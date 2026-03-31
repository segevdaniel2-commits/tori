import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, subDays, parseISO, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  ChevronRight, ChevronLeft, Plus, X, Clock, User, Phone,
  Scissors, Calendar, Loader2, Check, Trash2, Lock
} from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAppointmentsApi, useBusinessApi } from '../../hooks/useApi';
import { useAuthStore, useDashboardStore, useNotificationStore } from '../../store/useStore';
import api from '../../hooks/useApi';

const STATUS_COLORS = {
  confirmed: { bg: 'bg-tori-100', text: 'text-tori-700', border: 'border-tori-300', dot: 'bg-tori-500' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-400' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500' },
};

const STATUS_LABELS = { confirmed: 'מאושר', completed: 'הושלם', cancelled: 'בוטל', pending: 'ממתין' };

const HOURS = Array.from({ length: 24 }, (_, i) => i).filter(h => h >= 7 && h <= 22);

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function AppointmentBlock({ appt, onClick }) {
  const start = appt.starts_at.split('T')[1]?.slice(0, 5) || appt.starts_at.slice(11, 16);
  const startMin = timeToMinutes(start);
  const topOffset = ((startMin - 7 * 60) / 60) * 80;
  const duration = appt.service_duration || 30;
  const height = Math.max((duration / 60) * 80 - 4, 30);
  const colors = STATUS_COLORS[appt.status] || STATUS_COLORS.confirmed;
  const staffColor = appt.staff_color || '#7C3AED';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01, zIndex: 5 }}
      className={`absolute left-2 right-2 rounded-xl px-3 py-2 cursor-pointer ${colors.bg} border ${colors.border} hover:shadow-md transition-all overflow-hidden`}
      style={{
        top: `${topOffset}px`,
        height: `${height}px`,
        borderRightColor: staffColor,
        borderRightWidth: 3,
      }}
      onClick={() => onClick(appt)}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <div className={`font-bold text-xs truncate flex-1 ${colors.text}`}>{appt.customer_name || 'לקוח'}</div>
        <span className={`text-xs opacity-60 shrink-0 ${colors.text}`}>{start}</span>
      </div>
      {height > 38 && (
        <div className={`text-xs opacity-65 truncate mt-0.5 ${colors.text}`}>
          {appt.service_name || appt.staff_name || ''}
        </div>
      )}
    </motion.div>
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
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">פרטי תור</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-tori-50 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-tori-600 flex items-center justify-center text-white font-bold text-lg">
              {(appt.customer_name || 'L')[0]}
            </div>
            <div>
              <div className="font-bold text-gray-900">{appt.customer_name || 'לקוח לא ידוע'}</div>
              {appt.customer_phone && (
                <a href={`tel:${appt.customer_phone}`} className="text-tori-600 text-sm hover:underline flex items-center gap-1">
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

function AddAppointmentModal({ selectedDate, onClose, onSuccess }) {
  const { business } = useAuthStore();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(selectedDate || today);
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [staffId, setStaffId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [time, setTime] = useState('10:00');
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
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
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
                    date === d
                      ? 'bg-tori-600 text-white border-tori-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-tori-300'
                  }`}
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
                <select value={serviceId} onChange={e => setServiceId(e.target.value)} className="form-input">
                  <option value="">בחר שירות</option>
                  {services?.filter(s => s.is_active).map(s => (
                    <option key={s.id} value={s.id}>{s.name} · ₪{s.price}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">עובד</label>
                <select value={staffId} onChange={e => setStaffId(e.target.value)} className="form-input">
                  <option value="">כל עובד</option>
                  {staff?.filter(s => s.is_active).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
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
            <button type="button" onClick={onClose} className="btn-secondary flex-1">ביטול</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {loading ? 'מוסיף...' : 'הוסף תור'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
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
                isSel ? 'bg-tori-600 text-white shadow-sm' :
                isTod ? 'bg-tori-50 text-tori-700 ring-1 ring-tori-300' :
                isPast ? 'text-gray-300 cursor-not-allowed' :
                'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => { onChange(today); onClose(); }}
          className="w-full py-2 text-sm font-semibold text-tori-600 hover:bg-tori-50 rounded-xl transition-colors"
        >
          חזור להיום
        </button>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const { business } = useAuthStore();
  const { selectedDate, setSelectedDate } = useDashboardStore();
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
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

  const dateObj = new Date(selectedDate + 'T00:00:00');
  const isTodayFlag = isToday(dateObj);

  function goDay(offset) {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  }

  function formatHeaderDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return format(d, 'EEEE, d בMMMM yyyy', { locale: he });
  }

  const activeAppts = appointments.filter(a => a.status !== 'cancelled');

  return (
    <div className="p-6 h-full flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goDay(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 border border-gray-200 transition-all"
          >
            <ChevronRight size={17} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDatePicker(v => !v)}
              className="flex flex-col items-start px-4 py-2 rounded-xl hover:bg-gray-50 border border-gray-200 transition-all min-w-[180px]"
            >
              <span className="font-bold text-gray-900 text-base leading-tight">
                {formatHeaderDate(selectedDate)}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                {isTodayFlag && (
                  <span className="bg-tori-100 text-tori-700 text-xs font-bold px-2 py-0.5 rounded-full">היום</span>
                )}
                <span className="text-xs text-gray-400">
                  {activeAppts.length === 0 ? 'אין תורים' : `${activeAppts.length} תורים`}
                </span>
              </div>
            </button>

            <AnimatePresence>
              {showDatePicker && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                >
                  <DatePickerPopup
                    value={selectedDate}
                    onChange={setSelectedDate}
                    onClose={() => setShowDatePicker(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => goDay(1)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 border border-gray-200 transition-all"
          >
            <ChevronLeft size={17} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!isTodayFlag && (
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all"
            >
              היום
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-sm px-4 py-2"
          >
            <Plus size={15} />
            הוסף תור
          </button>
        </div>
      </div>

      {/* Staff filter tabs */}
      {staffList.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {staffList.filter(s => s.is_active).map(s => (
            <button
              key={s.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-tori-300 hover:text-tori-600 whitespace-nowrap transition-all"
            >
              <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={32} className="animate-spin text-tori-400" />
          </div>
        ) : (
          <div className="flex h-full overflow-y-auto">
            {/* Time labels */}
            <div className="w-16 border-l border-gray-100 shrink-0">
              {HOURS.map(h => (
                <div key={h} className="h-20 flex items-start justify-center pt-1">
                  <span className="text-xs text-gray-400 font-medium">{String(h).padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div className="flex-1 relative">
              {/* Hour lines */}
              {HOURS.map(h => (
                <div key={h} className="h-20 border-b border-gray-50">
                  <div className="h-10 border-b border-gray-50 border-dashed" />
                </div>
              ))}

              {/* Current time line */}
              {isTodayFlag && (() => {
                const now = new Date();
                const nowMin = now.getHours() * 60 + now.getMinutes();
                const top = ((nowMin - 7 * 60) / 60) * 80;
                return (
                  <div
                    className="absolute left-0 right-0 flex items-center z-10 pointer-events-none"
                    style={{ top: `${top}px` }}
                  >
                    <div className="w-3 h-3 rounded-full bg-coral-500 -ml-1.5" />
                    <div className="flex-1 h-0.5 bg-coral-500" />
                  </div>
                );
              })()}

              {/* Appointments */}
              <div className="absolute inset-0 pointer-events-none">
                {activeAppts.map(appt => (
                  <div key={appt.id} className="pointer-events-auto">
                    <AppointmentBlock appt={appt} onClick={setSelectedAppt} />
                  </div>
                ))}
              </div>

              {/* Empty state */}
              {activeAppts.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <Calendar size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">אין תורים ביום זה</p>
                    <p className="text-gray-300 text-sm">התורים יופיעו כאן</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
            onClose={() => setShowAddModal(false)}
            onSuccess={() => { setShowAddModal(false); refetch(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
