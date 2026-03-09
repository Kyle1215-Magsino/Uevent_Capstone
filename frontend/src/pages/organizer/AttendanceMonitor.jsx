import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SearchInput, StatusBadge } from '../../components/ui';
import { cn, formatDateTime, getInitials } from '../../lib/utils';
import { ClipboardCheck, Eye, Users, Calendar, ScanFace, CreditCard, ClipboardList } from 'lucide-react';

const mockEvents = [
  {
    id: 1,
    title: 'Leadership Training Seminar',
    date: '2026-03-05T09:00:00',
    status: 'upcoming',
    method: 'face_recognition',
    attendees: 0,
    capacity: 200,
  },
  {
    id: 2,
    title: 'Cultural Night 2026',
    date: '2026-03-03T18:00:00',
    status: 'ongoing',
    method: 'face_recognition',
    attendees: 342,
    capacity: 500,
  },
  {
    id: 3,
    title: 'Academic Excellence Awards',
    date: '2026-03-01T14:00:00',
    status: 'completed',
    method: 'rfid',
    attendees: 189,
    capacity: 200,
  },
];

export default function AttendanceMonitor() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [search, setSearch] = useState('');

  const mockAttendees = [
    { id: 1, name: 'Juan Dela Cruz', student_id: '2024-00001', time: '2026-03-03T17:45:00', method: 'face', status: 'present' },
    { id: 2, name: 'Maria Santos', student_id: '2024-00002', time: '2026-03-03T17:48:00', method: 'face', status: 'present' },
    { id: 3, name: 'Ana Rivera', student_id: '2024-00004', time: '2026-03-03T17:50:00', method: 'rfid', status: 'present' },
    { id: 4, name: 'Pedro Gomez', student_id: '2024-00003', time: '2026-03-03T17:52:00', method: 'manual', status: 'present' },
  ];

  const methodIcons = {
    face: <ScanFace className="w-4 h-4 text-violet-600" />,
    rfid: <CreditCard className="w-4 h-4 text-orange-600" />,
    manual: <ClipboardList className="w-4 h-4 text-slate-600 dark:text-slate-300" />,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Attendance Monitoring"
        description="View attendance records for your events."
      />

      {/* Event Selector */}
      <div className="grid md:grid-cols-3 gap-4">
        {mockEvents.map((event) => (
          <button
            key={event.id}
            onClick={() => setSelectedEvent(event)}
            className={cn(
              'card p-4 text-left transition-all',
              selectedEvent?.id === event.id ? 'ring-2 ring-emerald-400 border-emerald-300' : 'hover:shadow-md'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <StatusBadge status={event.status} />
              <span className="text-xs text-slate-400">{event.attendees}/{event.capacity}</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{event.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDateTime(event.date)}
            </p>
          </button>
        ))}
      </div>

      {/* Attendance List */}
      {selectedEvent ? (
        <div className="card">
          <div className="px-6 py-4 border-b border-emerald-100 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{selectedEvent.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{selectedEvent.attendees} attendees recorded</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-64">
                <SearchInput value={search} onChange={setSearch} placeholder="Search attendees..." />
              </div>
              {selectedEvent.status === 'ongoing' && (
                <Link to={`/organizer/events/${selectedEvent.id}/live`} className="btn-primary text-sm">
                  Open Live Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="divide-y divide-emerald-100">
            {mockAttendees.map((attendee) => (
              <div key={attendee.id} className="px-6 py-3 flex items-center justify-between hover:bg-primary-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                    {getInitials(attendee.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{attendee.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{attendee.student_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    {methodIcons[attendee.method]}
                    <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{attendee.method}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(attendee.time).toLocaleTimeString()}
                  </span>
                  <span className="badge-success">{attendee.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Select an Event</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Choose an event above to view its attendance records.</p>
        </div>
      )}
    </div>
  );
}
