import { useState, useEffect } from 'react';
import { PageHeader, SearchInput, StatusBadge, DataTable, StatsCard } from '../../components/ui';
import { cn, formatDateTime, formatDate } from '../../lib/utils';
import { attendanceAPI } from '../../api/endpoints';
import { History, Calendar, Clock, Filter, Download, ScanFace, CreditCard, ClipboardList, ClipboardCheck, TrendingUp, UserX, Loader2 } from 'lucide-react';

const methodIcon = {
  facial: { icon: ScanFace, label: 'Face Recognition', color: 'text-violet-600' },
  face: { icon: ScanFace, label: 'Face Recognition', color: 'text-violet-600' },
  rfid: { icon: CreditCard, label: 'RFID', color: 'text-orange-600' },
  manual: { icon: ClipboardList, label: 'Manual', color: 'text-slate-600 dark:text-slate-300' },
  '-': { icon: Clock, label: 'N/A', color: 'text-slate-400' },
};

export default function AttendanceHistory() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await attendanceAPI.getMyAttendance();
        if (!cancelled) {
          const records = res.data?.data || res.data || [];
          setAttendance(Array.isArray(records) ? records : []);
        }
      } catch {
        // silently handle
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = attendance.filter((a) => {
    const eventName = a.event?.title || a.event || '';
    const matchSearch = eventName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const absentCount = attendance.filter((a) => a.status === 'absent').length;
  const rate = attendance.length > 0 ? ((presentCount / attendance.length) * 100).toFixed(1) : '0.0';

  const columns = [
    {
      key: 'event',
      label: 'Event',
      render: (val) => <p className="text-sm font-medium text-slate-900 dark:text-white">{val?.title || val}</p>,
    },
    {
      key: 'event',
      label: 'Event Date',
      render: (val) => <span className="text-sm text-slate-500 dark:text-slate-400">{val?.date ? formatDate(val.date) : '—'}</span>,
    },
    {
      key: 'check_in_time',
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

      {loading && (
        <div className="card p-12 text-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading attendance records...</p>
        </div>
      )}

      {!loading && <>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Events"
          value={attendance.length}
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
        <DataTable columns={columns} data={filtered} emptyMessage="No attendance records yet." pageSize={10} />
      </div>
      </>}
    </div>
  );
}
