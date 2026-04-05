import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, subDays, parseISO, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  ChevronRight, ChevronLeft, ChevronDown, Plus, X, Clock, User, Phone,
  Scissors, Calendar, Loader2, Check, Trash2, Lock
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
  const [status, setStatus] = useState(appt.status);
  const [updating, setUpdating] = useState(false);
  const appointmentsApi = useAppointmentsApi();

  const start = appt.starts_at.split('T')[1]?.slice(0, 5) || appt.starts_at.slice(11, 16);
  const end = appt.ends_at?.split('T')[1]?.slice(0, 5) || appt.ends_at?.slice(11, 16);
  const dateStr = appt.starts_at.split('T')[0];

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
          <div className="flex items-center gap-3 p-4 bg-[#fff1eb] rounded-xl">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: 'linear-gradient(135deg,#f97316,#f43f5e)' }}>
              {(appt.customer_name || 'L')[0]}
            </div>
            <div>
              <div className="font-bold text-gray-900">{appt.customer_name || 'לקוח לא ידוע'}</div>
              {appt.customer_phone && (
                <a href={`tel:${appt.customer_phone}`} className="text-[#f43f5e] text-sm hover:underline flex items-center gap-1">
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
              <div className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Scissors size={11} /> שירות</div>
              <div className="font-semibold text-gray-900 text-sm">{appt.service_name || '-'}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-gray-500 text-xs mb-1 flex items-center gap-1"><User size={11} /> עובד</div>
              <div className="font-semibold text-gray-900 text-sm">{appt.staff_name || '-'}</div>
            </div>
          </div>

          {appt.price && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex justify-between items-center">
              <span className="text-green-700 font-semibold">מחיר</span>
              <span className="text-green-800 font-black text-lg">₪{appt.price}</span>
            </div>
          )}

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
                onClick={() => { handleStatusChange('cancelled'); onCancel && onCancel(); }}
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

function AddAppointmentModal({ selectedDate, initialTime, onClose, onSuccess }) {
  const { business } = useAuthStore();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(selectedDate || today);
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [staffId, setStaffId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [time, setTime] = useState(initialTime || '10:00');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      const owner = staff.find(s => s.role === 'owner') || staff[0];
      if (owner) setStaffId(String(owner.id));
    }
  }, [staff]);

  useEffect(() => {
    if (services && services.length > 0 && !serviceId) {
      if (services[0]) setServiceId(String(services[0].id));
    }
  }, [services]);

  const selectedService = services?.find(s => s.id === Number(serviceId));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!customerName && !customerId) { setError('הכנס שם לקוח'); return; }
    if (!time) { setError('בחר שעה'); return; }
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
      const endsAt = endDate.toISOString().slice(0, 19);

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
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-xl">{error}</div>}

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
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="form-input" />
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
  const slots = [];
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  const openTotal = openH * 60 + openM;
  const closeTotal = closeH * 60 + closeM;
  for (let t = openTotal; t < closeTotal; t += bufferMinutes) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }

  const apptByTime = {};
  appointments.forEach(a => {
    const time = (a.starts_at.split('T')[1] || a.starts_at.slice(11)).slice(0, 5);
    apptByTime[time] = a;
  });

  const now = new Date();
  const nowStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const occupied = new Set();
  const statusMap = isNight ? STATUS_LABELS_NIGHT : STATUS_LABELS_DAY;
  const dividerColor = isNight ? 'rgba(255,255,255,0.04)' : '#f3f4f6';

  return (
    <div className="flex-1 overflow-y-auto">
      {slots.map((slotTime, idx) => {
        if (occupied.has(slotTime)) return null;

        const appt = apptByTime[slotTime];
        const isNowSlot = isTodayFlag && slotTime <= nowStr && nowStr < (slots[idx + 1] || '24:00');
        const isPast = isTodayFlag && slotTime < nowStr && !appt;

        if (appt) {
          const duration = appt.service_duration || bufferMinutes;
          const [sh, sm] = slotTime.split(':').map(Number);
          const endTotal = sh * 60 + sm + duration;
          const endH = Math.floor(endTotal / 60);
          const endM = endTotal % 60;
          const endTimeStr = `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;
          // Mark all covered slots as occupied
          for (let t = sh * 60 + sm + bufferMinutes; t < endTotal; t += bufferMinutes) {
            const h2 = Math.floor(t / 60); const m2 = t % 60;
            occupied.add(`${String(h2).padStart(2,'0')}:${String(m2).padStart(2,'0')}`);
          }
          const st = statusMap[appt.status] || statusMap.confirmed;
          const rowHeight = Math.max(64, Math.round(duration / bufferMinutes) * 56);

          return (
            <div key={slotTime} className="flex items-stretch cursor-pointer group" style={{ minHeight: rowHeight, borderBottom: `1px solid ${dividerColor}` }} onClick={() => onApptClick(appt)}>
              <div className="w-16 shrink-0 flex flex-col items-end justify-start pr-3 pt-3" style={{ borderLeft: `1px solid ${dividerColor}` }}>
                <span className={`text-xs font-bold ${isNight ? 'text-white' : 'text-gray-800'}`}>{slotTime}</span>
                <span className={`text-[10px] mt-0.5 ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>{endTimeStr}</span>
              </div>
              <div
                className="flex-1 mx-3 my-2 rounded-xl px-3 py-2 flex items-center gap-3 transition-all group-hover:brightness-95"
                style={{
                  background: isNight ? 'rgba(249,115,22,0.10)' : '#fff7ed',
                  borderRight: `3px solid ${appt.staff_color || '#f97316'}`,
                  border: `1px solid ${isNight ? 'rgba(249,115,22,0.15)' : '#f97316'}33`,
                  borderRight: `3px solid ${appt.staff_color || '#f97316'}`,
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm truncate ${isNight ? 'text-white' : 'text-gray-900'}`}>{appt.customer_name || 'לקוח'}</div>
                  <div className={`text-xs mt-0.5 ${isNight ? 'text-gray-400' : 'text-gray-500'}`}>
                    {[appt.service_name, `${duration} דק׳`, appt.staff_name].filter(Boolean).join(' · ')}
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
        }

        // Empty slot
        return (
          <div
            key={slotTime}
            className={`flex items-center group ${isPast ? 'cursor-default' : 'cursor-pointer'}`}
            style={{ minHeight: 56, borderBottom: `1px solid ${dividerColor}`, opacity: isPast ? 0.45 : 1 }}
            onClick={() => !isPast && onSlotClick(slotTime)}
          >
            <div className="w-16 shrink-0 flex items-center justify-end pr-3" style={{ height: '100%', borderLeft: `1px solid ${dividerColor}` }}>
              <span className={`text-xs font-medium ${isNowSlot ? 'text-[#f43f5e] font-bold' : isNight ? 'text-gray-600' : 'text-gray-400'}`}>{slotTime}</span>
            </div>
            <div className={`flex-1 mx-3 rounded-xl flex items-center justify-center transition-all ${isPast ? '' : isNight ? 'group-hover:bg-white/[0.03]' : 'group-hover:bg-[#fff7ed]'}`} style={{ height: 40 }}>
              {!isPast && (
                <span className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Plus size={11} />
                  קבע תור
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

// ─── Mobile appointment card ──────────────────────────────────────────────────
function MobileApptCard({ appt, onClick }) {
  const start = appt.starts_at.split('T')[1]?.slice(0, 5) || appt.starts_at.slice(11, 16);
  const end = appt.ends_at?.split('T')[1]?.slice(0, 5) || appt.ends_at?.slice(11, 16);
  const colors = STATUS_COLORS[appt.status] || STATUS_COLORS.confirmed;
  const staffColor = appt.staff_color || '#f97316';

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(appt)}
      className={`w-full text-right flex items-stretch gap-0 rounded-2xl border overflow-hidden shadow-sm active:shadow-none transition-shadow ${colors.bg} ${colors.border}`}
    >
      {/* Left accent bar (RTL → rendered on left) */}
      <div className="w-1 shrink-0 rounded-r-full" style={{ background: staffColor }} />

      <div className="flex-1 px-4 py-3 flex items-center gap-3">
        {/* Time column */}
        <div className="shrink-0 text-center min-w-[48px]">
          <div className={`font-black text-base leading-tight ${colors.text}`}>{start}</div>
          {end && <div className={`text-xs opacity-60 ${colors.text}`}>{end}</div>}
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-black/10 shrink-0" />

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
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today + 'T00:00:00');
    d.setDate(d.getDate() + i - 1); // -1 so today is 2nd item
    return d.toISOString().split('T')[0];
  });
  const DAY_SHORT = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 px-1" style={{ scrollbarWidth: 'none' }}>
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

export default function CalendarPage() {
  const { business } = useAuthStore();
  const { selectedDate, setSelectedDate } = useDashboardStore();
  const isNight = useNightMode();
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [addModalTime, setAddModalTime] = useState(null);
  const queryClient = useQueryClient();
  const appointmentsApi = useAppointmentsApi();

  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ['appointments', selectedDate],
    queryFn: () => appointmentsApi.list({ date: selectedDate }).then(r => r.data),
    enabled: !!business?.id,
  });

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

  const activeAppts = appointments.filter(a => a.status !== 'cancelled');
  const sortedAppts = [...activeAppts].sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  return (
    <div className="p-3 sm:p-6 h-full flex flex-col" dir="rtl">

      {/* ── Desktop header ─────────────────────────────────────────────────────── */}
      <div className="hidden sm:flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => goDay(1)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 border border-gray-200 transition-all">
            <ChevronRight size={17} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDatePicker(v => !v)}
              className="flex flex-col items-start px-4 py-2 rounded-xl hover:bg-gray-50 border border-gray-200 transition-all min-w-[180px]"
            >
              <span className="font-bold text-gray-900 text-base leading-tight">
                {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, d בMMMM yyyy', { locale: he })}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                {isTodayFlag && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#fff1eb', color: '#f97316' }}>היום</span>}
                <span className="text-xs text-gray-400">{activeAppts.length === 0 ? 'אין תורים' : `${activeAppts.length} תורים`}</span>
              </div>
            </button>
            <AnimatePresence>
              {showDatePicker && (
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}>
                  <DatePickerPopup value={selectedDate} onChange={setSelectedDate} onClose={() => setShowDatePicker(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => goDay(-1)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 border border-gray-200 transition-all">
            <ChevronLeft size={17} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isTodayFlag && (
            <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all">
              היום
            </button>
          )}
          <button onClick={() => { setAddModalTime(null); setShowAddModal(true); }} className="btn-primary text-sm px-4 py-2">
            <Plus size={15} />
            הוסף תור
          </button>
        </div>
      </div>

      {/* ── Mobile header ──────────────────────────────────────────────────────── */}
      <div className="sm:hidden mb-3">
        {/* Month + add button row */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div>
            <span className="font-black text-gray-900 text-xl">{formatHeaderDate(selectedDate)}</span>
            {isTodayFlag && <span className="mr-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#fff1eb', color: '#f97316' }}>היום</span>}
          </div>
          {!isTodayFlag && (
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border"
              style={{ color: '#f43f5e', background: '#fff1eb', borderColor: '#f97316' + '33' }}
            >
              היום
            </button>
          )}
        </div>
        {/* Swipeable date strip */}
        <MobileDateStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
      </div>

      {/* Staff filter tabs (shared desktop + mobile) */}
      {staffList.length > 1 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {staffList.filter(s => s.is_active).map(s => (
            <button key={s.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-[#f97316]/40 hover:text-[#f97316] whitespace-nowrap transition-all">
              <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Mobile list view ──────────────────────────────────────────────────── */}
      <div className="sm:hidden flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[#f97316]" />
          </div>
        ) : sortedAppts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Calendar size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-semibold text-base mb-1">אין תורים ביום זה</p>
            <p className="text-gray-400 text-sm mb-5">הוסף תור ידנית או המתן לתורים מהבוט</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary text-sm px-5 py-2.5"
            >
              <Plus size={15} />
              הוסף תור
            </button>
          </motion.div>
        ) : (
          <div className="space-y-2.5 pb-24">
            <div className="text-xs text-gray-400 font-medium px-1 mb-1">
              {sortedAppts.length} תורים
            </div>
            {sortedAppts.map((appt, i) => (
              <MobileApptCard key={appt.id} appt={appt} onClick={setSelectedAppt} />
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop time grid ───────────────────────────────────────────────── */}
      <div
        className={`hidden sm:flex flex-col flex-1 rounded-2xl overflow-hidden border ${isNight ? 'border-white/[0.07]' : 'border-gray-200'}`}
        style={{ background: isNight ? '#0d1117' : '#ffffff' }}
      >
        {/* Summary bar */}
        <div className={`flex items-center justify-between px-5 py-3 border-b shrink-0 ${isNight ? 'border-white/[0.06]' : 'border-gray-100'}`}>
          <span className={`font-bold text-sm ${isNight ? 'text-white' : 'text-gray-900'}`}>
            {!isBusinessOpen ? 'עסק סגור היום' : activeAppts.length === 0 ? 'אין תורים' : `${activeAppts.length} תורים`}
          </span>
          {activeAppts.length > 0 && (
            <span className={`text-sm ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>
              הכנסה צפויה:{' '}
              <span className={`font-bold ${isNight ? 'text-white' : 'text-gray-900'}`}>
                ₪{activeAppts.reduce((s, a) => s + (Number(a.price) || 0), 0).toLocaleString()}
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

      {/* ── Mobile FAB ────────────────────────────────────────────────────────── */}
      {sortedAppts.length > 0 && (
        <button
          onClick={() => setShowAddModal(true)}
          className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 btn-primary shadow-2xl text-sm px-6 py-3.5 rounded-full z-40 flex items-center gap-2"
        >
          <Plus size={17} />
          הוסף תור
        </button>
      )}

      {/* Modals */}
      <AnimatePresence>
        {selectedAppt && (
          <AppointmentModal
            appt={selectedAppt}
            onClose={() => setSelectedAppt(null)}
            onUpdate={() => { refetch(); setSelectedAppt(null); }}
            onCancel={() => { refetch(); setSelectedAppt(null); }}
          />
        )}
        {showAddModal && (
          <AddAppointmentModal
            selectedDate={selectedDate}
            initialTime={addModalTime}
            onClose={() => { setShowAddModal(false); setAddModalTime(null); }}
            onSuccess={() => { setShowAddModal(false); setAddModalTime(null); refetch(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
