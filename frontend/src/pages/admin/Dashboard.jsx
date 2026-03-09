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
  totalUsers: 3184,
  totalEvents: 87,
  totalAttendance: 29741,
  enrolledFaces: 2406,
  activeEvents: 3,
  pendingEnrollments: 9,
  rfidAssigned: 2753,
  locationVerified: 27518,
};

const mockRecentEvents = [
  { id: 1, title: 'NSTP Civic Welfare Training – Batch 4', date: '2026-03-11T07:30:00', status: 'upcoming', organizer: 'NSTP Office', attendees: 0, capacity: 180 },
  { id: 2, title: 'CIT Week 2026: Opening Ceremony', date: '2026-03-09T08:00:00', status: 'ongoing', organizer: 'CIT Student Council', attendees: 417, capacity: 600 },
  { id: 3, title: 'Parangal: Academic Honors Convocation', date: '2026-03-07T14:00:00', status: 'completed', organizer: 'Office of Student Affairs', attendees: 213, capacity: 250 },
  { id: 4, title: 'Blood Donation Drive – Red Cross Partnership', date: '2026-03-04T08:00:00', status: 'completed', organizer: 'University Health Services', attendees: 164, capacity: 200 },
];

const mockRecentActivity = [
  { id: 1, action: 'New student registered', user: 'Althea Mae Villanueva', time: '4 minutes ago' },
  { id: 2, action: 'Event created: GAD Sensitivity Forum', user: 'Prof. Rosario Bautista', time: '28 minutes ago' },
  { id: 3, action: 'Facial enrollment approved', user: 'Admin', time: '1 hour ago' },
  { id: 4, action: 'Attendance report exported for CIT Week Day 1', user: 'Engr. Dalisay Reyes', time: '2 hours ago' },
  { id: 5, action: 'Event completed: Blood Donation Drive', user: 'System', time: '5 hours ago' },
];

export default function AdminDashboard() {
  const { user } = useAuth();

  const statusColors = {
    upcoming: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/50',
    ongoing: 'bg-primary-50 text-primary-700 ring-1 ring-slate-200/50',
    completed: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/50',
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
          iconColor="violet"
        />
        <StatsCard
          title="Total Events"
          value={mockStats.totalEvents}
          change="8%"
          changeType="increase"
          icon={Calendar}
          iconColor="blue"
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
          iconColor="amber"
        />
        <StatsCard
          title="RFID Tags Assigned"
          value={mockStats.rfidAssigned.toLocaleString()}
          change="18%"
          changeType="increase"
          icon={CreditCard}
          iconColor="orange"
        />
        <StatsCard
          title="Location Verified"
          value={mockStats.locationVerified.toLocaleString()}
          change="32%"
          changeType="increase"
          icon={MapPin}
          iconColor="rose"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Events', value: mockStats.activeEvents, href: '/admin/events', icon: CalendarDays, color: 'text-primary-600 bg-primary-50' },
          { label: 'Pending Enrollments', value: mockStats.pendingEnrollments, href: '/admin/enrollments', icon: Hourglass, color: 'text-amber-600 bg-amber-50' },
          { label: 'RFID Management', value: mockStats.rfidAssigned.toLocaleString(), href: '/admin/rfid', icon: CreditCard, color: 'text-orange-600 bg-orange-50' },
          { label: 'Generate Report', value: 'Reports', href: '/admin/reports', icon: FileBarChart, color: 'text-violet-600 bg-violet-50' },
        ].map((action) => (
          <Link key={action.label} to={action.href} className="card-hover p-5 group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all duration-200" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{action.label}</p>
            <p className={`text-lg font-bold text-slate-900 dark:text-white mt-0.5`}>{action.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Events */}
        <div className="lg:col-span-2 card">
          <div className="px-6 py-4 border-b border-emerald-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Events</h3>
            <Link to="/admin/events" className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors">
              View All
            </Link>
          </div>
          <div className="divide-y divide-emerald-100/80">
            {mockRecentEvents.map((event) => (
              <div key={event.id} className="px-6 py-4 flex items-center justify-between hover:bg-primary-50/30 transition-colors duration-150">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{event.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{event.organizer}</span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(event.date)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
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
          <div className="px-6 py-4 border-b border-emerald-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="divide-y divide-emerald-100/80">
            {mockRecentActivity.map((activity) => (
              <div key={activity.id} className="px-6 py-3.5 hover:bg-primary-50/30 transition-colors duration-150">
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{activity.action}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{activity.user}</span>
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
