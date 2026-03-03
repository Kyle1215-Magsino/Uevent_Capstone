import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SearchInput, StatusBadge } from '../../components/ui';
import { cn, formatDateTime } from '../../lib/utils';
import { Eye, Calendar, MapPin, Users, Clock, Filter } from 'lucide-react';

const mockEvents = [
  { id: 1, title: 'Leadership Training Seminar', date: '2026-03-05T09:00:00', end_date: '2026-03-05T17:00:00', venue: 'Main Auditorium', organizer: 'CSG', status: 'upcoming', method: 'face_recognition', attendees: 0, capacity: 200 },
  { id: 2, title: 'Cultural Night 2026', date: '2026-03-03T18:00:00', end_date: '2026-03-03T22:00:00', venue: 'University Gymnasium', organizer: 'Cultural Committee', status: 'ongoing', method: 'face_recognition', attendees: 342, capacity: 500 },
  { id: 3, title: 'Academic Excellence Awards', date: '2026-03-01T14:00:00', end_date: '2026-03-01T17:00:00', venue: 'Convention Hall', organizer: 'Academic Affairs', status: 'completed', method: 'rfid', attendees: 189, capacity: 200 },
  { id: 4, title: 'Environmental Awareness Campaign', date: '2026-02-28T08:00:00', end_date: '2026-02-28T12:00:00', venue: 'University Grounds', organizer: 'EcoClub', status: 'completed', method: 'manual', attendees: 156, capacity: 300 },
  { id: 5, title: 'Freshman Orientation', date: '2026-03-10T08:00:00', end_date: '2026-03-10T16:00:00', venue: 'Main Auditorium', organizer: 'Student Affairs', status: 'upcoming', method: 'face_recognition', attendees: 0, capacity: 800 },
  { id: 6, title: 'Inter-College Sports Fest', date: '2026-03-15T07:00:00', end_date: '2026-03-17T18:00:00', venue: 'Sports Complex', organizer: 'Sports Committee', status: 'upcoming', method: 'rfid', attendees: 0, capacity: 1000 },
];

const methodLabels = {
  face_recognition: { label: 'Face Recognition', color: 'bg-purple-100 text-purple-800' },
  rfid: { label: 'RFID', color: 'bg-blue-100 text-blue-800' },
  manual: { label: 'Manual', color: 'bg-slate-100 text-slate-800' },
};

export default function EventMonitoring() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = mockEvents.filter((event) => {
    const matchSearch = event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.organizer.toLowerCase().includes(search.toLowerCase());
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
                  statusFilter === status ? 'bg-primary-100 text-primary-700' : 'text-slate-600 hover:bg-primary-50/30'
                )}
              >
                {status === 'all' ? 'All Status' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((event) => (
          <div key={event.id} className="card-hover">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <StatusBadge status={event.status} />
                <span className={cn('badge', methodLabels[event.method].color)}>
                  {methodLabels[event.method].label}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-slate-900 mb-2">{event.title}</h3>

              <div className="space-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDateTime(event.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{event.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>By {event.organizer}</span>
                </div>
              </div>

              {/* Attendance Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-500">Attendance</span>
                  <span className="font-medium text-slate-700">
                    {event.attendees}/{event.capacity}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((event.attendees / event.capacity) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  to={`/admin/events/${event.id}`}
                  className="btn-secondary text-sm flex-1 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </Link>
                {event.status === 'ongoing' && (
                  <Link
                    to={`/admin/events/${event.id}/live`}
                    className="btn-primary text-sm flex-1 flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Live Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900">No events found</h3>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}
