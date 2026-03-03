import { PageHeader, StatsCard } from '../../components/ui';
import { BarChart3, TrendingUp, Users, Calendar, Clock, Award } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts';

// Mock analytics data
const monthlyData = [
  { month: 'Sep', events: 12, attendance: 3200 },
  { month: 'Oct', events: 18, attendance: 5100 },
  { month: 'Nov', events: 15, attendance: 4300 },
  { month: 'Dec', events: 8, attendance: 2100 },
  { month: 'Jan', events: 20, attendance: 6400 },
  { month: 'Feb', events: 22, attendance: 7200 },
  { month: 'Mar', events: 5, attendance: 1800 },
];

const topEvents = [
  { name: 'University Foundation Day', attendance: 1250, rate: 96 },
  { name: 'Student Council Election', attendance: 890, rate: 92 },
  { name: 'Inter-College Sports Fest', attendance: 780, rate: 88 },
  { name: 'Cultural Night', attendance: 650, rate: 85 },
  { name: 'Academic Excellence Awards', attendance: 520, rate: 82 },
];

const methodDistribution = [
  { method: 'Face Recognition', count: 78, percentage: 50 },
  { method: 'RFID', count: 54, percentage: 35 },
  { method: 'Manual', count: 24, percentage: 15 },
];

const PIE_COLORS = ['#8B42FF', '#3366FF', '#94a3b8'];

const peakHoursData = [
  { time: '7-9 AM', count: 4200 },
  { time: '9-12 PM', count: 8900 },
  { time: '12-2 PM', count: 3100 },
  { time: '2-5 PM', count: 7400 },
  { time: '5-8 PM', count: 5600 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-900 mb-1">{label}</p>
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
        <StatsCard title="Events This Semester" value="100" change="15%" changeType="increase" icon={Calendar} />
        <StatsCard title="Avg. Attendance Rate" value="77.5%" change="3.2%" changeType="increase" icon={TrendingUp} />
        <StatsCard title="Peak Month" value="Feb 2026" icon={Award} />
        <StatsCard title="Active Students" value="2,124" change="8%" changeType="increase" icon={Users} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Attendance Area Chart */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-6">Monthly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3366FF" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3366FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="attendance" name="Attendance" stroke="#3366FF" strokeWidth={2.5} fill="url(#colorAttendance)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Method Distribution – Pie Chart */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-6">Attendance Method Distribution</h3>
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
                    <p className="text-sm font-semibold text-slate-900">{m.percentage}%</p>
                    <p className="text-xs text-slate-500">{m.method}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Events – Horizontal Bar Chart */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-6">Top Events by Attendance</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topEvents} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="attendance" name="Attendance" fill="#3366FF" radius={[0, 6, 6, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Hours – Bar Chart */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-6">Peak Attendance Hours</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={peakHoursData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
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
