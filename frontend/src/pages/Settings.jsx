import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/ui';
import { cn } from '../lib/utils';
import {
  Settings as SettingsIcon, Bell, MapPin, Shield, Globe,
  CreditCard, ScanFace, Save, Loader2, CheckCircle,
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Notification settings */
  const [notifications, setNotifications] = useState({
    eventReminders: true,
    checkInAlerts: true,
    enrollmentUpdates: true,
    systemAnnouncements: false,
  });

  /* Geofence settings (admin only) */
  const [geofence, setGeofence] = useState({
    enabled: true,
    latitude: '12.7478',
    longitude: '121.4732',
    radius: '500',
  });

  /* Attendance settings (admin only) */
  const [attendance, setAttendance] = useState({
    defaultMethod: 'face_recognition',
    allowMultipleMethods: true,
    locationRequired: true,
    rfidEnabled: true,
    faceEnabled: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Settings"
        description={isAdmin ? 'Configure system-wide and personal settings.' : 'Manage your notification preferences.'}
      />

      <form onSubmit={handleSave} className="max-w-3xl mx-auto space-y-6">
        {/* Notification Preferences */}
        <div className="card p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600" />Notification Preferences
          </h3>
          <div className="space-y-3">
            {[
              { key: 'eventReminders', label: 'Event Reminders', desc: 'Get notified before events you registered for' },
              { key: 'checkInAlerts', label: 'Check-In Alerts', desc: 'Receive alerts when check-in is available' },
              { key: 'enrollmentUpdates', label: 'Enrollment Updates', desc: 'Get notified about facial enrollment status changes' },
              { key: 'systemAnnouncements', label: 'System Announcements', desc: 'Receive general system announcements' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification(item.key)}
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors duration-200 relative',
                    notifications[item.key] ? 'bg-emerald-500' : 'bg-slate-300'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-sm',
                    notifications[item.key] && 'translate-x-5'
                  )} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Geofence Configuration (Admin only) */}
        {isAdmin && (
          <div className="card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />Campus Geofence Configuration
            </h3>
            <p className="text-xs text-slate-500">
              Configure the campus geofence to restrict check-in to within the campus boundary.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                <input
                  type="text"
                  value={geofence.latitude}
                  onChange={(e) => setGeofence((p) => ({ ...p, latitude: e.target.value }))}
                  className="input-field font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                <input
                  type="text"
                  value={geofence.longitude}
                  onChange={(e) => setGeofence((p) => ({ ...p, longitude: e.target.value }))}
                  className="input-field font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Radius (meters)</label>
                <input
                  type="number"
                  value={geofence.radius}
                  onChange={(e) => setGeofence((p) => ({ ...p, radius: e.target.value }))}
                  className="input-field text-sm"
                  min={100}
                  max={5000}
                />
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-900">Enforce Geofence</p>
                <p className="text-xs text-slate-500">Require location verification during check-in</p>
              </div>
              <button
                type="button"
                onClick={() => setGeofence((p) => ({ ...p, enabled: !p.enabled }))}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors duration-200 relative',
                  geofence.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-sm',
                  geofence.enabled && 'translate-x-5'
                )} />
              </button>
            </div>
          </div>
        )}

        {/* Attendance Methods (Admin only) */}
        {isAdmin && (
          <div className="card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />Attendance Configuration
            </h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Default Attendance Method</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'face_recognition', label: 'Face Recognition', icon: ScanFace },
                  { value: 'rfid', label: 'RFID', icon: CreditCard },
                  { value: 'manual', label: 'Manual', icon: Globe },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setAttendance((p) => ({ ...p, defaultMethod: method.value }))}
                    className={cn(
                      'border-2 rounded-xl p-3 text-center transition-all',
                      attendance.defaultMethod === method.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <method.icon className={cn(
                      'w-6 h-6 mx-auto mb-1',
                      attendance.defaultMethod === method.value ? 'text-emerald-600' : 'text-slate-400'
                    )} />
                    <p className="text-xs font-medium text-slate-900">{method.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {[
                { key: 'allowMultipleMethods', label: 'Allow Multiple Methods', desc: 'Let organizers choose from multiple attendance methods per event' },
                { key: 'locationRequired', label: 'Require Location', desc: 'Enforce campus geofence during all check-ins' },
                { key: 'rfidEnabled', label: 'Enable RFID', desc: 'Allow RFID-based attendance tracking system-wide' },
                { key: 'faceEnabled', label: 'Enable Face Recognition', desc: 'Allow facial recognition-based attendance' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttendance((p) => ({ ...p, [item.key]: !p[item.key] }))}
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors duration-200 relative',
                      attendance[item.key] ? 'bg-emerald-500' : 'bg-slate-300'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-sm',
                      attendance[item.key] && 'translate-x-5'
                    )} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <CheckCircle className="w-4 h-4" />Settings saved
            </span>
          )}
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
