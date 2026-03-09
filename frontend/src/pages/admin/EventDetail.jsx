import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StatusBadge, DataTable, SearchInput } from '../../components/ui';
import { cn, formatDate, formatDateTime, getInitials } from '../../lib/utils';
import { eventsAPI, attendanceAPI, reportsAPI } from '../../api/endpoints';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  Radio,
  ScanFace,
  CreditCard,
  ClipboardList,
  Loader2,
  User,
  Download,
} from 'lucide-react';

/* ── Method display helpers ── */
const methodLabels = {
  facial: 'Face Recognition',
  face_recognition: 'Face Recognition',
  face: 'Face Recognition',
  rfid: 'RFID',
  manual: 'Manual',
  any: 'Any Method',
  location: 'Location Tracking',
};

const methodColors = {
  facial: 'bg-violet-100 text-violet-800',
  face_recognition: 'bg-violet-100 text-violet-800',
  face: 'bg-violet-100 text-violet-800',
  rfid: 'bg-orange-100 text-orange-800',
  any: 'bg-blue-100 text-blue-800',
  location: 'bg-rose-100 text-rose-800',
  manual: 'bg-slate-100 dark:bg-slate-800 text-slate-800',
};

const methodIcon = {
  facial: <ScanFace className="w-4 h-4 text-violet-600" />,
  face_recognition: <ScanFace className="w-4 h-4 text-violet-600" />,
  face: <ScanFace className="w-4 h-4 text-violet-600" />,
  rfid: <CreditCard className="w-4 h-4 text-orange-600" />,
  manual: <ClipboardList className="w-4 h-4 text-slate-600 dark:text-slate-300" />,
};

/* ── Attendance table columns ── */
const attendanceColumns = [
  {
    key: 'name',
    label: 'Student',
    render: (_, row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
          {getInitials(row.user?.name || 'U')}
        </div>
        <div>
          <p className="font-medium text-slate-900 dark:text-white text-sm">{row.user?.name || 'Unknown'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{row.user?.student_id || '—'}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'check_in_time',
    label: 'Check-in Time',
    render: (val) => (
      <span className="text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
        {val ? formatDateTime(val) : '—'}
      </span>
    ),
  },
  {
    key: 'method',
    label: 'Method',
    render: (val) => (
      <div className="flex items-center gap-1.5">
        {methodIcon[val] || methodIcon.manual}
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', methodColors[val] || methodColors.manual)}>
          {methodLabels[val] || val || '—'}
        </span>
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (val) => (
      <span className={cn(
        'text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize',
        val === 'present' ? 'bg-emerald-100 text-emerald-700' :
        val === 'late' ? 'bg-amber-100 text-amber-700' :
        'bg-red-100 text-red-700'
      )}>
        {val || '—'}
      </span>
    ),
  },
];

export default function EventDetail() {
  const { id: eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [eventRes, attendanceRes] = await Promise.all([
          eventsAPI.getById(eventId),
          attendanceAPI.getByEvent(eventId).catch(() => ({ data: [] })),
        ]);
        if (!cancelled) {
          setEvent(eventRes.data?.data || eventRes.data);
          setAttendees(attendanceRes.data?.data || attendanceRes.data || []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load event details.');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [eventId]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await reportsAPI.exportCSV(eventId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-${event?.title || eventId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      // silently fail
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="card p-12 text-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="card p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-600 font-medium">{error || 'Event not found.'}</p>
          <Link to="/admin/events" className="btn-secondary mt-4 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Link>
        </div>
      </div>
    );
  }

  /* ── Computed stats ── */
  const totalCheckins = event.total_attendees || attendees.filter(a => ['present', 'late'].includes(a.status)).length;
  const presentCount = event.present_count || attendees.filter(a => a.status === 'present').length;
  const lateCount = event.late_count || attendees.filter(a => a.status === 'late').length;
  const absentCount = event.absent_count || attendees.filter(a => a.status === 'absent').length;
  const capacity = event.capacity || 0;
  const fillRate = capacity > 0 ? ((totalCheckins / capacity) * 100).toFixed(1) : '0.0';

  /* ── Method breakdown ── */
  const methodBreakdown = attendees.reduce((acc, a) => {
    const m = a.method || 'manual';
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});

  /* ── Filtered attendees ── */
  const filtered = attendees.filter(
    (a) =>
      (a.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.user?.student_id || '').includes(search)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header row ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/events" className="btn-secondary p-2">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{event.title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{event.description || 'No description'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {event.status === 'ongoing' && (
            <Link to={`/admin/events/${eventId}/live`} className="btn-primary text-sm flex items-center gap-1.5 px-3 py-1.5">
              <Radio className="w-3.5 h-3.5" /> Live
            </Link>
          )}
          <button onClick={handleExport} disabled={exporting} className="btn-secondary text-sm flex items-center gap-1.5 px-3 py-1.5">
            <Download className={cn('w-3.5 h-3.5', exporting && 'animate-spin')} />
            {exporting ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </div>

      {/* ── Event info card ── */}
      <div className="card p-5 space-y-4">
        {/* Badges + Details row */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={event.status} />
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', methodColors[event.attendance_method] || methodColors.manual)}>
            {methodLabels[event.attendance_method] || event.attendance_method || '—'}
          </span>
          <span className="text-slate-300 mx-1">|</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><CalendarDays className="w-3 h-3" />{formatDate(event.date)}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{event.start_time || '—'} – {event.end_time || '—'}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue || '—'}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><User className="w-3 h-3" />{event.organizer?.name || event.organizer || '—'}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary-500" />
            <span className="font-semibold text-slate-900 dark:text-white">{totalCheckins}</span>
            <span className="text-slate-400">/ {capacity}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-300">Present <strong>{presentCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-600 dark:text-slate-300">Late <strong>{lateCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-slate-600 dark:text-slate-300">Absent <strong>{absentCount}</strong></span>
          </div>
          <span className="text-slate-400 ml-auto text-xs">{fillRate}% filled</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
          <div className="bg-primary-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(parseFloat(fillRate), 100)}%` }} />
        </div>

        {/* Method breakdown (only if there are check-ins) */}
        {Object.keys(methodBreakdown).length > 0 && (
          <div className="flex items-center gap-5">
            {['facial', 'face_recognition', 'rfid', 'manual'].map((method) => {
              const count = methodBreakdown[method];
              if (!count) return null;
              return (
                <div key={method} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {methodIcon[method] || methodIcon.manual}
                  {methodLabels[method]}: <strong className="text-slate-700 dark:text-slate-300">{count}</strong>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Attendance table ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Attendance Records <span className="font-normal text-slate-400">({filtered.length})</span>
          </h3>
          <div className="w-64">
            <SearchInput value={search} onChange={setSearch} placeholder="Search students..." />
          </div>
        </div>
        <DataTable
          columns={attendanceColumns}
          data={filtered}
          emptyMessage="No attendance records found for this event."
          pageSize={10}
        />
      </div>
    </div>
  );
}
