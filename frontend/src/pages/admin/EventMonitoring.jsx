import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SearchInput, StatusBadge, DataTable } from '../../components/ui';
import { cn, formatDateTime } from '../../lib/utils';
import { eventsAPI } from '../../api/endpoints';
import { Eye, MapPin, Loader2, Radio } from 'lucide-react';

const methodLabels = {
  facial: 'Face Recognition',
  face_recognition: 'Face Recognition',
  rfid: 'RFID',
  manual: 'Manual',
  any: 'Any Method',
  location: 'Location Tracking',
};

const methodColors = {
  facial: 'bg-violet-100 text-violet-800',
  face_recognition: 'bg-violet-100 text-violet-800',
  rfid: 'bg-orange-100 text-orange-800',
  any: 'bg-blue-100 text-blue-800',
  location: 'bg-rose-100 text-rose-800',
  manual: 'bg-slate-100 dark:bg-slate-800 text-slate-800',
};

const columns = [
  {
    key: 'title',
    label: 'Event',
    render: (_, row) => (
      <div className="min-w-[180px]">
        <p className="font-semibold text-slate-900 dark:text-white">{row.title}</p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{row.venue || '—'}</span>
          <span className="text-slate-300">·</span>
          <span>{row.organizer?.name || row.organizer || '—'}</span>
        </div>
      </div>
    ),
  },
  {
    key: 'date',
    label: 'Date',
    render: (val) => (
      <span className="text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
        {formatDateTime(val)}
      </span>
    ),
  },
  {
    key: 'total_attendees',
    label: 'Attendance',
    render: (val, row) => {
      const attendees = val || (row.present_count || 0) + (row.late_count || 0);
      const capacity = row.capacity || 0;
      const pct = capacity > 0 ? Math.min((attendees / capacity) * 100, 100) : 0;
      return (
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="flex-1">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
              <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{attendees}/{capacity}</span>
        </div>
      );
    },
  },
  {
    key: 'status',
    label: 'Status',
    render: (val) => <StatusBadge status={val} />,
  },
  {
    key: 'actions',
    label: '',
    sortable: false,
    render: (_, row) => (
      <div className="flex items-center gap-1.5">
        <Link to={`/admin/events/${row.id}`} className="btn-secondary text-xs px-2 py-1 flex items-center gap-1">
          <Eye className="w-3 h-3" />View
        </Link>
        {row.status === 'ongoing' && (
          <Link to={`/admin/events/${row.id}/live`} className="btn-primary text-xs px-2 py-1 flex items-center gap-1">
            <Radio className="w-3 h-3" />Live
          </Link>
        )}
      </div>
    ),
  },
];

export default function EventMonitoring() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await eventsAPI.getAll({ per_page: 100 });
        if (!cancelled) {
          setEvents(res.data?.data || res.data || []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = events.filter((event) => {
    const matchSearch = (event.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (event.organizer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (event.venue || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Event Monitoring"
        description="Monitor all events created by organizers across the system."
      />

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Search events..." />
          </div>
          <div className="flex gap-2">
            {['all', 'upcoming', 'ongoing', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                  statusFilter === status ? 'bg-primary-100 text-primary-700' : 'text-slate-600 dark:text-slate-300 hover:bg-primary-50/30'
                )}
              >
                {status === 'all' ? 'All Status' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events DataTable */}
      {loading ? (
        <div className="card p-12 text-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading events...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="No events found. Try adjusting your search or filter criteria."
          pageSize={10}
        />
      )}
    </div>
  );
}
