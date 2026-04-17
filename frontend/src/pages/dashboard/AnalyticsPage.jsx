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

const MONTH_NAMES      = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
const MONTH_NAMES_FULL = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

function useNightMode() {
  const [isNight, setIsNight] = useState(() => { const h = new Date().getHours(); return h >= 20 || h < 6; });
  useEffect(() => {
    const id = setInterval(() => { const h = new Date().getHours(); setIsNight(h >= 20 || h < 6); }, 60000);
    return () => clearInterval(id);
  }, []);
  return isNight;
}

function MonthPicker({ value, onChange, isNight }) {
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
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
          isNight
            ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50 shadow-sm'
        }`}
      >
        <Calendar size={15} className="text-[#f43f5e]" />
        {displayLabel}
        <ChevronLeft size={14} className={`transition-transform ${isNight ? 'text-gray-500' : 'text-gray-400'} ${open ? 'rotate-90' : '-rotate-90'}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`absolute left-0 top-full mt-2 z-50 w-64 rounded-2xl shadow-2xl p-4 border ${
              isNight
                ? 'bg-[#0d1117] border-white/10 shadow-black/50'
                : 'bg-white border-gray-200 shadow-gray-200/80'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setViewYear(y => y - 1)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  isNight ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900'
                }`}>
                <ChevronRight size={16} />
              </button>
              <span className={`font-bold text-sm ${isNight ? 'text-white' : 'text-gray-900'}`}>{viewYear}</span>
              <button onClick={() => setViewYear(y => y + 1)}
                disabled={viewYear >= new Date().getFullYear()}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  isNight ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900'
                }`}>
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
                      isSelected
                        ? 'bg-gradient-to-r from-[#f97316] via-[#f43f5e] to-[#06b6d4] text-white'
                        : isFuture
                          ? (isNight ? 'text-gray-700 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed')
                          : (isNight ? 'text-gray-300 hover:bg-white/10 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
                    }`}>
                    {name}
                  </button>
                );
              })}
            </div>
            <div className={`border-t mt-3 pt-3 flex justify-between ${isNight ? 'border-white/[0.06]' : 'border-gray-100'}`}>
              <button
                onClick={() => {
                  const now = new Date();
                  setViewYear(now.getFullYear());
                  onChange(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
                  setOpen(false);
                }}
                className="text-xs text-[#f43f5e] hover:text-[#f97316] font-semibold transition-colors">
                החודש הנוכחי
              </button>
              <button onClick={() => setOpen(false)}
                className={`text-xs font-medium transition-colors ${isNight ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}>
                סגור
              </button>
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
      className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-semibold uppercase tracking-wide ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>{title}</span>
        <div className="w-7 h-7 rounded-xl flex items-center justify-center"
          style={{ background: isNight ? 'rgba(255,255,255,0.07)' : `${iconColor}18` }}>
          <Icon size={14} style={{ color: iconColor }} />
        </div>
      </div>
      {loading ? (
        <div className="h-6 w-20 bg-gray-100 rounded-lg animate-pulse" />
      ) : (
        <div className={`text-xl font-black ${isNight ? 'text-white' : 'text-gray-900'}`}>{value}</div>
      )}
      {subtitle && <p className={`text-xs mt-0.5 ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>{subtitle}</p>}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label, isNight }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl shadow-lg p-3 text-right"
        style={{
          background: isNight ? '#1a1a2e' : '#fff',
          border: `1px solid ${isNight ? 'rgba(255,255,255,0.1)' : '#f1f5f9'}`,
        }}>
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

  // ── PDF via styled print window ──────────────────────────────────────
  function downloadPDF() {
    const s = monthlyReport?.summary || {};
    const monthLabel = `${MONTH_NAMES_FULL[parseInt(month.split('-')[1]) - 1]} ${month.split('-')[0]}`;
    const businessName = business?.name || 'Tori';
    const pending = Math.max(0, (s.total ?? 0) - (s.completed ?? 0) - (s.cancelled ?? 0));
    const appointments = monthlyReport?.appointments || [];
    const statusMap = { completed: 'הושלם', cancelled: 'בוטל', pending: 'ממתין' };

    const rows = appointments.map(a => {
      const status = a.status === 'completed' ? 'הושלם' : a.status === 'cancelled' ? 'בוטל' : 'ממתין';
      const statusColor = a.status === 'completed' ? '#10b981' : a.status === 'cancelled' ? '#f43f5e' : '#f97316';
      return `
        <tr>
          <td>${a.customer_name || '—'}</td>
          <td>${a.service_name || '—'}</td>
          <td>${a.staff_name || '—'}</td>
          <td dir="ltr">${a.starts_at?.split('T')[0] || '—'}</td>
          <td dir="ltr">${a.starts_at?.split('T')[1]?.slice(0, 5) || '—'}</td>
          <td>₪${a.price || 0}</td>
          <td><span class="badge" style="background:${statusColor}20;color:${statusColor}">${status}</span></td>
        </tr>`;
    }).join('');

    const noRows = appointments.length === 0
      ? `<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:24px">אין תורים לחודש זה</td></tr>`
      : '';

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <title>דוח ${businessName} — ${monthLabel}</title>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Heebo', sans-serif;
      background: #f8f9fc;
      color: #1e1e28;
      padding: 0;
      direction: rtl;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #f97316 0%, #f43f5e 60%, #e8305a 100%);
      padding: 32px 40px 28px;
      color: #fff;
    }
    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .brand {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -1px;
    }
    .report-meta {
      font-size: 13px;
      opacity: 0.85;
      font-weight: 600;
    }
    .header-subtitle {
      font-size: 15px;
      opacity: 0.75;
      margin-top: 6px;
    }

    /* ── Content wrapper ── */
    .content { padding: 28px 40px 40px; }

    /* ── Section title ── */
    .section-title {
      font-size: 15px;
      font-weight: 800;
      color: #374151;
      margin-bottom: 12px;
      margin-top: 24px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 16px;
      border-radius: 2px;
      background: linear-gradient(to bottom, #f97316, #f43f5e);
    }

    /* ── KPI grid ── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 6px;
    }
    .kpi-card {
      background: #fff;
      border-radius: 12px;
      padding: 14px 16px;
      border: 1px solid #e5e7eb;
    }
    .kpi-label {
      font-size: 11px;
      color: #9ca3af;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }
    .kpi-value {
      font-size: 22px;
      font-weight: 900;
      color: #1e1e28;
    }
    .kpi-value.accent { color: #f43f5e; }
    .kpi-value.cyan   { color: #06b6d4; }
    .kpi-value.green  { color: #10b981; }
    .kpi-value.orange { color: #f97316; }

    /* ── Status summary bar ── */
    .status-bar {
      display: flex;
      gap: 10px;
      margin-top: 6px;
    }
    .status-item {
      flex: 1;
      background: #fff;
      border-radius: 10px;
      padding: 10px 14px;
      border: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .status-count { font-size: 18px; font-weight: 900; }
    .status-name  { font-size: 11px; color: #9ca3af; font-weight: 600; }

    /* ── Table ── */
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    thead tr { background: linear-gradient(135deg, #f97316, #f43f5e); }
    thead th {
      padding: 10px 12px;
      text-align: right;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      letter-spacing: 0.03em;
    }
    tbody tr { background: #fff; border-bottom: 1px solid #f3f4f6; }
    tbody tr:nth-child(even) { background: #fafafa; }
    tbody td { padding: 9px 12px; font-size: 12px; color: #374151; vertical-align: middle; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 700;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
      display: flex;
      justify-content: space-between;
    }

    /* ── Print ── */
    @media print {
      body { background: #fff; }
      @page { margin: 0; size: A4 portrait; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-top">
      <div class="brand">Tori</div>
      <div class="report-meta">דוח חודשי — ${monthLabel}</div>
    </div>
    <div class="header-subtitle">${businessName}</div>
  </div>

  <div class="content">

    <!-- KPIs -->
    <div class="section-title">סיכום חודשי</div>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">סה״כ תורים</div>
        <div class="kpi-value">${s.total ?? 0}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">הכנסות החודש</div>
        <div class="kpi-value accent">₪${(s.revenue ?? 0).toLocaleString('he-IL')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">לקוחות חדשים</div>
        <div class="kpi-value cyan">${monthlyReport?.newCustomers ?? 0}</div>
      </div>
    </div>

    <!-- Status -->
    <div class="section-title">סטטוס תורים</div>
    <div class="status-bar">
      <div class="status-item">
        <div class="dot" style="background:#10b981"></div>
        <div>
          <div class="status-count" style="color:#10b981">${s.completed ?? 0}</div>
          <div class="status-name">הושלמו</div>
        </div>
      </div>
      <div class="status-item">
        <div class="dot" style="background:#f97316"></div>
        <div>
          <div class="status-count" style="color:#f97316">${pending}</div>
          <div class="status-name">ממתינים</div>
        </div>
      </div>
      <div class="status-item">
        <div class="dot" style="background:#f43f5e"></div>
        <div>
          <div class="status-count" style="color:#f43f5e">${s.cancelled ?? 0}</div>
          <div class="status-name">בוטלו</div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="section-title">פירוט תורים</div>
    <table>
      <thead>
        <tr>
          <th>לקוח</th>
          <th>שירות</th>
          <th>עובד</th>
          <th>תאריך</th>
          <th>שעה</th>
          <th>מחיר</th>
          <th>סטטוס</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        ${noRows}
      </tbody>
    </table>

    <div class="footer">
      <span>Tori — מערכת ניהול תורים</span>
      <span>הופק בתאריך ${new Date().toLocaleDateString('he-IL')}</span>
    </div>

  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 600);
    });
  </script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
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

  // Pie data
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
    <div className="p-3 sm:p-5 space-y-3 pb-24 sm:pb-5" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className={`text-xl sm:text-2xl font-black ${isNight ? 'text-white' : 'text-gray-900'}`}>נתונים</h2>
        <div className="flex items-center gap-2">
          <MonthPicker value={month} onChange={setMonth} isNight={isNight} />
          <button
            onClick={downloadPDF}
            disabled={!monthlyReport}
            className={`btn-secondary text-sm py-2 px-3 sm:px-4 disabled:opacity-50`}
          >
            <Download size={15} />
            <span className="hidden sm:inline">ייצא PDF</span>
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <StatCard isNight={isNight} title="סה״כ הכנסות"  value={hideStats ? '••••' : overview ? `₪${overview.totalRevenue?.toLocaleString()}` : '-'} subtitle="מאז ההקמה"                icon={TrendingUp} color="coral"  loading={loadingOverview} />
        <StatCard isNight={isNight} title="סה״כ לקוחות"  value={hideStats ? '••••' : overview?.totalCustomers ?? '-'}                                                                      subtitle="לקוחות רשומים"           icon={Users}      color="cyan"   loading={loadingOverview} />
        <StatCard isNight={isNight} title="תורים החודש"  value={overview?.monthlyAppointments ?? '-'}                                                                                      subtitle={`${overview?.avgPerDay ?? 0} בממוצע ליום`} icon={Calendar}   color="orange" loading={loadingOverview} />
        <StatCard isNight={isNight} title="הכנסות החודש" value={hideStats ? '••••' : overview ? `₪${overview.monthlyRevenue?.toLocaleString()}` : '-'}                                     subtitle="החודש הנוכחי"            icon={DollarSign} color="green"  loading={loadingOverview} />
      </div>

      {/* Daily revenue chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-bold text-sm ${isNight ? 'text-white' : 'text-gray-900'}`}>הכנסות יומיות</h3>
          <div className="flex gap-1">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
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
          <div className="h-44 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-[#f43f5e]" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f43f5e" stopOpacity={isNight ? 0.25 : 0.18} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} tickFormatter={v => `₪${v}`} width={44} />
              <Tooltip content={<CustomTooltip isNight={isNight} />} />
              <Area type="monotone" dataKey="revenue" name="הכנסות" stroke="#f43f5e" fill="url(#revenueGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-3">

        {/* Appointment status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className={`font-bold text-sm mb-3 ${isNight ? 'text-white' : 'text-gray-900'}`}>
            סטטוס תורים — {MONTH_NAMES[parseInt(month.split('-')[1]) - 1]} {month.split('-')[0]}
          </h3>

          {total === 0 ? (
            <div className={`text-center py-8 text-sm ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>אין נתונים עדיין</div>
          ) : (
            <div className="flex items-center gap-4">
              {/* Donut with total inside */}
              <div className="relative shrink-0" style={{ width: 128, height: 128 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58}
                      paddingAngle={3} dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="rounded-xl shadow-lg px-3 py-2 text-right"
                          style={{ background: isNight ? '#1a1a2e' : '#fff', border: `1px solid ${isNight ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}` }}>
                          <span className="text-sm font-bold" style={{ color: payload[0].payload.color }}>
                            {payload[0].name}: {payload[0].value}
                          </span>
                        </div>
                      ) : null
                    } />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className={`text-2xl font-black leading-none ${isNight ? 'text-white' : 'text-gray-900'}`}>{total}</span>
                  <span className={`text-[10px] font-medium mt-0.5 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>תורים</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-2.5">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className={`text-sm font-medium ${isNight ? 'text-gray-300' : 'text-gray-600'}`}>{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-black ${isNight ? 'text-white' : 'text-gray-900'}`}>{d.value}</span>
                      <span className={`text-xs w-9 text-left tabular-nums ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>
                        {Math.round((d.value / total) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}

                {monthlyReport && (
                  <div className={`pt-2.5 border-t flex gap-3 ${isNight ? 'border-white/[0.07]' : 'border-gray-100'}`}>
                    <div className={`flex-1 rounded-xl p-2.5 ${isNight ? 'bg-white/[0.04]' : 'bg-gray-50'}`}>
                      <div className={`text-[10px] mb-0.5 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>הכנסות</div>
                      <div className="text-sm font-black text-[#f43f5e]">₪{monthlyReport.summary.revenue?.toLocaleString() || 0}</div>
                    </div>
                    <div className={`flex-1 rounded-xl p-2.5 ${isNight ? 'bg-white/[0.04]' : 'bg-gray-50'}`}>
                      <div className={`text-[10px] mb-0.5 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>לקוחות חדשים</div>
                      <div className="text-sm font-black text-[#06b6d4]">{monthlyReport.newCustomers ?? 0}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Peak hours */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className={`font-bold text-sm mb-3 ${isNight ? 'text-white' : 'text-gray-900'}`}>שעות עמוסות</h3>
          {hoursData.length === 0 ? (
            <div className={`text-center py-8 text-sm ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>אין נתונים עדיין</div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={hoursData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} allowDecimals={false} width={20} />
                <Tooltip content={<CustomTooltip isNight={isNight} />} />
                <Bar dataKey="count" name="תורים" fill="#f43f5e" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
}
