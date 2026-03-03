import { useState } from 'react';
import { PageHeader } from '../../components/ui';
import { cn } from '../../lib/utils';
import { ScanFace, Camera, Upload, CheckCircle, AlertTriangle, Info, ArrowRight, RotateCcw } from 'lucide-react';

export default function FacialEnrollment() {
  const [step, setStep] = useState(1); // 1: intro, 2: capture, 3: review, 4: submitted
  const [capturedImages, setCapturedImages] = useState([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState('not_enrolled'); // not_enrolled, pending, enrolled

  const handleCapture = () => {
    // Simulate capturing an image
    setCapturedImages((prev) => [
      ...prev,
      { id: Date.now(), preview: `Photo ${prev.length + 1}` },
    ]);
  };

  const handleSubmit = () => {
    setStep(4);
    setEnrollmentStatus('pending');
  };

  if (enrollmentStatus === 'enrolled') {
    return (
      <div className="space-y-8 animate-fade-in">
        <PageHeader title="Facial Enrollment" description="Your facial recognition data." />
        <div className="card p-8 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Enrollment Active</h3>
          <p className="text-sm text-slate-500 mt-2">
            Your facial data has been approved and is active for event check-in verification.
          </p>
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Status</p>
                <p className="font-medium text-emerald-600">Approved</p>
              </div>
              <div>
                <p className="text-slate-500">Images</p>
                <p className="font-medium text-slate-900">5 photos</p>
              </div>
              <div>
                <p className="text-slate-500">Enrolled Date</p>
                <p className="font-medium text-slate-900">Feb 15, 2026</p>
              </div>
              <div>
                <p className="text-slate-500">Last Used</p>
                <p className="font-medium text-slate-900">Mar 3, 2026</p>
              </div>
            </div>
          </div>
          <button className="btn-danger text-sm mt-6">
            Request Re-enrollment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Facial Enrollment"
        description="Register your face for automated event attendance verification."
      />

      {/* Progress Steps */}
      <div className="card p-4">
        <div className="flex items-center justify-center gap-0">
          {['Instructions', 'Capture Photos', 'Review', 'Submit'].map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;
            return (
              <div key={label} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                      isActive ? 'bg-primary-600 text-white' :
                      isCompleted ? 'bg-emerald-500 text-white' :
                      'bg-slate-200 text-slate-500'
                    )}
                  >
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : stepNum}
                  </div>
                  <span className={cn('text-sm font-medium hidden sm:block', isActive ? 'text-primary-700' : 'text-slate-500')}>
                    {label}
                  </span>
                </div>
                {i < 3 && <div className={cn('w-12 sm:w-20 h-0.5 mx-2', step > stepNum ? 'bg-emerald-500' : 'bg-slate-200')} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && (
        <div className="card p-8 max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ScanFace className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Facial Recognition Enrollment</h3>
            <p className="text-sm text-slate-500 mt-2">
              This process will capture your facial data for automated event attendance.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Guidelines
              </h4>
              <ul className="mt-2 text-sm text-blue-700 space-y-1.5 list-disc list-inside">
                <li>Ensure good lighting on your face</li>
                <li>Remove sunglasses, hats, or face coverings</li>
                <li>Look directly at the camera</li>
                <li>Capture 5 photos from slightly different angles</li>
                <li>Keep a neutral expression</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Privacy Notice
              </h4>
              <p className="mt-1 text-sm text-amber-700">
                Your facial data is securely stored and used solely for university event attendance verification.
                You can request deletion at any time.
              </p>
            </div>
          </div>

          <button onClick={() => setStep(2)} className="btn-primary w-full flex items-center justify-center gap-2">
            Start Enrollment
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card p-8 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Capture Your Photos</h3>
          <p className="text-sm text-slate-500 mb-6">
            Take {5 - capturedImages.length} more photo{5 - capturedImages.length !== 1 ? 's' : ''}. 
            Slightly adjust your head angle for each one.
          </p>

          {/* Camera Viewport Placeholder */}
          <div className="bg-slate-900 rounded-xl aspect-video flex items-center justify-center mb-6 relative overflow-hidden">
            <div className="absolute inset-0 border-2 border-dashed border-slate-600 m-8 rounded-full opacity-50" />
            <div className="text-center">
              <Camera className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Camera viewport</p>
              <p className="text-slate-600 text-xs mt-1">Position your face within the oval guide</p>
            </div>
          </div>

          {/* Captured Photos Grid */}
          <div className="flex items-center gap-3 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-16 h-16 rounded-lg border-2 flex items-center justify-center text-xs font-medium',
                  i < capturedImages.length
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-dashed border-slate-300 bg-slate-50 text-slate-400'
                )}
              >
                {i < capturedImages.length ? (
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                ) : (
                  i + 1
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {capturedImages.length < 5 ? (
              <button onClick={handleCapture} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Camera className="w-4 h-4" />
                Capture Photo ({capturedImages.length}/5)
              </button>
            ) : (
              <button onClick={() => setStep(3)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                Review Photos
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {capturedImages.length > 0 && (
              <button
                onClick={() => setCapturedImages([])}
                className="btn-secondary flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card p-8 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Review Your Photos</h3>
          <p className="text-sm text-slate-500 mb-6">
            Please verify that all 5 photos are clear and show your face properly.
          </p>

          <div className="grid grid-cols-5 gap-3 mb-6">
            {capturedImages.map((img, i) => (
              <div key={img.id} className="aspect-square bg-slate-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <ScanFace className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500 mt-1">Photo {i + 1}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-sm text-slate-600">
            <p className="font-medium">Before submitting, make sure:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-slate-500">
              <li>Your face is clearly visible in all photos</li>
              <li>Photos are well-lit and not blurry</li>
              <li>You are the only person in each photo</li>
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary flex-1">
              Retake Photos
            </button>
            <button onClick={handleSubmit} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              Submit for Review
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card p-8 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Enrollment Submitted!</h3>
          <p className="text-sm text-slate-500 mt-2">
            Your facial data has been submitted for review. An administrator will verify and approve your enrollment.
            You'll be notified once it's approved.
          </p>
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Estimated approval time: 24-48 hours
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
