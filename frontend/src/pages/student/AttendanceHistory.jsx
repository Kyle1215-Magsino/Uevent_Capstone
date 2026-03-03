import { useState } from 'react';
import { PageHeader, SearchInput, StatusBadge, DataTable, StatsCard } from '../../components/ui';
import { cn, formatDateTime, formatDate } from '../../lib/utils';
import { History, Calendar, Clock, Filter, Download, ScanFace, CreditCard, ClipboardList, ClipboardCheck, TrendingUp, UserX } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';

const mockAttendance = [
  { id: 1, event: 'Cultural Night 2026', date: '2026-03-03T18:00:00', checkIn: '2026-03-03T17:45:00', status: 'present', method: 'face' },
  { id: 2, event: 'Academic Excellence Awards', date: '2026-03-01T14:00:00', checkIn: '2026-03-01T13:50:00', status: 'present', method: 'rfid' },
  { id: 3, event: 'Environmental Awareness Campaign', date: '2026-02-28T08:00:00', checkIn: null, status: 'absent', method: '-' },
  { id: 4, event: 'Tech Innovation Summit', date: '2026-02-20T09:00:00', checkIn: '2026-02-20T08:55:00', status: 'present', method: 'face' },
  { id: 5, event: 'Student Council General Assembly', date: '2026-02-15T14:00:00', checkIn: '2026-02-15T13:45:00', status: 'present', method: 'rfid' },
  { id: 6, event: 'Career Fair 2026', date: '2026-02-10T09:00:00', checkIn: '2026-02-10T09:10:00', status: 'present', method: 'face' },
  { id: 7, event: 'Health & Wellness Day', date: '2026-02-05T08:00:00', checkIn: null, status: 'absent', method: '-' },
  { id: 8, event: 'Christmas Party 2025', date: '2025-12-18T18:00:00', checkIn: '2025-12-18T17:55:00', status: 'present', method: 'manual' },
];

const methodIcon = {
  face: { icon: ScanFace, label: 'Face Recognition', color: 'text-purple-600' },
  rfid: { icon: CreditCard, label: 'RFID', color: 'text-blue-600' },
  manual: { icon: ClipboardList, label: 'Manual', color: 'text-slate-600' },
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

  const pieData = [
    { name: 'Present', value: presentCount },
    { name: 'Absent', value: absentCount },
  ];
  const PIE_COLORS = ['#10b981', '#f43f5e'];

  const columns = [
    {
      key: 'event',
      label: 'Event',
      render: (val) => <p className="text-sm font-medium text-slate-900">{val}</p>,
    },
    {
      key: 'date',
      label: 'Event Date',
      render: (val) => <span className="text-sm text-slate-500">{formatDate(val)}</span>,
    },
    {
      key: 'checkIn',
      label: 'Check-in Time',
      render: (val) =>
        val ? (
          <span className="flex items-center gap-1.5 text-sm text-slate-500">
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
          iconColor="blue"
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
          iconColor="amber"
        />
      </div>

      {/* Attendance Breakdown */}
      <div className="card p-4 flex items-center justify-center">
        <div className="flex items-center gap-8">
          <ResponsiveContainer width={100} height={100}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={44} paddingAngle={4} strokeWidth={0}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-slate-600">Present: <strong>{presentCount}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-sm text-slate-600">Absent: <strong>{absentCount}</strong></span>
            </div>
          </div>
        </div>
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
                  statusFilter === status ? 'bg-primary-100 text-primary-700' : 'text-slate-600 hover:bg-primary-50/30'
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
