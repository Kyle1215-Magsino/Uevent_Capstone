import { useState } from 'react';
import { PageHeader, SearchInput, StatusBadge, DataTable, StatsCard } from '../../components/ui';
import { cn, formatDateTime, formatDate } from '../../lib/utils';
import { History, Calendar, Clock, Filter, Download, ScanFace, CreditCard, ClipboardList, ClipboardCheck, TrendingUp, UserX } from 'lucide-react';

const mockAttendance = [
  { id: 1, event: 'CIT Week 2026: Opening Ceremony', date: '2026-03-09T08:00:00', checkIn: '2026-03-09T07:48:00', status: 'present', method: 'face' },
  { id: 2, event: 'Parangal: Academic Honors Convocation', date: '2026-03-07T14:00:00', checkIn: '2026-03-07T13:52:00', status: 'present', method: 'rfid' },
  { id: 3, event: 'Blood Donation Drive – Red Cross Partnership', date: '2026-03-04T08:00:00', checkIn: null, status: 'absent', method: '-' },
  { id: 4, event: 'Research Colloquium: AI & Emerging Tech', date: '2026-02-25T09:00:00', checkIn: '2026-02-25T08:47:00', status: 'present', method: 'face' },
  { id: 5, event: 'SSG General Assembly: 2nd Semester', date: '2026-02-18T14:00:00', checkIn: '2026-02-18T13:41:00', status: 'present', method: 'rfid' },
  { id: 6, event: 'CIT Industry Immersion Fair', date: '2026-02-11T09:00:00', checkIn: '2026-02-11T09:06:00', status: 'present', method: 'face' },
  { id: 7, event: 'Mental Health Awareness Webinar', date: '2026-02-06T10:00:00', checkIn: null, status: 'absent', method: '-' },
  { id: 8, event: 'University Christmas Celebration 2025', date: '2025-12-17T17:00:00', checkIn: '2025-12-17T16:53:00', status: 'present', method: 'manual' },
];

const methodIcon = {
  face: { icon: ScanFace, label: 'Face Recognition', color: 'text-violet-600' },
  rfid: { icon: CreditCard, label: 'RFID', color: 'text-orange-600' },
  manual: { icon: ClipboardList, label: 'Manual', color: 'text-slate-600 dark:text-slate-300' },
  '-': { icon: Clock, label: 'N/A', color: 'text-slate-400' },
};

export default function AttendanceHistory() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = mockAttendance.filter((a) => {
    const matchSearch = a.event.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const presentCount = mockAttendance.filter((a) => a.status === 'present').length;
  const absentCount = mockAttendance.filter((a) => a.status === 'absent').length;
  const rate = ((presentCount / mockAttendance.length) * 100).toFixed(1);

  const columns = [
    {
      key: 'event',
      label: 'Event',
      render: (val) => <p className="text-sm font-medium text-slate-900 dark:text-white">{val}</p>,
    },
    {
      key: 'date',
      label: 'Event Date',
      render: (val) => <span className="text-sm text-slate-500 dark:text-slate-400">{formatDate(val)}</span>,
    },
    {
      key: 'checkIn',
      label: 'Check-in Time',
      render: (val) =>
        val ? (
          <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            {new Date(val).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'method',
      label: 'Method',
      render: (val) => {
        const m = methodIcon[val];
        const MethodIcon = m.icon;
        return (
          <span className={cn('flex items-center gap-1.5 text-sm', m.color)}>
            <MethodIcon className="w-4 h-4" />
            {m.label}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="My Attendance History"
        description="View your complete event attendance records."
        actions={
          <button className="btn-secondary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            Download Records
          </button>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Events"
          value={mockAttendance.length}
          icon={Calendar}
          iconColor="emerald"
        />
        <StatsCard
          title="Present"
          value={presentCount}
          icon={ClipboardCheck}
          iconColor="emerald"
        />
        <StatsCard
          title="Absent"
          value={absentCount}
          icon={UserX}
          iconColor="rose"
        />
        <StatsCard
          title="Attendance Rate"
          value={`${rate}%`}
          icon={TrendingUp}
          iconColor="blue"
        />
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Search events..." />
          </div>
          <div className="flex gap-2">
            {['all', 'present', 'absent'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                  statusFilter === status ? 'bg-primary-100 text-primary-700' : 'text-slate-600 dark:text-slate-300 hover:bg-primary-50/30'
                )}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance DataTable */}
      <div className="card">
        <DataTable columns={columns} data={filtered} emptyMessage="No records found." pageSize={10} />
      </div>
    </div>
  );
}
