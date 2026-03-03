import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SearchInput, StatusBadge, ConfirmDialog, Modal } from '../../components/ui';
import { cn, formatDateTime } from '../../lib/utils';
import { CalendarPlus, Eye, Edit, Trash2, MapPin, Clock, Users, MoreVertical, ScanFace, CreditCard, ClipboardList, Info, Navigation } from 'lucide-react';

const mockEvents = [
  { id: 1, title: 'Leadership Training Seminar', description: '', date: '2026-03-05', start_time: '09:00', end_time: '12:00', venue: 'Main Auditorium', status: 'upcoming', attendance_method: 'face_recognition', attendees: 0, capacity: 200 },
  { id: 2, title: 'Cultural Night 2026', description: '', date: '2026-03-03', start_time: '18:00', end_time: '21:00', venue: 'University Gymnasium', status: 'ongoing', attendance_method: 'face_recognition', attendees: 342, capacity: 500 },
  { id: 3, title: 'Academic Excellence Awards', description: '', date: '2026-03-01', start_time: '14:00', end_time: '17:00', venue: 'Convention Hall', status: 'completed', attendance_method: 'rfid', attendees: 189, capacity: 200 },
  { id: 4, title: 'Environmental Awareness Campaign', description: '', date: '2026-02-28', start_time: '08:00', end_time: '12:00', venue: 'University Grounds', status: 'completed', attendance_method: 'manual', attendees: 156, capacity: 300 },
];

const methodLabels = {
  face_recognition: 'Face Recognition',
  rfid: 'RFID',
  manual: 'Manual',
  location: 'Location Tracking',
};

const attendanceMethods = [
  { value: 'face_recognition', label: 'Face Recognition', description: 'Automated check-in using facial recognition camera.', icon: ScanFace, color: 'border-emerald-500 bg-emerald-50', iconColor: 'text-emerald-600' },
  { value: 'rfid', label: 'RFID Scanning', description: 'Students tap their RFID-enabled ID cards.', icon: CreditCard, color: 'border-emerald-500 bg-emerald-50', iconColor: 'text-emerald-600' },
  { value: 'location', label: 'Location Tracking', description: 'Verify students are within campus geofence.', icon: Navigation, color: 'border-emerald-500 bg-emerald-50', iconColor: 'text-emerald-600' },
  { value: 'manual', label: 'Manual Verification', description: 'Organizers manually verify and log attendance.', icon: ClipboardList, color: 'border-slate-500 bg-slate-50', iconColor: 'text-slate-600' },
];

const emptyForm = { title: '', description: '', date: '', start_time: '', end_time: '', venue: '', capacity: '', attendance_method: 'face_recognition' };

