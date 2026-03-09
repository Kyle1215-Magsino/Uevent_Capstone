import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute, RoleRoute, GuestRoute } from './routes/Guards';
import AppLayout from './components/layout/AppLayout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import EventMonitoring from './pages/admin/EventMonitoring';
import AdminReports from './pages/admin/Reports';
import Analytics from './pages/admin/Analytics';
import Enrollments from './pages/admin/Enrollments';
import RFIDManagement from './pages/admin/RFIDManagement';
import EventDetail from './pages/admin/EventDetail';

// Organizer Pages
import OrganizerDashboard from './pages/organizer/Dashboard';
import CreateEvent from './pages/organizer/CreateEvent';
import ManageEvents from './pages/organizer/ManageEvents';
import LiveDashboard from './pages/organizer/LiveDashboard';
import AttendanceMonitor from './pages/organizer/AttendanceMonitor';
import OrganizerReports from './pages/organizer/Reports';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentEvents from './pages/student/Events';
import FacialEnrollment from './pages/student/FacialEnrollment';
import AttendanceHistory from './pages/student/AttendanceHistory';

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Public / Landing */}
      <Route path="/" element={isAuthenticated ? <Navigate to={`/${user?.role}`} replace /> : <Landing />} />

      {/* Auth (guest only) */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* ── Admin Routes ── */}
      <Route path="/admin" element={<RoleRoute roles={['admin']}><AppLayout><AdminDashboard /></AppLayout></RoleRoute>} />
      <Route path="/admin/users" element={<RoleRoute roles={['admin']}><AppLayout><UserManagement /></AppLayout></RoleRoute>} />
      <Route path="/admin/events" element={<RoleRoute roles={['admin']}><AppLayout><EventMonitoring /></AppLayout></RoleRoute>} />
      <Route path="/admin/reports" element={<RoleRoute roles={['admin']}><AppLayout><AdminReports /></AppLayout></RoleRoute>} />
      <Route path="/admin/analytics" element={<RoleRoute roles={['admin']}><AppLayout><Analytics /></AppLayout></RoleRoute>} />
      <Route path="/admin/enrollments" element={<RoleRoute roles={['admin']}><AppLayout><Enrollments /></AppLayout></RoleRoute>} />
      <Route path="/admin/rfid" element={<RoleRoute roles={['admin']}><AppLayout><RFIDManagement /></AppLayout></RoleRoute>} />
      <Route path="/admin/events/:id" element={<RoleRoute roles={['admin']}><AppLayout><EventDetail /></AppLayout></RoleRoute>} />
      <Route path="/admin/events/:id/live" element={<RoleRoute roles={['admin']}><AppLayout><LiveDashboard /></AppLayout></RoleRoute>} />
      <Route path="/admin/profile" element={<RoleRoute roles={['admin']}><AppLayout><Profile /></AppLayout></RoleRoute>} />
      <Route path="/admin/settings" element={<RoleRoute roles={['admin']}><AppLayout><Settings /></AppLayout></RoleRoute>} />

      {/* ── Organizer Routes ── */}
      <Route path="/organizer" element={<RoleRoute roles={['organizer']}><AppLayout><OrganizerDashboard /></AppLayout></RoleRoute>} />
      <Route path="/organizer/events/create" element={<RoleRoute roles={['organizer']}><AppLayout><CreateEvent /></AppLayout></RoleRoute>} />
      <Route path="/organizer/events" element={<RoleRoute roles={['organizer']}><AppLayout><ManageEvents /></AppLayout></RoleRoute>} />
      <Route path="/organizer/events/:id/live" element={<RoleRoute roles={['organizer', 'admin']}><AppLayout><LiveDashboard /></AppLayout></RoleRoute>} />
      <Route path="/organizer/attendance" element={<RoleRoute roles={['organizer']}><AppLayout><AttendanceMonitor /></AppLayout></RoleRoute>} />
      <Route path="/organizer/reports" element={<RoleRoute roles={['organizer']}><AppLayout><OrganizerReports /></AppLayout></RoleRoute>} />
      <Route path="/organizer/profile" element={<RoleRoute roles={['organizer']}><AppLayout><Profile /></AppLayout></RoleRoute>} />
      <Route path="/organizer/settings" element={<RoleRoute roles={['organizer']}><AppLayout><Settings /></AppLayout></RoleRoute>} />

      {/* ── Student Routes ── */}
      <Route path="/student" element={<RoleRoute roles={['student']}><AppLayout><StudentDashboard /></AppLayout></RoleRoute>} />
      <Route path="/student/events" element={<RoleRoute roles={['student']}><AppLayout><StudentEvents /></AppLayout></RoleRoute>} />
      <Route path="/student/enrollment" element={<RoleRoute roles={['student']}><AppLayout><FacialEnrollment /></AppLayout></RoleRoute>} />
      <Route path="/student/attendance" element={<RoleRoute roles={['student']}><AppLayout><AttendanceHistory /></AppLayout></RoleRoute>} />
      <Route path="/student/profile" element={<RoleRoute roles={['student']}><AppLayout><Profile /></AppLayout></RoleRoute>} />
      <Route path="/student/settings" element={<RoleRoute roles={['student']}><AppLayout><Settings /></AppLayout></RoleRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
