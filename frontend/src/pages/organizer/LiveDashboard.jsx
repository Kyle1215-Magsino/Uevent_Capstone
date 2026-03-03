import { useState, useEffect } from 'react';
import { PageHeader, SearchInput, StatsCard } from '../../components/ui';
import { cn, getInitials, formatDateTime } from '../../lib/utils';
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
} from 'lucide-react';

// Mock live data
const mockEventInfo = {
  id: 2,
  title: 'Cultural Night 2026',
  date: '2026-03-03T18:00:00',
  venue: 'University Gymnasium',
  capacity: 500,
  method: 'face_recognition',
};

const initialAttendees = [
  { id: 1, name: 'Juan Dela Cruz', student_id: '2024-00001', time: '2026-03-03T17:45:00', method: 'face' },
  { id: 2, name: 'Maria Santos', student_id: '2024-00002', time: '2026-03-03T17:48:00', method: 'face' },
  { id: 3, name: 'Ana Rivera', student_id: '2024-00004', time: '2026-03-03T17:50:00', method: 'face' },
  { id: 4, name: 'Pedro Gomez', student_id: '2024-00003', time: '2026-03-03T17:52:00', method: 'rfid' },
  { id: 5, name: 'Carlos Mendoza', student_id: '2024-00005', time: '2026-03-03T17:55:00', method: 'manual' },
];

export default function LiveDashboard() {
  const [attendees, setAttendees] = useState(initialAttendees);
  const [search, setSearch] = useState('');
  const [isLive, setIsLive] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      // Simulated new check-in
      const names = ['Rosa Garcia', 'Luis Torres', 'Diana Cruz', 'Marco Reyes', 'Linda Tan'];
      const methods = ['face', 'face', 'face', 'rfid', 'manual'];
      const randomIdx = Math.floor(Math.random() * names.length);
      const newAttendee = {
        id: Date.now(),
        name: names[randomIdx],
        student_id: `2024-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
        time: new Date().toISOString(),
        method: methods[randomIdx],
      };
      setAttendees((prev) => [newAttendee, ...prev]);
    }, 5000);
    return () => clearInterval(interval);
  }, [isLive]);

  const filtered = attendees.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.student_id.includes(search)
  );

  const methodIcon = {
    face: <ScanFace className="w-4 h-4 text-emerald-600" />,
    rfid: <CreditCard className="w-4 h-4 text-emerald-600" />,
    manual: <ClipboardList className="w-4 h-4 text-slate-600" />,
  };

  const methodLabel = {
    face: 'Face Recognition',
    rfid: 'RFID',
    manual: 'Manual',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Live Attendance Dashboard"
        description={mockEventInfo.title}
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
            <button className="btn-secondary flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        }
      />

      {/* Live Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Check-ins"
          value={attendees.length}
          icon={ClipboardCheck}
          iconColor="primary"
        />
        <StatsCard
          title="Capacity"
          value={mockEventInfo.capacity}
          icon={Users}
          iconColor="emerald"
        />
        <StatsCard
          title="Fill Rate"
          value={`${((attendees.length / mockEventInfo.capacity) * 100).toFixed(1)}%`}
          icon={Gauge}
          iconColor="emerald"
        />
        <StatsCard
          title="Remaining"
          value={Math.max(mockEventInfo.capacity - attendees.length, 0)}
          icon={UserMinus}
          iconColor="emerald"
        />
      </div>

      {/* Progress Bar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Attendance Progress</span>
          <span className="text-sm text-slate-500">
            {attendees.length} / {mockEventInfo.capacity}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-4">
          <div
            className="bg-primary-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((attendees.length / mockEventInfo.capacity) * 100, 100)}%` }}
          />
        </div>

        {/* Method breakdown */}
        <div className="flex items-center gap-6 mt-4">
          {['face', 'rfid', 'manual'].map((method) => {
            const count = attendees.filter((a) => a.method === method).length;
            return (
              <div key={method} className="flex items-center gap-2">
                {methodIcon[method]}
                <span className="text-sm text-slate-600">
                  {methodLabel[method]}: <strong>{count}</strong>
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
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  {new Date(attendee.time).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
