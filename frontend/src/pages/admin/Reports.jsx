import { useState } from 'react';
import { PageHeader, SearchInput, DataTable, StatsCard } from '../../components/ui';
import { cn, formatDate } from '../../lib/utils';
import { FileText, Download, Calendar, Users, Filter, ChevronDown, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const mockReports = [
  { id: 1, event: 'CIT Week 2026: Opening Ceremony', date: '2026-03-09', total: 600, present: 417, method: 'Face Recognition', rate: 69.5 },
  { id: 2, event: 'Parangal: Academic Honors Convocation', date: '2026-03-07', total: 250, present: 213, method: 'RFID', rate: 85.2 },
  { id: 3, event: 'Blood Donation Drive – Red Cross Partnership', date: '2026-03-04', total: 200, present: 164, method: 'Manual', rate: 82.0 },
  { id: 4, event: 'Research Colloquium: AI & Emerging Tech', date: '2026-02-25', total: 120, present: 103, method: 'Face Recognition', rate: 85.8 },
  { id: 5, event: 'SSG General Assembly: 2nd Semester', date: '2026-02-18', total: 1200, present: 1103, method: 'RFID', rate: 91.9 },
];

const chartData = mockReports.map((r) => ({ name: r.event.length > 18 ? r.event.slice(0, 18) + '…' : r.event, Present: r.present, Expected: r.total })).reverse();

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur border border-emerald-200 dark:border-slate-700 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-900 dark:text-white mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <strong>{entry.value.toLocaleString()}</strong>
        </p>
      ))}
    </div>
  );
};

export default function Reports() {
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('all');

  const filtered = mockReports.filter((r) =>
    r.event.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: 'event',
      label: 'Event',
      render: (val) => <p className="text-sm font-medium text-slate-900 dark:text-white">{val}</p>,
    },
    {
      key: 'date',
      label: 'Date',
      render: (val) => <span className="text-sm text-slate-500 dark:text-slate-400">{formatDate(val)}</span>,
    },
    {
      key: 'method',
      label: 'Method',
      render: (val) => <span className="badge-info">{val}</span>,
    },
    {
      key: 'total',
      label: 'Expected',
      render: (val) => <span className="text-sm text-slate-700 dark:text-slate-300">{val}</span>,
    },
    {
      key: 'present',
      label: 'Present',
      render: (val) => <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{val}</span>,
    },
    {
      key: 'rate',
      label: 'Rate',
      render: (val) => (
        <span
          className={cn(
            'badge',
            val >= 80
              ? 'bg-emerald-100 text-emerald-800'
              : val >= 60
              ? 'bg-amber-100 text-amber-800'
              : 'bg-rose-100 text-rose-800'
          )}
        >
          {val}%
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          <button className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
            <FileText className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Attendance Reports"
        description="View and export consolidated attendance reports across all events."
        actions={
          <button className="btn-primary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            Export All
          </button>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Total Reports"
          value={mockReports.length}
          icon={FileText}
          iconColor="primary"
        />
        <StatsCard
          title="Total Attendance"
          value={mockReports.reduce((sum, r) => sum + r.present, 0).toLocaleString()}
          icon={Users}
          iconColor="violet"
        />
        <StatsCard
          title="Avg. Attendance Rate"
          value={`${(mockReports.reduce((sum, r) => sum + r.rate, 0) / mockReports.length).toFixed(1)}%`}
          icon={BarChart3}
          iconColor="amber"
        />
      </div>

      {/* Attendance Comparison Chart */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Attendance vs Expected</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Expected" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
            <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Search event reports..." />
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="semester">This Semester</option>
          </select>
        </div>
      </div>

      {/* Reports DataTable */}
      <div className="card">
        <DataTable columns={columns} data={filtered} emptyMessage="No reports found." pageSize={10} />
      </div>
    </div>
  );
}
