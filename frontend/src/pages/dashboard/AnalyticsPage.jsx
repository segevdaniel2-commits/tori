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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTH_NAMES = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
const MONTH_NAMES_FULL = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

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

  function downloadPDF() {
    if (!monthlyReport) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const [yearStr, monthStr] = month.split('-');
    const monthLabel = `${MONTH_NAMES_FULL[parseInt(monthStr) - 1]} ${yearStr}`;
    const businessName = business?.name || 'Tori';

    // Header background
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 0, 210, 32, 'F');

    // Business name & report title (right-aligned for Hebrew)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(businessName, 200, 13, { align: 'right' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tori | ${monthLabel}`, 200, 22, { align: 'right' });

    // Summary KPIs row
    const s = monthlyReport.summary || {};
    const kpis = [
      { label: 'Total Appointments', value: String(s.total ?? 0) },
      { label: 'Completed', value: String(s.completed ?? 0) },
      { label: 'Pending', value: String(Math.max(0, (s.total ?? 0) - (s.completed ?? 0) - (s.cancelled ?? 0))) },
      { label: 'Cancelled', value: String(s.cancelled ?? 0) },
      { label: 'Revenue', value: `NIS ${(s.revenue ?? 0).toLocaleString()}` },
      { label: 'New Customers', value: String(monthlyReport.newCustomers ?? 0) },
    ];

    let y = 42;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 40);
    doc.text('Monthly Summary', 10, y);
    y += 6;

    const colW = (210 - 20) / 3;
    kpis.forEach((k, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 10 + col * colW;
      const ky = y + row * 18;

      doc.setFillColor(248, 249, 252);
      doc.roundedRect(x, ky, colW - 3, 15, 2, 2, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 140);
      doc.text(k.label, x + 3, ky + 5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(30, 30, 40);
      doc.text(k.value, x + 3, ky + 12);
    });

    y += 40;

    // Appointments table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 40);
    doc.text('Appointments', 10, y);
    y += 4;

    const rows = (monthlyReport.appointments || []).map(a => [
      a.customer_name || '-',
      a.service_name || '-',
      a.staff_name || '-',
      a.starts_at?.split('T')[0] || '-',
      a.starts_at?.split('T')[1]?.slice(0, 5) || '-',
      `NIS ${a.price || 0}`,
      a.status === 'completed' ? 'Completed' :
      a.status === 'cancelled' ? 'Cancelled' : 'Pending',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Customer', 'Service', 'Staff', 'Date', 'Time', 'Price', 'Status']],
      body: rows.length ? rows : [['No appointments this month', '', '', '', '', '', '']],
      theme: 'grid',
      headStyles: {
        fillColor: [249, 115, 22],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
      },
      bodyStyles: { fontSize: 8.5, halign: 'center', textColor: [40, 40, 50] },
      alternateRowStyles: { fillColor: [248, 249, 252] },
      columnStyles: { 0: { halign: 'left' }, 1: { halign: 'left' } },
      margin: { left: 10, right: 10 },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 180);
      doc.text(`Tori — Generated ${new Date().toLocaleDateString('he-IL')}   Page ${i}/${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`tori-report-${month}.pdf`);
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

  // Appointment status pie data
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
    <div className="p-3 sm:p-5 space-y-3 pb-24 sm:pb-4 overflow-hidden" dir="rtl">

      {/* Page header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className={`text-xl sm:text-2xl font-black ${isNight ? 'text-white' : 'text-gray-900'}`}>נתונים</h2>
        <div className="flex items-center gap-2">
          <MonthPicker value={month} onChange={setMonth} />
          <button onClick={downloadPDF} className="btn-secondary text-sm py-2 px-3 sm:px-4">
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
          <div className="h-40 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-[#f43f5e]" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={168}>
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

      {/* Bottom row: status + hours */}
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
              <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={56}
                      paddingAngle={3} dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}>
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
                {/* Total label in hole */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className={`text-xl font-black leading-none ${isNight ? 'text-white' : 'text-gray-900'}`}>{total}</span>
                  <span className={`text-[10px] font-medium mt-0.5 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>תורים</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-2">
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

                {/* Monthly revenue + new customers inline */}
                {monthlyReport && (
                  <div className={`pt-2 border-t flex gap-3 ${isNight ? 'border-white/[0.07]' : 'border-gray-100'}`}>
                    <div className={`flex-1 rounded-xl p-2 ${isNight ? 'bg-white/[0.04]' : 'bg-gray-50'}`}>
                      <div className={`text-[10px] mb-0.5 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>הכנסות</div>
                      <div className="text-sm font-black text-[#f43f5e]">₪{monthlyReport.summary.revenue?.toLocaleString() || 0}</div>
                    </div>
                    <div className={`flex-1 rounded-xl p-2 ${isNight ? 'bg-white/[0.04]' : 'bg-gray-50'}`}>
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
            <ResponsiveContainer width="100%" height={168}>
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
