import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { StatsCard, PageHeader } from '../../components/ui';
import {
  Users,
  Calendar,
  ClipboardCheck,
  ScanFace,
  TrendingUp,
  ArrowRight,
  Clock,
  CalendarDays,
  Hourglass,
  FileBarChart,
  CreditCard,
  MapPin,
} from 'lucide-react';
import { cn, formatDateTime } from '../../lib/utils';

// Mock data for demonstration
const mockStats = {
  totalUsers: 2547,
  totalEvents: 156,
  totalAttendance: 45230,
  enrolledFaces: 1832,
  activeEvents: 5,
  pendingEnrollments: 12,
  rfidAssigned: 2103,
  locationVerified: 41580,
};

const mockRecentEvents = [
  { id: 1, title: 'Leadership Training Seminar', date: '2026-03-05T09:00:00', status: 'upcoming', organizer: 'CSG', attendees: 0, capacity: 200 },
  { id: 2, title: 'Cultural Night 2026', date: '2026-03-03T18:00:00', status: 'ongoing', organizer: 'Cultural Committee', attendees: 342, capacity: 500 },
  { id: 3, title: 'Academic Excellence Awards', date: '2026-03-01T14:00:00', status: 'completed', organizer: 'Academic Affairs', attendees: 189, capacity: 200 },
  { id: 4, title: 'Environmental Awareness Campaign', date: '2026-02-28T08:00:00', status: 'completed', organizer: 'EcoClub', attendees: 156, capacity: 300 },
];

const mockRecentActivity = [
  { id: 1, action: 'New student registered', user: 'Maria Santos', time: '2 minutes ago' },
  { id: 2, action: 'Event created', user: 'John Reyes', time: '15 minutes ago' },
  { id: 3, action: 'Facial enrollment approved', user: 'Admin', time: '1 hour ago' },
  { id: 4, action: 'Attendance report generated', user: 'Sarah Lopez', time: '2 hours ago' },
  { id: 5, action: 'Event completed', user: 'System', time: '3 hours ago' },
];

export default function AdminDashboard() {
  const { user } = useAuth();

  const statusColors = {
    upcoming: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50',
    ongoing: 'bg-primary-50 text-primary-700 ring-1 ring-primary-200/50',
    completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Admin'}`}
        description="Here's an overview of your university event management system."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Total Students"
          value={mockStats.totalUsers.toLocaleString()}
          change="12%"
          changeType="increase"
          icon={Users}
          iconColor="emerald"
        />
        <StatsCard
          title="Total Events"
          value={mockStats.totalEvents}
          change="8%"
          changeType="increase"
          icon={Calendar}
          iconColor="emerald"
        />
        <StatsCard
          title="Attendance Logs"
          value={mockStats.totalAttendance.toLocaleString()}
          change="23%"
          changeType="increase"
          icon={ClipboardCheck}
          iconColor="emerald"
        />
        <StatsCard
          title="Face Enrollments"
          value={mockStats.enrolledFaces.toLocaleString()}
          change="5%"
          changeType="increase"
          icon={ScanFace}
          iconColor="emerald"
        />
        <StatsCard
          title="RFID Tags Assigned"
          value={mockStats.rfidAssigned.toLocaleString()}
          change="18%"
          changeType="increase"
          icon={CreditCard}
          iconColor="emerald"
        />
        <StatsCard
          title="Location Verified"
          value={mockStats.locationVerified.toLocaleString()}
          change="32%"
          changeType="increase"
          icon={MapPin}
          iconColor="emerald"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Events', value: mockStats.activeEvents, href: '/admin/events', icon: CalendarDays, color: 'text-primary-600 bg-primary-50' },
          { label: 'Pending Enrollments', value: mockStats.pendingEnrollments, href: '/admin/enrollments', icon: Hourglass, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'RFID Management', value: mockStats.rfidAssigned.toLocaleString(), href: '/admin/rfid', icon: CreditCard, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Generate Report', value: 'Reports', href: '/admin/reports', icon: FileBarChart, color: 'text-emerald-600 bg-emerald-50' },
        ].map((action) => (
          <Link key={action.label} to={action.href} className="card-hover p-5 group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all duration-200" />
            </div>
            <p className="text-sm text-slate-500 font-medium">{action.label}</p>
            <p className={`text-lg font-bold text-slate-900 mt-0.5`}>{action.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Events */}
        <div className="lg:col-span-2 card">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Recent Events</h3>
            <Link to="/admin/events" className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-100/80">
            {mockRecentEvents.map((event) => (
              <div key={event.id} className="px-6 py-4 flex items-center justify-between hover:bg-primary-50/30 transition-colors duration-150">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{event.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">{event.organizer}</span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(event.date)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-xs text-slate-500 font-medium">
                    {event.attendees}/{event.capacity}
                  </span>
                  <span className={cn('badge capitalize', statusColors[event.status])}>
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-slate-100/80">
            {mockRecentActivity.map((activity) => (
              <div key={activity.id} className="px-6 py-3.5 hover:bg-primary-50/30 transition-colors duration-150">
                <p className="text-sm text-slate-700 font-medium">{activity.action}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500">{activity.user}</span>
                  <span className="text-xs text-slate-300">•</span>
                  <span className="text-xs text-slate-400">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
