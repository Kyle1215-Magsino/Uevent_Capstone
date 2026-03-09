import { useState, useRef, useCallback, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import toast from 'react-hot-toast';
import { cn, getInitials } from '../../lib/utils';
import { attendanceAPI, enrollmentAPI } from '../../api/endpoints';
import { Modal } from '../../components/ui';
import {
  ScanFace, CreditCard, ClipboardList, CheckCircle2,
  Loader2, XCircle,
} from 'lucide-react';

/* ── Constants ─────────────────────────────────────────────── */
const MODEL_URL = '/models';

// Bongabong Campus coordinates (simulated)
const CAMPUS_CENTER = { lat: 12.7478, lng: 121.4732 };
const GEOFENCE_RADIUS_METERS = 500;

/* ── Helpers ───────────────────────────────────────────────── */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* Determine attendance status based on event start time (15-min grace period) */
function determineAttendanceStatus(event) {
  if (!event) return 'present';
  const now = new Date();
  // Parse event date + start_time
  const eventDate = new Date(event.date || event.start_date);
  if (event.start_time) {
    const [h, m] = event.start_time.split(':').map(Number);
    eventDate.setHours(h, m, 0, 0);
  }
  const lateThreshold = new Date(eventDate.getTime() + 15 * 60000);
  return now > lateThreshold ? 'late' : 'present';
}

export default function CheckInStation({ open, onClose, event }) {
  const [checkInMethod, setCheckInMethod] = useState('rfid');
  const [rfidInput, setRfidInput] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [processingStatus, setProcessingStatus] = useState('idle'); // idle | processing | success | error
  const [processMessage, setProcessMessage] = useState('');
  const [isLive, setIsLive] = useState(true);

  /* Face verification state */
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetecting, setFaceDetecting] = useState(false);
  const [faceResult, setFaceResult] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectRef = useRef(null);

  /* Enrolled faces for face matching */
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [enrolledMap, setEnrolledMap] = useState({}); // userId -> { name, student_id }
  const [facesLoading, setFacesLoading] = useState(false);

  /* Location state */
  const [locationStatus, setLocationStatus] = useState('unknown');
  const [, setDeviceLocation] = useState(null);
  const [locationDistance, setLocationDistance] = useState(null);

  /* Reset state when modal opens/closes or event changes */
  useEffect(() => {
    if (!open) {
      // Clean up on close
      setCheckInMethod('rfid');
      setRfidInput('');
      setManualInput('');
      setRecentCheckins([]);
      setProcessingStatus('idle');
      setProcessMessage('');
      setFaceResult(null);
      setFaceMatcher(null);
      setEnrolledMap({});
    }
  }, [open]);

  /* ── Load enrolled faces for face matching ───────────────── */
  useEffect(() => {
    if (!open || !event) return;
    (async () => {
      setFacesLoading(true);
      try {
        const res = await enrollmentAPI.getEnrolledFaces();
        const enrollments = res.data || [];

        if (enrollments.length === 0) {
          setFaceMatcher(null);
          setFacesLoading(false);
          return;
        }

        const labeledDescriptors = [];
        const userMap = {};

        for (const enrollment of enrollments) {
          if (!enrollment.face_data) continue;
          try {
            const parsed = JSON.parse(enrollment.face_data);
            const descriptors = parsed.map((d) => new Float32Array(d));
            if (descriptors.length > 0) {
              labeledDescriptors.push(
                new faceapi.LabeledFaceDescriptors(String(enrollment.user_id), descriptors)
              );
              userMap[String(enrollment.user_id)] = {
                name: enrollment.user?.name || 'Unknown',
                student_id: enrollment.user?.student_id || '',
                email: enrollment.user?.email || '',
                user_id: enrollment.user_id,
              };
            }
          } catch {
            // Skip malformed entries
          }
        }

        setEnrolledMap(userMap);
        if (labeledDescriptors.length > 0) {
          setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.6));
        }
      } catch {
        toast.error('Failed to load enrolled faces.');
      } finally {
        setFacesLoading(false);
      }
    })();
  }, [open, event]);

  /* ── Geolocation ─────────────────────────────────────────── */
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setDeviceLocation({ lat: latitude, lng: longitude, accuracy });
        const dist = haversineDistance(latitude, longitude, CAMPUS_CENTER.lat, CAMPUS_CENTER.lng);
        setLocationDistance(Math.round(dist));
        setLocationStatus(dist <= GEOFENCE_RADIUS_METERS ? 'inside' : 'outside');
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* ── Load face-api models ────────────────────────────────── */
  const loadModels = useCallback(async () => {
    if (modelsLoaded) return;
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    } catch { /* ignore */ }
  }, [modelsLoaded]);

  const startCamera = useCallback(async () => {
    await loadModels();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraActive(false);
    }
  }, [loadModels]);

  const stopCamera = useCallback(() => {
    if (detectRef.current) clearInterval(detectRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setFaceDetecting(false);
    setFaceResult(null);
  }, []);

  /* Auto-start camera when switching to face method */
  useEffect(() => {
    if (checkInMethod === 'face' && open && event) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkInMethod, open, event]);

  /* Attach stream to video element once it renders (fixes race condition) */
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive, checkInMethod]);

  /* Draw face overlay */
  const drawOverlay = useCallback((detection) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const displaySize = { width: video.clientWidth, height: video.clientHeight };
    faceapi.matchDimensions(canvas, displaySize);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (detection) {
      const resized = faceapi.resizeResults(detection, displaySize);
      const { x, y, width, height } = resized.detection.box;
      const mx = displaySize.width - x - width;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(mx, y, width, height);
      if (resized.landmarks) {
        ctx.fillStyle = '#34d399';
        resized.landmarks.positions.forEach((pt) => {
          ctx.beginPath();
          ctx.arc(displaySize.width - pt.x, pt.y, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }
  }, []);

  /* Run face detection for check-in — identifies which student */
  const runFaceCheckIn = useCallback(async () => {
    if (!videoRef.current || !modelsLoaded) return;

    if (!faceMatcher) {
      toast.error('No enrolled faces loaded. Ensure students have approved facial enrollments.');
      return;
    }

    setFaceDetecting(true);
    setFaceResult(null);

    let matched = false;
    let attempts = 0;

    detectRef.current = setInterval(async () => {
      if (matched || !videoRef.current) return;
      attempts++;

      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        drawOverlay(detection);

        // Match against all enrolled faces
        const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

        if (bestMatch.label !== 'unknown') {
          const confidence = Math.round((1 - bestMatch.distance) * 100);
          matched = true;
          clearInterval(detectRef.current);

          const studentInfo = enrolledMap[bestMatch.label];
          setFaceResult({ success: true, score: confidence, student: studentInfo });
          setFaceDetecting(false);

          if (studentInfo) {
            // Record attendance via API
            try {
              const res = await attendanceAPI.faceCheckIn(event.id, { user_id: studentInfo.user_id });
              const attendanceStatus = res.data?.status || 'present';
              addCheckIn(studentInfo.name, studentInfo.student_id, 'face', confidence, attendanceStatus);
              toast.success(`${studentInfo.name} checked in via Face Recognition (${confidence}% match) — ${attendanceStatus.toUpperCase()}`);
            } catch (err) {
              if (err.response?.status === 409) {
                const existingStatus = err.response?.data?.attendance?.status || 'present';
                addCheckIn(studentInfo.name, studentInfo.student_id, 'face', confidence, existingStatus);
                toast(`${studentInfo.name} already checked in.`, { icon: 'ℹ️' });
              } else {
                toast.error(err.response?.data?.message || 'Failed to record attendance.');
              }
            }
          }
        }
      } else {
        drawOverlay(null);
      }

      if (attempts >= 30 && !matched) {
        clearInterval(detectRef.current);
        setFaceResult({ success: false, score: 0 });
        setFaceDetecting(false);
        toast.error('Face not recognized. Student may not be enrolled.');
      }
    }, 500);
  }, [modelsLoaded, faceMatcher, enrolledMap, drawOverlay, event]);

  /* ── RFID scan handler ───────────────────────────────────── */
  const handleRFIDScan = async (e) => {
    e.preventDefault();
    const input = rfidInput.trim();
    if (!input || !event) return;

    setProcessingStatus('processing');
    setProcessMessage('Reading RFID tag...');

    try {
      const res = await attendanceAPI.rfidCheckIn(event.id, { student_id: input });
      const user = res.data?.user;
      const attendanceStatus = res.data?.status || 'present';
      const name = user?.name || 'Student';
      const studentId = user?.student_id || input;

      addCheckIn(name, studentId, 'rfid', 100, attendanceStatus);
      setProcessingStatus('success');
      setProcessMessage(`✓ ${name} checked in via RFID — ${attendanceStatus.toUpperCase()}`);
      toast.success(`${name} checked in via RFID`);
    } catch (err) {
      if (err.response?.status === 409) {
        const user = err.response?.data?.attendance?.user;
        const name = user?.name || 'Student';
        setProcessingStatus('success');
        setProcessMessage(`${name} already checked in.`);
        toast(`${name} already checked in.`, { icon: 'ℹ️' });
      } else {
        setProcessingStatus('error');
        setProcessMessage(err.response?.data?.message || 'RFID tag not recognized.');
        toast.error(err.response?.data?.message || 'RFID tag not recognized.');
      }
    }
    setRfidInput('');
    setTimeout(() => setProcessingStatus('idle'), 3000);
  };

  /* ── Manual check-in handler ─────────────────────────────── */
  const handleManualCheckIn = async (e) => {
    e.preventDefault();
    const input = manualInput.trim();
    if (!input || !event) return;

    setProcessingStatus('processing');
    setProcessMessage('Looking up student...');

    try {
      // Try RFID check-in with the student_id input
      const res = await attendanceAPI.rfidCheckIn(event.id, { student_id: input });
      const user = res.data?.user;
      const attendanceStatus = res.data?.status || 'present';
      const name = user?.name || 'Student';
      const studentId = user?.student_id || input;

      addCheckIn(name, studentId, 'manual', null, attendanceStatus);
      setProcessingStatus('success');
      setProcessMessage(`✓ ${name} checked in manually — ${attendanceStatus.toUpperCase()}`);
      toast.success(`${name} checked in manually`);
    } catch (err) {
      if (err.response?.status === 409) {
        const user = err.response?.data?.attendance?.user;
        const name = user?.name || 'Student';
        setProcessingStatus('success');
        setProcessMessage(`${name} already checked in.`);
        toast(`${name} already checked in.`, { icon: 'ℹ️' });
      } else {
        setProcessingStatus('error');
        setProcessMessage(err.response?.data?.message || 'Student not found.');
        toast.error(err.response?.data?.message || 'Student not found.');
      }
    }
    setManualInput('');
    setTimeout(() => setProcessingStatus('idle'), 3000);
  };

  /* ── Add check-in record ─────────────────────────────────── */
  const addCheckIn = (name, studentId, method, score, attendanceStatus) => {
    const status = attendanceStatus || determineAttendanceStatus(event);
    setRecentCheckins((prev) => [
      {
        id: Date.now(),
        name,
        student_id: studentId,
        method,
        score,
        status,
        time: new Date().toISOString(),
        location: locationStatus,
      },
      ...prev,
    ]);
  };

  const methodIcon = { face: ScanFace, rfid: CreditCard, manual: ClipboardList };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Check-In — ${event?.title || 'Event'}`} size="md">
      <div className="space-y-0 -m-6">
        {/* Event info bar */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-emerald-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{event?.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{event?.venue} · {event?.status}</p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {recentCheckins.length}/{event?.capacity || 0}
          </span>
        </div>

        {/* Method Tabs */}
        <div className="border-b border-emerald-200 dark:border-slate-700 flex">
          {[
            { key: 'rfid', icon: CreditCard, label: 'RFID' },
            { key: 'face', icon: ScanFace, label: 'Face' },
            { key: 'manual', icon: ClipboardList, label: 'Manual' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCheckInMethod(tab.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                checkInMethod === tab.key
                  ? 'border-emerald-800 text-primary-700 bg-primary-50/40'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {/* RFID */}
          {checkInMethod === 'rfid' && (
            <form onSubmit={handleRFIDScan} className="space-y-3">
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={rfidInput}
                  onChange={(e) => setRfidInput(e.target.value)}
                  className="input-field pl-11 text-center font-mono tracking-wider"
                  placeholder="Scan or type RFID / Student ID"
                  autoFocus
                />
              </div>
              <button type="submit" className="btn-primary w-full">Process Scan</button>
            </form>
          )}

          {/* Face Recognition */}
          {checkInMethod === 'face' && (
            <div className="space-y-3">
              <div className="relative bg-slate-900 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                {cameraActive ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                    {faceDetecting && (
                      <div className="absolute top-2 inset-x-2 flex justify-center">
                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary-500/80 text-white backdrop-blur-sm flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" /> Scanning…
                        </span>
                      </div>
                    )}
                    {faceResult && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1.5">
                        {faceResult.success ? (
                          <>
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                            <p className="text-white font-semibold text-sm">{faceResult.student?.name}</p>
                            <p className="text-white/60 text-xs">{faceResult.student?.student_id}</p>
                            <p className="text-white/70 text-xs">Match: {faceResult.score}%</p>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-10 h-10 text-red-400" />
                            <p className="text-white font-semibold text-sm">No match found</p>
                          </>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 p-6">
                    <Loader2 className="w-6 h-6 text-slate-500 dark:text-slate-400 animate-spin" />
                    <p className="text-slate-400 text-xs">Starting camera…</p>
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-2">
                {!faceDetecting && !faceResult && (
                  <button onClick={runFaceCheckIn} disabled={!cameraActive || !modelsLoaded || facesLoading || !faceMatcher} className="btn-primary text-sm w-full flex items-center justify-center gap-2">
                    {facesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanFace className="w-4 h-4" />}
                    {facesLoading ? 'Loading faces…' : !faceMatcher ? 'No enrolled faces' : 'Start Face Scan'}
                  </button>
                )}
                {faceResult && (
                  <button onClick={() => setFaceResult(null)} className="btn-secondary text-sm w-full">Scan Next Student</button>
                )}
              </div>
            </div>
          )}

          {/* Manual */}
          {checkInMethod === 'manual' && (
            <form onSubmit={handleManualCheckIn} className="space-y-3">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="input-field text-center"
                placeholder="Student ID or Name"
              />
              <button type="submit" className="btn-primary w-full">Check In</button>
            </form>
          )}

          {/* Processing Feedback */}
          {processingStatus !== 'idle' && (
            <div className={cn(
              'mt-3 p-3 rounded-lg border text-center flex items-center justify-center gap-2',
              processingStatus === 'processing' ? 'bg-slate-50 dark:bg-slate-800/50 border-emerald-200 dark:border-slate-700' :
              processingStatus === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-slate-700' :
              'bg-red-50 dark:bg-red-900/20 border-red-200'
            )}>
              {processingStatus === 'processing' && <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />}
              {processingStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {processingStatus === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
              <p className={cn(
                'text-sm font-medium',
                processingStatus === 'success' ? 'text-emerald-700' :
                processingStatus === 'error' ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'
              )}>
                {processMessage}
              </p>
            </div>
          )}
        </div>

        {/* Recent Check-ins */}
        <div className="border-t border-emerald-200 dark:border-slate-700">
          <div className="px-5 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Recent</span>
            <span className="text-xs text-slate-400">{recentCheckins.length} checked in</span>
          </div>
          {recentCheckins.length > 0 ? (
            <div className="divide-y divide-emerald-100 max-h-[240px] overflow-y-auto">
              {recentCheckins.slice(0, 20).map((checkin, i) => {
                const MethodIcon = methodIcon[checkin.method];
                return (
                  <div key={checkin.id} className={cn(
                    'px-5 py-2.5 flex items-center justify-between',
                    i === 0 && 'bg-primary-50/50'
                  )}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                        {getInitials(checkin.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">{checkin.name}</p>
                        <p className="text-[11px] text-slate-400">{checkin.student_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <MethodIcon className={cn(
                        'w-3.5 h-3.5',
                        checkin.method === 'face' ? 'text-violet-500' :
                        checkin.method === 'rfid' ? 'text-orange-500' : 'text-slate-400'
                      )} />
                      <span className={cn(
                        'text-[11px] font-semibold px-1.5 py-0.5 rounded-full capitalize',
                        checkin.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                        checkin.status === 'late' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {checkin.status}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(checkin.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-xs text-slate-400">No check-ins yet</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