function EventFormFields({ form, onChange }) {
  const handleChange = (field, value) => onChange((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Event Title *</label>
        <input type="text" required value={form.title} onChange={(e) => handleChange('title', e.target.value)} className="input-field" placeholder="e.g., Leadership Training Seminar" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea rows={3} value={form.description} onChange={(e) => handleChange('description', e.target.value)} className="input-field resize-none" placeholder="Brief description of the event..." />
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
          <input type="date" required value={form.date} onChange={(e) => handleChange('date', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Start Time *</label>
          <input type="time" required value={form.start_time} onChange={(e) => handleChange('start_time', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">End Time *</label>
          <input type="time" required value={form.end_time} onChange={(e) => handleChange('end_time', e.target.value)} className="input-field" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Venue *</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" required value={form.venue} onChange={(e) => handleChange('venue', e.target.value)} className="input-field pl-10" placeholder="e.g., Main Auditorium" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Expected Capacity *</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="number" required min={1} value={form.capacity} onChange={(e) => handleChange('capacity', e.target.value)} className="input-field pl-10" placeholder="200" />
          </div>
        </div>
      </div>

      {/* Attendance Method */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Attendance Method</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {attendanceMethods.map((method) => (
            <button
              key={method.value}
              type="button"
              onClick={() => handleChange('attendance_method', method.value)}
              className={cn(
                'border-2 rounded-xl p-3 text-left transition-all',
                form.attendance_method === method.value ? method.color : 'border-slate-200 hover:border-slate-300 bg-white'
              )}
            >
              <method.icon className={cn('w-6 h-6 mb-2', form.attendance_method === method.value ? method.iconColor : 'text-slate-400')} />
              <p className="text-xs font-semibold text-slate-900">{method.label}</p>
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">{method.description}</p>
            </button>
          ))}
        </div>
        {form.attendance_method === 'face_recognition' && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-700">Students must complete facial enrollment before they can be verified via face recognition.</p>
          </div>
        )}
        {form.attendance_method === 'rfid' && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-700">Students must have an RFID tag assigned in the system. Tags are managed by the admin.</p>
          </div>
        )}
        {form.attendance_method === 'location' && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-700">Students must be within the 500m campus geofence radius. Location is verified via GPS.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ManageEvents() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const openCreate = () => {
    setCreateForm(emptyForm);
    setShowCreateModal(true);
  };

  const openEdit = (event) => {
    setEditForm({
      title: event.title,
      description: event.description || '',
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      venue: event.venue,
      capacity: String(event.capacity),
      attendance_method: event.attendance_method,
    });
    setEditEvent(event);
    setActiveDropdown(null);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setShowCreateModal(false); }, 600);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setEditEvent(null); }, 600);
  };

  const filtered = mockEvents.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="My Events"
        description="View and manage all events you've organized."
        actions={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
            <CalendarPlus className="w-4 h-4" />
            Create Event
          </button>
        }
      />

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Search your events..." />
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

      {/* Events List */}
      <div className="space-y-4">
        {filtered.map((event) => (
          <div key={event.id} className="card-hover">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                    <StatusBadge status={event.status} />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{formatDateTime(event.date)}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{event.venue}</span>
                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{event.attendees}/{event.capacity} attendees</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="badge-info text-xs">{methodLabels[event.attendance_method]}</span>
                    <div className="flex-1 max-w-xs">
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${Math.min((event.attendees / event.capacity) * 100, 100)}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{((event.attendees / event.capacity) * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {event.status === 'ongoing' && (
                    <Link to={`/organizer/events/${event.id}/live`} className="btn-primary text-sm">Live Dashboard</Link>
                  )}
                  <Link to={`/organizer/events/${event.id}`} className="btn-secondary text-sm flex items-center gap-1">
                    <Eye className="w-4 h-4" />View
                  </Link>
                  <div className="relative">
                    <button onClick={() => setActiveDropdown(activeDropdown === event.id ? null : event.id)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-primary-50/30 rounded-lg">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {activeDropdown === event.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-100 rounded-xl shadow-lg py-1 z-10">
                        <button onClick={() => openEdit(event)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-primary-50/30">
                          <Edit className="w-4 h-4" />Edit
                        </button>
                        <button
                          onClick={() => { setDeleteConfirm(event); setActiveDropdown(null); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
                        >
                          <Trash2 className="w-4 h-4" />Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card p-12 text-center">
            <CalendarPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900">No events found</h3>
            <p className="text-sm text-slate-500 mt-1">Create your first event to get started.</p>
            <button onClick={openCreate} className="btn-primary text-sm mt-4 inline-flex items-center gap-2">
              <CalendarPlus className="w-4 h-4" />Create Event
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => setDeleteConfirm(null)}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"? All attendance records for this event will be lost.`}
        confirmText="Delete"
        danger
      />

      {/* Create Event Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Event" size="lg">
        <form onSubmit={handleCreate} className="space-y-5">
          <EventFormFields form={createForm} onChange={setCreateForm} />
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary text-sm flex items-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CalendarPlus className="w-4 h-4" />Create Event</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Event Modal */}
      <Modal open={!!editEvent} onClose={() => setEditEvent(null)} title="Edit Event" size="lg">
        <form onSubmit={handleUpdate} className="space-y-5">
          <EventFormFields form={editForm} onChange={setEditForm} />
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setEditEvent(null)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary text-sm flex items-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
