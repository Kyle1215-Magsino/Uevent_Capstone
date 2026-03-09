import { useState, useEffect } from 'react';
import { PageHeader, SearchInput, StatusBadge, DataTable } from '../../components/ui';
import { cn, formatDateTime } from '../../lib/utils';
import { eventsAPI } from '../../api/endpoints';
import EventCheckIn from './EventCheckIn';
import { Calendar, MapPin, Users, ScanFace, CreditCard, ClipboardList, MapPinCheck, Loader2 } from 'lucide-react';

const methodLabels = {
  facial: 'Face Recognition',
  face_recognition: 'Face Recognition',
  rfid: 'RFID',
  any: 'Any Method',
  location: 'Location Tracking',
  manual: 'Manual',
};

const methodColors = {
  facial: 'bg-violet-100 text-violet-800',
  face_recognition: 'bg-violet-100 text-violet-800',
  rfid: 'bg-orange-100 text-orange-800',
  any: 'bg-blue-100 text-blue-800',
  location: 'bg-rose-100 text-rose-800',
  manual: 'bg-slate-100 dark:bg-slate-800 text-slate-800',
};

export default function StudentEvents() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkInEvent, setCheckInEvent] = useState(null);

  const columns = [
    {
      key: 'title',
      label: 'Event',
      render: (_, row) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{row.title}</p>
          {row.description && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{row.description}</p>}
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (val) => (
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {formatDateTime(val)}
        </span>
      ),
    },
    {
      key: 'venue',
      label: 'Venue',
      render: (val) => (
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          {val}
        </span>
      ),
    },
    {
      key: 'organizer',
      label: 'Organizer',
      render: (val) => <span className="text-slate-600 dark:text-slate-300">{val?.name || val || '—'}</span>,
    },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (val) => (
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          {val || '—'}
        </span>
      ),
    },
    {
      key: 'attendance_method',
      label: 'Method',
      render: (val, row) => {
        const method = val || row.method || 'any';
        return (
          <span className={cn('badge text-xs', methodColors[method] || 'bg-slate-100 dark:bg-slate-800 text-slate-800')}>
            {methodLabels[method] || method}
          </span>
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
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {(row.status === 'ongoing' || row.status === 'upcoming') && (
            <button onClick={() => setCheckInEvent(row)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
              <MapPinCheck className="w-3.5 h-3.5" />
              Check In
            </button>
          )}
        </div>
      ),
    },
  ];
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await eventsAPI.getAll({ per_page: 50 });
        if (!cancelled) {
          setEvents(res.data?.data || res.data || []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load events.');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = events.filter((e) => {
    const matchSearch = e.title?.toLowerCase().includes(search.toLowerCase()) ||
      (e.venue || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="University Events"
        description="Browse upcoming and past university events."
      />

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Search events..." />
          </div>
          <div className="flex gap-2">
            {['all', 'upcoming', 'ongoing', 'completed'].map((status) => (
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

      {/* Loading / Error */}
      {loading && (
        <div className="card p-12 text-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading events...</p>
        </div>
      )}

      {error && !loading && (
        <div className="card p-12 text-center">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* Events DataTable */}
      {!loading && !error && (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="No events found. Try adjusting your search or filter."
          pageSize={10}
        />
      )}

      {/* Event Check-In Modal */}
      <EventCheckIn
        open={!!checkInEvent}
        onClose={() => setCheckInEvent(null)}
        event={checkInEvent}
      />
    </div>
  );
}
