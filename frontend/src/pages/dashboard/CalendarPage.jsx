import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, subDays, parseISO, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  ChevronRight, ChevronLeft, ChevronDown, Plus, X, Clock, User, Phone,
  Scissors, Calendar, Loader2, Check, Trash2, Lock, RefreshCw, Pencil,
  ArrowUp, RotateCcw, UserPlus, CalendarPlus, CalendarX2, Sparkles, Send,
} from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAppointmentsApi, useBusinessApi } from '../../hooks/useApi';
import { useAuthStore, useDashboardStore, useNotificationStore } from '../../store/useStore';
import api from '../../hooks/useApi';

const STATUS_COLORS = {
  confirmed: { bg: 'bg-[#fff1eb]', text: 'text-[#f97316]', border: 'border-[#f97316]/20', dot: 'bg-[#f97316]' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-400' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500' },
};

const STATUS_LABELS = { confirmed: 'מאושר', completed: 'הושלם', cancelled: 'בוטל', pending: 'ממתין' };


const STATUS_LABELS_NIGHT = {
  confirmed: { label: 'מאושר', cls: 'bg-[#f97316]/15 text-[#f97316] border-[#f97316]/20' },
  completed: { label: 'הושלם', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' },
  cancelled: { label: 'בוטל',  cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
  pending:   { label: 'ממתין', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/20' },
};
const STATUS_LABELS_DAY = {
  confirmed: { label: 'מאושר', cls: 'bg-[#fff1eb] text-[#f97316] border-[#f97316]/20' },
  completed: { label: 'הושלם', cls: 'bg-green-50 text-green-700 border-green-200' },
  cancelled: { label: 'בוטל',  cls: 'bg-red-50 text-red-600 border-red-200' },
  pending:   { label: 'ממתין', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
};

function useNightMode() {
  const [isNight, setIsNight] = useState(() => { const h = new Date().getHours(); return h >= 20 || h < 6; });
  useEffect(() => {
    const id = setInterval(() => { const h = new Date().getHours(); setIsNight(h >= 20 || h < 6); }, 60000);
    return () => clearInterval(id);
  }, []);
  return isNight;
}

function DesktopApptRow({ appt, onClick, showNowLine, isNight }) {
  const start = appt.starts_at.split('T')[1]?.slice(0, 5) || appt.starts_at.slice(11, 16);
  const end   = appt.ends_at?.split('T')[1]?.slice(0, 5) || appt.ends_at?.slice(11, 16);
  const staffColor = appt.staff_color || '#f43f5e';
  const statusMap = isNight ? STATUS_LABELS_NIGHT : STATUS_LABELS_DAY;
  const st = statusMap[appt.status] || statusMap.confirmed;
  const duration = appt.service_duration || 30;

  return (
    <>
      {showNowLine && (
        <div className="flex items-center gap-3 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#f43f5e] shrink-0" />
          <div className="flex-1 h-px bg-[#f43f5e]/40" />
          <span className="text-[#f43f5e] text-xs font-bold shrink-0">עכשיו</span>
          <div className="flex-1 h-px bg-[#f43f5e]/40" />
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ backgroundColor: isNight ? 'rgba(255,255,255,0.06)' : 'rgba(249,115,22,0.04)' }}
        onClick={() => onClick(appt)}
        className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border cursor-pointer transition-all group ${
          isNight ? 'border-white/[0.06] bg-white/[0.03]' : 'border-gray-100 bg-white shadow-sm'
        }`}
      >
        {/* Time */}
        <div className="shrink-0 text-right w-14">
          <div className={`font-black text-base leading-tight ${isNight ? 'text-white' : 'text-gray-900'}`}>{start}</div>
          {end && <div className={`text-xs mt-0.5 ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>{end}</div>}
        </div>

        {/* Staff color accent */}
        <div className="w-0.5 h-10 rounded-full shrink-0" style={{ background: staffColor }} />

        {/* Customer + service */}
        <div className="flex-1 min-w-0">
          <div className={`font-bold text-base leading-tight truncate ${isNight ? 'text-white' : 'text-gray-900'}`}>
            {appt.customer_name || 'לקוח'}
          </div>
          <div className={`text-sm mt-0.5 flex items-center gap-1.5 flex-wrap ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>
            {appt.service_name && <span>{appt.service_name}</span>}
            {appt.service_name && <span className={isNight ? 'text-gray-700' : 'text-gray-300'}>·</span>}
            <span>{duration} דק׳</span>
            {appt.staff_name && <><span className={isNight ? 'text-gray-700' : 'text-gray-300'}>·</span><span>{appt.staff_name}</span></>}
          </div>
        </div>

        {/* Phone */}
        {appt.customer_phone && (
          <span className={`text-sm font-medium shrink-0 hidden lg:block ${isNight ? 'text-gray-600' : 'text-gray-400'}`} dir="ltr">
            {appt.customer_phone}
          </span>
        )}

        {/* Price */}
        {appt.price != null && (
          <span className={`font-bold text-base shrink-0 ${isNight ? 'text-white' : 'text-gray-900'}`}>₪{appt.price}</span>
        )}

        {/* Status badge */}
        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${st.cls}`}>
          {st.label}
        </span>
      </motion.div>
    </>
  );
}

function AppointmentModal({ appt, onClose, onUpdate, onCancel }) {
  const isNight = useNightMode();
  const [status, setStatus] = useState(appt.status);
  const [notes, setNotes] = useState(appt.notes || '');
  const [editingNotes, setEditingNotes] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [customerName, setCustomerName] = useState(appt.customer_name || '');
  const [savingName, setSavingName] = useState(false);
  const [editingService, setEditingService] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(appt.service_id || '');
  const [savingService, setSavingService] = useState(false);
  const appointmentsApi = useAppointmentsApi();
  const { data: servicesList = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/businesses/services').then(r => r.data),
    staleTime: 60000,
  });

  // Parse start/end always as stored local-time strings (no UTC conversion)
  const start = appt.starts_at.slice(11, 16);
  const rawEnd = appt.ends_at?.slice(11, 16);
  // Guard against backwards ends_at (UTC storage bug from older bookings):
  // if end < start, recompute end from service duration
  const end = (() => {
    if (!rawEnd) return null;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = rawEnd.split(':').map(Number);
    const dur = appt.service_duration;
    if (dur && eh * 60 + em < sh * 60 + sm) {
      const et = sh * 60 + sm + dur;
      return `${String(Math.floor(et/60)).padStart(2,'0')}:${String(et%60).padStart(2,'0')}`;
    }
    return rawEnd;
  })();
  const dateStr = appt.starts_at.split('T')[0];

  async function handleSaveName() {
    if (!customerName.trim() || !appt.customer_id) return;
    setSavingName(true);
    try {
      await api.put(`/customers/${appt.customer_id}`, { name: customerName.trim() });
      setEditingName(false);
      onUpdate();
    } finally {
      setSavingName(false);
    }
  }

  async function handleSaveService() {
    if (!selectedServiceId) return;
    setSavingService(true);
    try {
      await appointmentsApi.update(appt.id, { service_id: Number(selectedServiceId) });
      setEditingService(false);
      onUpdate();
    } finally {
      setSavingService(false);
    }
  }

  async function handleStatusChange(newStatus) {
    setUpdating(true);
    try {
      await appointmentsApi.update(appt.id, { status: newStatus });
      setStatus(newStatus);
      onUpdate();
    } finally {
      setUpdating(false);
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      await appointmentsApi.update(appt.id, { notes: notes.trim() });
      setEditingNotes(false);
      onUpdate();
    } finally {
      setSavingNotes(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">פרטי תור</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl"
            style={{ background: isNight ? 'rgba(249,115,22,0.10)' : '#fff1eb', border: isNight ? '1px solid rgba(249,115,22,0.18)' : 'none' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ background: 'linear-gradient(135deg,#f97316,#f43f5e)' }}>
              {(customerName || 'L')[0]}
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="flex-1 text-sm font-bold border border-[#f97316]/50 rounded-lg px-2.5 py-1 focus:outline-none min-w-0"
                    style={{ background: isNight ? 'rgba(255,255,255,0.08)' : '#fff', color: isNight ? '#fff' : '#111' }}
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setCustomerName(appt.customer_name || ''); setEditingName(false); } }}
                  />
                  <button onClick={handleSaveName} disabled={savingName} className="p-1.5 rounded-lg bg-[#f97316] text-white hover:bg-[#f43f5e] transition-colors shrink-0">
                    {savingName ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                  </button>
                  <button onClick={() => { setCustomerName(appt.customer_name || ''); setEditingName(false); }} className="p-1.5 rounded-lg text-gray-500 transition-colors shrink-0"
                    style={{ background: isNight ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)' }}>
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="font-bold truncate" style={{ color: isNight ? '#ffffff' : '#111827' }}>{customerName || 'לקוח לא ידוע'}</div>
                  <button onClick={() => setEditingName(true)} className="p-1 rounded hover:bg-[#f97316]/15 transition-colors shrink-0">
                    <Pencil size={11} className="text-[#f97316]" />
                  </button>
                </div>
              )}
              {appt.customer_phone && (
                <a href={`tel:${appt.customer_phone}`} className="text-[#f43f5e] text-sm hover:underline flex items-center gap-1 mt-0.5">
                  <Phone size={12} />
                  {appt.customer_phone}
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Calendar size={11} /> תאריך</div>
              <div className="font-semibold text-gray-900 text-sm">{format(parseISO(dateStr), 'EEEE, d MMMM', { locale: he })}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Clock size={11} /> שעה</div>
              <div className="font-semibold text-gray-900 text-sm">{start}{end ? ` עד ${end}` : ''}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-500 text-xs flex items-center gap-1"><Scissors size={11} /> שירות</span>
                {!editingService && (
                  <button onClick={() => setEditingService(true)} className="p-0.5 rounded hover:bg-[#f97316]/15 transition-colors">
                    <Pencil size={10} className="text-[#f97316]" />
                  </button>
                )}
              </div>
              {editingService ? (
                <div className="flex items-center gap-1">
                  <select
                    value={selectedServiceId}
                    onChange={e => setSelectedServiceId(e.target.value)}
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-1.5 py-1 focus:outline-none bg-white text-gray-900"
                    style={{ minWidth: 0 }}
                  >
                    <option value="">בחר שירות</option>
                    {servicesList.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button onClick={handleSaveService} disabled={savingService || !selectedServiceId}
                    className="p-1 rounded-lg bg-[#f97316] text-white shrink-0">
                    {savingService ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                  </button>
                  <button onClick={() => { setSelectedServiceId(appt.service_id || ''); setEditingService(false); }}
                    className="p-1 rounded-lg bg-gray-200 text-gray-600 shrink-0">
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div className="font-semibold text-gray-900 text-sm">{appt.service_name || '-'}</div>
              )}
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-gray-500 text-xs mb-1 flex items-center gap-1"><User size={11} /> עובד</div>
              <div className="font-semibold text-gray-900 text-sm">{appt.staff_name || '-'}</div>
            </div>
          </div>

          {appt.price > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex justify-between items-center">
              <span className="text-green-700 font-semibold">מחיר</span>
              <span className="text-green-800 font-black text-lg">₪{appt.price}</span>
            </div>
          )}

          {/* Editable notes */}
          <div className="border border-gray-100 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-gray-500 text-xs font-semibold">הערה לתור</span>
              {!editingNotes && (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="text-xs text-[#f97316] hover:text-[#f43f5e] font-medium"
                >
                  {notes ? 'ערוך' : '+ הוסף הערה'}
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="הערה לתור..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#f97316] resize-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="flex items-center gap-1 bg-[#f97316] text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                  >
                    {savingNotes ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    שמור
                  </button>
                  <button
                    onClick={() => { setNotes(appt.notes || ''); setEditingNotes(false); }}
                    className="text-xs text-gray-400 px-3 py-1.5 rounded-lg border border-gray-200"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">{notes || <span className="text-gray-300 italic">אין הערה</span>}</p>
            )}
          </div>

          {/* Status actions */}
          <div className="flex gap-2 flex-wrap">
            {status !== 'completed' && (
              <button
                onClick={() => handleStatusChange('completed')}
                disabled={updating}
                className="flex items-center gap-1.5 bg-green-100 text-green-700 hover:bg-green-200 text-sm font-semibold px-3 py-2 rounded-xl transition-all"
              >
                <Check size={14} />
                סמן כהושלם
              </button>
            )}
            {status !== 'cancelled' && (
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={updating}
                className="flex items-center gap-1.5 bg-red-100 text-red-600 hover:bg-red-200 text-sm font-semibold px-3 py-2 rounded-xl transition-all"
              >
                <Trash2 size={14} />
                בטל תור
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CustomSelect({ label, value, onChange, options, placeholder = 'בחר...' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 hover:border-[#f43f5e]/40 transition-all focus:outline-none"
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={15} className={`text-gray-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.13 }}
            className="absolute top-full mt-1.5 right-0 left-0 z-50 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-black/10 overflow-hidden"
          >
            <div className="max-h-48 overflow-y-auto py-1">
              {options.map((o, i) => {
                const isSelected = String(o.value) === String(value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => { onChange(String(o.value)); setOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-right transition-colors ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#f97316]/10 via-[#f43f5e]/10 to-[#06b6d4]/10 text-[#f43f5e] font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{o.label}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {o.sub && <span className="text-xs text-gray-400">{o.sub}</span>}
                      {isSelected && <Check size={13} className="text-[#f43f5e]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddAppointmentModal({ selectedDate, initialTime, initialStaffId, onClose, onSuccess, existingAppointments = [] }) {
  const { business } = useAuthStore();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(selectedDate || today);
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [staffId, setStaffId] = useState(initialStaffId ? String(initialStaffId) : '');
  const [serviceId, setServiceId] = useState('');
  const [time, setTime] = useState(initialTime || '10:00');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [altSlots, setAltSlots] = useState([]);
  const appointmentsApi = useAppointmentsApi();

  const quickDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today + 'T00:00:00');
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  function quickDateLabel(d) {
    const diff = Math.round((new Date(d + 'T00:00:00') - new Date(today + 'T00:00:00')) / 86400000);
    if (diff === 0) return 'היום';
    if (diff === 1) return 'מחר';
    return format(new Date(d + 'T00:00:00'), 'EEE d/M', { locale: he });
  }

  const { data: staff } = useQuery({ queryKey: ['staff'], queryFn: () => api.get('/businesses/staff').then(r => r.data) });
  const { data: services } = useQuery({ queryKey: ['services'], queryFn: () => api.get('/businesses/services').then(r => r.data) });
  const { data: customers } = useQuery({ queryKey: ['customers-search', customerPhone], queryFn: () => api.get('/customers', { params: { search: customerPhone } }).then(r => r.data.customers), enabled: customerPhone.length > 3 });

  // Auto-select defaults once data arrives
  useEffect(() => {
    if (staff && staff.length > 0 && !staffId) {
      const preferred = initialStaffId ? staff.find(s => s.id === Number(initialStaffId)) : null;
      const fallback = staff.find(s => s.role === 'owner') || staff[0];
      const target = preferred || fallback;
      if (target) setStaffId(String(target.id));
    }
  }, [staff]);

  useEffect(() => {
    if (services && services.length > 0 && !serviceId) {
      if (services[0]) setServiceId(String(services[0].id));
    }
  }, [services]);

  const selectedService = services?.find(s => s.id === Number(serviceId));

  // Find up to 3 free slots near a given time on a given date
  function findNearbySlots(forDate, forTime, durationMin) {
    const [h, m] = forTime.split(':').map(Number);
    const base = h * 60 + m;
    const step = business?.buffer_minutes || 30;
    const candidates = [];
    for (let delta = step; delta <= step * 6; delta += step) {
      candidates.push(base - delta, base + delta);
    }
    const dayAppts = existingAppointments.filter(a => a.status !== 'cancelled' && a.starts_at.startsWith(forDate));
    return candidates
      .filter(t => t >= 0 && t < 24 * 60)
      .sort((a, b) => Math.abs(a - base) - Math.abs(b - base))
      .filter(t => {
        const slotStart = `${forDate}T${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}:00`;
        const slotEnd = new Date(new Date(slotStart).getTime() + durationMin * 60000).toISOString().slice(0, 19);
        return !dayAppts.some(a => a.starts_at < slotEnd && a.ends_at > slotStart);
      })
      .slice(0, 3)
      .map(t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!customerName && !customerId) { setError('הכנס שם לקוח'); return; }
    if (!time) { setError('בחר שעה'); return; }

    // Client-side conflict check before hitting the API
    const duration = selectedService?.duration_minutes || 30;
    const newStart = `${date}T${time}:00`;
    const newEnd = new Date(new Date(newStart).getTime() + duration * 60000).toISOString().slice(0, 19);
    const conflict = existingAppointments.find(a =>
      a.status !== 'cancelled' && a.starts_at.startsWith(date) &&
      a.starts_at < newEnd && a.ends_at > newStart
    );
    if (conflict) {
      const nearby = findNearbySlots(date, time, duration);
      setAltSlots(nearby);
      setError(`השעה ${time} תפוסה — ${conflict.customer_name || 'לקוח'} כבר קבע באותה שעה`);
      return;
    }

    setAltSlots([]);
    setLoading(true);
    setError('');
    try {
      // Create or find customer
      let cid = customerId;
      if (!cid) {
        const { data: customerData } = await api.post('/customers/quick', {
          name: customerName,
          whatsapp_phone: customerPhone || `manual_${Date.now()}`,
          business_id: business.id,
        }).catch(() => ({ data: null }));

        // Try to find by phone
        if (customerPhone) {
          const { data: list } = await api.get('/customers', { params: { search: customerPhone } });
          const found = list.customers.find(c => c.whatsapp_phone === customerPhone);
          if (found) cid = found.id;
        }
        if (!cid && customerData) cid = customerData.id;
      }

      if (!cid) throw new Error('לא ניתן ליצור לקוח');

      const startsAt = `${date}T${time}:00`;
      const duration = selectedService?.duration_minutes || 30;
      const endDate = new Date(`${date}T${time}:00`);
      endDate.setMinutes(endDate.getMinutes() + duration);
      const _p = n => String(n).padStart(2, '0');
      const endsAt = `${endDate.getFullYear()}-${_p(endDate.getMonth()+1)}-${_p(endDate.getDate())}T${_p(endDate.getHours())}:${_p(endDate.getMinutes())}:00`;

      await appointmentsApi.create({
        customer_id: cid,
        staff_id: staffId || undefined,
        service_id: serviceId || undefined,
        starts_at: startsAt,
        ends_at: endsAt,
        price: selectedService?.price,
        notes,
      });

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'שגיאה ביצירת תור');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">הוסף תור ידנית</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <p className="text-red-600 text-sm font-medium">{error}</p>
              {altSlots.length > 0 && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-red-400">שעות פנויות קרובות:</span>
                  {altSlots.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => { setTime(slot); setError(''); setAltSlots([]); }}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg text-white"
                      style={{ background: 'linear-gradient(135deg,#f97316,#f43f5e)' }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Date */}
          <div className="border border-gray-100 rounded-2xl p-3">
            <label className="form-label">תאריך *</label>
            <div className="flex gap-2 flex-wrap">
              {quickDates.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDate(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    date === d ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-[#f97316]/40'
                  }`}
                  style={date === d ? { background: 'linear-gradient(135deg,#f97316,#f43f5e)' } : {}}
                >
                  {quickDateLabel(d)}
                </button>
              ))}
            </div>
          </div>

          {/* Customer */}
          <div className="border border-gray-100 rounded-2xl p-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">שם לקוח *</label>
                <input value={customerName} onChange={e => setCustomerName(e.target.value)} className="form-input" placeholder="ישראל ישראלי" />
              </div>
              <div>
                <label className="form-label">טלפון</label>
                <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="form-input" placeholder="050-..." dir="ltr" />
              </div>
            </div>
          </div>

          {/* Service + Staff + Time */}
          <div className="border border-gray-100 rounded-2xl p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">שירות</label>
                <CustomSelect
                  value={serviceId}
                  onChange={setServiceId}
                  placeholder="בחר שירות"
                  options={(services || []).map(s => ({
                    value: s.id,
                    label: s.name,
                    sub: `₪${s.price}`,
                  }))}
                />
              </div>
              <div>
                <label className="form-label">עובד</label>
                <CustomSelect
                  value={staffId}
                  onChange={setStaffId}
                  placeholder="בחר עובד"
                  options={(staff || []).map(s => ({
                    value: s.id,
                    label: s.name,
                    sub: s.role === 'owner' ? 'בעלים' : undefined,
                  }))}
                />
              </div>
            </div>
            <div>
              <label className="form-label">שעה *</label>
              <div className="flex items-center gap-2" dir="ltr">
                <select
                  value={time.split(':')[0] || '10'}
                  onChange={e => setTime(`${e.target.value}:${time.split(':')[1] || '00'}`)}
                  className="form-input flex-1 text-center"
                >
                  {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span className="text-gray-400 font-bold text-lg shrink-0">:</span>
                <select
                  value={time.split(':')[1] || '00'}
                  onChange={e => setTime(`${time.split(':')[0] || '10'}:${e.target.value}`)}
                  className="form-input flex-1 text-center"
                >
                  {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="border border-gray-100 rounded-2xl p-3">
            <label className="form-label">הערות</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="form-input resize-none" rows={2} placeholder="הערות אופציונליות..." />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">ביטול</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {loading ? 'מוסיף...' : 'הוסף תור'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Desktop Time Grid ────────────────────────────────────────────────────────
function DesktopTimeGrid({ appointments, isNight, openTime, closeTime, bufferMinutes, onSlotClick, onApptClick, isTodayFlag }) {
  const step = Math.max(bufferMinutes || 30, 5);
  const slots = [];
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  const openTotal = openH * 60 + openM;
  const closeTotal = closeH * 60 + closeM;
  for (let t = openTotal; t < closeTotal; t += step) {
    slots.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
  }

  // Map each appointment to its nearest slot boundary (floor to step)
  const slotAppts = {};
  appointments.forEach(a => {
    const tStr = (a.starts_at.split('T')[1] || a.starts_at.slice(11)).slice(0, 5);
    const [h, m] = tStr.split(':').map(Number);
    const slotMin = Math.floor((h * 60 + m) / step) * step;
    const key = `${String(Math.floor(slotMin / 60)).padStart(2, '0')}:${String(slotMin % 60).padStart(2, '0')}`;
    if (!slotAppts[key]) slotAppts[key] = [];
    slotAppts[key].push(a);
  });

  // Pre-compute all occupied slots from every appointment
  const occupied = new Set();
  appointments.forEach(a => {
    const tStr = (a.starts_at.split('T')[1] || a.starts_at.slice(11)).slice(0, 5);
    const [sh, sm] = tStr.split(':').map(Number);
    const duration = a.service_duration || step;
    const slotMin = Math.floor((sh * 60 + sm) / step) * step;
    for (let t = slotMin + step; t < slotMin + duration; t += step) {
      occupied.add(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
    }
  });

  const now = new Date();
  const nowStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const statusMap = isNight ? STATUS_LABELS_NIGHT : STATUS_LABELS_DAY;
  const dividerColor = isNight ? 'rgba(255,255,255,0.04)' : '#f3f4f6';

  return (
    <div className="flex-1 overflow-y-auto">
      {slots.map((slotTime, idx) => {
        if (occupied.has(slotTime)) return null;

        const appts = slotAppts[slotTime] || [];
        const isNowSlot = isTodayFlag && slotTime <= nowStr && nowStr < (slots[idx + 1] || '24:00');
        const isPast = isTodayFlag && slotTime < nowStr && appts.length === 0;

        if (appts.length > 0) {
          return (
            <div key={slotTime} style={{ borderBottom: `1px solid ${dividerColor}` }}>
              {appts.map(appt => {
                const aStart = appt.starts_at.slice(11, 16);
                const dur = appt.service_duration || step;
                const [ash, asm] = aStart.split(':').map(Number);
                const endMin = ash * 60 + asm + dur;
                const endTimeStr = `${String(Math.floor(endMin/60)).padStart(2,'0')}:${String(endMin%60).padStart(2,'0')}`;
                const st = statusMap[appt.status] || statusMap.confirmed;
                const cardHeight = Math.max(64, Math.round(dur / step) * 56);

                return (
                  <div key={appt.id} className="flex items-stretch cursor-pointer group" style={{ minHeight: cardHeight }}
                    onClick={() => onApptClick(appt)}>
                    <div className="w-16 shrink-0 flex flex-col items-end justify-start pr-3 pt-3"
                      style={{ borderLeft: `1px solid ${dividerColor}` }}>
                      <span className={`text-xs font-bold ${isNight ? 'text-white' : 'text-gray-800'}`}>{aStart}</span>
                      <span className={`text-[10px] mt-0.5 ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>{endTimeStr}</span>
                    </div>
                    <div className="flex-1 mx-3 my-2 rounded-xl px-3 py-2 flex items-center gap-3 transition-all group-hover:brightness-95"
                      style={{
                        background: isNight ? 'rgba(255,255,255,0.04)' : '#f8f8fa',
                        border: `1px solid ${isNight ? 'rgba(255,255,255,0.08)' : '#e8e8ec'}`,
                        borderRight: `3px solid ${appt.staff_color || '#94a3b8'}`,
                      }}>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-sm truncate ${isNight ? 'text-white' : 'text-gray-900'}`}>{appt.customer_name || 'לקוח'}</div>
                        <div className={`text-xs mt-0.5 ${isNight ? 'text-gray-400' : 'text-gray-500'}`}>
                          {[appt.service_name, `${dur} דק׳`, appt.staff_name].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      {appt.customer_phone && (
                        <span className={`text-xs hidden lg:block shrink-0 ${isNight ? 'text-gray-500' : 'text-gray-400'}`} dir="ltr">{appt.customer_phone}</span>
                      )}
                      {appt.price != null && (
                        <span className={`font-bold text-sm shrink-0 ${isNight ? 'text-white' : 'text-gray-900'}`}>₪{appt.price}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${st.cls}`}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        // Empty slot
        return (
          <div key={slotTime}
            className={`flex items-center group ${isPast ? 'cursor-default' : 'cursor-pointer'}`}
            style={{ minHeight: 56, borderBottom: `1px solid ${dividerColor}`, opacity: isPast ? 0.45 : 1 }}
            onClick={() => !isPast && onSlotClick(slotTime)}>
            <div className="w-16 shrink-0 flex items-center justify-end pr-3"
              style={{ height: '100%', borderLeft: `1px solid ${dividerColor}` }}>
              <span className={`text-xs font-medium ${isNowSlot ? 'text-[#f43f5e] font-bold' : isNight ? 'text-gray-600' : 'text-gray-400'}`}>{slotTime}</span>
            </div>
            <div className={`flex-1 mx-3 rounded-xl flex items-center justify-center transition-all ${isPast ? '' : isNight ? 'group-hover:bg-white/[0.03]' : 'group-hover:bg-[#fff7ed]'}`} style={{ height: 40 }}>
              {!isPast && (
                <span className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Plus size={11} />קבע תור
                </span>
              )}
              {isNowSlot && <div className="w-full h-px mx-2" style={{ background: '#f43f5e', opacity: 0.4 }} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const HEB_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const DAY_LABELS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

function DatePickerPopup({ value, onChange, onClose }) {
  const today = new Date().toISOString().split('T')[0];
  const [viewYear, setViewYear] = useState(() => new Date(value + 'T00:00:00').getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date(value + 'T00:00:00').getMonth());
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div
      ref={ref}
      className="absolute top-full mt-2 right-0 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-72"
      dir="rtl"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronRight size={16} /></button>
        <span className="font-bold text-gray-900 text-sm">{HEB_MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft size={16} /></button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const isSel = ds === value;
          const isTod = ds === today;
          const isPast = ds < today;
          return (
            <button
              key={d}
              disabled={isPast}
              onClick={() => { onChange(ds); onClose(); }}
              className={`w-full aspect-square flex items-center justify-center text-sm rounded-xl transition-all font-medium ${
                isSel ? 'text-white shadow-sm' :
                isTod ? 'ring-1' :
                isPast ? 'text-gray-300 cursor-not-allowed' :
                'text-gray-700 hover:bg-gray-100'
              }`}
              style={isSel ? { background: 'linear-gradient(135deg,#f97316,#f43f5e)' } : isTod ? { background: '#fff1eb', color: '#f97316', ringColor: '#f97316' } : {}}
            >
              {d}
            </button>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => { onChange(today); onClose(); }}
          className="w-full py-2 text-sm font-semibold text-[#f43f5e] hover:bg-[#fff1eb] rounded-xl transition-colors"
        >
          חזור להיום
        </button>
      </div>
    </div>
  );
}

// ─── Mobile AI Chat bottom sheet ─────────────────────────────────────────────
function MobileAiChat({ isNight, onClose, onAppointmentChange }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'שלום! אני טורילי, העוזר החכם שלך. אני יכול לעזור לך לקבוע תורים, לשנות זמנים, לבטל ולענות על שאלות על לוח הזמנים שלך.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    const history = messages.map(m => ({ role: m.role, content: m.text }));
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/owner-bot/chat', { message: text, history });
      const reply = res.data?.reply || res.data?.message || 'לא הצלחתי להבין, נסה שוב.';
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      if (res.data?.appointmentChanged) onAppointmentChange?.();
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'שגיאה בחיבור לשרת. נסה שוב.' }]);
    } finally {
      setLoading(false);
    }
  }

  const bg = isNight ? '#12121A' : '#ffffff';
  const border = isNight ? 'rgba(255,255,255,0.08)' : '#f3f4f6';
  const textMain = isNight ? '#ffffff' : '#111827';
  const textSub = isNight ? '#6b7280' : '#9ca3af';
  const inputBg = isNight ? 'rgba(255,255,255,0.06)' : '#f9fafb';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="w-full rounded-t-3xl flex flex-col"
        style={{ background: bg, maxHeight: '80vh', borderTop: `1px solid ${border}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: textMain }}>טורילי</div>
              <div className="text-xs" style={{ color: textSub }}>עוזר יומן חכם</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl" style={{ background: isNight ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }}>
            <X size={16} style={{ color: textSub }} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div
                className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={m.role === 'user'
                  ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderBottomLeftRadius: 4 }
                  : { background: isNight ? 'rgba(255,255,255,0.07)' : '#f3f4f6', color: textMain, borderBottomRightRadius: 4 }
                }
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-end">
              <div className="px-4 py-2.5 rounded-2xl" style={{ background: isNight ? 'rgba(255,255,255,0.07)' : '#f3f4f6' }}>
                <Loader2 size={14} className="animate-spin" style={{ color: textSub }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 flex items-center gap-2.5" style={{ borderTop: `1px solid ${border}` }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="שאל אותי כל דבר על היומן..."
            className="flex-1 text-sm px-4 py-2.5 rounded-xl outline-none"
            style={{ background: inputBg, color: textMain, border: `1px solid ${border}` }}
            dir="rtl"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-opacity"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', opacity: (!input.trim() || loading) ? 0.4 : 1 }}
          >
            <Send size={15} className="text-white" style={{ transform: 'scaleX(-1)' }} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const NIGHT_STATUS_COLORS = {
  confirmed: { bg: 'bg-[#f97316]/10', text: 'text-[#fb923c]', border: 'border-[#f97316]/25', dot: 'bg-[#f97316]' },
  completed:  { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/25', dot: 'bg-emerald-400' },
  cancelled:  { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/25',    dot: 'bg-red-400' },
  pending:    { bg: 'bg-amber-500/10',   text: 'text-amber-300',  border: 'border-amber-500/25',  dot: 'bg-amber-400' },
};

// ─── Mobile appointment card ──────────────────────────────────────────────────
function MobileApptCard({ appt, onClick, isNight }) {
  const start = appt.starts_at.split('T')[1]?.slice(0, 5) || appt.starts_at.slice(11, 16);
  const end = appt.ends_at?.split('T')[1]?.slice(0, 5) || appt.ends_at?.slice(11, 16);
  const palette = isNight ? NIGHT_STATUS_COLORS : STATUS_COLORS;
  const colors = palette[appt.status] || palette.confirmed;
  const staffColor = appt.staff_color || '#f97316';

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(appt)}
      className={`w-full text-right flex items-stretch gap-0 rounded-2xl border overflow-hidden active:opacity-80 transition-all ${colors.bg} ${colors.border}`}
    >
      {/* Staff color accent bar */}
      <div className="w-1.5 shrink-0" style={{ background: staffColor }} />

      <div className="flex-1 px-4 py-3 flex items-center gap-3">
        {/* Time column */}
        <div className="shrink-0 text-center min-w-[48px]">
          <div className={`font-black text-base leading-tight ${colors.text}`}>{start}</div>
          {end && <div className={`text-xs opacity-60 ${colors.text}`}>{end}</div>}
        </div>

        {/* Divider */}
        <div className={`w-px h-10 shrink-0 ${isNight ? 'bg-white/10' : 'bg-black/10'}`} />

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className={`font-bold text-base leading-tight truncate ${colors.text}`}>
            {appt.customer_name || 'לקוח'}
          </div>
          <div className={`text-sm opacity-70 truncate mt-0.5 ${colors.text}`}>
            {[appt.service_name, appt.staff_name].filter(Boolean).join(' · ') || ''}
          </div>
        </div>

        {/* Status dot */}
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot}`} />
      </div>
    </motion.button>
  );
}

// ─── 7-day date strip for mobile ─────────────────────────────────────────────
function MobileDateStrip({ selectedDate, onSelect }) {
  const today = new Date().toISOString().split('T')[0];
  const stripRef = useRef(null);
  const days = Array.from({ length: 21 }, (_, i) => {
    const d = new Date(today + 'T00:00:00');
    d.setDate(d.getDate() + i - 7); // 7 past days + today + 13 future
    return d.toISOString().split('T')[0];
  });

  // Scroll selected date into view
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const idx = days.indexOf(selectedDate);
    if (idx === -1) return;
    const btn = strip.children[idx];
    if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedDate]);
  const DAY_SHORT = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  return (
    <div ref={stripRef} className="flex gap-1 overflow-x-auto pb-1 px-1" style={{ scrollbarWidth: 'none' }}>
      {days.map(d => {
        const dayObj = new Date(d + 'T00:00:00');
        const isSelected = d === selectedDate;
        const isToday = d === today;
        return (
          <button
            key={d}
            onClick={() => onSelect(d)}
            className={`flex flex-col items-center shrink-0 w-11 py-2 rounded-xl transition-all font-medium ${
              isSelected ? 'text-white shadow-md' :
              isToday ? 'ring-1' :
              'text-gray-500 hover:bg-gray-100'
            }`}
            style={isSelected ? { background: 'linear-gradient(135deg,#f97316,#f43f5e)' } : isToday ? { background: '#fff1eb', color: '#f97316' } : {}}
          >
            <span className="text-xs">{DAY_SHORT[dayObj.getDay()]}</span>
            <span className={`text-base font-black leading-tight ${isSelected ? 'text-white' : ''}`}>{dayObj.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Embedded AI Bot Panel ────────────────────────────────────────────────────
const BOT_CHAT_KEY = 'ownerbot_chat';
const BOT_CHAT_TTL = 60 * 60 * 1000;
function loadBotChat() {
  try {
    const raw = localStorage.getItem(BOT_CHAT_KEY);
    if (!raw) return [];
    const { messages, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > BOT_CHAT_TTL) { localStorage.removeItem(BOT_CHAT_KEY); return []; }
    return messages || [];
  } catch { return []; }
}
const BOT_ACTION_CARDS = [
  { id: 'new-customer',      icon: UserPlus,    title: 'לקוח חדש',   desc: 'קבע תור ללקוח חדש',    prompt: 'אני רוצה לקבוע תור ללקוח חדש שלא ביקר אצלי' },
  { id: 'cancel',            icon: CalendarX2,  title: 'ביטול תור',  desc: 'בטל תור קיים',          prompt: 'אני רוצה לבטל תור קיים' },
  { id: 'existing-customer', icon: CalendarPlus,title: 'לקוח קיים',  desc: 'קבע תור ללקוח חוזר',   prompt: 'אני רוצה לקבוע תור ללקוח שכבר ביקר אצלי' },
];

function CalendarBotPanel({ isNight, onAppointmentChange }) {
  const [messages, setMessages] = useState(() => loadBotChat());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const isEmpty = messages.length === 0;

  const surface  = isNight ? '#0d1117' : '#ffffff';
  const border   = isNight ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  const subtle   = isNight ? 'rgba(255,255,255,0.05)' : '#f3f4f6';
  const muted    = isNight ? 'rgba(255,255,255,0.38)' : '#9ca3af';
  const titleClr = isNight ? '#ffffff' : '#111827';

  useEffect(() => {
    if (messages.length > 0)
      localStorage.setItem(BOT_CHAT_KEY, JSON.stringify({ messages, savedAt: Date.now() }));
  }, [messages]);

  useEffect(() => {
    if (!isEmpty && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, isEmpty]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  }

  async function send(text) {
    const msg = (typeof text === 'string' ? text : input).trim();
    if (!msg || loading) return;
    setInput('');
    setError(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    const userMsg = { role: 'user', content: msg, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const { data } = await api.post('/owner-bot/chat', {
        message: msg,
        history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, id: Date.now() + 1 }]);
      if (data.reply.includes('✓')) onAppointmentChange?.();
    } catch (err) {
      const detail = err?.response?.data?.error || err?.message || '';
      setError(`שגיאה.${detail ? ` (${detail})` : ''}`);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  function resetChat() {
    localStorage.removeItem(BOT_CHAT_KEY);
    setMessages([]);
    setInput('');
    setError(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  const inputRow = (
    <div className="flex items-end gap-2.5 px-4 py-3 rounded-2xl"
      style={{ background: subtle, border: `1px solid ${border}` }}>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={e => { setInput(e.target.value); autoResize(); }}
        onKeyDown={handleKey}
        placeholder="שאל כל דבר..."
        rows={1}
        className="flex-1 bg-transparent resize-none text-sm focus:outline-none leading-relaxed border-0 outline-none"
        style={{ color: titleClr, maxHeight: 100, scrollbarWidth: 'none' }}
      />
      <button
        onClick={() => send(input)}
        disabled={!input.trim() || loading}
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all mb-0.5"
        style={{ background: input.trim() && !loading ? 'linear-gradient(135deg,#f97316,#f43f5e)' : isNight ? 'rgba(255,255,255,0.08)' : '#e5e7eb' }}
      >
        {loading
          ? <Loader2 size={13} className="animate-spin" style={{ color: input.trim() ? '#fff' : muted }} />
          : <ArrowUp size={14} style={{ color: input.trim() && !loading ? '#fff' : muted }} />
        }
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: isNight ? '#0d1117' : '#ffffff' }}>
      {/* Header — centered title + abs-positioned reset button */}
      <div className="relative flex items-center justify-center px-4 py-4 border-b shrink-0"
        style={{ background: surface, borderColor: border }}>
        <div className="text-center">
          <div className="text-base tracking-[0.22em]" style={{ color: titleClr, fontWeight: 600, letterSpacing: '0.22em' }}>TORILI</div>
          <div className="text-[11px] font-normal mt-0.5 tracking-wide" style={{ color: muted }}>עוזר AI</div>
        </div>
        {!isEmpty && (
          <button onClick={resetChat}
            className="absolute left-3 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all hover:opacity-75"
            style={{ color: muted, borderColor: border }}>
            <RotateCcw size={11} />
            שיחה חדשה
          </button>
        )}
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto relative">
        {isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5 pb-6 gap-5">
            <div className="text-center">
              <p className="font-bold text-base mb-1.5" style={{ color: titleClr }}>במה אפשר לעזור?</p>
              <p className="text-sm" style={{ color: muted }}>בחר פעולה או כתוב שאלה חופשית</p>
            </div>
            <div className="flex flex-col gap-2.5 w-full">
              {BOT_ACTION_CARDS.map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.button
                    key={card.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 + i * 0.07 }}
                    onClick={() => send(card.prompt)}
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border text-right transition-all w-full"
                    style={{ background: isNight ? 'rgba(255,255,255,0.04)' : '#ffffff', borderColor: border, cursor: 'pointer' }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: isNight ? 'rgba(249,115,22,0.12)' : '#fff1eb' }}>
                      <Icon size={17} style={{ color: '#f97316' }} />
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <div className="font-bold text-sm" style={{ color: titleClr }}>{card.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: muted }}>{card.desc}</div>
                    </div>
                    <ChevronLeft size={15} style={{ color: muted }} />
                  </motion.button>
                );
              })}
            </div>
            <div className="w-full">{inputRow}</div>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-3" dir="ltr">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.14 }}
                  style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                >
                  {msg.role === 'user' ? (
                    <div className="max-w-[80%] px-3.5 py-2.5 text-sm leading-relaxed" dir="rtl"
                      style={{ background: isNight ? 'rgba(255,255,255,0.09)' : '#f0f0f3', color: isNight ? 'rgba(255,255,255,0.92)' : '#1f2937', borderRadius: '16px 16px 4px 16px' }}>
                      {msg.content}
                    </div>
                  ) : (
                    <div className="max-w-[88%] text-sm leading-relaxed" dir="rtl" style={{ color: isNight ? 'rgba(255,255,255,0.78)' : '#374151' }}>
                      {msg.content.replace(/[■▪▸●►]/g, '•')}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex gap-1.5 items-center py-1 pr-1">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: muted }}
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.16 }} />
                ))}
              </div>
            )}
            {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</div>}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar — visible during conversation */}
      <AnimatePresence>
        {!isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="shrink-0 border-t px-4 py-3"
            style={{ background: surface, borderColor: border }}
          >
            {inputRow}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CalendarPage() {
  const { business } = useAuthStore();
  const { selectedDate, setSelectedDate } = useDashboardStore();
  const { addNotification } = useNotificationStore();
  const isNight = useNightMode();
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [addModalTime, setAddModalTime] = useState(null);
  const [showAiChat, setShowAiChat] = useState(false);
  const queryClient = useQueryClient();
  const appointmentsApi = useAppointmentsApi();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ['appointments', selectedDate],
    queryFn: () => appointmentsApi.list({ date: selectedDate }).then(r => r.data),
    enabled: !!business?.id,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  const handleMobileRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try { await refetch(); } finally { setIsRefreshing(false); }
  }, [refetch]);

  const { data: staffList = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => api.get('/businesses/staff').then(r => r.data),
  });

  // Pre-fetch services so AddAppointmentModal has data immediately when opened
  useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/businesses/services').then(r => r.data),
  });

  const { data: businessHours = [] } = useQuery({
    queryKey: ['business-hours'],
    queryFn: () => api.get('/businesses/hours').then(r => r.data),
  });

  const dateObj = new Date(selectedDate + 'T00:00:00');
  const isTodayFlag = isToday(dateObj);

  const dayOfWeek = dateObj.getDay();
  const dayHours = businessHours.find(h => h.day_of_week === dayOfWeek);
  const isBusinessOpen = dayHours ? dayHours.is_open !== 0 : true;
  const openTime = dayHours?.open_time || '09:00';
  const closeTime = dayHours?.close_time || '20:00';
  const bufferMinutes = business?.buffer_minutes || 30;

  function goDay(offset) {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  }

  function formatHeaderDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return format(d, 'EEEE, d בMMMM', { locale: he });
  }

  const [staffFilter, setStaffFilter] = useState(null); // null = all staff
  // Reset filter when date changes
  useEffect(() => { setStaffFilter(null); }, [selectedDate]);

  const activeAppts = appointments.filter(a => a.status !== 'cancelled');
  const filteredAppts = staffFilter
    ? activeAppts.filter(a => a.staff_id === staffFilter)
    : activeAppts;
  const sortedAppts = [...filteredAppts].sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  // shared staff filter JSX used in both mobile and desktop
  const staffFilterBar = staffList.filter(s => s.is_active).length > 1 ? (
    <div className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      <button
        onClick={() => setStaffFilter(null)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
          staffFilter === null ? 'text-white border-transparent' : isNight ? 'border-white/10 text-gray-400 hover:text-white hover:border-white/20' : 'border-gray-200 text-gray-500 hover:border-[#f97316]/40 hover:text-[#f97316]'
        }`}
        style={staffFilter === null ? { background: 'linear-gradient(135deg,#f97316,#f43f5e)' } : {}}
      >
        הכל
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${staffFilter === null ? 'bg-white/20 text-white' : isNight ? 'bg-white/10 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
          {activeAppts.length}
        </span>
      </button>
      {staffList.filter(s => s.is_active).map(s => {
        const count = activeAppts.filter(a => a.staff_id === s.id).length;
        const isActive = staffFilter === s.id;
        return (
          <button key={s.id} onClick={() => setStaffFilter(isActive ? null : s.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
              isNight ? isActive ? 'border-transparent text-white' : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20' : isActive ? 'border-transparent text-white' : 'border-gray-200 text-gray-600 hover:border-[#f97316]/40 hover:text-[#f97316]'
            }`}
            style={isActive ? { background: s.color || '#f97316' } : {}}
          >
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: isActive ? 'rgba(255,255,255,0.6)' : (s.color || '#f97316') }} />
            {s.name}
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : isNight ? 'bg-white/10 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div className="px-3 pt-3 pb-0 sm:px-6 sm:pt-6 sm:pb-0 h-full flex flex-col" dir="rtl">

      {/* ── Mobile header ──────────────────────────────────────────────────────── */}
      <div className="sm:hidden mb-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1">
            <button onClick={() => goDay(-1)} className={`p-1.5 rounded-xl transition-all active:scale-90 ${isNight ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
              <ChevronRight size={20} />
            </button>
            <div className="flex items-center gap-1.5">
              <span className={`font-black text-lg leading-tight ${isNight ? 'text-white' : 'text-gray-900'}`}>{formatHeaderDate(selectedDate)}</span>
              {isTodayFlag && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#fff1eb', color: '#f97316' }}>היום</span>}
            </div>
            <button onClick={() => goDay(1)} className={`p-1.5 rounded-xl transition-all active:scale-90 ${isNight ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
              <ChevronLeft size={20} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleMobileRefresh} disabled={isRefreshing}
              className={`p-2 rounded-full border transition-all active:scale-90 ${isNight ? 'border-white/10 text-gray-500 hover:text-white' : 'border-gray-200 text-gray-500 hover:border-[#f97316]/40 hover:text-[#f97316]'}`} aria-label="רענן">
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            {!isTodayFlag && (
              <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border"
                style={{ color: '#f43f5e', background: '#fff1eb', borderColor: '#f97316' + '33' }}>
                היום
              </button>
            )}
          </div>
        </div>
        <MobileDateStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
      </div>

      {/* ── Mobile: staff filter + list + FAB ─────────────────────────────────── */}
      <div className="sm:hidden flex-1 flex flex-col min-h-0">
        {staffFilterBar}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-[#f97316]" />
            </div>
          ) : sortedAppts.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Calendar size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-semibold text-base mb-1">אין תורים ביום זה</p>
              <p className="text-gray-400 text-sm mb-5">הוסף תור ידנית או המתן לתורים מהבוט</p>
              <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm px-5 py-2.5">
                <Plus size={15} />הוסף תור
              </button>
            </motion.div>
          ) : (
            <div className="space-y-2.5 pb-24">
              <div className="text-xs text-gray-400 font-medium px-1 mb-1">{sortedAppts.length} תורים</div>
              {sortedAppts.map(appt => <MobileApptCard key={appt.id} appt={appt} onClick={setSelectedAppt} isNight={isNight} />)}
            </div>
          )}
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="fixed bottom-[84px] right-4 w-14 h-14 rounded-full z-40 flex items-center justify-center shadow-xl active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg, #f97316, #f43f5e)', boxShadow: '0 8px 24px rgba(244,63,94,0.4)' }}>
          <Plus size={22} className="text-white" />
        </button>
        <button onClick={() => setShowAiChat(true)}
          className="fixed bottom-[84px] left-4 w-14 h-14 rounded-full z-40 flex items-center justify-center shadow-xl active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>
          <Sparkles size={20} className="text-white" />
        </button>
      </div>

      {/* ── Desktop: 2-column layout ──────────────────────────────────────────── */}
      <div className="hidden sm:flex gap-6 flex-1 min-h-0">

        {/* ── Bot panel — RIGHT (first in RTL flex) ── */}
        <div className={`w-[370px] xl:w-[410px] shrink-0 flex flex-col rounded-t-2xl overflow-hidden border border-b-0`}
          style={{ borderColor: isNight ? 'rgba(255,255,255,0.08)' : '#e5e7eb' }}>
          <CalendarBotPanel
            isNight={isNight}
            onAppointmentChange={() => queryClient.invalidateQueries({ queryKey: ['appointments', selectedDate] })}
          />
        </div>

        {/* ── Calendar column — LEFT (second in RTL flex) ── */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">

          {/* Date navigation header — above the table */}
          <div className="flex items-center justify-between mb-3 gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => goDay(-1)} className={`p-2 rounded-xl border transition-all ${isNight ? 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                <ChevronRight size={17} />
              </button>
              <div className="relative">
                <button onClick={() => setShowDatePicker(v => !v)}
                  className={`flex flex-col items-start px-4 py-2 rounded-xl border transition-all min-w-[190px] ${isNight ? 'border-white/10 hover:border-white/20' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <span className={`font-bold text-base leading-tight ${isNight ? 'text-white' : 'text-gray-900'}`}>
                    {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, d בMMMM yyyy', { locale: he })}
                  </span>
                  {isTodayFlag && (
                    <div className="mt-0.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#fff1eb', color: '#f97316' }}>היום</span>
                    </div>
                  )}
                </button>
                <AnimatePresence>
                  {showDatePicker && (
                    <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}>
                      <DatePickerPopup value={selectedDate} onChange={setSelectedDate} onClose={() => setShowDatePicker(false)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={() => goDay(1)} className={`p-2 rounded-xl border transition-all ${isNight ? 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                <ChevronLeft size={17} />
              </button>
            </div>
            <button onClick={() => { setAddModalTime(null); setShowAddModal(true); }} className="btn-primary text-sm px-4 py-2">
              <Plus size={15} />הוסף תור
            </button>
          </div>

          {/* Staff filter */}
          {staffFilterBar}

          {/* Time grid */}
          <div className={`flex flex-col flex-1 min-h-0 rounded-t-2xl overflow-hidden border border-b-0 ${isNight ? 'border-white/[0.07]' : 'border-gray-200'}`}
            style={{ background: isNight ? '#0d1117' : '#ffffff' }}>
            <div className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${isNight ? 'border-white/[0.06]' : 'border-gray-100'}`}>
              <span className={`font-semibold text-sm ${isNight ? 'text-white' : 'text-gray-800'}`}>
                {!isBusinessOpen ? 'עסק סגור היום' : sortedAppts.length === 0 ? 'אין תורים היום' : `${sortedAppts.length} תורים`}
              </span>
              {sortedAppts.length > 0 && (
                <span style={{ color: isNight ? 'rgba(255,255,255,0.35)' : '#b0b7c3', fontSize: 12 }}>
                  הכנסה צפויה{' '}
                  <span style={{ fontWeight: 700, fontSize: 14, color: isNight ? '#ffffff' : '#374151' }}>
                    ₪{sortedAppts.reduce((s, a) => s + (Number(a.price) || 0), 0).toLocaleString()}
                  </span>
                </span>
              )}
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center flex-1">
                <Loader2 size={28} className="animate-spin text-[#f43f5e]" />
              </div>
            ) : !isBusinessOpen ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center">
                <Lock size={36} className={`mb-3 ${isNight ? 'text-white/10' : 'text-gray-200'}`} />
                <p className={`font-semibold ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>העסק סגור ביום זה</p>
              </div>
            ) : (
              <DesktopTimeGrid
                appointments={sortedAppts}
                isNight={isNight}
                openTime={openTime}
                closeTime={closeTime}
                bufferMinutes={bufferMinutes}
                isTodayFlag={isTodayFlag}
                onApptClick={setSelectedAppt}
                onSlotClick={(time) => { setAddModalTime(time); setShowAddModal(true); }}
              />
            )}
          </div>
        </div>

      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedAppt && (
          <AppointmentModal
            appt={selectedAppt}
            onClose={() => setSelectedAppt(null)}
            onUpdate={() => {
              queryClient.invalidateQueries({ queryKey: ['appointments', selectedDate] });
              setSelectedAppt(null);
            }}
          />
        )}
        {showAddModal && (
          <AddAppointmentModal
            selectedDate={selectedDate}
            initialTime={addModalTime}
            initialStaffId={staffFilter}
            existingAppointments={appointments}
            onClose={() => { setShowAddModal(false); setAddModalTime(null); }}
            onSuccess={() => {
              setShowAddModal(false);
              setAddModalTime(null);
              queryClient.invalidateQueries({ queryKey: ['appointments', selectedDate] });
              addNotification({ title: 'תור נוסף', message: 'תור חדש נקבע בהצלחה', type: 'appointment', read: false });
            }}
          />
        )}
        {showAiChat && (
          <MobileAiChat isNight={isNight} onClose={() => setShowAiChat(false)}
            onAppointmentChange={() => queryClient.invalidateQueries({ queryKey: ['appointments', selectedDate] })} />
        )}
      </AnimatePresence>
    </div>
  );
}
