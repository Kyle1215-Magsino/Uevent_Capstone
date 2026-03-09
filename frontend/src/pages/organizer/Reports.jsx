import { useState } from 'react';
import { PageHeader, SearchInput, DataTable, StatsCard } from '../../components/ui';
import { cn, formatDate } from '../../lib/utils';
import { FileText, Download, Calendar, Users, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const mockReports = [
  { id: 1, event: 'CIT Week 2026: Opening Ceremony', date: '2026-03-09', total: 600, present: 417, method: 'Face Recognition', rate: 69.5 },
  { id: 2, event: 'Parangal: Academic Honors Convocation', date: '2026-03-07', total: 250, present: 213, method: 'RFID', rate: 85.2 },
  { id: 3, event: 'Blood Donation Drive – Red Cross Partnership', date: '2026-03-04', total: 200, present: 164, method: 'Manual', rate: 82.0 },
];

const chartData = mockReports.map((r) => ({ name: r.event.length > 18 ? r.event.slice(0, 18) + '…' : r.event, Present: r.present, Expected: r.total })).reverse();

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur border border-emerald-200 dark:border-slate-700 rounded-xl shadow-lg px-4 py-3 text-sm">
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

export default function OrganizerReports() {
  const [search, setSearch] = useState('');

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
      render: (val) => <span className="badge-info text-xs">{val}</span>,
    },
    {
      key: 'present',
      label: 'Present',
      render: (val, row) => (
        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{val} <span className="text-slate-400 font-normal">/ {row.total}</span></span>
      ),
    },
    {
      key: 'rate',
      label: 'Rate',
      render: (val) => (
        <span className={cn(
          'badge',
          val >= 80 ? 'bg-emerald-100 text-emerald-800' : val >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
        )}>
          {val}%
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: () => (
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> View
          </button>
          <button className="btn-primary text-xs px-2.5 py-1 flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Event Reports"
        description="Generate and export attendance reports for your events."
        actions={
          <button className="btn-primary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            Export All
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Total Events"
          value={mockReports.length}
          icon={Calendar}
          iconColor="primary"
        />
        <StatsCard
          title="Total Present"
          value={mockReports.reduce((sum, r) => sum + r.present, 0).toLocaleString()}
          icon={Users}
          iconColor="violet"
        />
        <StatsCard
          title="Avg. Rate"
          value={`${(mockReports.reduce((sum, r) => sum + r.rate, 0) / mockReports.length).toFixed(1)}%`}
          icon={BarChart3}
          iconColor="amber"
        />
      </div>

      {/* Attendance Chart */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Attendance Overview</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Expected" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={22} />
            <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Search */}
      <div className="card p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search event reports..." />
      </div>

      {/* Reports DataTable */}
      <div className="card">
        <DataTable columns={columns} data={filtered} emptyMessage="No reports found." pageSize={10} />
      </div>
    </div>
  );
}
