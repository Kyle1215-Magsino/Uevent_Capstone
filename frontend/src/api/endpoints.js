import api from './axios';

// ── Auth ──
export const authAPI = {
  login: (credentials) => api.post('/api/login', credentials),
  register: (data) => api.post('/api/register', data),
  logout: () => api.post('/api/logout'),
  getUser: () => api.get('/api/user'),
  forgotPassword: (email) => api.post('/api/forgot-password', { email }),
  resetPassword: (data) => api.post('/api/reset-password', data),
};

// ── Users (Admin) ──
export const usersAPI = {
  getAll: (params) => api.get('/api/users', { params }),
  getById: (id) => api.get(`/api/users/${id}`),
  create: (data) => api.post('/api/users', data),
  update: (id, data) => api.put(`/api/users/${id}`, data),
  delete: (id) => api.delete(`/api/users/${id}`),
  updateRole: (id, role) => api.patch(`/api/users/${id}/role`, { role }),
};

// ── Events ──
export const eventsAPI = {
  getAll: (params) => api.get('/api/events', { params }),
  getById: (id) => api.get(`/api/events/${id}`),
  create: (data) => api.post('/api/events', data),
  update: (id, data) => api.put(`/api/events/${id}`, data),
  delete: (id) => api.delete(`/api/events/${id}`),
  getUpcoming: () => api.get('/api/events/upcoming'),
  getAttendance: (id) => api.get(`/api/events/${id}/attendance`),
};

// ── Attendance ──
export const attendanceAPI = {
  checkIn: (eventId, data) => api.post(`/api/events/${eventId}/check-in`, data),
  manualCheckIn: (eventId, data) => api.post(`/api/events/${eventId}/manual-check-in`, data),
  rfidCheckIn: (eventId, data) => api.post(`/api/events/${eventId}/rfid-check-in`, data),
  faceCheckIn: (eventId, data) => api.post(`/api/events/${eventId}/face-check-in`, data),
  getByEvent: (eventId, params) => api.get(`/api/events/${eventId}/attendance`, { params }),
  getByStudent: (studentId) => api.get(`/api/students/${studentId}/attendance`),
  getMyAttendance: () => api.get('/api/my-attendance'),
  getLiveDashboard: (eventId) => api.get(`/api/events/${eventId}/live-dashboard`),
};

// ── Facial Enrollment ──
export const enrollmentAPI = {
  enroll: (data) => api.post('/api/facial-enrollment', data),
  getStatus: () => api.get('/api/facial-enrollment/status'),
  delete: () => api.delete('/api/facial-enrollment'),
  getAll: (params) => api.get('/api/facial-enrollments', { params }),
  approve: (id) => api.patch(`/api/facial-enrollments/${id}/approve`),
  reject: (id) => api.patch(`/api/facial-enrollments/${id}/reject`),
};

// ── Analytics (Admin) ──
export const analyticsAPI = {
  getDashboard: () => api.get('/api/analytics/dashboard'),
  getEventStats: (params) => api.get('/api/analytics/events', { params }),
  getAttendanceStats: (params) => api.get('/api/analytics/attendance', { params }),
};

// ── Reports ──
export const reportsAPI = {
  getEventReport: (eventId) => api.get(`/api/reports/events/${eventId}`),
  getAttendanceReport: (params) => api.get('/api/reports/attendance', { params }),
  exportCSV: (eventId) => api.get(`/api/reports/events/${eventId}/export`, { responseType: 'blob' }),
};
