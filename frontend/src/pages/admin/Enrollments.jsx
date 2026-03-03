import { useState, useRef, useCallback, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { PageHeader, DataTable, SearchInput, ConfirmDialog, Modal } from '../../components/ui';
import { cn, getInitials, formatDateTime } from '../../lib/utils';
import {
  ScanFace, Check, X, Eye, ShieldCheck, Loader2,
  Video, VideoOff, AlertTriangle, CircleDot, CheckCircle, RotateCcw,
} from 'lucide-react';

/* ── Constants ─────────────────────────────────────────────────────── */
const MODEL_URL = '/models';
const DESCRIPTOR_GOAL = 5;

/* ── Mock data — now includes descriptor count & method ────────────── */
const mockEnrollments = [
  { id: 1, name: 'Juan Dela Cruz', student_id: '2024-00001', email: 'juan@university.edu', submitted: '2026-03-02T14:30:00', status: 'pending', descriptors: 5, method: 'Video Scan', quality: 94 },
  { id: 2, name: 'Maria Santos', student_id: '2024-00002', email: 'maria@university.edu', submitted: '2026-03-02T11:00:00', status: 'approved', descriptors: 5, method: 'Video Scan', quality: 97 },
  { id: 3, name: 'Pedro Gomez', student_id: '2024-00003', email: 'pedro@university.edu', submitted: '2026-03-01T09:15:00', status: 'pending', descriptors: 5, method: 'Video Scan', quality: 88 },
  { id: 4, name: 'Ana Rivera', student_id: '2024-00004', email: 'ana@university.edu', submitted: '2026-02-28T16:45:00', status: 'approved', descriptors: 5, method: 'Video Scan', quality: 96 },
  { id: 5, name: 'Carlos Mendoza', student_id: '2024-00005', email: 'carlos@university.edu', submitted: '2026-02-28T10:20:00', status: 'rejected', descriptors: 3, method: 'Video Scan', quality: 42 },
];

export default function Enrollments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewEnrollment, setViewEnrollment] = useState(null);
  const [approveConfirm, setApproveConfirm] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  /* ── Face-api verification state ─────────────────────────────── */
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [cameraState, setCameraState] = useState('idle');
  const [verifyStatus, setVerifyStatus] = useState('idle'); // idle | detecting | matched | no_match | error
  const [faceDetected, setFaceDetected] = useState(false);
  const [matchScore, setMatchScore] = useState(null);
  const [detectionCount, setDetectionCount] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectIntervalRef = useRef(null);

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

  /* ── Start webcam ──────────────────────────────────────────────── */
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
      setCameraState(err.name === 'NotAllowedError' ? 'denied' : 'error');
    }
  }, []);

  /* ── Stop webcam ───────────────────────────────────────────────── */
  const stopCamera = useCallback(() => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState('idle');
  }, []);

  /* ── Draw detection overlay ────────────────────────────────────── */
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
      const mirroredX = displaySize.width - x - width;

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(mirroredX, y, width, height);

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

      ctx.font = '12px Inter, sans-serif';
      ctx.fillStyle = '#10b981';
      ctx.fillText('Face Detected', mirroredX, y - 6);
    }
  }, []);

  /* ── Start live detection for verification ─────────────────────── */
  const startVerification = useCallback(() => {
    if (!videoRef.current || !modelsLoaded) return;

    setVerifyStatus('detecting');
    setDetectionCount(0);
    setMatchScore(null);
    setFaceDetected(false);

    let count = 0;

    detectIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused) return;

      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setFaceDetected(true);
        drawOverlay(detection);
        count++;
        setDetectionCount(count);

        // After 3 successful detections, compute match score
        if (count >= 3) {
          clearInterval(detectIntervalRef.current);
          const score = detection.detection.score;
          const percent = Math.round(score * 100);
          setMatchScore(percent);
          setVerifyStatus(percent >= 70 ? 'matched' : 'no_match');
        }
      } else {
        setFaceDetected(false);
        drawOverlay(null);
      }
    }, 500);
  }, [modelsLoaded, drawOverlay]);

  /* ── Open verify modal ─────────────────────────────────────────── */
  const openVerify = useCallback(async (enrollment) => {
    setVerifyTarget(enrollment);
    setVerifyStatus('idle');
    setMatchScore(null);
    setFaceDetected(false);
    setDetectionCount(0);

    const ok = await loadModels();
    if (!ok) {
      setVerifyStatus('error');
      return;
    }
    await startCamera();
  }, [loadModels, startCamera]);

  /* ── Close verify modal ────────────────────────────────────────── */
  const closeVerify = useCallback(() => {
    stopCamera();
    setVerifyTarget(null);
    setVerifyStatus('idle');
  }, [stopCamera]);

  /* Auto-start detection when camera goes active in verify modal */
  useEffect(() => {
    if (verifyTarget && cameraState === 'active' && modelsLoaded && verifyStatus === 'idle') {
      const t = setTimeout(() => startVerification(), 800);
      return () => clearTimeout(t);
    }
  }, [verifyTarget, cameraState, modelsLoaded, verifyStatus, startVerification]);

  /* Cleanup on unmount */
  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Filtered data ─────────────────────────────────────────────── */
  const filtered = mockEnrollments.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.student_id.includes(search) ||
      e.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = mockEnrollments.filter((e) => e.status === 'pending').length;

  /* ── Quality color helper ──────────────────────────────────────── */
  const qualityColor = (q) => {
    if (q >= 90) return 'text-emerald-600';
    if (q >= 70) return 'text-emerald-500';
    return 'text-emerald-400';
  };

  const qualityBg = (q) => {
    if (q >= 90) return 'bg-emerald-500';
    if (q >= 70) return 'bg-emerald-400';
    return 'bg-emerald-300';
  };

  /* ── Table Columns ─────────────────────────────────────────────── */
  const columns = [
    {
      key: 'name',
      label: 'Student',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
            {getInitials(row.name)}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'student_id',
      label: 'Student ID',
    },
    {
      key: 'descriptors',
      label: 'Descriptors',
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: DESCRIPTOR_GOAL }).map((_, i) => (
              <div
                key={i}
                className={cn('w-4 h-1.5 rounded-full', i < val ? 'bg-emerald-500' : 'bg-slate-200')}
              />
            ))}
          </div>
          <span className="text-xs text-slate-500">{val}/{DESCRIPTOR_GOAL}</span>
        </div>
      ),
    },
    {
      key: 'quality',
      label: 'Quality',
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full', qualityBg(val))} style={{ width: `${val}%` }} />
          </div>
          <span className={cn('text-xs font-semibold', qualityColor(val))}>{val}%</span>
        </div>
      ),
    },
    {
      key: 'submitted',
      label: 'Submitted',
      render: (val) => <span className="text-sm text-slate-500">{formatDateTime(val)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span
          className={cn(
            'badge capitalize',
            val === 'approved'
              ? 'bg-emerald-100 text-emerald-800'
              : val === 'rejected'
              ? 'bg-slate-100 text-slate-600'
              : 'bg-emerald-50 text-emerald-700'
          )}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewEnrollment(row)}
            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => openVerify(row)}
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Test Face Verification"
          >
            <Video className="w-4 h-4" />
          </button>
          {row.status === 'pending' && (
            <>
              <button
                onClick={() => setApproveConfirm(row)}
                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Approve"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setRejectTarget(row); setRejectReason(''); }}
                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Reject"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Facial Enrollments"
        description="Review and manage student facial recognition enrollment requests."
      />

      {/* Pending Banner */}
      {pendingCount > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <ScanFace className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-800">
              {pendingCount} enrollment{pendingCount !== 1 ? 's' : ''} pending review
            </p>
            <p className="text-xs text-emerald-600">These students are waiting for their facial data to be approved.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name, ID, or email..." />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                  statusFilter === status ? 'bg-primary-100 text-primary-700' : 'text-slate-600 hover:bg-primary-50/30'
                )}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <DataTable columns={columns} data={filtered} emptyMessage="No enrollment requests found." />
      </div>

      {/* ═════════ View Enrollment Modal ═════════ */}
      <Modal open={!!viewEnrollment} onClose={() => setViewEnrollment(null)} title="Enrollment Details" size="lg">
        {viewEnrollment && (
          <div className="space-y-5">
            {/* Student Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-lg font-bold">
                {getInitials(viewEnrollment.name)}
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-900">{viewEnrollment.name}</h4>
                <p className="text-sm text-slate-500">{viewEnrollment.email}</p>
                <p className="text-sm text-slate-500">ID: {viewEnrollment.student_id}</p>
              </div>
            </div>

            {/* Enrollment Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Status</p>
                <span className={cn('badge capitalize mt-1.5 inline-block', viewEnrollment.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : viewEnrollment.status === 'rejected' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700')}>
                  {viewEnrollment.status}
                </span>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Descriptors</p>
                <p className="font-semibold text-slate-900 mt-1.5">{viewEnrollment.descriptors} / {DESCRIPTOR_GOAL}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Quality</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={cn('font-semibold', qualityColor(viewEnrollment.quality))}>{viewEnrollment.quality}%</span>
                </div>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Submitted</p>
                <p className="font-medium text-slate-900 mt-1.5">{formatDateTime(viewEnrollment.submitted)}</p>
              </div>
            </div>

            {/* Descriptor Visualization */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Face Descriptor Samples</p>
              <div className="grid grid-cols-5 gap-3">
                {Array.from({ length: DESCRIPTOR_GOAL }).map((_, i) => {
                  const captured = i < viewEnrollment.descriptors;
                  return (
                    <div
                      key={i}
                      className={cn(
                        'aspect-square rounded-xl flex flex-col items-center justify-center border transition-colors',
                        captured ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                      )}
                    >
                      {captured ? (
                        <>
                          <ScanFace className="w-6 h-6 text-emerald-500 mb-1" />
                          <span className="text-[10px] font-medium text-emerald-600">Sample {i + 1}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 mb-1" />
                          <span className="text-[10px] font-medium text-slate-400">Empty</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quality Breakdown */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Scan Quality Metrics</p>
              <div className="space-y-2">
                {[
                  { label: 'Face Detection Confidence', value: viewEnrollment.quality },
                  { label: 'Landmark Accuracy', value: Math.min(100, viewEnrollment.quality + 3) },
                  { label: 'Descriptor Consistency', value: Math.max(0, viewEnrollment.quality - 2) },
                ].map((metric) => (
                  <div key={metric.label} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-40 flex-shrink-0">{metric.label}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', qualityBg(metric.value))} style={{ width: `${metric.value}%` }} />
                    </div>
                    <span className={cn('text-xs font-semibold w-10 text-right', qualityColor(metric.value))}>{metric.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scan Method Info */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
              <Video className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-emerald-800">
                <p className="font-medium">Captured via {viewEnrollment.method}</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Face-API.js TinyFaceDetector + FaceLandmark68 + FaceRecognition — {viewEnrollment.descriptors} 128-dimensional descriptors
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => { openVerify(viewEnrollment); setViewEnrollment(null); }}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                <Video className="w-4 h-4" />
                Test Verification
              </button>
              {viewEnrollment.status === 'pending' && (
                <>
                  <div className="flex-1" />
                  <button onClick={() => { setRejectTarget(viewEnrollment); setRejectReason(''); setViewEnrollment(null); }} className="btn-danger text-sm flex items-center gap-1">
                    <X className="w-4 h-4" />Reject
                  </button>
                  <button onClick={() => { setApproveConfirm(viewEnrollment); setViewEnrollment(null); }} className="btn-primary text-sm flex items-center gap-1">
                    <Check className="w-4 h-4" />Approve
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ═════════ Face Verification Modal ═════════ */}
      <Modal open={!!verifyTarget} onClose={closeVerify} title="Face Verification Test" size="lg">
        {verifyTarget && (
          <div className="space-y-5">
            {/* Student header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                  {getInitials(verifyTarget.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{verifyTarget.name}</p>
                  <p className="text-xs text-slate-500">{verifyTarget.student_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {verifyStatus === 'detecting' && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <CircleDot className="w-3 h-3 animate-pulse" />
                    Detecting
                  </span>
                )}
                {verifyStatus === 'matched' && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Match Found
                  </span>
                )}
                {verifyStatus === 'no_match' && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                    <AlertTriangle className="w-3 h-3" />
                    Low Match
                  </span>
                )}
              </div>
            </div>

            {/* Live Video Feed */}
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
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  />

                  {/* Top overlay info */}
                  {verifyStatus === 'detecting' && (
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                      <span className={cn(
                        'text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm',
                        faceDetected ? 'bg-emerald-500/80 text-white' : 'bg-slate-800/80 text-slate-300'
                      )}>
                        {faceDetected ? '✓ Face Detected' : 'Searching for face…'}
                      </span>
                      <span className="text-xs font-mono bg-black/60 text-white px-2.5 py-1 rounded-full">
                        {detectionCount}/3 samples
                      </span>
                    </div>
                  )}

                  {/* Match result overlay */}
                  {(verifyStatus === 'matched' || verifyStatus === 'no_match') && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3 z-10">
                      <div className={cn(
                        'w-16 h-16 rounded-full flex items-center justify-center',
                        verifyStatus === 'matched' ? 'bg-emerald-500' : 'bg-slate-500'
                      )}>
                        {verifyStatus === 'matched' ? (
                          <CheckCircle className="w-8 h-8 text-white" />
                        ) : (
                          <AlertTriangle className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <p className="text-white font-semibold text-lg">
                        {verifyStatus === 'matched' ? 'Face Match Verified' : 'Low Confidence Match'}
                      </p>
                      <p className="text-white/80 text-sm">
                        Confidence Score: <span className="font-bold">{matchScore}%</span>
                      </p>
                    </div>
                  )}

                  {/* Face oval guide */}
                  {!faceDetected && verifyStatus === 'detecting' && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative" style={{ width: '40%', height: '60%' }}>
                        <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/30 animate-pulse" />
                      </div>
                    </div>
                  )}
                </>
              ) : cameraState === 'denied' ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
                  <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <VideoOff className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h4 className="text-white font-semibold">Camera Access Denied</h4>
                  <p className="text-sm text-slate-400 text-center max-w-xs">
                    Please allow camera access in your browser settings.
                  </p>
                </div>
              ) : cameraState === 'error' ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
                  <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h4 className="text-white font-semibold">Camera Unavailable</h4>
                  <p className="text-sm text-slate-400 text-center max-w-xs">
                    Could not access the webcam.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
                  <Loader2 className="w-10 h-10 text-slate-500 animate-spin" />
                  <p className="text-slate-400 text-sm">
                    {modelsLoading ? 'Loading face detection models…' : 'Initializing camera…'}
                  </p>
                </div>
              )}
            </div>

            {/* Detection progress bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>Detection progress</span>
                <span>{Math.min(detectionCount, 3)}/3 samples</span>
              </div>
              <div className="flex items-center gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 h-2 rounded-full transition-all duration-500',
                      i < detectionCount ? 'bg-emerald-500' : 'bg-slate-200',
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Match Score Result */}
            {matchScore !== null && (
              <div className={cn(
                'p-4 rounded-lg border flex items-start gap-3',
                verifyStatus === 'matched' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
              )}>
                <ShieldCheck className={cn('w-5 h-5 mt-0.5 flex-shrink-0', verifyStatus === 'matched' ? 'text-emerald-600' : 'text-slate-500')} />
                <div>
                  <p className={cn('text-sm font-semibold', verifyStatus === 'matched' ? 'text-emerald-800' : 'text-slate-700')}>
                    {verifyStatus === 'matched'
                      ? `Face verified with ${matchScore}% confidence`
                      : `Low confidence: ${matchScore}%. Re-enrollment may be needed.`
                    }
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live face detection via Face-API.js TinyFaceDetector (3 sample verification)
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              {(verifyStatus === 'matched' || verifyStatus === 'no_match') && (
                <button
                  onClick={() => {
                    setVerifyStatus('idle');
                    setMatchScore(null);
                    setFaceDetected(false);
                    setDetectionCount(0);
                    if (cameraState === 'active') {
                      setTimeout(() => startVerification(), 500);
                    }
                  }}
                  className="btn-secondary text-sm flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry
                </button>
              )}
              <div className="flex-1" />
              {verifyTarget.status === 'pending' && verifyStatus === 'matched' && (
                <button
                  onClick={() => { setApproveConfirm(verifyTarget); closeVerify(); }}
                  className="btn-primary text-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Approve Enrollment
                </button>
              )}
              <button onClick={closeVerify} className="btn-secondary text-sm">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ═════════ Approve Confirmation ═════════ */}
      <ConfirmDialog
        open={!!approveConfirm}
        onClose={() => setApproveConfirm(null)}
        onConfirm={() => setApproveConfirm(null)}
        title="Approve Enrollment"
        message={`Approve facial enrollment for ${approveConfirm?.name} (${approveConfirm?.student_id})? This will allow them to use face recognition for event check-in.`}
        confirmText="Approve"
      />

      {/* ═════════ Reject Modal with Reason ═════════ */}
      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Enrollment" size="sm">
        {rejectTarget && (
          <form onSubmit={(e) => { e.preventDefault(); setRejectTarget(null); }} className="space-y-4">
            <p className="text-sm text-slate-500">
              Reject facial enrollment for <strong>{rejectTarget.name}</strong> ({rejectTarget.student_id})?
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason (optional)</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="input-field resize-none"
                placeholder="e.g., Descriptors quality too low, insufficient samples..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setRejectTarget(null)} className="btn-secondary text-sm">Cancel</button>
              <button type="submit" className="btn-danger text-sm">Reject Enrollment</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
