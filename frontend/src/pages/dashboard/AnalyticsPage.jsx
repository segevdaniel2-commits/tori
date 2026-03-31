import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, Calendar, DollarSign, Download, Loader2 } from 'lucide-react';
import { useAnalyticsApi } from '../../hooks/useApi';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const COLORS = ['#7c3aed', '#f43f5e', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

function StatCard({ title, value, subtitle, icon: Icon, color = 'tori', loading }) {
  const colorMap = {
    tori: { bg: 'bg-tori-50', icon: 'text-tori-600', border: 'border-tori-100' },
    coral: { bg: 'bg-red-50', icon: 'text-coral-500', border: 'border-red-100' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-100' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' },
  };
  const c = colorMap[color] || colorMap.tori;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl p-4 sm:p-6 border ${c.border} shadow-sm`}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <span className="text-gray-600 text-sm font-medium">{title}</span>
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon size={18} className={c.icon} />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse" />
      ) : (
        <div className="text-3xl font-black text-gray-900">{value}</div>
      )}
      {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-right">
        <p className="text-gray-600 text-xs mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="font-bold" style={{ color: entry.color }}>
            {entry.name}: {entry.name.includes('הכנסות') || entry.name === 'revenue' ? `₪${entry.value?.toLocaleString()}` : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const analyticsApi = useAnalyticsApi();

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsApi.overview().then(r => r.data),
    refetchInterval: 60000,
  });

  const { data: dailyRevenue = [], isLoading: loadingDaily } = useQuery({
    queryKey: ['analytics-daily', days],
    queryFn: () => analyticsApi.dailyRevenue(days).then(r => r.data),
  });

  const { data: popularServices = [] } = useQuery({
    queryKey: ['analytics-services'],
    queryFn: () => analyticsApi.popularServices().then(r => r.data),
  });

  const { data: peakHours = [] } = useQuery({
    queryKey: ['analytics-hours'],
    queryFn: () => analyticsApi.peakHours().then(r => r.data),
  });

  const { data: monthlyReport } = useQuery({
    queryKey: ['analytics-monthly', month],
    queryFn: () => analyticsApi.monthlyReport(month).then(r => r.data),
  });

  const revenueData = dailyRevenue.map(d => ({
    date: format(new Date(d.date + 'T00:00:00'), 'd/M'),
    revenue: d.revenue,
    תורים: d.appointments,
  }));

  const servicesData = popularServices.slice(0, 6).map(s => ({
    name: s.name,
    count: s.count,
    revenue: s.revenue,
  }));

  const hoursData = peakHours.map(h => ({
    hour: `${h.hour}:00`,
    count: h.count,
  }));

  function downloadReport() {
    if (!monthlyReport) return;
    const rows = [
      ['שם לקוח', 'שירות', 'עובד', 'תאריך', 'שעה', 'מחיר', 'סטטוס'],
      ...(monthlyReport.appointments || []).map(a => [
        a.customer_name || '',
        a.service_name || '',
        a.staff_name || '',
        a.starts_at.split('T')[0],
        a.starts_at.split('T')[1]?.slice(0, 5) || '',
        a.price || 0,
        a.status,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tori-report-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900">אנליטיקות</h2>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="form-input w-36 sm:w-40 text-sm py-2"
          />
          <button
            onClick={downloadReport}
            className="btn-secondary text-sm py-2 px-3 sm:px-4"
          >
            <Download size={15} />
            <span className="hidden sm:inline">ייצא Excel</span>
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="הכנסות החודש"
          value={overview ? `₪${overview.monthlyRevenue?.toLocaleString()}` : '-'}
          subtitle="החודש הנוכחי"
          icon={DollarSign}
          color="green"
          loading={loadingOverview}
        />
        <StatCard
          title="תורים החודש"
          value={overview?.monthlyAppointments ?? '-'}
          subtitle={`${overview?.avgPerDay ?? 0} בממוצע ליום`}
          icon={Calendar}
          color="tori"
          loading={loadingOverview}
        />
        <StatCard
          title="סה״כ לקוחות"
          value={overview?.totalCustomers ?? '-'}
          subtitle="לקוחות רשומים"
          icon={Users}
          color="amber"
          loading={loadingOverview}
        />
        <StatCard
          title="סה״כ הכנסות"
          value={overview ? `₪${overview.totalRevenue?.toLocaleString()}` : '-'}
          subtitle="מאז ההקמה"
          icon={TrendingUp}
          color="coral"
          loading={loadingOverview}
        />
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-900 text-lg">הכנסות יומיות</h3>
          <div className="flex gap-2">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  days === d ? 'bg-tori-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d} יום
              </button>
            ))}
          </div>
        </div>
        {loadingDaily ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-tori-400" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₪${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="הכנסות" stroke="#7c3aed" fill="url(#revenueGrad)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Popular services */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-6">שירותים פופולריים</h3>
          {servicesData.length === 0 ? (
            <div className="text-center text-gray-400 py-8">אין נתונים עדיין</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={servicesData} layout="vertical" margin={{ right: 20, left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="כמות" radius={[0, 6, 6, 0]}>
                  {servicesData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Peak hours */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-6">שעות עמוסות</h3>
          {hoursData.length === 0 ? (
            <div className="text-center text-gray-400 py-8">אין נתונים עדיין</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hoursData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="תורים" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Monthly summary */}
      {monthlyReport && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-4">סיכום חודשי: {month}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'סה״כ תורים', value: monthlyReport.summary.total },
              { label: 'הושלמו', value: monthlyReport.summary.completed },
              { label: 'הכנסות', value: `₪${monthlyReport.summary.revenue?.toLocaleString()}` },
              { label: 'לקוחות חדשים', value: monthlyReport.newCustomers },
            ].map((s, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-gray-900">{s.value}</div>
                <div className="text-gray-500 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
