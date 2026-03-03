import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SearchInput, StatusBadge, ConfirmDialog, Modal, DataTable } from '../../components/ui';
import { cn, formatDateTime } from '../../lib/utils';
import { eventsAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { CalendarPlus, Eye, Edit, Trash2, MapPin, Clock, Users, MoreVertical, ScanFace, CreditCard, ClipboardList, Info, Navigation, Loader2, Radio } from 'lucide-react';

const methodLabels = {
  facial: 'Face Recognition',
  face_recognition: 'Face Recognition',
  rfid: 'RFID',
  manual: 'Manual',
  any: 'Any Method',
  location: 'Location Tracking',
};

const methodColors = {
  facial: 'bg-emerald-100 text-emerald-800',
  face_recognition: 'bg-emerald-100 text-emerald-800',
  rfid: 'bg-emerald-100 text-emerald-800',
  any: 'bg-emerald-100 text-emerald-800',
  location: 'bg-emerald-100 text-emerald-800',
  manual: 'bg-slate-100 text-slate-800',
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await eventsAPI.getAll({ per_page: 100 });
      setEvents(res.data?.data || res.data || []);
    } catch {
      toast.error('Failed to load events.');
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const openCreate = () => {
    setCreateForm(emptyForm);
    setShowCreateModal(true);
  };

  const openEdit = (event) => {
    setEditForm({
      title: event.title,
      description: event.description || '',
      date: event.date?.split('T')[0] || event.date,
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      venue: event.venue,
      capacity: String(event.capacity || ''),
      attendance_method: event.attendance_method || 'facial',
    });
    setEditEvent(event);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await eventsAPI.create(createForm);
      toast.success('Event created successfully!');
      setShowCreateModal(false);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await eventsAPI.update(editEvent.id, editForm);
      toast.success('Event updated successfully!');
      setEditEvent(null);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update event.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await eventsAPI.delete(deleteConfirm.id);
      toast.success('Event deleted.');
      setDeleteConfirm(null);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete event.');
    }
  };

  const filtered = events.filter((e) => {
    const matchSearch = (e.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.venue || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns = [
    {
      key: 'title',
      label: 'Event',
      render: (_, row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.title}</p>
          {row.description && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{row.description}</p>}
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (val) => (
        <span className="flex items-center gap-1.5 text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          {formatDateTime(val)}
        </span>
      ),
    },
    {
      key: 'venue',
      label: 'Venue',
      render: (val) => (
        <span className="flex items-center gap-1.5 text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          {val}
        </span>
      ),
    },
    {
      key: 'attendance_method',
      label: 'Method',
      render: (val) => {
        const method = val || 'any';
        return (
          <span className={cn('badge text-xs', methodColors[method] || 'bg-slate-100 text-slate-800')}>
            {methodLabels[method] || method}
          </span>
        );
      },
    },
    {
      key: 'total_attendees',
      label: 'Attendees',
      render: (val, row) => {
        const attendees = val || row.present_count + row.late_count || 0;
        const capacity = row.capacity || 0;
        const pct = capacity > 0 ? Math.min((attendees / capacity) * 100, 100) : 0;
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1">
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <span className="text-xs text-slate-500 whitespace-nowrap">{attendees}/{capacity}</span>
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
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'ongoing' && (
            <Link to={`/organizer/events/${row.id}/live`} className="btn-primary text-xs px-2 py-1 flex items-center gap-1">
              <Radio className="w-3 h-3" />Live
            </Link>
          )}
          <Link to={`/organizer/events/${row.id}`} className="btn-secondary text-xs px-2 py-1 flex items-center gap-1">
            <Eye className="w-3 h-3" />View
          </Link>
          <button onClick={() => openEdit(row)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-primary-50/30 rounded-lg">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteConfirm(row)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

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

      {/* Events DataTable */}
      {eventsLoading ? (
        <div className="card p-12 text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading events...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="No events found. Create your first event to get started."
          pageSize={10}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
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
