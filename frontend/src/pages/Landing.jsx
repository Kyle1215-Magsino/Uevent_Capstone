import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Users, ScanFace, Shield, BarChart3, Zap, ArrowRight, Eye, EyeOff,
  LogIn, UserPlus, CheckCircle2, MapPin, CreditCard, X,
} from 'lucide-react';

const Logo = ({ className = 'w-10 h-10' }) => (
  <img src="/usg.png" alt="U-EventTrack" className={`${className} object-contain`} />
);

export default function Landing() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, error: authError } = useAuth();

  const [authModal, setAuthModal] = useState(null);

  useEffect(() => {
    if (location.state?.authModal) {
      setAuthModal(location.state.authModal);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // ── Login form ──
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginShowPw, setLoginShowPw] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // ── Register form ──
  const [regForm, setRegForm] = useState({ name: '', email: '', student_id: '', password: '', password_confirmation: '' });
  const [regShowPw, setRegShowPw] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regValidation, setRegValidation] = useState({});

  const dashboardMap = { admin: '/admin', organizer: '/organizer', student: '/student' };

  const resetLogin = () => { setLoginForm({ email: '', password: '' }); setLoginError(''); setLoginShowPw(false); };
  const resetReg = () => { setRegForm({ name: '', email: '', student_id: '', password: '', password_confirmation: '' }); setRegError(''); setRegValidation({}); setRegShowPw(false); };

  const openLogin = () => { resetLogin(); setAuthModal('login'); };
  const openRegister = () => { resetReg(); setAuthModal('register'); };
  const closeModal = () => setAuthModal(null);
  const switchToRegister = () => { resetReg(); setAuthModal('register'); };
  const switchToLogin = () => { resetLogin(); setAuthModal('login'); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const user = await login(loginForm);
      closeModal();
      navigate(dashboardMap[user.role] || '/');
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError('');
    setRegValidation({});
    if (regForm.password !== regForm.password_confirmation) {
      setRegError('Passwords do not match.');
      setRegLoading(false);
      return;
    }
    try {
      const user = await register(regForm);
      closeModal();
      navigate(dashboardMap[user.role] || '/student');
    } catch (err) {
      if (err.response?.data?.errors) setRegValidation(err.response.data.errors);
      else setRegError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  const fieldErr = (field) => regValidation[field] ? <p className="text-xs text-red-500 mt-1">{regValidation[field][0]}</p> : null;

  const features = [
    { icon: ScanFace, title: 'Facial Recognition', desc: 'AI-powered face detection for accurate attendance verification.' },
    { icon: CreditCard, title: 'RFID Technology', desc: 'Tap-and-go check-in with student RFID cards.' },
    { icon: MapPin, title: 'GPS Geofencing', desc: 'Location verification ensures physical presence at events.' },
    { icon: Shield, title: 'Role-Based Access', desc: 'Dedicated dashboards for Admins, Organizers, and Students.' },
    { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Live attendance tracking with exportable reports.' },
    { icon: Zap, title: 'Multi-Method Check-In', desc: 'Flexible verification combining multiple methods.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Logo className="w-9 h-9" />
            <span className="text-lg font-bold text-slate-900">U-EventTrack</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={openLogin} className="text-slate-600 hover:text-slate-900 px-4 py-2 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
              Sign In
            </button>
            <button onClick={openRegister} className="btn-primary text-sm">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <Logo className="w-20 h-20 mx-auto mb-6" />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight tracking-tight">
              Smart Event Attendance
              <br />
              <span className="text-emerald-600">Tracking System</span>
            </h1>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              Modernize university event management with facial recognition,
              RFID technology, GPS geofencing, and real-time analytics.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={openRegister} className="btn-primary text-base px-8 py-3 flex items-center gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={openLogin} className="btn-secondary text-base px-8 py-3">
                Sign In
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { label: 'Active Users', value: '2,500+' },
              { label: 'Events Tracked', value: '350+' },
              { label: 'Attendance Logs', value: '45,000+' },
              { label: 'Accuracy Rate', value: '99.2%' },
            ].map((s) => (
              <div key={s.label} className="text-center py-4 px-3 bg-white rounded-xl border border-slate-200">
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Features</h2>
            <p className="text-slate-500 mt-2">Everything you need for smart event management.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Built for Every Role</h2>
            <p className="text-slate-500 mt-2">Three tailored experiences for your university.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { role: 'USG Admin', icon: Shield, items: ['Manage users & roles', 'Monitor all events', 'RFID management', 'System analytics'] },
              { role: 'Organizer', icon: Users, items: ['Create events', 'Check-in station', 'Live monitoring', 'Export reports'] },
              { role: 'Student', icon: ScanFace, items: ['Facial enrollment', 'Self-service check-in', 'RFID card linking', 'Attendance history'] },
            ].map((r) => (
              <div key={r.role} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-emerald-600 px-5 py-5 flex items-center gap-3">
                  <r.icon className="w-6 h-6 text-white/90" />
                  <h3 className="text-lg font-bold text-white">{r.role}</h3>
                </div>
                <ul className="p-5 space-y-2.5">
                  {r.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to Get Started?</h2>
          <p className="text-emerald-100 mt-3">
            Transform your university event attendance tracking today.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={openRegister} className="inline-flex items-center gap-2 bg-white text-emerald-700 font-semibold px-8 py-3 rounded-xl hover:bg-emerald-50 transition-colors text-base">
              Create Account <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={openLogin} className="inline-flex items-center gap-2 text-white font-semibold px-8 py-3 rounded-xl border border-white/30 hover:bg-white/10 transition-colors text-base">
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo className="w-7 h-7" />
            <span className="text-white font-semibold">U-EventTrack</span>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} U-EventTrack. University Student Government.</p>
        </div>
      </footer>

      {/* ═══════ LOGIN MODAL ═══════ */}
      {authModal === 'login' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md animate-scale-in">
            {/* Header */}
            <div className="px-6 pt-6 pb-0 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Logo className="w-10 h-10" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Sign In</h3>
                  <p className="text-xs text-slate-400">U-EventTrack</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              {(loginError || authError) && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
                  {loginError || authError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email" required autoFocus
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="input-field"
                  placeholder="you@university.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={loginShowPw ? 'text' : 'password'} required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="input-field pr-10"
                    placeholder="Enter password"
                  />
                  <button type="button" onClick={() => setLoginShowPw(!loginShowPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {loginShowPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loginLoading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
                {loginLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><LogIn className="w-4 h-4" /> Sign In</>
                )}
              </button>

              <p className="text-center text-sm text-slate-500">
                No account?{' '}
                <button type="button" onClick={switchToRegister} className="text-emerald-600 hover:text-emerald-700 font-semibold">
                  Create one
                </button>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ REGISTER MODAL ═══════ */}
      {authModal === 'register' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Header */}
            <div className="px-6 pt-6 pb-0 flex items-start justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <Logo className="w-10 h-10" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Create Account</h3>
                  <p className="text-xs text-slate-400">U-EventTrack</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegister} className="p-6 space-y-4">
              {(regError || authError) && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
                  {regError || authError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input type="text" required value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    className="input-field" placeholder="Juan Dela Cruz" />
                  {fieldErr('name')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Student ID</label>
                  <input type="text" required value={regForm.student_id}
                    onChange={(e) => setRegForm({ ...regForm, student_id: e.target.value })}
                    className="input-field" placeholder="2024-00001" />
                  {fieldErr('student_id')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">University Email</label>
                <input type="email" required value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  className="input-field" placeholder="you@university.edu" />
                {fieldErr('email')}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input type={regShowPw ? 'text' : 'password'} required minLength={8}
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    className="input-field pr-10" placeholder="Min 8 characters" />
                  <button type="button" onClick={() => setRegShowPw(!regShowPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {regShowPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErr('password')}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                <input type={regShowPw ? 'text' : 'password'} required
                  value={regForm.password_confirmation}
                  onChange={(e) => setRegForm({ ...regForm, password_confirmation: e.target.value })}
                  className="input-field" placeholder="Re-enter password" />
              </div>

              <button type="submit" disabled={regLoading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
                {regLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><UserPlus className="w-4 h-4" /> Create Account</>
                )}
              </button>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <button type="button" onClick={switchToLogin} className="text-emerald-600 hover:text-emerald-700 font-semibold">
                  Sign In
                </button>
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
