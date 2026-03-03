import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import { PageHeader, Modal } from '../../components/ui';
import { cn, formatDateTime } from '../../lib/utils';
import {
  ScanFace, CreditCard, MapPin, CheckCircle2, Clock,
  Loader2, AlertTriangle, Navigation, ChevronRight,
  ShieldCheck, XCircle, Calendar, Users,
} from 'lucide-react';

/* ── Constants ─────────────────────────────────────────────── */
const MODEL_URL = '/models';
const CAMPUS_CENTER = { lat: 12.7478, lng: 121.4732 };
const GEOFENCE_RADIUS_METERS = 500;

const mockEvent = {
  id: 2,
  title: 'Cultural Night 2026',
  date: '2026-03-03T18:00:00',
  venue: 'University Gymnasium',
  method: 'face_recognition',
  status: 'ongoing',
  capacity: 500,
  organizer: 'Cultural Committee',
};

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function EventCheckIn() {
  const [step, setStep] = useState('info'); // info | verify | result
  const [selectedMethod, setSelectedMethod] = useState(null);

  /* Location */
  const [locationStatus, setLocationStatus] = useState('checking');
  const [locationDistance, setLocationDistance] = useState(null);

  /* Face verification */
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceStatus, setFaceStatus] = useState('idle'); // idle | detecting | success | fail
  const [faceScore, setFaceScore] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectRef = useRef(null);

  /* RFID */
  const [rfidInput, setRfidInput] = useState('');
  const [rfidStatus, setRfidStatus] = useState('idle'); // idle | processing | success | fail

  /* Result */
  const [checkInResult, setCheckInResult] = useState(null);

  /* ── Geolocation ─────────────────────────────────────────── */
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = haversineDistance(pos.coords.latitude, pos.coords.longitude, CAMPUS_CENTER.lat, CAMPUS_CENTER.lng);
        setLocationDistance(Math.round(dist));
        setLocationStatus(dist <= GEOFENCE_RADIUS_METERS ? 'inside' : 'outside');
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  /* ── Face-api ────────────────────────────────────────────── */
  const loadModels = useCallback(async () => {
    if (modelsLoaded) return true;
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      return true;
    } catch {
      return false;
    }
  }, [modelsLoaded]);

  const startCamera = useCallback(async () => {
    const ok = await loadModels();
    if (!ok) return;
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
  }, []);

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const runFaceVerification = useCallback(async () => {
    if (!cameraActive || !modelsLoaded) return;
    setFaceStatus('detecting');
    let attempts = 0;
    let matched = false;

    detectRef.current = setInterval(async () => {
      if (matched || !videoRef.current) return;
      attempts++;

      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        drawOverlay(detection);
        const score = Math.round(detection.detection.score * 100);
        if (score >= 65) {
          matched = true;
          clearInterval(detectRef.current);
          setFaceScore(score);
          setFaceStatus('success');
          stopCamera();
          completeCheckIn('face', score);
        }
      } else {
        drawOverlay(null);
      }

      if (attempts >= 20 && !matched) {
        clearInterval(detectRef.current);
        setFaceStatus('fail');
      }
    }, 500);
  }, [cameraActive, modelsLoaded, drawOverlay, stopCamera]);

  /* ── RFID ────────────────────────────────────────────────── */
  const handleRFIDSubmit = (e) => {
    e.preventDefault();
    if (!rfidInput.trim()) return;
    setRfidStatus('processing');
    setTimeout(() => {
      // Simulate RFID lookup
      const valid = rfidInput.trim().length >= 4;
      if (valid) {
        setRfidStatus('success');
        completeCheckIn('rfid', 100);
      } else {
        setRfidStatus('fail');
      }
    }, 1000);
  };

  /* ── Complete ────────────────────────────────────────────── */
  const completeCheckIn = (method, score) => {
    setCheckInResult({
      event: mockEvent.title,
      method,
      score,
      location: locationStatus,
      distance: locationDistance,
      time: new Date().toISOString(),
    });
    setStep('result');
  };

  /* ── Begin verification ──────────────────────────────────── */
  const startVerification = async (method) => {
    setSelectedMethod(method);
    setStep('verify');
    if (method === 'face') {
      await startCamera();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Event Check-In"
        description="Verify your identity and check in to the event."
      />

      {/* ── Step: Event Info ── */}
      {step === 'info' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Event Card */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="badge bg-emerald-100 text-emerald-800 capitalize">{mockEvent.status}</span>
              <span className="text-xs text-slate-500">{mockEvent.organizer}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{mockEvent.title}</h2>
            <div className="grid sm:grid-cols-3 gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" />{formatDateTime(mockEvent.date)}</span>
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" />{mockEvent.venue}</span>
              <span className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" />Capacity: {mockEvent.capacity}</span>
            </div>
          </div>

          {/* Location Verification */}
          <div className={cn(
            'card p-4 flex items-center gap-3',
            locationStatus === 'inside' ? 'border-emerald-200 bg-emerald-50' :
            locationStatus === 'outside' ? 'border-emerald-200 bg-emerald-50/50' :
            'border-slate-200'
          )}>
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              locationStatus === 'inside' ? 'bg-emerald-100' : 'bg-slate-100'
            )}>
              <Navigation className={cn('w-5 h-5', locationStatus === 'inside' ? 'text-emerald-600' : 'text-slate-500')} />
            </div>
            <div className="flex-1">
              <p className={cn('text-sm font-medium', locationStatus === 'inside' ? 'text-emerald-800' : 'text-slate-700')}>
                {locationStatus === 'inside' ? 'You are within the campus area' :
                 locationStatus === 'outside' ? 'You appear to be outside campus' :
                 locationStatus === 'denied' ? 'Location access denied' :
                 locationStatus === 'checking' ? 'Verifying your location...' : 'Location unavailable'}
              </p>
              {locationDistance !== null && (
                <p className="text-xs text-slate-500">{locationDistance}m from campus center</p>
              )}
            </div>
            {locationStatus === 'checking' && <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />}
            {locationStatus === 'inside' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            {locationStatus === 'outside' && <AlertTriangle className="w-5 h-5 text-emerald-500" />}
          </div>

          {/* Check-in Method Selection */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Select Verification Method</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={() => startVerification('face')}
                className="card-hover p-5 text-left group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <ScanFace className="w-6 h-6 text-emerald-600" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900">Face Recognition</h4>
                <p className="text-xs text-slate-500 mt-1">Verify using your enrolled facial data</p>
              </button>
              <button
                onClick={() => startVerification('rfid')}
                className="card-hover p-5 text-left group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-emerald-600" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900">RFID Scan</h4>
                <p className="text-xs text-slate-500 mt-1">Tap your RFID-enabled student ID card</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step: Verify ── */}
      {step === 'verify' && selectedMethod === 'face' && (
        <div className="max-w-lg mx-auto space-y-5">
          <div className="relative bg-slate-900 rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
            {cameraActive ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                {faceStatus === 'detecting' && (
                  <div className="absolute top-3 inset-x-3 flex justify-center">
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-500/80 text-white backdrop-blur-sm flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />Verifying face...
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
              </div>
            )}
          </div>
          <div className="flex justify-center gap-3">
            {faceStatus === 'idle' && (
              <button onClick={runFaceVerification} disabled={!cameraActive} className="btn-primary flex items-center gap-2">
                <ScanFace className="w-4 h-4" />Begin Verification
              </button>
            )}
            {faceStatus === 'fail' && (
              <>
                <button onClick={() => { setFaceStatus('idle'); startCamera(); }} className="btn-secondary text-sm">Retry</button>
                <button onClick={() => { stopCamera(); setStep('info'); setFaceStatus('idle'); }} className="btn-secondary text-sm">Back</button>
              </>
            )}
            {faceStatus === 'idle' && (
              <button onClick={() => { stopCamera(); setStep('info'); }} className="btn-secondary">Cancel</button>
            )}
          </div>
          {faceStatus === 'fail' && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl text-center">
              <AlertTriangle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-emerald-700">Face not recognized. Please try again or use RFID.</p>
            </div>
          )}
        </div>
      )}

      {step === 'verify' && selectedMethod === 'rfid' && (
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Tap Your Student ID</h3>
            <p className="text-sm text-slate-500 mt-1">Place your RFID-enabled ID card near the reader</p>
          </div>
          <form onSubmit={handleRFIDSubmit}>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={rfidInput}
                onChange={(e) => setRfidInput(e.target.value)}
                className="input-field pl-11 text-center text-lg font-mono tracking-wider"
                placeholder="RFID Tag Number"
                autoFocus
              />
            </div>
            <button type="submit" disabled={rfidStatus === 'processing'} className="btn-primary w-full mt-3 flex items-center justify-center gap-2">
              {rfidStatus === 'processing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {rfidStatus === 'processing' ? 'Verifying...' : 'Verify RFID'}
            </button>
          </form>
          {rfidStatus === 'fail' && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl text-center">
              <XCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-emerald-700">RFID not recognized. Please try again.</p>
            </div>
          )}
          <button onClick={() => { setStep('info'); setRfidStatus('idle'); setRfidInput(''); }} className="btn-secondary w-full">
            Back
          </button>
        </div>
      )}

      {/* ── Step: Result ── */}
      {step === 'result' && checkInResult && (
        <div className="max-w-md mx-auto space-y-6">
          <div className="card p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Check-In Successful!</h2>
              <p className="text-sm text-slate-500 mt-1">{checkInResult.event}</p>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Method</span>
                <span className="font-medium text-slate-900 flex items-center gap-1.5">
                  {checkInResult.method === 'face' ? <ScanFace className="w-4 h-4 text-emerald-600" /> : <CreditCard className="w-4 h-4 text-emerald-600" />}
                  {checkInResult.method === 'face' ? 'Face Recognition' : 'RFID'}
                </span>
              </div>
              {checkInResult.score && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Confidence</span>
                  <span className="font-medium text-emerald-600">{checkInResult.score}%</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Location</span>
                <span className={cn('font-medium flex items-center gap-1', checkInResult.location === 'inside' ? 'text-emerald-600' : 'text-slate-600')}>
                  <MapPin className="w-3.5 h-3.5" />
                  {checkInResult.location === 'inside' ? 'On Campus' : checkInResult.location === 'outside' ? 'Off Campus' : 'Unknown'}
                  {checkInResult.distance !== null && ` (${checkInResult.distance}m)`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Time</span>
                <span className="font-medium text-slate-900 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(checkInResult.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-xs text-emerald-700">Your attendance has been securely recorded and verified.</p>
            </div>
          </div>

          <Link to="/student/events" className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
            Back to Events
          </Link>
        </div>
      )}
    </div>
  );
}
