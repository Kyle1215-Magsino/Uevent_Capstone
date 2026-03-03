import { useState } from 'react';
import { PageHeader, SearchInput, StatusBadge } from '../../components/ui';
import { cn, formatDateTime } from '../../lib/utils';
import { Calendar, MapPin, Clock, Users, ScanFace, CreditCard, ClipboardList } from 'lucide-react';

const mockEvents = [
  { id: 1, title: 'Leadership Training Seminar', description: 'Annual leadership training for all student leaders and officers.', date: '2026-03-05T09:00:00', end_date: '2026-03-05T17:00:00', venue: 'Main Auditorium', status: 'upcoming', method: 'face_recognition', capacity: 200, organizer: 'CSG' },
  { id: 2, title: 'Cultural Night 2026', description: 'A grand celebration of diverse cultures within our university community.', date: '2026-03-03T18:00:00', end_date: '2026-03-03T22:00:00', venue: 'University Gymnasium', status: 'ongoing', method: 'face_recognition', capacity: 500, organizer: 'Cultural Committee' },
  { id: 3, title: 'Academic Excellence Awards', description: 'Recognition ceremony for outstanding academic performers.', date: '2026-03-01T14:00:00', end_date: '2026-03-01T17:00:00', venue: 'Convention Hall', status: 'completed', method: 'rfid', capacity: 200, organizer: 'Academic Affairs' },
  { id: 5, title: 'Freshman Orientation', description: 'Welcome and orientation program for new students.', date: '2026-03-10T08:00:00', end_date: '2026-03-10T16:00:00', venue: 'Main Auditorium', status: 'upcoming', method: 'face_recognition', capacity: 800, organizer: 'Student Affairs' },
  { id: 6, title: 'Inter-College Sports Fest', description: 'Annual sports competition among all college teams.', date: '2026-03-15T07:00:00', end_date: '2026-03-17T18:00:00', venue: 'Sports Complex', status: 'upcoming', method: 'rfid', capacity: 1000, organizer: 'Sports Committee' },
];

const methodConfig = {
  face_recognition: { icon: ScanFace, label: 'Face Recognition', color: 'text-purple-600 bg-purple-100' },
  rfid: { icon: CreditCard, label: 'RFID', color: 'text-blue-600 bg-blue-100' },
  manual: { icon: ClipboardList, label: 'Manual', color: 'text-slate-600 bg-slate-100' },
};

export default function StudentEvents() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = mockEvents.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
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
                  statusFilter === status ? 'bg-primary-100 text-primary-700' : 'text-slate-600 hover:bg-primary-50/30'
                )}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((event) => {
          const method = methodConfig[event.method];
          return (
            <div key={event.id} className="card-hover overflow-hidden">
              {/* Status header bar */}
              <div
                className={cn(
                  'px-5 py-2 text-xs font-semibold uppercase tracking-wide',
                  event.status === 'upcoming' ? 'bg-blue-500 text-white' :
                  event.status === 'ongoing' ? 'bg-primary-500 text-white' :
                  'bg-slate-200 text-slate-600'
                )}
              >
                {event.status}
              </div>

              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{event.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{event.description}</p>

                <div className="space-y-2 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{formatDateTime(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{event.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{event.organizer} · Capacity: {event.capacity}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className={cn('badge', method.color)}>
                    <method.icon className="w-3 h-3 mr-1" />
                    {method.label}
                  </span>
                  {event.status === 'ongoing' && (
                    <button className="btn-primary text-sm px-3 py-1.5">
                      Check In
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900">No events found</h3>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filter.</p>
        </div>
      )}
    </div>
  );
}
