import { useState } from 'react';
import { PageHeader, DataTable, SearchInput, Modal, ConfirmDialog } from '../../components/ui';
import { cn, getInitials } from '../../lib/utils';
import {
  CreditCard, Users, Plus, Edit, Trash2, CheckCircle, XCircle,
  Search, Tag, Loader2, AlertTriangle, ShieldCheck,
} from 'lucide-react';

const mockStudents = [
  { id: 1, name: 'Juan Dela Cruz', student_id: '2024-00001', email: 'juan@university.edu', rfid_tag: 'RFID-001-2024', rfid_status: 'active', assigned_date: '2026-01-15' },
  { id: 2, name: 'Maria Santos', student_id: '2024-00002', email: 'maria@university.edu', rfid_tag: 'RFID-002-2024', rfid_status: 'active', assigned_date: '2026-01-15' },
  { id: 3, name: 'Pedro Gomez', student_id: '2024-00003', email: 'pedro@university.edu', rfid_tag: 'RFID-003-2024', rfid_status: 'active', assigned_date: '2026-01-20' },
  { id: 4, name: 'Ana Rivera', student_id: '2024-00004', email: 'ana@university.edu', rfid_tag: 'RFID-004-2024', rfid_status: 'active', assigned_date: '2026-02-01' },
  { id: 5, name: 'Carlos Mendoza', student_id: '2024-00005', email: 'carlos@university.edu', rfid_tag: null, rfid_status: 'unassigned', assigned_date: null },
  { id: 6, name: 'Rosa Garcia', student_id: '2024-00006', email: 'rosa@university.edu', rfid_tag: 'RFID-006-2024', rfid_status: 'deactivated', assigned_date: '2026-01-22' },
  { id: 7, name: 'Luis Torres', student_id: '2024-00007', email: 'luis@university.edu', rfid_tag: null, rfid_status: 'unassigned', assigned_date: null },
  { id: 8, name: 'Diana Cruz', student_id: '2024-00008', email: 'diana@university.edu', rfid_tag: 'RFID-008-2024', rfid_status: 'active', assigned_date: '2026-02-10' },
];

const mockStats = {
  total: 8,
  assigned: 5,
  active: 4,
  unassigned: 2,
  deactivated: 1,
};

export default function RFIDManagement() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignModal, setAssignModal] = useState(null);
  const [rfidInput, setRfidInput] = useState('');
  const [deactivateConfirm, setDeactivateConfirm] = useState(null);
  const [loading, setLoading] = useState(false);

  const filtered = mockStudents.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id.includes(search) ||
      (s.rfid_tag && s.rfid_tag.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || s.rfid_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAssign = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAssignModal(null);
      setRfidInput('');
    }, 600);
  };

  const columns = [
    {
      key: 'name',
      label: 'Student',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
            {getInitials(row.name)}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'student_id', label: 'Student ID' },
    {
      key: 'rfid_tag',
      label: 'RFID Tag',
      render: (val) => val ? (
        <span className="font-mono text-sm text-slate-900 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-emerald-600" />{val}
        </span>
      ) : (
        <span className="text-sm text-slate-400 italic">Not assigned</span>
      ),
    },
    {
      key: 'rfid_status',
      label: 'Status',
      render: (val) => (
        <span className={cn(
          'badge capitalize',
          val === 'active' ? 'bg-emerald-100 text-emerald-800' :
          val === 'deactivated' ? 'bg-slate-100 text-slate-600' :
          'bg-emerald-50 text-emerald-700'
        )}>
          {val}
        </span>
      ),
    },
    {
      key: 'assigned_date',
      label: 'Assigned',
      render: (val) => val ? (
        <span className="text-sm text-slate-500">{new Date(val).toLocaleDateString()}</span>
      ) : (
        <span className="text-sm text-slate-400">—</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {row.rfid_status === 'unassigned' && (
            <button
              onClick={() => { setAssignModal(row); setRfidInput(''); }}
              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Assign RFID"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          {row.rfid_status === 'active' && (
            <>
              <button
                onClick={() => { setAssignModal(row); setRfidInput(row.rfid_tag || ''); }}
                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Reassign"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeactivateConfirm(row)}
                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Deactivate"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {row.rfid_status === 'deactivated' && (
            <button
              onClick={() => { setAssignModal(row); setRfidInput(''); }}
              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Reactivate / Reassign"
            >
              <CreditCard className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="RFID Management"
        description="Assign and manage RFID tags for student identification."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: mockStats.total, icon: Users, color: 'bg-emerald-100 text-emerald-600' },
          { label: 'Active Tags', value: mockStats.active, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600' },
          { label: 'Unassigned', value: mockStats.unassigned, icon: AlertTriangle, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Deactivated', value: mockStats.deactivated, icon: XCircle, color: 'bg-slate-100 text-slate-600' },
        ].map((stat) => (
          <div key={stat.label} className="card-hover p-5">
            <div className="flex items-center justify-between mb-2">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name, student ID, or RFID tag..." />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'unassigned', 'deactivated'].map((status) => (
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

      {/* Table */}
      <div className="card">
        <DataTable columns={columns} data={filtered} emptyMessage="No students found." />
      </div>

      {/* RFID Info */}
      <div className="card p-4 flex items-start gap-3 bg-emerald-50 border-emerald-200">
        <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-emerald-800">
          <p className="font-medium">RFID Tag Assignment</p>
          <p className="text-xs text-emerald-600 mt-0.5">
            Each student receives a unique RFID tag linked to their student ID. Tags are used for automated attendance check-in at event venues via RFID readers.
          </p>
        </div>
      </div>

      {/* Assign / Reassign Modal */}
      <Modal
        open={!!assignModal}
        onClose={() => setAssignModal(null)}
        title={assignModal?.rfid_tag ? 'Reassign RFID Tag' : 'Assign RFID Tag'}
        size="sm"
      >
        {assignModal && (
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                {getInitials(assignModal.name)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{assignModal.name}</p>
                <p className="text-xs text-slate-500">{assignModal.student_id}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">RFID Tag Number *</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={rfidInput}
                  onChange={(e) => setRfidInput(e.target.value)}
                  className="input-field pl-10 font-mono"
                  placeholder="e.g., RFID-XXX-XXXX"
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Scan or manually enter the RFID tag identifier.</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setAssignModal(null)} className="btn-secondary text-sm">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary text-sm flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {assignModal.rfid_tag ? 'Update Tag' : 'Assign Tag'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        open={!!deactivateConfirm}
        onClose={() => setDeactivateConfirm(null)}
        onConfirm={() => setDeactivateConfirm(null)}
        title="Deactivate RFID Tag"
        message={`Deactivate the RFID tag for ${deactivateConfirm?.name} (${deactivateConfirm?.rfid_tag})? The student will not be able to use RFID check-in until a new tag is assigned.`}
        confirmText="Deactivate"
        danger
      />
    </div>
  );
}
