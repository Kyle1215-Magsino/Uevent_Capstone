import { useState, useRef, useCallback, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import toast from 'react-hot-toast';
import { PageHeader, SearchInput, StatsCard, Modal } from '../../components/ui';
import { cn, getInitials } from '../../lib/utils';
import { eventsAPI, attendanceAPI, enrollmentAPI } from '../../api/endpoints';
import {
  ScanFace, CreditCard, ClipboardList, MapPin, CheckCircle2,
  Video, VideoOff, Loader2, AlertTriangle, Radio, Users,
  ClipboardCheck, Gauge, XCircle, Wifi, Navigation,
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

export default function CheckInStation() {
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
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

  /* ── Load events from API ────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await eventsAPI.getAll();
        const list = res.data?.data || res.data || [];
        setEvents(Array.isArray(list) ? list : []);
      } catch {
        toast.error('Failed to load events.');
      } finally {
        setEventsLoading(false);
      }
    })();
  }, []);

  /* ── Load enrolled faces for face matching ───────────────── */
  useEffect(() => {
    if (!selectedEvent) return;
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
  }, [selectedEvent]);

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
    if (checkInMethod === 'face' && selectedEvent) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkInMethod, selectedEvent]);

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
              const res = await attendanceAPI.faceCheckIn(selectedEvent.id, { user_id: studentInfo.user_id });
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
  }, [modelsLoaded, faceMatcher, enrolledMap, drawOverlay, selectedEvent]);

  /* ── RFID scan handler ───────────────────────────────────── */
  const handleRFIDScan = async (e) => {
    e.preventDefault();
    const input = rfidInput.trim();
    if (!input || !selectedEvent) return;

    setProcessingStatus('processing');
    setProcessMessage('Reading RFID tag...');

    try {
      const res = await attendanceAPI.rfidCheckIn(selectedEvent.id, { student_id: input });
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
    if (!input || !selectedEvent) return;

    setProcessingStatus('processing');
    setProcessMessage('Looking up student...');

    try {
      // Try RFID check-in with the student_id input
      const res = await attendanceAPI.rfidCheckIn(selectedEvent.id, { student_id: input });
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
    const status = attendanceStatus || determineAttendanceStatus(selectedEvent);
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
  const methodLabel = { face: 'Face Recognition', rfid: 'RFID', manual: 'Manual' };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Check-In Station"
        description="Process student attendance using RFID, facial recognition, or manual entry."
        actions={
          selectedEvent && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsLive(!isLive)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                )}
              >
                <Radio className={cn('w-4 h-4', isLive && 'animate-pulse')} />
                {isLive ? 'Station Active' : 'Paused'}
              </button>
            </div>
          )
        }
      />

      {/* Location Status Banner */}
      <div className={cn(
        'border rounded-xl p-4 flex items-center gap-3',
        locationStatus === 'inside' ? 'bg-emerald-50 border-emerald-200' :
        locationStatus === 'outside' ? 'bg-emerald-50/50 border-emerald-200' :
        'bg-slate-50 border-slate-200'
      )}>
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          locationStatus === 'inside' ? 'bg-emerald-100' :
          locationStatus === 'outside' ? 'bg-emerald-100' : 'bg-slate-100'
        )}>
          <Navigation className={cn(
            'w-5 h-5',
            locationStatus === 'inside' ? 'text-emerald-600' :
            locationStatus === 'outside' ? 'text-emerald-500' : 'text-slate-500'
          )} />
        </div>
        <div className="flex-1">
          <p className={cn(
            'text-sm font-medium',
            locationStatus === 'inside' ? 'text-emerald-800' :
            locationStatus === 'outside' ? 'text-emerald-700' : 'text-slate-700'
          )}>
            {locationStatus === 'inside' ? 'Within Campus Geofence' :
             locationStatus === 'outside' ? 'Outside Campus Boundary' :
             locationStatus === 'denied' ? 'Location Access Denied' :
             locationStatus === 'unsupported' ? 'Geolocation Not Supported' : 'Detecting Location...'}
          </p>
          <p className="text-xs text-slate-500">
            {locationDistance !== null
              ? `${locationDistance}m from campus center · Geofence: ${GEOFENCE_RADIUS_METERS}m radius`
              : 'Enable location services for geofence verification'}
          </p>
        </div>
        <div className={cn(
          'w-3 h-3 rounded-full',
          locationStatus === 'inside' ? 'bg-emerald-500 animate-pulse' :
          locationStatus === 'outside' ? 'bg-emerald-400' : 'bg-slate-400'
        )} />
      </div>

      {/* Event Selection */}
      {!selectedEvent ? (
        <>
          <h3 className="text-lg font-semibold text-slate-900">Select Event</h3>
          {eventsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No events found.</p>
            </div>
          ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {events.filter((e) => e.status === 'ongoing' || e.status === 'upcoming').map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="card-hover p-5 text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={cn(
                    'badge capitalize text-xs',
                    event.status === 'ongoing' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  )}>
                    {event.status}
                  </span>
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">{event.title}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{event.venue}
                </p>
              </button>
            ))}
          </div>
          )}
        </>
      ) : (
        <>
          {/* Active Event Header */}
          <div className="card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Wifi className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{selectedEvent.title}</h3>
                <p className="text-xs text-slate-500">{selectedEvent.venue} · Capacity: {selectedEvent.capacity}</p>
              </div>
            </div>
            <button onClick={() => { setSelectedEvent(null); stopCamera(); }} className="btn-secondary text-sm">
              Change Event
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total Check-ins" value={recentCheckins.length} icon={ClipboardCheck} iconColor="primary" />
            <StatsCard title="Capacity" value={selectedEvent.capacity} icon={Users} iconColor="emerald" />
            <StatsCard title="Fill Rate" value={`${((recentCheckins.length / selectedEvent.capacity) * 100).toFixed(1)}%`} icon={Gauge} iconColor="emerald" />
            <StatsCard title="Location" value={locationStatus === 'inside' ? 'On Campus' : 'Off Campus'} icon={MapPin} iconColor="emerald" />
          </div>

          {/* Check-in Method Tabs */}
          <div className="card overflow-hidden">
            <div className="border-b border-slate-200 flex">
              {[
                { key: 'rfid', icon: CreditCard, label: 'RFID Scanner' },
                { key: 'face', icon: ScanFace, label: 'Face Recognition' },
                { key: 'manual', icon: ClipboardList, label: 'Manual Entry' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setCheckInMethod(tab.key)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                    checkInMethod === tab.key
                      ? 'border-primary-500 text-primary-700 bg-primary-50/40'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* ── RFID Tab ── */}
              {checkInMethod === 'rfid' && (
                <div className="space-y-5">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900">Scan RFID Tag</h4>
                    <p className="text-sm text-slate-500 mt-1">Place the student's ID card on the RFID reader or type the tag number</p>
                  </div>
                  <form onSubmit={handleRFIDScan} className="max-w-md mx-auto">
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={rfidInput}
                        onChange={(e) => setRfidInput(e.target.value)}
                        className="input-field pl-11 text-center text-lg font-mono tracking-wider"
                        placeholder="RFID-XXX-XXXX or Student ID"
                        autoFocus
                      />
                    </div>
                    <button type="submit" className="btn-primary w-full mt-3">
                      Process Scan
                    </button>
                  </form>

                  {/* Processing feedback */}
                  {processingStatus !== 'idle' && (
                    <div className={cn(
                      'max-w-md mx-auto p-4 rounded-xl border text-center',
                      processingStatus === 'processing' ? 'bg-slate-50 border-slate-200' :
                      processingStatus === 'success' ? 'bg-emerald-50 border-emerald-200' :
                      'bg-emerald-50/50 border-emerald-200'
                    )}>
                      {processingStatus === 'processing' && <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto mb-2" />}
                      {processingStatus === 'success' && <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />}
                      {processingStatus === 'error' && <XCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />}
                      <p className={cn(
                        'text-sm font-medium',
                        processingStatus === 'success' ? 'text-emerald-800' :
                        processingStatus === 'error' ? 'text-emerald-700' : 'text-slate-700'
                      )}>
                        {processMessage}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Face Recognition Tab ── */}
              {checkInMethod === 'face' && (
                <div className="space-y-5">
                  <div className="relative bg-slate-900 rounded-xl overflow-hidden max-w-lg mx-auto" style={{ aspectRatio: '4/3' }}>
                    {cameraActive ? (
                      <>
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                        {faceDetecting && (
                          <div className="absolute top-3 inset-x-3 flex items-center justify-center">
                            <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-500/80 text-white backdrop-blur-sm flex items-center gap-1.5">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Scanning face...
                            </span>
                          </div>
                        )}
                        {faceResult && (
                          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                            {faceResult.success ? (
                              <>
                                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                                <p className="text-white font-semibold">{faceResult.student?.name}</p>
                                {faceResult.student?.student_id && (
                                  <p className="text-white/60 text-xs">{faceResult.student.student_id}</p>
                                )}
                                <p className="text-white/70 text-sm">Match: {faceResult.score}%</p>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-12 h-12 text-slate-400" />
                                <p className="text-white font-semibold">No match found</p>
                                <p className="text-white/60 text-xs">Student may not be enrolled</p>
                              </>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
                        <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
                        <p className="text-slate-400 text-sm">Starting camera...</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center gap-3">
                    {!faceDetecting && !faceResult && (
                      <button onClick={runFaceCheckIn} disabled={!cameraActive || !modelsLoaded || facesLoading || !faceMatcher} className="btn-primary text-sm flex items-center gap-2">
                        {facesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanFace className="w-4 h-4" />}
                        {facesLoading ? 'Loading enrolled faces...' : !faceMatcher ? 'No enrolled faces' : 'Start Face Check-In'}
                      </button>
                    )}
                    {faceResult && (
                      <button onClick={() => { setFaceResult(null); }} className="btn-secondary text-sm">
                        Scan Next Student
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Manual Tab ── */}
              {checkInMethod === 'manual' && (
                <div className="space-y-5">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <ClipboardList className="w-8 h-8 text-slate-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900">Manual Check-In</h4>
                    <p className="text-sm text-slate-500 mt-1">Enter the student's ID number or name</p>
                  </div>
                  <form onSubmit={handleManualCheckIn} className="max-w-md mx-auto">
                    <input
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      className="input-field text-center"
                      placeholder="Student ID or Name"
                    />
                    <button type="submit" className="btn-primary w-full mt-3">
                      Check In Student
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Recent Check-ins Feed */}
          <div className="card">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-slate-900">Recent Check-ins</h3>
                {isLive && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />Real-time
                  </span>
                )}
              </div>
              <span className="text-sm text-slate-500">{recentCheckins.length} total</span>
            </div>
            {recentCheckins.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {recentCheckins.map((checkin, i) => {
                  const MethodIcon = methodIcon[checkin.method];
                  return (
                    <div key={checkin.id} className={cn(
                      'px-6 py-3 flex items-center justify-between hover:bg-primary-50/30 transition-colors',
                      i === 0 && 'bg-emerald-50'
                    )}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                          {getInitials(checkin.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{checkin.name}</p>
                          <p className="text-xs text-slate-500">{checkin.student_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <MethodIcon className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs text-slate-500">{methodLabel[checkin.method]}</span>
                        </div>
                        <span className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded-full capitalize',
                          checkin.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                          checkin.status === 'late' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        )}>
                          {checkin.status}
                        </span>
                        {checkin.location === 'inside' && (
                          <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />On Campus
                          </span>
                        )}
                        <span className="text-xs text-slate-400">
                          {new Date(checkin.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <CheckCircle2 className={cn('w-5 h-5', checkin.status === 'present' ? 'text-emerald-500' : 'text-amber-500')} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No check-ins yet. Start scanning to begin.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
