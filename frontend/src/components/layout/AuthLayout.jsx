import { Link } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex flex-col items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <CalendarCheck className="w-7 h-7 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">U-EventTrack</h1>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {(title || subtitle) && (
            <div className="text-center mb-6">
              {title && <h2 className="text-2xl font-bold text-slate-900">{title}</h2>}
              {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-primary-200 text-sm mt-6">
          &copy; {new Date().getFullYear()} U-EventTrack. University Student Government.
        </p>
      </div>
    </div>
  );
}
