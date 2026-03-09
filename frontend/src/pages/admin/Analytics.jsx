import { PageHeader, StatsCard } from '../../components/ui';
import { BarChart3, TrendingUp, Users, Calendar, Clock, Award } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts';

// Analytics data – A.Y. 2025-2026
const monthlyData = [
  { month: 'Sep', events: 9, attendance: 2870 },
  { month: 'Oct', events: 14, attendance: 4615 },
  { month: 'Nov', events: 11, attendance: 3942 },
  { month: 'Dec', events: 6, attendance: 1738 },
  { month: 'Jan', events: 16, attendance: 5283 },
  { month: 'Feb', events: 18, attendance: 6491 },
  { month: 'Mar', events: 4, attendance: 1527 },
];

const topEvents = [
  { name: 'University Foundation Day & Homecoming', attendance: 1487, rate: 94 },
  { name: 'SSG General Assembly: 2nd Semester', attendance: 1103, rate: 91 },
  { name: 'Intramurals 2026 – Opening Ceremony', attendance: 938, rate: 87 },
  { name: 'CIT Week 2026: Opening Ceremony', attendance: 724, rate: 84 },
  { name: 'Parangal: Academic Honors Convocation', attendance: 561, rate: 81 },
];

const methodDistribution = [
  { method: 'Face Recognition', count: 43, percentage: 49 },
  { method: 'RFID', count: 31, percentage: 36 },
  { method: 'Manual', count: 13, percentage: 15 },
];

const PIE_COLORS = ['#10b981', '#059669', '#6ee7b7'];

const peakHoursData = [
  { time: '7-9 AM', count: 5340 },
  { time: '9-12 PM', count: 9125 },
  { time: '12-2 PM', count: 2760 },
  { time: '2-5 PM', count: 6814 },
  { time: '5-8 PM', count: 4702 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur border border-emerald-200 dark:border-slate-700 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-900 dark:text-white mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <strong>{entry.value.toLocaleString()}</strong>
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="System Analytics"
        description="Comprehensive analytics and insights for event management performance."
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Events This Semester" value="78" change="12%" changeType="increase" icon={Calendar} />
        <StatsCard title="Avg. Attendance Rate" value="79.3%" change="2.8%" changeType="increase" icon={TrendingUp} />
        <StatsCard title="Peak Month" value="Feb 2026" icon={Award} />
        <StatsCard title="Active Students" value="2,406" change="6%" changeType="increase" icon={Users} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Attendance Area Chart */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-6">Monthly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="attendance" name="Attendance" stroke="#10b981" strokeWidth={2.5} fill="url(#colorAttendance)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Method Distribution – Pie Chart */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-6">Attendance Method Distribution</h3>
          <div className="flex items-center justify-center gap-6">
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie
                  data={methodDistribution}
                  dataKey="percentage"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  strokeWidth={0}
                >
                  {methodDistribution.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value}%`, name]}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-4">
              {methodDistribution.map((m, i) => (
                <div key={m.method} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{m.percentage}%</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{m.method}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Events – Horizontal Bar Chart */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-6">Top Events by Attendance</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topEvents} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="attendance" name="Attendance" fill="#10b981" radius={[0, 6, 6, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Hours – Bar Chart */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-6">Peak Attendance Hours</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={peakHoursData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Check-ins" fill="url(#colorPeak)" radius={[6, 6, 0, 0]} barSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
