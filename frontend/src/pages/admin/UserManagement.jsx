import { useState } from 'react';
import { PageHeader, DataTable, SearchInput, StatusBadge, ConfirmDialog, Modal } from '../../components/ui';
import { cn, getInitials, getRoleBadgeColor } from '../../lib/utils';
import { UserPlus, MoreVertical, Edit, Trash2, Shield } from 'lucide-react';

const mockUsers = [
  { id: 1, name: 'Juan Dela Cruz', email: 'juan@university.edu', student_id: '2024-00001', role: 'student', status: 'active', enrolled: true },
  { id: 2, name: 'Maria Santos', email: 'maria@university.edu', student_id: '2024-00002', role: 'student', status: 'active', enrolled: true },
  { id: 3, name: 'John Reyes', email: 'john@university.edu', student_id: null, role: 'organizer', status: 'active', enrolled: false },
  { id: 4, name: 'Sarah Lopez', email: 'sarah@university.edu', student_id: null, role: 'organizer', status: 'active', enrolled: false },
  { id: 5, name: 'Admin User', email: 'admin@university.edu', student_id: null, role: 'admin', status: 'active', enrolled: false },
  { id: 6, name: 'Pedro Gomez', email: 'pedro@university.edu', student_id: '2024-00003', role: 'student', status: 'active', enrolled: false },
  { id: 7, name: 'Ana Rivera', email: 'ana@university.edu', student_id: '2024-00004', role: 'student', status: 'active', enrolled: true },
  { id: 8, name: 'Carlos Mendoza', email: 'carlos@university.edu', student_id: '2024-00005', role: 'student', status: 'pending', enrolled: false },
];

const emptyForm = { name: '', email: '', student_id: '', role: 'student', password: '' };

export default function UserManagement() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [roleChangeUser, setRoleChangeUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => {
    setForm(emptyForm);
    setShowAddModal(true);
  };

  const openEdit = (user) => {
    setForm({ name: user.name, email: user.email, student_id: user.student_id || '', role: user.role, password: '' });
    setEditUser(user);
    setActiveDropdown(null);
  };

  const openRoleChange = (user) => {
    setRoleChangeUser(user);
    setForm((f) => ({ ...f, role: user.role }));
    setActiveDropdown(null);
  };

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const filteredUsers = mockUsers.filter((user) => {
    const matchSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.student_id && user.student_id.includes(search));
    const matchRole = roleFilter === 'all' || user.role === roleFilter;
    return matchSearch && matchRole;
  });

  const columns = [
    {
      key: 'name',
      label: 'User',
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
      render: (val) => val || <span className="text-slate-400">N/A</span>,
    },
    {
      key: 'role',
      label: 'Role',
      render: (val) => (
        <span className={cn('badge capitalize', getRoleBadgeColor(val))}>
          {val === 'admin' ? 'USG Admin' : val === 'organizer' ? 'Organizer' : 'Student'}
        </span>
      ),
    },
    {
      key: 'enrolled',
      label: 'Face Enrolled',
      render: (val) =>
        val ? (
          <span className="badge-success">Enrolled</span>
        ) : (
          <span className="badge bg-slate-100 text-slate-500">Not Enrolled</span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === row.id ? null : row.id)}
            className="p-1.5 rounded-lg hover:bg-primary-50/30 text-slate-400 hover:text-slate-600"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {activeDropdown === row.id && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-100 rounded-xl shadow-lg py-1 z-10">
              <button
                onClick={() => openEdit(row)}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-primary-50/30"
              >
                <Edit className="w-4 h-4" />
                Edit User
              </button>
              <button
                onClick={() => openRoleChange(row)}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-primary-50/30"
              >
                <Shield className="w-4 h-4" />
                Change Role
              </button>
              <button
                onClick={() => {
                  setDeleteConfirm(row);
                  setActiveDropdown(null);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete User
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="User Management"
        description="Manage student accounts, organizers, and system administrators."
        actions={
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        }
      />

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, or student ID..." />
          </div>
          <div className="flex gap-2">
            {['all', 'student', 'organizer', 'admin'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                  roleFilter === role
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-slate-600 hover:bg-primary-50/30'
                )}
              >
                {role === 'all' ? 'All Roles' : role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">{filteredUsers.length} users found</p>
        </div>
        <DataTable columns={columns} data={filteredUsers} emptyMessage="No users found." />
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          setDeleteConfirm(null);
        }}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteConfirm?.name}? This action cannot be undone.`}
        confirmText="Delete"
        danger
      />

      {/* Add User Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New User">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); }}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input className="input-field" placeholder="Enter full name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" className="input-field" placeholder="user@university.edu" value={form.email} onChange={(e) => handleChange('email', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Student ID (optional)</label>
            <input className="input-field" placeholder="2024-00001" value={form.student_id} onChange={(e) => handleChange('student_id', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select className="input-field" value={form.role} onChange={(e) => handleChange('role', e.target.value)}>
              <option value="student">Student</option>
              <option value="organizer">Event Organizer</option>
              <option value="admin">USG Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
            <input type="password" className="input-field" placeholder="Minimum 8 characters" value={form.password} onChange={(e) => handleChange('password', e.target.value)} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" className="btn-primary text-sm">Add User</button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setEditUser(null); }}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input className="input-field" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" className="input-field" value={form.email} onChange={(e) => handleChange('email', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Student ID (optional)</label>
            <input className="input-field" value={form.student_id} onChange={(e) => handleChange('student_id', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select className="input-field" value={form.role} onChange={(e) => handleChange('role', e.target.value)}>
              <option value="student">Student</option>
              <option value="organizer">Event Organizer</option>
              <option value="admin">USG Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password (leave blank to keep)</label>
            <input type="password" className="input-field" placeholder="Leave blank to keep current" value={form.password} onChange={(e) => handleChange('password', e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditUser(null)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" className="btn-primary text-sm">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Change Role Modal */}
      <Modal open={!!roleChangeUser} onClose={() => setRoleChangeUser(null)} title="Change User Role" size="sm">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setRoleChangeUser(null); }}>
          <p className="text-sm text-slate-500">Change role for <strong>{roleChangeUser?.name}</strong></p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select className="input-field" value={form.role} onChange={(e) => handleChange('role', e.target.value)}>
              <option value="student">Student</option>
              <option value="organizer">Event Organizer</option>
              <option value="admin">USG Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setRoleChangeUser(null)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" className="btn-primary text-sm">Update Role</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
