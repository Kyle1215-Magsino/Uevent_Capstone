import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader, SearchInput, StatsCard } from '../../components/ui';
import { cn, getInitials, formatDateTime } from '../../lib/utils';
import { attendanceAPI, eventsAPI } from '../../api/endpoints';
import {
  Radio,
  Users,
  Clock,
  CheckCircle2,
  UserCheck,
  ScanFace,
  CreditCard,
  ClipboardList,
  RefreshCw,
  ClipboardCheck,
  Gauge,
  UserMinus,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export default function LiveDashboard() {
  const { id: eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [methodBreakdown, setMethodBreakdown] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [isLive, setIsLive] = useState(true);

  const fetchData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await attendanceAPI.getLiveDashboard(eventId);
      const data = res.data;
      setEvent(data.event);
      setMethodBreakdown(data.method_breakdown || {});
      // Map recent_checkins to a flat attendee list
      const mapped = (data.recent_checkins || []).map((a) => ({
        id: a.id,
        name: a.user?.name || 'Unknown',
        student_id: a.user?.student_id || '—',
        time: a.check_in_time,
        method: a.method,
        status: a.status,
      }));
      setAttendees(mapped);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Initial load
  useEffect(() => { fetchData(true); }, [fetchData]);

  // Auto-refresh every 5 seconds when live
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => fetchData(false), 5000);
    return () => clearInterval(interval);
  }, [isLive, fetchData]);

  const filtered = attendees.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.student_id || '').includes(search)
  );

  const totalCheckins = event?.total_attendees || attendees.length;
  const presentCount = event?.present_count || attendees.filter(a => a.status === 'present').length;
  const lateCount = event?.late_count || attendees.filter(a => a.status === 'late').length;
  const capacity = event?.capacity || 0;
  const remaining = Math.max(capacity - totalCheckins, 0);
  const fillRate = capacity > 0 ? ((totalCheckins / capacity) * 100).toFixed(1) : '0.0';

  const methodIcon = {
    facial: <ScanFace className="w-4 h-4 text-emerald-600" />,
    face: <ScanFace className="w-4 h-4 text-emerald-600" />,
    rfid: <CreditCard className="w-4 h-4 text-emerald-600" />,
    manual: <ClipboardList className="w-4 h-4 text-slate-600" />,
  };

  const methodLabel = {
    facial: 'Face Recognition',
    face: 'Face Recognition',
    rfid: 'RFID',
    manual: 'Manual',
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="card p-12 text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading live dashboard...</p>
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
          <Link to="/" className="btn-secondary mt-4 inline-flex">Go Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Live Attendance Dashboard"
        description={`${event.title} — ${event.venue || ''}`}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLive(!isLive)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
              )}
            >
              <Radio className={cn('w-4 h-4', isLive && 'animate-pulse')} />
              {isLive ? 'Live' : 'Paused'}
            </button>
            <button onClick={() => fetchData(false)} className="btn-secondary flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        }
      />

      {/* Live Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Check-ins"
          value={totalCheckins}
          icon={ClipboardCheck}
          iconColor="primary"
        />
        <StatsCard
          title="Present"
          value={presentCount}
          icon={UserCheck}
          iconColor="emerald"
        />
        <StatsCard
          title="Late"
          value={lateCount}
          icon={AlertTriangle}
          iconColor="emerald"
        />
        <StatsCard
          title="Fill Rate"
          value={`${fillRate}%`}
          icon={Gauge}
          iconColor="emerald"
        />
        <StatsCard
          title="Remaining"
          value={remaining}
          icon={UserMinus}
          iconColor="emerald"
        />
      </div>

      {/* Progress Bar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Attendance Progress</span>
          <span className="text-sm text-slate-500">
            {totalCheckins} / {capacity}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-4">
          <div
            className="bg-primary-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(parseFloat(fillRate), 100)}%` }}
          />
        </div>

        {/* Method breakdown */}
        <div className="flex items-center gap-6 mt-4">
          {['facial', 'rfid', 'manual'].map((method) => {
            const count = methodBreakdown[method] || 0;
            return (
              <div key={method} className="flex items-center gap-2">
                {methodIcon[method] || methodIcon.manual}
                <span className="text-sm text-slate-600">
                  {methodLabel[method] || method}: <strong>{count}</strong>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Feed */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-slate-900">Live Check-in Feed</h3>
            {isLive && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Real-time
              </span>
            )}
          </div>
          <div className="w-64">
            <SearchInput value={search} onChange={setSearch} placeholder="Search attendees..." />
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {filtered.map((attendee, i) => (
            <div
              key={attendee.id}
              className={cn(
                'px-6 py-3 flex items-center justify-between hover:bg-primary-50/30 transition-colors',
                i === 0 && isLive && 'bg-emerald-50'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                  {getInitials(attendee.name)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{attendee.name}</p>
                  <p className="text-xs text-slate-500">{attendee.student_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  {methodIcon[attendee.method]}
                  <span className="text-xs text-slate-500">{methodLabel[attendee.method]}</span>
                </div>
                <span className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-full capitalize',
                  attendee.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                  attendee.status === 'late' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                )}>
                  {attendee.status}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  {new Date(attendee.time).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
                <CheckCircle2 className={cn('w-5 h-5', attendee.status === 'present' ? 'text-emerald-500' : 'text-amber-500')} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
