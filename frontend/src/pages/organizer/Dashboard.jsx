import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { StatsCard, PageHeader } from '../../components/ui';
import { cn, formatDateTime } from '../../lib/utils';
import {
  Calendar,
  CalendarPlus,
  ClipboardCheck,
  Users,
  Clock,
  ArrowRight,
  TrendingUp,
  Radio,
} from 'lucide-react';

const mockStats = {
  totalEvents: 12,
  activeEvents: 2,
  totalAttendance: 3420,
  avgRate: 82.5,
};

const mockMyEvents = [
  { id: 1, title: 'Leadership Training Seminar', date: '2026-03-05T09:00:00', status: 'upcoming', attendees: 0, capacity: 200, method: 'face_recognition' },
  { id: 2, title: 'Cultural Night 2026', date: '2026-03-03T18:00:00', status: 'ongoing', attendees: 342, capacity: 500, method: 'face_recognition' },
  { id: 3, title: 'Academic Excellence Awards', date: '2026-03-01T14:00:00', status: 'completed', attendees: 189, capacity: 200, method: 'rfid' },
];

export default function OrganizerDashboard() {
  const { user } = useAuth();

  const statusColors = {
    upcoming: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/50',
    ongoing: 'bg-primary-100 text-primary-800',
    completed: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/50',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] || 'Organizer'}`}
        description="Manage your assigned events and monitor attendance."
        actions={
          <Link to="/organizer/events" className="btn-primary flex items-center gap-2 text-sm">
            <CalendarPlus className="w-4 h-4" />
            Create Event
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="My Events" value={mockStats.totalEvents} icon={Calendar} iconColor="blue" />
        <StatsCard title="Active Now" value={mockStats.activeEvents} icon={Clock} iconColor="primary" />
        <StatsCard title="Total Attendance" value={mockStats.totalAttendance.toLocaleString()} icon={ClipboardCheck} iconColor="emerald" />
        <StatsCard title="Avg. Rate" value={`${mockStats.avgRate}%`} icon={TrendingUp} iconColor="amber" />
      </div>

      {/* My Events List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-emerald-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white">My Recent Events</h3>
          <Link to="/organizer/events" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View All
          </Link>
        </div>
        <div className="divide-y divide-emerald-100">
          {mockMyEvents.map((event) => (
            <div key={event.id} className="px-6 py-4 flex items-center justify-between hover:bg-primary-50/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{event.title}</p>
                  <span className={cn('badge capitalize text-xs', statusColors[event.status])}>
                    {event.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(event.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {event.attendees}/{event.capacity}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {event.status === 'ongoing' && (
                  <Link to={`/organizer/events/${event.id}/live`} className="btn-primary text-xs px-3 py-1.5">
                    Live Dashboard
                  </Link>
                )}
                <Link
                  to={`/organizer/events/${event.id}`}
                  className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/organizer/events" className="card-hover p-5 group">
          <CalendarPlus className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Create New Event</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Set up a new university event with attendance tracking.</p>
        </Link>
        <Link to="/organizer/checkin" className="card-hover p-5 group">
          <Radio className="w-8 h-8 text-violet-600 mb-3" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Check-In Station</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Process student check-ins via RFID, face, or manual entry.</p>
        </Link>
        <Link to="/organizer/reports" className="card-hover p-5 group">
          <TrendingUp className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Generate Reports</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Export attendance reports for your events.</p>
        </Link>
      </div>
    </div>
  );
}
