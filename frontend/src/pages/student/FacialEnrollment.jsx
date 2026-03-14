import { useState, useRef, useCallback, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/ui';
import { cn } from '../../lib/utils';
import { enrollmentAPI } from '../../api/endpoints';
import {
  ScanFace, Upload, CheckCircle, AlertTriangle, Info,
  ArrowRight, RotateCcw, Video, VideoOff, CircleDot, ShieldCheck, Loader2,
} from 'lucide-react';

/* ── Constants ─────────────────────────────────────────────────────── */
const SCAN_DURATION_SEC = 15;          // total scanning time
const DESCRIPTOR_GOAL = 5;             // number of face descriptors to collect
const DETECTION_INTERVAL_MS = 400;     // how often we run detection
const MODEL_URL = '/models';           // public/models

export default function FacialEnrollment() {
  const [step, setStep] = useState(1);               // 1-intro  2-scan  3-complete  (enrolled)
  const [enrollmentStatus, setEnrollmentStatus] = useState('not_enrolled');
  const [cameraState, setCameraState] = useState('idle');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);       // 0‥100
  const [descriptorsCollected, setDescriptorsCollected] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [scanStatus, setScanStatus] = useState('waiting');    // waiting | scanning | processing | done | failed
  const [scanMessage, setScanMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(SCAN_DURATION_SEC);

  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const descriptorsRef = useRef([]);
  const detectIntervalRef = useRef(null);
  const timerRef = useRef(null);
  const animFrameRef = useRef(null);

  /* ── Load face-api models ──────────────────────────────────────── */
  const loadModels = useCallback(async () => {
    if (modelsLoaded) return true;
    setModelsLoading(true);
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      setModelsLoading(false);
      return true;
    } catch {
      setModelsLoading(false);
      return false;
    }
  }, [modelsLoaded]);

  /* ── Start webcam ─────────────────────────────────────────────── */
  const startCamera = useCallback(async () => {
    setCameraState('starting');
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
      setCameraState('active');
    } catch (err) {
      setCameraState(err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' ? 'denied' : 'error');
    }
  }, []);

  /* ── Stop webcam ──────────────────────────────────────────────── */
  const stopCamera = useCallback(() => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState('idle');
  }, []);

  /* ── Draw detection overlay on canvas ─────────────────────────── */
  const drawOverlay = useCallback((detection) => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const displaySize = { width: video.clientWidth, height: video.clientHeight };
    faceapi.matchDimensions(canvas, displaySize);

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detection) {
      const resized = faceapi.resizeResults(detection, displaySize);
      // Draw bounding box (mirrored because video is scaleX(-1))
      const { x, y, width, height } = resized.detection.box;
      const mirroredX = displaySize.width - x - width;

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(mirroredX, y, width, height);

      // Draw landmarks (mirrored)
      if (resized.landmarks) {
        const pts = resized.landmarks.positions;
        ctx.fillStyle = '#34d399';
        pts.forEach((pt) => {
          const mx = displaySize.width - pt.x;
          ctx.beginPath();
          ctx.arc(mx, pt.y, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Label
      ctx.font = '12px Inter, sans-serif';
      ctx.fillStyle = '#10b981';
      ctx.fillText('Face Detected', mirroredX, y - 6);
    }
  }, []);

  /* ── Continuous face detection loop ───────────────────────────── */
  const startDetection = useCallback(() => {
    if (!videoRef.current || !modelsLoaded) return;

    descriptorsRef.current = [];
    setDescriptorsCollected(0);
    setScanProgress(0);
    setTimeLeft(SCAN_DURATION_SEC);
    setScanStatus('scanning');
    setScanMessage('Look at the camera — scanning your face…');

    const startTime = Date.now();
    const endTime = startTime + SCAN_DURATION_SEC * 1000;

    // Timer countdown
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      const pct = Math.min(100, ((Date.now() - startTime) / (SCAN_DURATION_SEC * 1000)) * 100);
      setScanProgress(pct);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        finishScan();
      }
    }, 250);

    // Detection loop
    detectIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setFaceDetected(true);
        drawOverlay(detection);

        // Collect descriptor if we haven't hit the goal yet
        if (descriptorsRef.current.length < DESCRIPTOR_GOAL) {
          descriptorsRef.current.push(detection.descriptor);
          setDescriptorsCollected(descriptorsRef.current.length);

          if (descriptorsRef.current.length === 1) {
            setScanMessage('Face found! Hold still, slowly turn your head…');
          } else if (descriptorsRef.current.length === 3) {
            setScanMessage('Great — tilt your head slightly…');
          } else if (descriptorsRef.current.length >= DESCRIPTOR_GOAL) {
            setScanMessage('All samples captured!');
          }
        }
      } else {
        setFaceDetected(false);
        drawOverlay(null);
      }
    }, DETECTION_INTERVAL_MS);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelsLoaded, drawOverlay]);

  /* ── Finish scan ──────────────────────────────────────────────── */
  const finishScan = useCallback(() => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }

    setScanProgress(100);

    if (descriptorsRef.current.length >= DESCRIPTOR_GOAL) {
      setScanStatus('processing');
      setScanMessage('Processing facial data…');

      // Simulate a short processing delay then succeed
      setTimeout(() => {
        setScanStatus('done');
        setScanMessage(`Scan complete — ${descriptorsRef.current.length} facial descriptors captured.`);
      }, 1500);
    } else {
      setScanStatus('failed');
      setScanMessage(
        `Only ${descriptorsRef.current.length}/${DESCRIPTOR_GOAL} samples captured. Please ensure good lighting and try again.`
      );
    }
  }, []);

  /* ── Enter scan step ──────────────────────────────────────────── */
  const beginScanStep = useCallback(async () => {
    setStep(2);
    setScanStatus('waiting');
    setScanMessage('Loading face detection models…');
    const ok = await loadModels();
    if (!ok) {
      setScanStatus('failed');
      setScanMessage('Failed to load face detection models. Please check your connection and try again.');
      return;
    }
    await startCamera();
  }, [loadModels, startCamera]);

  /* Auto-start detection once camera is active + models loaded */
  useEffect(() => {
    if (step === 2 && cameraState === 'active' && modelsLoaded && scanStatus === 'waiting') {
      // Small delay so the user can see themselves first
      const t = setTimeout(() => startDetection(), 1200);
      return () => clearTimeout(t);
    }
  }, [step, cameraState, modelsLoaded, scanStatus, startDetection]);

  /* Cleanup on unmount / step change */
  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    stopCamera();
    setScanStatus('processing');
    setScanMessage('Submitting enrollment data…');

    // Serialize Float32Array descriptors to plain arrays for JSON
    const serializedDescriptors = descriptorsRef.current.map((d) => Array.from(d));

    try {
      await enrollmentAPI.enroll({
        images_count: serializedDescriptors.length,
        face_data: JSON.stringify(serializedDescriptors),
      });
      setStep(3);
      setEnrollmentStatus('pending');
      toast.success('Enrollment submitted successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit enrollment.';
      if (err.response?.status === 409) {
        setStep(3);
        setEnrollmentStatus('pending');
        toast('You already have a pending or approved enrollment.', { icon: 'ℹ️' });
      } else {
        toast.error(msg);
        setScanStatus('failed');
        setScanMessage('Failed to submit enrollment. Please try again.');
      }
    }
  };

  const handleRetry = () => {
    setScanStatus('waiting');
    setFaceDetected(false);
    descriptorsRef.current = [];
    setDescriptorsCollected(0);
    setScanProgress(0);
    setTimeLeft(SCAN_DURATION_SEC);
    if (cameraState === 'active' && modelsLoaded) {
      setTimeout(() => startDetection(), 500);
    } else {
      beginScanStep();
    }
  };

  /* ── Enrolled State ───────────────────────────────────────────── */
  if (enrollmentStatus === 'enrolled') {
    return (
      <div className="space-y-8 animate-fade-in">
        <PageHeader title="Facial Enrollment" description="Your facial recognition data." />
        <div className="card p-8 text-center max-w-lg">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Enrollment Active</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Your facial data has been approved and is active for event check-in verification.
          </p>
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-emerald-200 dark:border-slate-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Status</p>
                <p className="font-medium text-emerald-600">Approved</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Descriptors</p>
                <p className="font-medium text-slate-900 dark:text-white">{DESCRIPTOR_GOAL} samples</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Enrolled Date</p>
                <p className="font-medium text-slate-900 dark:text-white">Feb 15, 2026</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Last Used</p>
                <p className="font-medium text-slate-900 dark:text-white">Mar 3, 2026</p>
              </div>
            </div>
          </div>
          <button className="btn-danger text-sm mt-6">Request Re-enrollment</button>
        </div>
      </div>
    );
  }

  /* ── Progress bar color helper ────────────────────────────────── */
  const progressColor =
    scanStatus === 'done' ? 'bg-emerald-500' :
    scanStatus === 'failed' ? 'bg-red-400' :
    'bg-primary-500';

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Facial Enrollment"
        description="Register your face for automated event attendance verification."
      />

      {/* Two-column layout: Progress + Video left, Instructions/Status right */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ─── Left Column: Progress Steps + Video Feed ────────────── */}
        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="card p-4">
            <div className="flex items-center gap-0">
              {['Instructions', 'Face Scan', 'Submit'].map((label, i) => {
                const stepNum = i + 1;
                const isActive = step === stepNum;
                const isCompleted = step > stepNum;
                return (
                  <div key={label} className="flex items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                          isActive && 'bg-primary-600 text-white',
                          isCompleted && 'bg-primary-500 text-white',
                          !isActive && !isCompleted && 'bg-slate-200 text-slate-500 dark:text-slate-400',
                        )}
                      >
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : stepNum}
                      </div>
                      <span className={cn('text-sm font-medium hidden sm:block', isActive ? 'text-primary-700' : 'text-slate-500 dark:text-slate-400')}>
                        {label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div className={cn('w-16 sm:w-24 h-0.5 mx-2', step > stepNum ? 'bg-primary-500' : 'bg-slate-200')} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 1 — Camera placeholder */}
          {step === 1 && (
            <div className="card p-6 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <ScanFace className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                Your camera preview will appear here once you start the face scan.
              </p>
            </div>
          )}

          {/* Step 2 — Video feed */}
          {step === 2 && (
            <div className="card p-6">
              <div className="relative bg-slate-900 rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                {cameraState === 'active' || cameraState === 'starting' ? (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    <canvas
                      ref={overlayCanvasRef}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    />
                    {!faceDetected && scanStatus === 'scanning' && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="relative" style={{ width: '45%', height: '65%' }}>
                          <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/30 animate-pulse" />
                        </div>
                      </div>
                    )}
                    {scanStatus === 'scanning' && (
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                        <span className={cn(
                          'text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm',
                          faceDetected ? 'bg-primary-500/80 text-white' : 'bg-slate-800/80 text-slate-300'
                        )}>
                          {faceDetected ? '✓ Face Detected' : 'Searching for face…'}
                        </span>
                        <span className="text-xs font-mono font-bold bg-black/60 text-white px-2.5 py-1 rounded-full">
                          {timeLeft}s
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between">
                      <span className="text-xs text-white/80 bg-black/50 px-3 py-1 rounded-full">
                        Descriptors: {descriptorsCollected}/{DESCRIPTOR_GOAL}
                      </span>
                      {scanStatus === 'scanning' && (
                        <span className="text-xs text-white/70 bg-black/50 px-3 py-1 rounded-full">
                          Slowly turn your head
                        </span>
                      )}
                    </div>
                    {scanStatus === 'processing' && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-20 gap-3">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                        <p className="text-white font-medium">Processing facial data…</p>
                      </div>
                    )}
                  </>
                ) : cameraState === 'denied' ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
                    <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center">
                      <VideoOff className="w-7 h-7 text-amber-400" />
                    </div>
                    <h4 className="text-white font-semibold">Camera Access Denied</h4>
                    <p className="text-sm text-slate-400 text-center max-w-xs">
                      Please allow camera access in your browser settings and try again.
                    </p>
                    <button onClick={beginScanStep} className="btn-secondary text-sm mt-2">
                      Retry
                    </button>
                  </div>
                ) : cameraState === 'error' ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
                    <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-7 h-7 text-amber-400" />
                    </div>
                    <h4 className="text-white font-semibold">Camera Unavailable</h4>
                    <p className="text-sm text-slate-400 text-center max-w-xs">
                      Could not access webcam. Make sure it's connected and not in use by another app.
                    </p>
                    <button onClick={beginScanStep} className="btn-secondary text-sm mt-2">
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
                    <Loader2 className="w-10 h-10 text-slate-500 dark:text-slate-400 animate-spin" />
                    <p className="text-slate-400 text-sm">Initializing…</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3 — Complete placeholder */}
          {step === 3 && (
            <div className="card p-6 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center">
                Scan complete — awaiting admin review.
              </p>
            </div>
          )}
        </div>

        {/* ─── Right Column: Instructions / Controls / Status ──────── */}
        <div className="space-y-6">
          {/* Step 1 — Instructions */}
          {step === 1 && (
            <div className="card p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ScanFace className="w-8 h-8 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Facial Recognition Enrollment</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  We'll use AI-powered video scanning to capture your facial data for automated event attendance.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    How It Works
                  </h4>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1.5 list-disc list-inside">
                    <li>Your webcam opens and streams a live video feed</li>
                    <li>Face-API detects and tracks your face in real time</li>
                    <li>The system automatically captures {DESCRIPTOR_GOAL} facial descriptors over {SCAN_DURATION_SEC} seconds</li>
                    <li>Facial landmarks are overlaid on the video so you know it's working</li>
                    <li>No photos are stored — only mathematical face descriptors</li>
                  </ul>
                </div>

                <div className="bg-primary-50/60 border border-emerald-200 dark:border-slate-700 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-primary-800 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Tips for Best Results
                  </h4>
                  <ul className="mt-2 text-sm text-primary-700 space-y-1.5 list-disc list-inside">
                    <li>Use a well-lit room — avoid backlighting</li>
                    <li>Remove sunglasses, hats, or face coverings</li>
                    <li>Look directly at the camera, then slowly tilt your head</li>
                    <li>Stay within arm's length of the camera</li>
                  </ul>
                </div>

                <div className="bg-blue-50/40 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Privacy Notice
                  </h4>
                  <p className="mt-1 text-sm text-blue-700">
                    Your facial data is securely stored as numerical descriptors and used solely for event attendance.
                    You can request deletion at any time.
                  </p>
                </div>
              </div>

              <button
                onClick={beginScanStep}
                disabled={modelsLoading}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {modelsLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading Models…
                  </>
                ) : (
                  <>
                    Start Face Scan
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2 — Scan controls */}
          {step === 2 && (
            <div className="card p-6 space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Live Face Scan</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{scanMessage}</p>
              </div>

              <div>
                {cameraState === 'active' && scanStatus === 'scanning' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
                    <CircleDot className="w-3 h-3 animate-pulse" />
                    Scanning
                  </span>
                )}
                {(cameraState === 'starting' || scanStatus === 'waiting') && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading
                  </span>
                )}
                {scanStatus === 'done' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Complete
                  </span>
                )}
                {scanStatus === 'failed' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full">
                    <AlertTriangle className="w-3 h-3" />
                    Retry
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                  <span>Scan progress</span>
                  <span>{Math.round(scanProgress)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-300', progressColor)}
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {Array.from({ length: DESCRIPTOR_GOAL }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 h-2 rounded-full transition-all duration-500',
                      i < descriptorsCollected ? 'bg-primary-500' : 'bg-slate-200',
                    )}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3">
                {scanStatus === 'done' ? (
                  <button onClick={handleSubmit} className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all duration-200">
                    <Upload className="w-4 h-4" />
                    Submit Enrollment
                  </button>
                ) : scanStatus === 'failed' ? (
                  <button onClick={handleRetry} className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all duration-200">
                    <RotateCcw className="w-4 h-4" />
                    Retry Scan
                  </button>
                ) : (
                  <button disabled className="flex-1 flex items-center justify-center gap-2 bg-primary-400 text-white px-4 py-2.5 rounded-xl font-semibold text-sm opacity-50 cursor-not-allowed">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scanning…
                  </button>
                )}
                {scanStatus !== 'scanning' && scanStatus !== 'processing' && (
                  <button onClick={() => { stopCamera(); setStep(1); }} className="btn-secondary flex items-center gap-2">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 3 — Submitted */}
          {step === 3 && (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Enrollment Submitted!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Your facial scan data ({DESCRIPTOR_GOAL} descriptors) has been submitted for review.
                An administrator will verify and approve your enrollment.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-emerald-200 dark:border-slate-700 text-sm">
                  <p className="text-slate-400 text-xs">Descriptors</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{DESCRIPTOR_GOAL} captured</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-emerald-200 dark:border-slate-700 text-sm">
                  <p className="text-slate-400 text-xs">Method</p>
                  <p className="font-semibold text-slate-900 dark:text-white">Video Scan</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-slate-700 rounded-lg">
                <p className="text-sm text-emerald-800 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Estimated approval time: 24-48 hours
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
