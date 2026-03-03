import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const { user } = useAuth();

  const dashboardMap = {
    admin: '/admin',
    organizer: '/organizer',
    student: '/student',
  };

  const homeLink = user ? dashboardMap[user.role] || '/' : '/';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="text-center max-w-md">
        <p className="text-8xl font-extrabold text-primary-500">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Page Not Found</h1>
        <p className="mt-2 text-slate-500">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={() => window.history.back()} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link to={homeLink} className="btn-primary flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
