import { useState } from 'react';
import { PageHeader, DataTable, SearchInput, StatusBadge, ConfirmDialog, Modal } from '../../components/ui';
import { cn, getInitials, formatDateTime } from '../../lib/utils';
import { ScanFace, Check, X, Eye, Image } from 'lucide-react';

const mockEnrollments = [
  { id: 1, name: 'Juan Dela Cruz', student_id: '2024-00001', email: 'juan@university.edu', submitted: '2026-03-02T14:30:00', status: 'pending', images: 5 },
  { id: 2, name: 'Maria Santos', student_id: '2024-00002', email: 'maria@university.edu', submitted: '2026-03-02T11:00:00', status: 'approved', images: 5 },
  { id: 3, name: 'Pedro Gomez', student_id: '2024-00003', email: 'pedro@university.edu', submitted: '2026-03-01T09:15:00', status: 'pending', images: 5 },
  { id: 4, name: 'Ana Rivera', student_id: '2024-00004', email: 'ana@university.edu', submitted: '2026-02-28T16:45:00', status: 'approved', images: 5 },
  { id: 5, name: 'Carlos Mendoza', student_id: '2024-00005', email: 'carlos@university.edu', submitted: '2026-02-28T10:20:00', status: 'rejected', images: 3 },
];

export default function Enrollments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewEnrollment, setViewEnrollment] = useState(null);
  const [approveConfirm, setApproveConfirm] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = mockEnrollments.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.student_id.includes(search) ||
      e.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = mockEnrollments.filter((e) => e.status === 'pending').length;

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
    {
      key: 'student_id',
      label: 'Student ID',
    },
    {
      key: 'images',
      label: 'Images',
      render: (val) => (
        <div className="flex items-center gap-1 text-sm text-slate-600">
          <Image className="w-4 h-4 text-slate-400" />
          {val} photos
        </div>
      ),
    },
    {
      key: 'submitted',
      label: 'Submitted',
      render: (val) => <span className="text-sm text-slate-500">{formatDateTime(val)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span
          className={cn(
            'badge capitalize',
            val === 'approved'
              ? 'bg-emerald-100 text-emerald-800'
              : val === 'rejected'
              ? 'bg-rose-100 text-rose-800'
              : 'bg-amber-100 text-amber-800'
          )}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewEnrollment(row)}
            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status === 'pending' && (
            <>
              <button
                onClick={() => setApproveConfirm(row)}
                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setRejectTarget(row); setRejectReason(''); }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Facial Enrollments"
        description="Review and manage student facial recognition enrollment requests."
      />

      {/* Pending Banner */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <ScanFace className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">
              {pendingCount} enrollment{pendingCount !== 1 ? 's' : ''} pending review
            </p>
            <p className="text-xs text-amber-600">These students are waiting for their facial data to be approved.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name, ID, or email..." />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
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
        <DataTable columns={columns} data={filtered} emptyMessage="No enrollment requests found." />
      </div>

      {/* View Enrollment Modal */}
      <Modal open={!!viewEnrollment} onClose={() => setViewEnrollment(null)} title="Enrollment Details">
        {viewEnrollment && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-lg font-bold">
                {getInitials(viewEnrollment.name)}
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-900">{viewEnrollment.name}</h4>
                <p className="text-sm text-slate-500">{viewEnrollment.email}</p>
                <p className="text-sm text-slate-500">ID: {viewEnrollment.student_id}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg text-sm">
              <div>
                <p className="text-slate-500">Status</p>
                <span className={cn('badge capitalize mt-1 inline-block', viewEnrollment.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : viewEnrollment.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')}>
                  {viewEnrollment.status}
                </span>
              </div>
              <div>
                <p className="text-slate-500">Images</p>
                <p className="font-medium text-slate-900 mt-1">{viewEnrollment.images} photos</p>
              </div>
              <div>
                <p className="text-slate-500">Submitted</p>
                <p className="font-medium text-slate-900 mt-1">{formatDateTime(viewEnrollment.submitted)}</p>
              </div>
            </div>
            {/* Image Previews Placeholder */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Captured Photos</p>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: viewEnrollment.images }).map((_, i) => (
                  <div key={i} className="aspect-square bg-slate-200 rounded-lg flex items-center justify-center">
                    <ScanFace className="w-6 h-6 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
            {viewEnrollment.status === 'pending' && (
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button onClick={() => { setRejectTarget(viewEnrollment); setRejectReason(''); setViewEnrollment(null); }} className="btn-danger text-sm flex items-center gap-1">
                  <X className="w-4 h-4" />Reject
                </button>
                <button onClick={() => { setApproveConfirm(viewEnrollment); setViewEnrollment(null); }} className="btn-primary text-sm flex items-center gap-1">
                  <Check className="w-4 h-4" />Approve
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approve Confirmation */}
      <ConfirmDialog
        open={!!approveConfirm}
        onClose={() => setApproveConfirm(null)}
        onConfirm={() => setApproveConfirm(null)}
        title="Approve Enrollment"
        message={`Approve facial enrollment for ${approveConfirm?.name} (${approveConfirm?.student_id})? This will allow them to use face recognition for event check-in.`}
        confirmText="Approve"
      />

      {/* Reject Modal with Reason */}
      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Enrollment" size="sm">
        {rejectTarget && (
          <form onSubmit={(e) => { e.preventDefault(); setRejectTarget(null); }} className="space-y-4">
            <p className="text-sm text-slate-500">
              Reject facial enrollment for <strong>{rejectTarget.name}</strong> ({rejectTarget.student_id})?
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason (optional)</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="input-field resize-none"
                placeholder="e.g., Photos are blurry or face is not clearly visible..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setRejectTarget(null)} className="btn-secondary text-sm">Cancel</button>
              <button type="submit" className="btn-danger text-sm">Reject Enrollment</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
