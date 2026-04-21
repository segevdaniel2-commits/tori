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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const [pdfLoading, setPdfLoading] = useState(false);
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

  // ── PDF: render HTML off-screen → html2canvas → jsPDF download ──────
  async function downloadPDF() {
    if (!monthlyReport || pdfLoading) return;
    setPdfLoading(true);

    const s = monthlyReport?.summary || {};
    const monthLabel = `${MONTH_NAMES_FULL[parseInt(month.split('-')[1]) - 1]} ${month.split('-')[0]}`;
    const esc = str => String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const businessName = esc(business?.name || 'Tori');
    const pendingCount = Math.max(0, (s.total ?? 0) - (s.completed ?? 0) - (s.cancelled ?? 0));
    const appointments = monthlyReport?.appointments || [];

    const tableRows = appointments.map((a, idx) => {
      const status = a.status === 'completed' ? 'הושלם' : a.status === 'cancelled' ? 'בוטל' : 'ממתין';
      const statusColor = a.status === 'completed' ? '#10b981' : a.status === 'cancelled' ? '#f43f5e' : '#f97316';
      const bg = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
      const td = `padding:14px 16px;border-bottom:1px solid #eef0f3;font-size:13px;color:#374151;vertical-align:middle;line-height:1.5`;
      return `<tr style="background:${bg}">
        <td style="${td};font-weight:700;color:#111827">${esc(a.customer_name) || '—'}</td>
        <td style="${td}">${esc(a.service_name) || '—'}</td>
        <td style="${td}">${esc(a.staff_name) || '—'}</td>
        <td style="${td};direction:ltr;text-align:left;color:#6b7280;font-size:12px">${a.starts_at?.split('T')[0] || '—'}</td>
        <td style="${td};direction:ltr;text-align:left;font-weight:600;font-size:13px">${a.starts_at?.split('T')[1]?.slice(0, 5) || '—'}</td>
        <td style="${td};font-weight:700;color:#111827">₪${a.price || 0}</td>
        <td style="${td}"><span style="background:${statusColor}18;color:${statusColor};padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;white-space:nowrap;display:inline-block">${status}</span></td>
      </tr>`;
    }).join('');

    const noRows = appointments.length === 0
      ? `<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:24px;font-size:13px">אין תורים לחודש זה</td></tr>`
      : '';

    // Build off-screen container — system fonts only (Segoe UI supports Hebrew on Windows)
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed; left: -9999px; top: 0;
      width: 860px; background: #f1f3f8;
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl; color: #1e1e28;
    `;

    const sectionTitle = (label) => `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;margin-top:28px">
        <div style="width:5px;height:20px;border-radius:3px;background:#f43f5e;flex-shrink:0"></div>
        <span style="font-size:15px;font-weight:800;color:#111827">${label}</span>
      </div>`;

    const kpiCards = [
      { label: 'סה״כ תורים',     value: String(s.total ?? 0),                              color: '#111827' },
      { label: 'הכנסות החודש',   value: `₪${(s.revenue ?? 0).toLocaleString('he-IL')}`,   color: '#f43f5e' },
      { label: 'לקוחות חדשים',   value: String(monthlyReport?.newCustomers ?? 0),           color: '#06b6d4' },
    ].map(k => `
      <div style="flex:1;background:#fff;border-radius:12px;padding:16px 18px;border:1px solid #e5e7eb;border-top:3px solid ${k.color}">
        <div style="font-size:11px;color:#9ca3af;font-weight:600;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em">${k.label}</div>
        <div style="font-size:24px;font-weight:900;color:${k.color};line-height:1">${k.value}</div>
      </div>`).join('');

    const statusCards = [
      { label: 'הושלמו',  value: s.completed ?? 0, color: '#10b981', bg: '#f0fdf4' },
      { label: 'ממתינים', value: pendingCount,       color: '#f97316', bg: '#fff7ed' },
      { label: 'בוטלו',   value: s.cancelled ?? 0,  color: '#f43f5e', bg: '#fff1f2' },
    ].map(st => `
      <div style="flex:1;background:${st.bg};border-radius:12px;padding:14px 18px;border:1px solid ${st.color}30;text-align:center">
        <div style="font-size:28px;font-weight:900;color:${st.color};line-height:1;margin-bottom:4px">${st.value}</div>
        <div style="font-size:12px;font-weight:600;color:${st.color}cc">${st.label}</div>
      </div>`).join('');

    container.innerHTML = `
      <!-- Header -->
      <div style="background:linear-gradient(120deg,#f97316 0%,#f43f5e 100%);padding:32px 40px;color:#fff">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:30px;font-weight:900;letter-spacing:-1px;margin-bottom:4px">Tori</div>
            <div style="font-size:14px;opacity:0.8">${businessName}</div>
          </div>
          <div style="text-align:left">
            <div style="font-size:13px;opacity:0.75;font-weight:500">דוח חודשי</div>
            <div style="font-size:18px;font-weight:800;margin-top:2px">${monthLabel}</div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div style="padding:8px 40px 40px">

        ${sectionTitle('סיכום חודשי')}
        <div style="display:flex;gap:12px">
          ${kpiCards}
        </div>

        ${sectionTitle('סטטוס תורים')}
        <div style="display:flex;gap:12px">
          ${statusCards}
        </div>

        ${sectionTitle('פירוט תורים')}
        <div style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <colgroup>
              <col style="width:18%">
              <col style="width:16%">
              <col style="width:15%">
              <col style="width:13%">
              <col style="width:9%">
              <col style="width:12%">
              <col style="width:17%">
            </colgroup>
            <thead>
              <tr style="background:#f43f5e">
                ${['לקוח','שירות','עובד','תאריך','שעה','מחיר','סטטוס'].map(h =>
                  `<th style="padding:14px 16px;text-align:right;font-size:12px;font-weight:700;color:#fff;border-bottom:none;letter-spacing:0.02em">${h}</th>`
                ).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableRows}${noRows}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e2e5ea;font-size:11px;color:#9ca3af;display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:600;color:#d1d5db">Tori — מערכת ניהול תורים</span>
          <span>הופק בתאריך ${new Date().toLocaleDateString('he-IL')}</span>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    try {
      // Small delay to ensure layout is complete
      await new Promise(r => setTimeout(r, 80));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: false,
        allowTaint: true,
        backgroundColor: '#f1f3f8',
        logging: false,
        width: 860,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = 210;
      const pdfH = 297;
      const imgH = (canvas.height * pdfW) / canvas.width;

      let posY = 0;
      let remaining = imgH;
      let page = 0;

      while (remaining > 0) {
        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -posY, pdfW, imgH);
        posY += pdfH;
        remaining -= pdfH;
        page++;
      }

      pdf.save(`tori-${month}.pdf`);
    } finally {
      document.body.removeChild(container);
      setPdfLoading(false);
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
            disabled={!monthlyReport || pdfLoading}
            className="btn-secondary text-sm py-2 px-3 sm:px-4 disabled:opacity-50"
          >
            {pdfLoading
              ? <Loader2 size={15} className="animate-spin" />
              : <Download size={15} />}
            <span className="hidden sm:inline">{pdfLoading ? 'מייצר...' : 'ייצא PDF'}</span>
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <StatCard isNight={isNight} title="סה״כ הכנסות"  value={hideStats ? '••••' : overview ? `₪${overview.totalRevenue?.toLocaleString()}` : '-'} subtitle="מאז ההקמה"                icon={TrendingUp} color="coral"  loading={loadingOverview} />
        <StatCard isNight={isNight} title="סה״כ לקוחות"  value={hideStats ? '••••' : overview?.totalCustomers ?? '-'}                                                                      subtitle="לקוחות רשומים"           icon={Users}      color="cyan"   loading={loadingOverview} />
        <StatCard isNight={isNight} title="תורים החודש"  value={monthlyReport?.summary?.total ?? overview?.monthlyAppointments ?? '-'}                                                      subtitle={MONTH_NAMES[parseInt(month.split('-')[1]) - 1] + ' ' + month.split('-')[0]} icon={Calendar}   color="orange" loading={!monthlyReport && loadingOverview} />
        <StatCard isNight={isNight} title="הכנסות החודש" value={hideStats ? '••••' : monthlyReport?.summary ? `₪${(monthlyReport.summary.revenue ?? 0).toLocaleString()}` : overview ? `₪${overview.monthlyRevenue?.toLocaleString()}` : '-'} subtitle={MONTH_NAMES[parseInt(month.split('-')[1]) - 1] + ' ' + month.split('-')[0]} icon={DollarSign} color="green"  loading={!monthlyReport && loadingOverview} />
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
      {(() => {
        // Compute insights from monthly appointments
        const appts = monthlyReport?.appointments || [];
        const svcCount = {};
        appts.forEach(a => { if (a.service_name) svcCount[a.service_name] = (svcCount[a.service_name] || 0) + 1; });
        const topService = Object.entries(svcCount).sort((a, b) => b[1] - a[1])[0];
        const avgValue = (completed > 0 && monthlyReport?.summary?.revenue)
          ? Math.round(monthlyReport.summary.revenue / completed)
          : null;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-start">

            {/* Appointment status */}
            <div className={`rounded-2xl border shadow-sm p-4 lg:col-span-2 self-start ${isNight ? 'bg-[#0d1117] border-white/[0.07]' : 'bg-white border-gray-100'}`}>
              <div className="flex items-baseline justify-between mb-3">
                <h3 className={`font-bold text-sm ${isNight ? 'text-white' : 'text-gray-900'}`}>סטטוס תורים</h3>
                <span className={`text-xs ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>{MONTH_NAMES[parseInt(month.split('-')[1]) - 1]} {month.split('-')[0]}</span>
              </div>

              {total === 0 ? (
                <div className={`text-center py-6 text-sm ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>אין נתונים עדיין</div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0" style={{ width: 110, height: 110 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={32} outerRadius={50}
                          paddingAngle={3} dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}>
                          {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className={`text-2xl font-black leading-none ${isNight ? 'text-white' : 'text-gray-900'}`}>{total}</span>
                      <span className={`text-[10px] mt-0.5 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>תורים</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {pieData.map(d => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                          <span className={`text-sm ${isNight ? 'text-gray-300' : 'text-gray-600'}`}>{d.name}</span>
                        </div>
                        <div className="flex items-baseline gap-1.5 tabular-nums">
                          <span className={`text-base font-black ${isNight ? 'text-white' : 'text-gray-900'}`}>{d.value}</span>
                          <span className={`text-[11px] ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>{Math.round((d.value / total) * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Insights card */}
            <div className={`rounded-2xl border shadow-sm p-4 lg:col-span-1 self-start space-y-3 ${isNight ? 'bg-[#0d1117] border-white/[0.07]' : 'bg-white border-gray-100'}`}>
              <h3 className={`font-bold text-sm ${isNight ? 'text-white' : 'text-gray-900'}`}>תובנות</h3>

              <div className={`rounded-xl p-3 ${isNight ? 'bg-white/[0.04]' : 'bg-gray-50'}`}>
                <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>שירות מוביל</div>
                {topService ? (
                  <>
                    <div className={`font-bold text-sm truncate ${isNight ? 'text-white' : 'text-gray-900'}`}>{topService[0]}</div>
                    <div className={`text-xs mt-0.5 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>{topService[1]} תורים</div>
                  </>
                ) : (
                  <div className={`text-xs ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>אין נתונים</div>
                )}
              </div>

              <div className={`rounded-xl p-3 ${isNight ? 'bg-white/[0.04]' : 'bg-gray-50'}`}>
                <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>ממוצע לתור</div>
                {avgValue !== null ? (
                  <div className={`font-black text-lg ${isNight ? 'text-white' : 'text-gray-900'}`}>₪{avgValue.toLocaleString()}</div>
                ) : (
                  <div className={`text-xs ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>אין נתונים</div>
                )}
              </div>

              <div className={`rounded-xl p-3 ${isNight ? 'bg-white/[0.04]' : 'bg-gray-50'}`}>
                <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>לקוחות חדשים</div>
                <div className={`font-black text-lg ${isNight ? 'text-white' : 'text-gray-900'}`}>{monthlyReport?.newCustomers ?? '-'}</div>
              </div>
            </div>

            {/* Peak hours */}
            <div className={`rounded-2xl border shadow-sm p-4 lg:col-span-2 ${isNight ? 'bg-[#0d1117] border-white/[0.07]' : 'bg-white border-gray-100'}`}>
              <h3 className={`font-bold text-sm mb-3 ${isNight ? 'text-white' : 'text-gray-900'}`}>שעות עמוסות</h3>
              {hoursData.length === 0 ? (
                <div className={`text-center py-8 text-sm ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>אין נתונים עדיין</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={hoursData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }} barCategoryGap="25%">
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} allowDecimals={false} width={20} domain={[0, 'dataMax+1']} />
                    <Tooltip content={<CustomTooltip isNight={isNight} />} />
                    <Bar dataKey="count" name="תורים" fill="#f43f5e" radius={[5, 5, 0, 0]} fillOpacity={0.88} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

          </div>
        );
      })()}
    </div>
  );
}
