import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/ui';
import { cn, getInitials } from '../lib/utils';
import {
  UserCircle, Mail, Shield, CreditCard, ScanFace,
  MapPin, Calendar, CheckCircle, Clock, AlertCircle,
} from 'lucide-react';

const enrollmentStatusMap = {
  enrolled: { label: 'Enrolled', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-100' },
  pending: { label: 'Pending', icon: Clock, color: 'text-emerald-600 bg-emerald-50' },
  none: { label: 'Not Enrolled', icon: AlertCircle, color: 'text-slate-500 bg-slate-100' },
};

export default function Profile() {
  const { user } = useAuth();

  const mockProfile = {
    name: user?.name || 'User',
    email: user?.email || 'user@ueventtrack.com',
    role: user?.role || 'student',
    student_id: '2024-00001',
    department: 'College of Information Technology',
    joined: '2024-08-15',
    rfid_tag: 'RFID-001-2024',
    rfid_status: 'active',
    face_enrollment: 'enrolled',
    events_attended: 24,
    total_events: 35,
  };

  const enrollment = enrollmentStatusMap[mockProfile.face_enrollment] || enrollmentStatusMap.none;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="My Profile" description="View your account information and enrollment status." />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="card p-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold">
              {getInitials(mockProfile.name)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">{mockProfile.name}</h2>
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                <Mail className="w-4 h-4" />{mockProfile.email}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="badge bg-emerald-100 text-emerald-800 capitalize">
                  <Shield className="w-3 h-3 mr-1" />
                  {mockProfile.role === 'admin' ? 'USG Admin' : mockProfile.role === 'organizer' ? 'Event Organizer' : 'Student'}
                </span>
                {mockProfile.role === 'student' && (
                  <span className="text-xs text-slate-500">{mockProfile.student_id}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-emerald-600" />Account Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Department</span>
                <span className="font-medium text-slate-900">{mockProfile.department}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Member Since</span>
                <span className="font-medium text-slate-900">{new Date(mockProfile.joined).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Events Attended</span>
                <span className="font-medium text-slate-900">{mockProfile.events_attended} / {mockProfile.total_events}</span>
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />RFID Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">RFID Tag</span>
                <span className="font-mono font-medium text-slate-900">{mockProfile.rfid_tag || 'Not Assigned'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tag Status</span>
                <span className={cn(
                  'badge capitalize',
                  mockProfile.rfid_status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                )}>
                  {mockProfile.rfid_status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Face Enrollment & Location */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ScanFace className="w-4 h-4 text-emerald-600" />Facial Enrollment
            </h3>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', enrollment.color)}>
                <enrollment.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{enrollment.label}</p>
                <p className="text-xs text-slate-500">
                  {mockProfile.face_enrollment === 'enrolled'
                    ? '5 face descriptors captured'
                    : mockProfile.face_enrollment === 'pending'
                    ? 'Awaiting admin approval'
                    : 'Complete facial enrollment for face check-in'}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />Location Tracking
            </h3>
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-100">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-800">Campus Geofence Active</p>
                <p className="text-xs text-emerald-600">Check-in restricted to 500m campus radius</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
