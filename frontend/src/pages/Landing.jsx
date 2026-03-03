import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/ui';
import { CalendarCheck, Users, ScanFace, Shield, BarChart3, Zap, ArrowRight, Eye, EyeOff, LogIn, UserPlus, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Landing() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, error: authError } = useAuth();

  // Modal state: null | 'login' | 'register'
  const [authModal, setAuthModal] = useState(null);

  // Auto-open modal when redirected with state (e.g. from Guards)
  useEffect(() => {
    if (location.state?.authModal) {
      setAuthModal(location.state.authModal);
      // Clear the state so refreshing doesn't re-open
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // ── Login form state ──
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginShowPw, setLoginShowPw] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // ── Register form state ──
  const [regForm, setRegForm] = useState({ name: '', email: '', student_id: '', password: '', password_confirmation: '' });
  const [regShowPw, setRegShowPw] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regValidation, setRegValidation] = useState({});

  const dashboardMap = { admin: '/admin', organizer: '/organizer', student: '/student' };

  const resetLoginForm = () => { setLoginForm({ email: '', password: '' }); setLoginError(''); setLoginShowPw(false); };
  const resetRegForm = () => { setRegForm({ name: '', email: '', student_id: '', password: '', password_confirmation: '' }); setRegError(''); setRegValidation({}); setRegShowPw(false); };

  const openLogin = () => { resetLoginForm(); setAuthModal('login'); };
  const openRegister = () => { resetRegForm(); setAuthModal('register'); };
  const closeModal = () => { setAuthModal(null); };

  const switchToRegister = () => { resetRegForm(); setAuthModal('register'); };
  const switchToLogin = () => { resetLoginForm(); setAuthModal('login'); };

  // ── Handlers ──
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const user = await login(loginForm);
      closeModal();
      navigate(dashboardMap[user.role] || '/');
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid credentials. Please try again.');
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
      if (err.response?.data?.errors) {
        setRegValidation(err.response.data.errors);
      } else {
        setRegError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setRegLoading(false);
    }
  };

  const regFieldError = (field) => regValidation[field] ? <p className="text-xs text-rose-600 mt-1">{regValidation[field][0]}</p> : null;

  const features = [
    { icon: ScanFace, title: 'Facial Recognition', description: 'Automated attendance verification using ML-based facial recognition technology.', gradient: 'from-violet-500 to-purple-600' },
    { icon: Shield, title: 'Role-Based Access', description: 'Secure system with Admin, Organizer, and Student role-based access control.', gradient: 'from-blue-500 to-indigo-600' },
    { icon: BarChart3, title: 'Real-Time Analytics', description: 'Live attendance dashboards with instant updates and comprehensive reporting.', gradient: 'from-emerald-500 to-teal-600' },
    { icon: Zap, title: 'Multiple Check-In', description: 'Face recognition, RFID scanning, and manual verification for maximum reliability.', gradient: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center shadow-primary">
                <CalendarCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">U-EventTrack</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={openLogin} className="text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-all duration-200">Sign In</button>
              <button onClick={openRegister} className="btn-primary text-sm">Get Started</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/80 via-white to-accent-50/50" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary-100/40 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-accent-100/30 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-36">
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 rounded-full px-4 py-2 text-sm font-semibold mb-8 ring-1 ring-primary-200/50">
              <Sparkles className="w-4 h-4" />
              University Student Government
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              Smart Event Tracking
              <br />
              with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">
                Facial Recognition
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Modernize your university event attendance management with role-based access control,
              real-time monitoring, and ML-powered facial recognition.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={openRegister} className="btn-primary text-base px-8 py-3.5 flex items-center gap-2 shadow-primary-lg">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={openLogin} className="btn-secondary text-base px-8 py-3.5">
                Sign In
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-24 grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto animate-slide-up">
            {[
              { label: 'Active Users', value: '2,500+' },
              { label: 'Events Tracked', value: '350+' },
              { label: 'Attendance Logs', value: '45,000+' },
              { label: 'Accuracy Rate', value: '99.2%' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 shadow-sm">
                <p className="text-3xl font-bold bg-gradient-to-r from-primary-700 to-accent-700 text-transparent bg-clip-text">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Everything You Need</h2>
            <p className="text-slate-500 mt-3 max-w-2xl mx-auto text-lg">
              A comprehensive event tracking system designed for university student governments.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="card-hover p-6 group">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Built for Every Role</h2>
            <p className="text-slate-500 mt-3 text-lg">Three carefully designed user experiences.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                role: 'USG Admin',
                icon: Shield,
                color: 'from-violet-500 to-purple-700',
                features: ['Manage user accounts', 'Monitor all events', 'View consolidated reports', 'System analytics & logs'],
              },
              {
                role: 'Event Organizer',
                icon: CalendarCheck,
                color: 'from-primary-500 to-primary-700',
                features: ['Create & configure events', 'Set attendance methods', 'Real-time monitoring', 'Generate reports'],
              },
              {
                role: 'Student',
                icon: Users,
                color: 'from-emerald-500 to-emerald-700',
                features: ['Facial enrollment', 'View upcoming events', 'Live check-in', 'Attendance history'],
              },
            ].map((item) => (
              <div key={item.role} className="card-hover overflow-hidden group">
                <div className={`bg-gradient-to-br ${item.color} px-6 py-8 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <item.icon className="w-10 h-10 mb-3 text-white/90 relative z-10" />
                  <h3 className="text-xl font-bold relative z-10">{item.role}</h3>
                </div>
                <ul className="p-6 space-y-3">
                  {item.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Ready to Transform Event Management?</h2>
          <p className="text-primary-200 mt-4 text-lg">
            Join universities modernizing their student event attendance tracking.
          </p>
          <button
            onClick={openRegister}
            className="mt-10 inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <CalendarCheck className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">U-EventTrack</span>
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} U-EventTrack. University Student Government. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ═══════════ LOGIN MODAL ═══════════ */}
      <Modal open={authModal === 'login'} onClose={closeModal} title="Welcome Back" size="sm">
        <form onSubmit={handleLogin} className="space-y-5">
          {(loginError || authError) && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl p-3.5">
              {loginError || authError}
            </div>
          )}

          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
            <input
              id="login-email"
              type="email"
              required
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              className="input-field"
              placeholder="you@university.edu"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                id="login-password"
                type={loginShowPw ? 'text' : 'password'}
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="input-field pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setLoginShowPw(!loginShowPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {loginShowPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4 text-primary-600 rounded-md border-slate-300 focus:ring-primary-500" />
              <span className="text-sm text-slate-600">Remember me</span>
            </label>
          </div>

          <button type="submit" disabled={loginLoading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            {loginLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><LogIn className="w-4 h-4" /> Sign In</>
            )}
          </button>

          <p className="text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <button type="button" onClick={switchToRegister} className="text-primary-600 hover:text-primary-700 font-semibold">
              Create Account
            </button>
          </p>
        </form>
      </Modal>

      {/* ═══════════ REGISTER MODAL ═══════════ */}
      <Modal open={authModal === 'register'} onClose={closeModal} title="Create Account" size="sm">
        <form onSubmit={handleRegister} className="space-y-4">
          {(regError || authError) && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl p-3.5">
              {regError || authError}
            </div>
          )}

          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input id="reg-name" type="text" required value={regForm.name}
              onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
              className="input-field" placeholder="Juan Dela Cruz" />
            {regFieldError('name')}
          </div>

          <div>
            <label htmlFor="reg-student-id" className="block text-sm font-medium text-slate-700 mb-1.5">Student ID</label>
            <input id="reg-student-id" type="text" required value={regForm.student_id}
              onChange={(e) => setRegForm({ ...regForm, student_id: e.target.value })}
              className="input-field" placeholder="2024-00001" />
            {regFieldError('student_id')}
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1.5">University Email</label>
            <input id="reg-email" type="email" required value={regForm.email}
              onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
              className="input-field" placeholder="you@university.edu" />
            {regFieldError('email')}
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <input id="reg-password" type={regShowPw ? 'text' : 'password'} required minLength={8}
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                className="input-field pr-10" placeholder="Minimum 8 characters" />
              <button type="button" onClick={() => setRegShowPw(!regShowPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {regShowPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {regFieldError('password')}
          </div>

          <div>
            <label htmlFor="reg-pw-confirm" className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
            <input id="reg-pw-confirm" type={regShowPw ? 'text' : 'password'} required
              value={regForm.password_confirmation}
              onChange={(e) => setRegForm({ ...regForm, password_confirmation: e.target.value })}
              className="input-field" placeholder="Re-enter your password" />
          </div>

          <button type="submit" disabled={regLoading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            {regLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><UserPlus className="w-4 h-4" /> Create Account</>
            )}
          </button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <button type="button" onClick={switchToLogin} className="text-primary-600 hover:text-primary-700 font-semibold">
              Sign In
            </button>
          </p>
        </form>
      </Modal>
    </div>
  );
}
