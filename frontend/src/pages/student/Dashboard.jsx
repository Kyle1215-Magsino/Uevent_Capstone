import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { StatsCard, PageHeader, StatusBadge } from '../../components/ui';
import { cn, formatDateTime } from '../../lib/utils';
import { eventsAPI, attendanceAPI, enrollmentAPI } from '../../api/endpoints';
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
  Loader2,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState('not_enrolled');
  const [stats, setStats] = useState({ eventsAttended: 0, totalEvents: 0, attendanceRate: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [upcomingRes, attendanceRes, enrollmentRes] = await Promise.allSettled([
          eventsAPI.getUpcoming(),
          attendanceAPI.getMyAttendance(),
          enrollmentAPI.getStatus(),
        ]);

        if (cancelled) return;

        // Upcoming events
        if (upcomingRes.status === 'fulfilled') {
          const data = upcomingRes.value.data?.data || upcomingRes.value.data || [];
          setUpcomingEvents(Array.isArray(data) ? data.slice(0, 3) : []);
        }

        // Attendance
        if (attendanceRes.status === 'fulfilled') {
          const records = attendanceRes.value.data?.data || attendanceRes.value.data || [];
          const list = Array.isArray(records) ? records : [];
          setRecentAttendance(list.slice(0, 4));

          const presentCount = list.filter((a) => a.status === 'present').length;
          setStats({
            eventsAttended: presentCount,
            totalEvents: list.length,
            attendanceRate: list.length > 0 ? parseFloat(((presentCount / list.length) * 100).toFixed(1)) : 0,
          });
        }

        // Enrollment status
        if (enrollmentRes.status === 'fulfilled') {
          const enrollment = enrollmentRes.value.data;
          if (enrollment?.status === 'approved') setEnrollmentStatus('enrolled');
          else if (enrollment?.status === 'pending') setEnrollmentStatus('pending');
          else setEnrollmentStatus('not_enrolled');
        }
      } catch {
        // silently handle – pages show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const enrollmentBanner = {
    enrolled: { bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-slate-700', icon: CheckCircle, iconColor: 'text-emerald-600', text: 'Your facial data is enrolled and active.', textColor: 'text-emerald-800' },
    pending: { bg: 'bg-amber-50 border-amber-200', icon: Clock, iconColor: 'text-amber-600', text: 'Your facial enrollment is pending approval.', textColor: 'text-amber-800' },
    not_enrolled: { bg: 'bg-slate-50 dark:bg-slate-800/50 border-emerald-200 dark:border-slate-700', icon: AlertCircle, iconColor: 'text-slate-600 dark:text-slate-300', text: 'You haven\'t enrolled your facial data yet.', textColor: 'text-slate-800' },
  };

  const banner = enrollmentBanner[enrollmentStatus];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

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
        {enrollmentStatus === 'not_enrolled' && (
          <Link to="/student/enrollment" className="btn-primary text-sm">
            Enroll Now
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard title="Events Attended" value={stats.eventsAttended} icon={ClipboardCheck} iconColor="emerald" />
        <StatsCard title="Total Events" value={stats.totalEvents} icon={Calendar} iconColor="blue" />
        <StatsCard title="Attendance Rate" value={`${stats.attendanceRate}%`} icon={History} iconColor="amber" />
        <StatsCard
          title="Face Enrollment"
          value={enrollmentStatus === 'enrolled' ? 'Active' : enrollmentStatus === 'pending' ? 'Pending' : 'None'}
          icon={ScanFace}
          iconColor="violet"
        />
        <StatsCard title="RFID Tag" value="Not Assigned" icon={CreditCard} iconColor="rose" />
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
            {upcomingEvents.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No upcoming events.</div>
            ) : (
              upcomingEvents.map((event) => (
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
              ))
            )}
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
            {recentAttendance.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No attendance records yet.</div>
            ) : (
              recentAttendance.map((record) => (
                <div key={record.id} className="px-6 py-4 flex items-center justify-between hover:bg-primary-50/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{record.event?.title || record.event}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDateTime(record.check_in_time || record.date)}</p>
                  </div>
                  <StatusBadge status={record.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
