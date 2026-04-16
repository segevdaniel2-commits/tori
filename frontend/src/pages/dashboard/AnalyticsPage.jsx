import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, Calendar, DollarSign, Download, Loader2, ChevronRight, ChevronLeft, EyeOff } from 'lucide-react';
import { useAnalyticsApi } from '../../hooks/useApi';
import { useAuthStore } from '../../store/useStore';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const MONTH_NAMES = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];

function useNightMode() {
  const [isNight, setIsNight] = useState(() => { const h = new Date().getHours(); return h >= 20 || h < 6; });
  useEffect(() => {
    const id = setInterval(() => { const h = new Date().getHours(); setIsNight(h >= 20 || h < 6); }, 60000);
    return () => clearInterval(id);
  }, []);
  return isNight;
}

function MonthPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => parseInt(value.split('-')[0]));
  const ref = useRef(null);

  const curYear  = parseInt(value.split('-')[0]);
  const curMonth = parseInt(value.split('-')[1]) - 1;

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function select(monthIdx) {
    const m = String(monthIdx + 1).padStart(2, '0');
    onChange(`${viewYear}-${m}`);
    setOpen(false);
  }

  const displayLabel = (() => {
    const [y, m] = value.split('-');
    return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
  })();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(o => !o); setViewYear(curYear); }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-all"
      >
        <Calendar size={15} className="text-[#f43f5e]" />
        {displayLabel}
        <ChevronLeft size={14} className={`text-gray-500 transition-transform ${open ? 'rotate-90' : '-rotate-90'}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 z-50 w-64 rounded-2xl bg-[#0d1117] border border-white/10 shadow-2xl shadow-black/50 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setViewYear(y => y - 1)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <ChevronRight size={16} />
              </button>
              <span className="text-white font-bold text-sm">{viewYear}</span>
              <button onClick={() => setViewYear(y => y + 1)}
                disabled={viewYear >= new Date().getFullYear()}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {MONTH_NAMES.map((name, i) => {
                const isSelected = viewYear === curYear && i === curMonth;
                const isFuture = viewYear > new Date().getFullYear() ||
                  (viewYear === new Date().getFullYear() && i > new Date().getMonth());
                return (
                  <button key={i} onClick={() => select(i)} disabled={isFuture}
                    className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                      isSelected ? 'bg-gradient-to-r from-[#f97316] via-[#f43f5e] to-[#06b6d4] text-white' :
                      isFuture ? 'text-gray-700 cursor-not-allowed' :
                      'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}>
                    {name}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-white/[0.06] mt-3 pt-3 flex justify-between">
              <button onClick={() => { const now = new Date(); setViewYear(now.getFullYear()); onChange(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`); setOpen(false); }}
                className="text-xs text-[#f43f5e] hover:text-[#f97316] font-semibold transition-colors">
                החודש הנוכחי
              </button>
              <button onClick={() => setOpen(false)} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">סגור</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color = 'orange', loading, isNight }) {
  const iconColor = { orange: '#f97316', coral: '#f43f5e', cyan: '#06b6d4', green: '#10b981' }[color] || '#f97316';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold uppercase tracking-wide ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>{title}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: isNight ? 'rgba(255,255,255,0.07)' : `${iconColor}18` }}>
          <Icon size={15} style={{ color: iconColor }} />
        </div>
      </div>
      {loading ? (
        <div className="h-7 w-20 bg-gray-100 rounded-lg animate-pulse" />
      ) : (
        <div className={`text-2xl font-black ${isNight ? 'text-white' : 'text-gray-900'}`}>{value}</div>
      )}
      {subtitle && <p className={`text-xs mt-0.5 ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>{subtitle}</p>}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label, isNight }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-right"
        style={{ background: isNight ? '#1a1a2e' : '#fff', borderColor: isNight ? 'rgba(255,255,255,0.1)' : '#f1f5f9' }}>
        <p className="text-xs mb-1" style={{ color: isNight ? 'rgba(255,255,255,0.5)' : '#94a3b8' }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="font-bold text-sm" style={{ color: entry.color }}>
            {entry.name === 'revenue' || entry.name === 'הכנסות' ? `₪${entry.value?.toLocaleString()}` : entry.value}
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
  const { business } = useAuthStore();
  const hideStats = !!(business?.hide_stats);
  const isNight = useNightMode();

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsApi.overview().then(r => r.data),
    refetchInterval: 60000,
  });

  const { data: dailyRevenue = [], isLoading: loadingDaily } = useQuery({
    queryKey: ['analytics-daily', days],
    queryFn: () => analyticsApi.dailyRevenue(days).then(r => r.data),
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
  }));

  const hoursData = peakHours.map(h => ({ hour: `${h.hour}:00`, count: h.count }));

  const axisColor = isNight ? 'rgba(255,255,255,0.25)' : '#94a3b8';
  const gridColor = isNight ? 'rgba(255,255,255,0.04)' : 'transparent';

  function downloadReport() {
    if (!monthlyReport) return;
    const rows = [
      ['שם לקוח', 'שירות', 'עובד', 'תאריך', 'שעה', 'מחיר', 'סטטוס'],
      ...(monthlyReport.appointments || []).map(a => [
        a.customer_name || '', a.service_name || '', a.staff_name || '',
        a.starts_at.split('T')[0], a.starts_at.split('T')[1]?.slice(0, 5) || '',
        a.price || 0, a.status,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `tori-report-${month}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (hideStats) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center select-none" dir="rtl">
        <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-5">
          <EyeOff size={36} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-black text-gray-300 mb-2">הנתונים מוסתרים</h2>
        <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
          הסתרת נתוני הכנסות ולקוחות מופעלת.<br />
          לשינוי: <span className="text-gray-500 font-semibold">הגדרות → כללי → הסתר נתוני הכנסות</span>
        </p>
      </div>
    );
  }

  // Appointment status data
  const completed = monthlyReport?.summary?.completed ?? 0;
  const cancelled = monthlyReport?.summary?.cancelled ?? 0;
  const total     = monthlyReport?.summary?.total     ?? 0;
  const pending   = Math.max(0, total - completed - cancelled);
  const pieData = [
    { name: 'הושלמו',  value: completed, color: '#10b981' },
    { name: 'ממתינים', value: pending,   color: '#f97316' },
    { name: 'בוטלו',   value: cancelled, color: '#f43f5e' },
  ].filter(d => d.value > 0);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5 pb-28 sm:pb-6" dir="rtl">

      {/* Page header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className={`text-xl sm:text-2xl font-black ${isNight ? 'text-white' : 'text-gray-900'}`}>אנליטיקות</h2>
        <div className="flex items-center gap-2">
          <MonthPicker value={month} onChange={setMonth} />
          <button onClick={downloadReport} className="btn-secondary text-sm py-2 px-3 sm:px-4">
            <Download size={15} />
            <span className="hidden sm:inline">ייצא Excel</span>
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard isNight={isNight} title="סה״כ הכנסות"  value={hideStats ? '••••' : overview ? `₪${overview.totalRevenue?.toLocaleString()}` : '-'} subtitle="מאז ההקמה"                icon={TrendingUp} color="coral"  loading={loadingOverview} />
        <StatCard isNight={isNight} title="סה״כ לקוחות"  value={hideStats ? '••••' : overview?.totalCustomers ?? '-'}                                                                      subtitle="לקוחות רשומים"           icon={Users}      color="cyan"   loading={loadingOverview} />
        <StatCard isNight={isNight} title="תורים החודש"  value={overview?.monthlyAppointments ?? '-'}                                                                                      subtitle={`${overview?.avgPerDay ?? 0} בממוצע ליום`} icon={Calendar}   color="orange" loading={loadingOverview} />
        <StatCard isNight={isNight} title="הכנסות החודש" value={hideStats ? '••••' : overview ? `₪${overview.monthlyRevenue?.toLocaleString()}` : '-'}                                     subtitle="החודש הנוכחי"            icon={DollarSign} color="green"  loading={loadingOverview} />
      </div>

      {/* Daily revenue chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className={`font-bold text-base ${isNight ? 'text-white' : 'text-gray-900'}`}>הכנסות יומיות</h3>
          <div className="flex gap-1.5">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  days === d ? 'bg-gradient-to-r from-[#f97316] to-[#f43f5e] text-white' :
                  isNight ? 'bg-white/[0.06] text-gray-400 hover:bg-white/10 hover:text-white' :
                  'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {d} יום
              </button>
            ))}
          </div>
        </div>
        {loadingDaily ? (
          <div className="h-56 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-[#f43f5e]" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f43f5e" stopOpacity={isNight ? 0.25 : 0.18} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} tickFormatter={v => `₪${v}`} width={48} />
              <Tooltip content={<CustomTooltip isNight={isNight} />} />
              <Area type="monotone" dataKey="revenue" name="הכנסות" stroke="#f43f5e" fill="url(#revenueGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom row: status + hours */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">

        {/* Appointment status + monthly summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className={`font-bold text-base mb-5 ${isNight ? 'text-white' : 'text-gray-900'}`}>
            סטטוס תורים — {MONTH_NAMES[parseInt(month.split('-')[1]) - 1]} {month.split('-')[0]}
          </h3>

          {total === 0 ? (
            <div className={`text-center py-10 text-sm ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>אין נתונים עדיין</div>
          ) : (
            <>
              <div className="flex items-center gap-6">
                {/* Pie */}
                <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={72}
                        paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip content={({ active, payload }) =>
                        active && payload?.[0] ? (
                          <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-right"
                            style={{ background: isNight ? '#1a1a2e' : '#fff' }}>
                            <span className="text-sm font-bold" style={{ color: payload[0].payload.color }}>
                              {payload[0].name}: {payload[0].value}
                            </span>
                          </div>
                        ) : null
                      } />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-3">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className={`text-sm font-medium ${isNight ? 'text-gray-300' : 'text-gray-600'}`}>{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className={`text-base font-black ${isNight ? 'text-white' : 'text-gray-900'}`}>{d.value}</span>
                        <span className={`text-xs w-8 text-left ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>
                          {Math.round((d.value / total) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className={`pt-2.5 border-t flex justify-between items-center ${isNight ? 'border-white/[0.07]' : 'border-gray-100'}`}>
                    <span className={`text-xs font-medium ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>סה״כ תורים</span>
                    <span className={`text-lg font-black ${isNight ? 'text-white' : 'text-gray-800'}`}>{total}</span>
                  </div>
                </div>
              </div>

              {/* Monthly summary strip */}
              {monthlyReport && (
                <div className={`mt-4 pt-4 border-t grid grid-cols-2 gap-3 ${isNight ? 'border-white/[0.07]' : 'border-gray-100'}`}>
                  {[
                    { label: 'הכנסות החודש', value: `₪${monthlyReport.summary.revenue?.toLocaleString() || 0}`, color: '#f43f5e' },
                    { label: 'לקוחות חדשים', value: monthlyReport.newCustomers ?? 0, color: '#06b6d4' },
                  ].map((s, i) => (
                    <div key={i} className={`rounded-xl p-3 ${isNight ? 'bg-white/[0.04]' : 'bg-gray-50'}`}>
                      <div className={`text-xs mb-1 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</div>
                      <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Peak hours */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className={`font-bold text-base mb-5 ${isNight ? 'text-white' : 'text-gray-900'}`}>שעות עמוסות</h3>
          {hoursData.length === 0 ? (
            <div className={`text-center py-10 text-sm ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>אין נתונים עדיין</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hoursData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                <Tooltip content={<CustomTooltip isNight={isNight} />} />
                <Bar dataKey="count" name="תורים" fill="#f43f5e"
                  radius={[5, 5, 0, 0]}
                  fillOpacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
}
