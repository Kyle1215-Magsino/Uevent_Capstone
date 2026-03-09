import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { StatsCard, PageHeader, StatusBadge } from '../../components/ui';
import { cn, formatDateTime } from '../../lib/utils';
import {
  Calendar,
  ClipboardCheck,
  ScanFace,
  History,
  Clock,
  MapPin,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Navigation,
} from 'lucide-react';

const mockStats = {
  eventsAttended: 24,
  totalEvents: 35,
  enrollmentStatus: 'enrolled', // enrolled | pending | not_enrolled
  attendanceRate: 68.6,
};

const mockUpcomingEvents = [
  { id: 1, title: 'Leadership Training Seminar', date: '2026-03-05T09:00:00', venue: 'Main Auditorium', method: 'face_recognition' },
  { id: 2, title: 'Freshman Orientation', date: '2026-03-10T08:00:00', venue: 'Main Auditorium', method: 'face_recognition' },
  { id: 3, title: 'Inter-College Sports Fest', date: '2026-03-15T07:00:00', venue: 'Sports Complex', method: 'rfid' },
];

const mockRecentAttendance = [
  { id: 1, event: 'Cultural Night 2026', date: '2026-03-03T18:00:00', status: 'present', method: 'face' },
  { id: 2, event: 'Academic Excellence Awards', date: '2026-03-01T14:00:00', status: 'present', method: 'rfid' },
  { id: 3, event: 'Environmental Awareness Campaign', date: '2026-02-28T08:00:00', status: 'absent', method: '-' },
  { id: 4, event: 'Tech Innovation Summit', date: '2026-02-20T09:00:00', status: 'present', method: 'face' },
];

export default function StudentDashboard() {
  const { user } = useAuth();

  const enrollmentBanner = {
    enrolled: { bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-slate-700', icon: CheckCircle, iconColor: 'text-emerald-600', text: 'Your facial data is enrolled and active.', textColor: 'text-emerald-800' },
    pending: { bg: 'bg-amber-50 border-amber-200', icon: Clock, iconColor: 'text-amber-600', text: 'Your facial enrollment is pending approval.', textColor: 'text-amber-800' },
    not_enrolled: { bg: 'bg-slate-50 dark:bg-slate-800/50 border-emerald-200 dark:border-slate-700', icon: AlertCircle, iconColor: 'text-slate-600 dark:text-slate-300', text: 'You haven\'t enrolled your facial data yet.', textColor: 'text-slate-800' },
  };

  const banner = enrollmentBanner[mockStats.enrollmentStatus];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={`Hello, ${user?.name?.split(' ')[0] || 'Student'}`}
        description="View your events and attendance records."
      />

      {/* Enrollment Status Banner */}
      <div className={cn('border rounded-xl p-4 flex items-center justify-between', banner.bg)}>
        <div className="flex items-center gap-3">
          <banner.icon className={cn('w-6 h-6', banner.iconColor)} />
          <div>
            <p className={cn('text-sm font-medium', banner.textColor)}>Facial Enrollment</p>
            <p className={cn('text-xs', banner.textColor, 'opacity-80')}>{banner.text}</p>
          </div>
        </div>
        {mockStats.enrollmentStatus === 'not_enrolled' && (
          <Link to="/student/enrollment" className="btn-primary text-sm">
            Enroll Now
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard title="Events Attended" value={mockStats.eventsAttended} icon={ClipboardCheck} iconColor="emerald" />
        <StatsCard title="Total Events" value={mockStats.totalEvents} icon={Calendar} iconColor="blue" />
        <StatsCard title="Attendance Rate" value={`${mockStats.attendanceRate}%`} icon={History} iconColor="amber" />
        <StatsCard
          title="Face Enrollment"
          value={mockStats.enrollmentStatus === 'enrolled' ? 'Active' : mockStats.enrollmentStatus === 'pending' ? 'Pending' : 'None'}
          icon={ScanFace}
          iconColor="violet"
        />
        <StatsCard title="RFID Tag" value={mockStats.rfidStatus === 'active' ? mockStats.rfidTag : 'Not Assigned'} icon={CreditCard} iconColor="rose" />
        <StatsCard title="Campus Location" value="Geofence Active" icon={Navigation} iconColor="cyan" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="card">
          <div className="px-6 py-4 border-b border-emerald-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">Upcoming Events</h3>
            <Link to="/student/events" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </Link>
          </div>
          <div className="divide-y divide-emerald-100">
            {mockUpcomingEvents.map((event) => (
              <div key={event.id} className="px-6 py-4 hover:bg-primary-50/30">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{event.title}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(event.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {event.venue}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="card">
          <div className="px-6 py-4 border-b border-emerald-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Attendance</h3>
            <Link to="/student/attendance" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </Link>
          </div>
          <div className="divide-y divide-emerald-100">
            {mockRecentAttendance.map((record) => (
              <div key={record.id} className="px-6 py-4 flex items-center justify-between hover:bg-primary-50/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{record.event}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDateTime(record.date)}</p>
                </div>
                <StatusBadge status={record.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
