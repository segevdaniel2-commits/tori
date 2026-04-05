import React, { useState, useEffect, useContext } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Clock, Scissors, Users, CreditCard, Puzzle, QrCode,
  Plus, Trash2, Edit3, Check, X, Loader2, Save, Copy, ExternalLink,
  AlertCircle, ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../store/useStore';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;
import api, { useBusinessApi } from '../../hooks/useApi';

// ─── Night mode context ───────────────────────────────────────────────────────
const NightCtx = React.createContext(false);

function useNightMode() {
  const [isNight, setIsNight] = useState(() => { const h = new Date().getHours(); return h >= 20 || h < 6; });
  useEffect(() => {
    const id = setInterval(() => { const h = new Date().getHours(); setIsNight(h >= 20 || h < 6); }, 60000);
    return () => clearInterval(id);
  }, []);
  return isNight;
}

// ─── Theme helpers ────────────────────────────────────────────────────────────
const inputCls = (n) => n
  ? 'w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#f43f5e]/50 text-sm transition-all'
  : 'w-full px-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#f43f5e]/60 text-sm transition-all shadow-sm';

const labelCls = (n) => n
  ? 'block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide'
  : 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide';

const TABS = [
  { id: 'general',      label: 'כללי',        icon: Building2 },
  { id: 'hours',        label: 'שעות',         icon: Clock },
  { id: 'services',     label: 'שירותים',      icon: Scissors },
  { id: 'staff',        label: 'עובדים',       icon: Users },
  { id: 'billing',      label: 'תשלום',        icon: CreditCard },
  { id: 'integrations', label: 'אינטגרציות',   icon: Puzzle },
  { id: 'qr',           label: 'קוד QR',       icon: QrCode },
];

const DAY_LABELS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const ACCENT = 'from-[#f97316] via-[#f43f5e] to-[#06b6d4]';

const PRESET_SUGGESTIONS = [
  { name: 'תספורת', duration_minutes: 30, price: 60 },
  { name: 'תספורת + זקן', duration_minutes: 45, price: 80 },
  { name: 'זקן', duration_minutes: 20, price: 30 },
  { name: 'פן', duration_minutes: 30, price: 80 },
  { name: 'צבע', duration_minutes: 90, price: 200 },
  { name: 'גוונים', duration_minutes: 120, price: 280 },
  { name: 'החלקה', duration_minutes: 120, price: 350 },
  { name: "ג'ל ציפורניים", duration_minutes: 45, price: 100 },
  { name: 'פדיקור', duration_minutes: 45, price: 80 },
  { name: 'ריסים קלאסי', duration_minutes: 90, price: 200 },
  { name: 'עיצוב גבות', duration_minutes: 30, price: 80 },
  { name: 'עיסוי שוודי', duration_minutes: 60, price: 250 },
  { name: 'טיפול פנים', duration_minutes: 60, price: 200 },
  { name: 'קיסרי', duration_minutes: 60, price: 250 },
  { name: 'הסרה', duration_minutes: 30, price: 40 },
  { name: 'ייעוץ', duration_minutes: 30, price: 0 },
];

const STAFF_COLORS = ['#f97316','#f43f5e','#06b6d4','#8b5cf6','#10b981','#eab308','#ec4899','#14b8a6'];

// ─── Shared Save Button ────────────────────────────────────────────────────────
function SaveBtn({ onClick, saving, saved, label = 'שמור שינויים' }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all bg-gradient-to-r ${ACCENT} shadow-md shadow-[#f43f5e]/20 disabled:opacity-50`}
    >
      {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : <Save size={15} />}
      {saving ? 'שומר...' : saved ? 'נשמר!' : label}
    </button>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  const isNight = useContext(NightCtx);
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition-all shrink-0 relative ${
        value ? 'bg-gradient-to-r from-[#f43f5e] to-[#06b6d4]' : isNight ? 'bg-white/10' : 'bg-gray-200'
      }`}
    >
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${value ? 'right-0.5' : 'left-0.5'}`} />
    </button>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Section({ title, children }) {
  const isNight = useContext(NightCtx);
  return (
    <div className={`border rounded-2xl p-4 space-y-3 ${isNight ? 'border-white/[0.10]' : 'border-gray-300 shadow-sm'}`}>
      {title && <p className={`text-xs font-bold uppercase tracking-widest ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>{title}</p>}
      {children}
    </div>
  );
}

// ─── General Settings ────────────────────────────────────────────────────────
function GeneralSettings() {
  const isNight = useContext(NightCtx);
  const { business, updateBusiness } = useAuthStore();
  const [form, setForm] = useState({
    name: business?.name || '',
    description: business?.description || '',
    address: business?.address || '',
    city: business?.city || '',
    phone: business?.phone || '',
    buffer_minutes: business?.buffer_minutes ?? 15,
    cancellation_hours: business?.cancellation_hours ?? 24,
    bot_tone: business?.bot_tone || 'friendly',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const { data } = await api.put('/businesses/settings', form);
      updateBusiness(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { alert('שגיאה בשמירה'); }
    finally { setSaving(false); }
  }

  const f = (field) => ({ value: form[field], onChange: e => setForm(p => ({ ...p, [field]: e.target.value })) });

  return (
    <div className="space-y-4">
      <Section title="פרטי העסק">
        <div>
          <label className={labelCls(isNight)}>שם העסק</label>
          <input {...f('name')} className={inputCls(isNight)} />
        </div>
        <div>
          <label className={labelCls(isNight)}>תיאור קצר</label>
          <textarea {...f('description')} className={inputCls(isNight) + ' resize-none'} rows={2} placeholder="תיאור שיופיע ללקוחות בבוט..." />
        </div>
      </Section>

      <Section title="מיקום ויצירת קשר">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls(isNight)}>כתובת</label>
            <input {...f('address')} className={inputCls(isNight)} />
          </div>
          <div>
            <label className={labelCls(isNight)}>עיר</label>
            <input {...f('city')} className={inputCls(isNight)} />
          </div>
        </div>
        <div className="max-w-xs">
          <label className={labelCls(isNight)}>טלפון</label>
          <input {...f('phone')} className={inputCls(isNight)} dir="ltr" placeholder="050-0000000" />
        </div>
      </Section>

      <Section title="תזמון תורים">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls(isNight)}>הפסקה בין תורים</label>
            <select value={form.buffer_minutes} onChange={e => setForm(p => ({ ...p, buffer_minutes: Number(e.target.value) }))} className={inputCls(isNight)}>
              {[0,5,10,15,20,30,45,60].map(m => <option key={m} value={m}>{m === 0 ? 'ללא' : `${m} דק׳`}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls(isNight)}>ביטול מינימום</label>
            <select value={form.cancellation_hours} onChange={e => setForm(p => ({ ...p, cancellation_hours: Number(e.target.value) }))} className={inputCls(isNight)}>
              {[1,2,4,8,12,24,48].map(h => <option key={h} value={h}>{h} שעות</option>)}
            </select>
          </div>
        </div>
      </Section>

      <Section title="אופי הבוט">
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'friendly',     label: 'חברי',    desc: 'חם ויומיומי' },
            { id: 'professional', label: 'מקצועי',  desc: 'ברור וממוקד' },
            { id: 'formal',       label: 'רשמי',    desc: 'פורמלי ומנומס' },
          ].map(t => (
            <button key={t.id} type="button" onClick={() => setForm(p => ({ ...p, bot_tone: t.id }))}
              className={`p-3 rounded-xl border text-right transition-all ${
                form.bot_tone === t.id
                  ? 'border-[#f43f5e]/50 bg-[#f43f5e]/10'
                  : isNight
                    ? 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}>
              <div className={`font-bold text-sm ${form.bot_tone === t.id ? 'text-[#f43f5e]' : isNight ? 'text-gray-300' : 'text-gray-700'}`}>{t.label}</div>
              <div className={`text-xs mt-0.5 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>{t.desc}</div>
            </button>
          ))}
        </div>
      </Section>

      <SaveBtn onClick={handleSave} saving={saving} saved={saved} />
    </div>
  );
}

// ─── Hours Settings ──────────────────────────────────────────────────────────
function HoursSettings() {
  const isNight = useContext(NightCtx);
  const businessApi = useBusinessApi();
  const { data: hoursData, isLoading, isError } = useQuery({
    queryKey: ['hours'],
    queryFn: () => businessApi.getHours().then(r => r.data),
    retry: 1,
  });
  const [hours, setHours] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const defaults = DAY_LABELS.map((_, i) => ({
      day_of_week: i, is_open: i < 5,
      open_time: '09:00', close_time: i === 5 ? '14:00' : '20:00',
    }));
    if (hoursData !== undefined && !hours) {
      const arr = hoursData || [];
      setHours(defaults.map(d => {
        const found = arr.find(h => h.day_of_week === d.day_of_week);
        return found ? { ...d, is_open: !!found.is_open, open_time: found.open_time, close_time: found.close_time } : d;
      }));
    } else if (isError && !hours) {
      setHours(defaults);
    }
  }, [hoursData, isError]);

  async function handleSave() {
    setSaving(true);
    try {
      await businessApi.updateHours({ hours });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { alert('שגיאה בשמירה'); }
    finally { setSaving(false); }
  }

  function setDayField(i, field, value) {
    setHours(prev => prev.map((h, j) => j === i ? { ...h, [field]: value } : h));
  }

  if (isLoading && !hours) return (
    <div className="flex justify-center py-10">
      <Loader2 size={24} className="animate-spin text-[#f43f5e]" />
    </div>
  );

  if (!hours) return null;

  const timeCls = isNight
    ? 'border border-white/10 bg-white/5 text-white text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#f43f5e]/50 w-24 text-center'
    : 'border border-gray-300 bg-white text-gray-800 text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#f43f5e]/60 w-24 shadow-sm text-center';

  const dividerCls = isNight ? 'border-white/[0.07]' : 'border-gray-100';

  return (
    <div className="space-y-4">
      {/* Hours table */}
      <div className={`border rounded-2xl overflow-hidden ${isNight ? 'border-white/[0.10]' : 'border-gray-300 shadow-sm'}`}>
        {hours.map((h, i) => (
          <div key={h.day_of_week}
            className={`flex items-center gap-4 px-4 py-3 border-b last:border-0 transition-all ${dividerCls} ${
              !h.is_open ? 'opacity-50' : ''
            } ${isNight ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50/60'}`}
          >
            {/* Toggle */}
            <Toggle value={h.is_open} onChange={v => setDayField(i, 'is_open', v)} />

            {/* Day name */}
            <span className={`font-semibold text-sm w-12 shrink-0 ${isNight ? 'text-white' : 'text-gray-800'}`}>
              {DAY_LABELS[h.day_of_week]}
            </span>

            {/* Time range */}
            <div className="flex items-center gap-2 mr-auto">
              {h.is_open ? (
                <>
                  <input type="time" value={h.open_time}
                    onChange={e => setDayField(i, 'open_time', e.target.value)}
                    className={timeCls} />
                  <span className={`text-xs font-medium ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>עד</span>
                  <input type="time" value={h.close_time}
                    onChange={e => setDayField(i, 'close_time', e.target.value)}
                    className={timeCls} />
                </>
              ) : (
                <span className={`text-sm font-medium ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>סגור</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <SaveBtn onClick={handleSave} saving={saving} saved={saved} label="שמור שעות" />
    </div>
  );
}

// ─── Services Settings ────────────────────────────────────────────────────────
function ServicesSettings() {
  const isNight = useContext(NightCtx);
  const businessApi = useBusinessApi();
  const queryClient = useQueryClient();
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => businessApi.getServices().then(r => r.data),
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [addTab, setAddTab] = useState('custom'); // 'custom' | 'preset'
  const [newService, setNewService] = useState({ name: '', duration_minutes: 30, price: '' });
  const [saving, setSaving] = useState(false);

  const activeServices = services.filter(s => s.is_active);
  const activeNames = new Set(activeServices.map(s => s.name));

  async function quickAdd(preset) {
    if (activeNames.has(preset.name)) return;
    try {
      await businessApi.createService({ ...preset, price: Number(preset.price) });
      queryClient.invalidateQueries(['services']);
    } catch { alert('שגיאה'); }
  }

  async function handleCustomAdd() {
    if (!newService.name || newService.price === '') return;
    setSaving(true);
    try {
      await businessApi.createService({ ...newService, price: Number(newService.price) });
      queryClient.invalidateQueries(['services']);
      setNewService({ name: '', duration_minutes: 30, price: '' });
      setShowAdd(false);
    } catch { alert('שגיאה'); }
    finally { setSaving(false); }
  }

  async function handleUpdate(id) {
    setSaving(true);
    try {
      await businessApi.updateService(id, editForm);
      queryClient.invalidateQueries(['services']);
      setEditingId(null);
    } catch { alert('שגיאה'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('למחוק שירות זה?')) return;
    try {
      await businessApi.deleteService(id);
      queryClient.invalidateQueries(['services']);
    } catch { alert('שגיאה'); }
  }

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[#f43f5e]" /></div>;

  const rowBorder = isNight ? 'border-white/[0.07]' : 'border-gray-100';
  const mutedText = isNight ? 'text-gray-500' : 'text-gray-400';

  return (
    <div className="space-y-4">

      {/* ── Services list ──────────────────────────────────────────────────── */}
      <div className={`border rounded-2xl overflow-hidden ${isNight ? 'border-white/[0.10]' : 'border-gray-300 shadow-sm'}`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${isNight ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-gray-50 border-gray-200'}`}>
          <span className={`font-bold text-sm ${isNight ? 'text-white' : 'text-gray-900'}`}>
            {activeServices.length > 0 ? `${activeServices.length} שירותים` : 'אין שירותים עדיין'}
          </span>
          {!showAdd && (
            <button
              onClick={() => { setShowAdd(true); setAddTab('custom'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r ${ACCENT} transition-all`}
            >
              <Plus size={13} />הוסף שירות
            </button>
          )}
        </div>

        {/* Inline Add form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className={`border-b ${isNight ? 'bg-[#f43f5e]/5 border-white/[0.08]' : 'bg-[#fff1eb] border-gray-200'}`}>
                {/* Tabs */}
                <div className={`flex border-b ${isNight ? 'border-white/[0.06]' : 'border-gray-200'}`}>
                  {[{ id: 'custom', label: 'שירות מותאם' }, { id: 'preset', label: 'מהרשימה' }].map(t => (
                    <button key={t.id} onClick={() => setAddTab(t.id)}
                      className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
                        addTab === t.id
                          ? `bg-gradient-to-r ${ACCENT} text-white`
                          : isNight ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {addTab === 'custom' ? (
                  <div className="p-4 space-y-3">
                    <input
                      value={newService.name}
                      onChange={e => setNewService(f => ({ ...f, name: e.target.value }))}
                      className={inputCls(isNight)}
                      placeholder="שם השירות (למשל: תספורת)"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls(isNight)}>משך (דק׳)</label>
                        <input type="number" min="5" step="5"
                          value={newService.duration_minutes}
                          onChange={e => setNewService(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                          className={inputCls(isNight)} />
                      </div>
                      <div>
                        <label className={labelCls(isNight)}>מחיר (₪)</label>
                        <input type="number" min="0"
                          value={newService.price}
                          onChange={e => setNewService(f => ({ ...f, price: e.target.value }))}
                          className={inputCls(isNight)}
                          placeholder="0" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleCustomAdd} disabled={saving || !newService.name}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${ACCENT} flex items-center justify-center gap-2 disabled:opacity-40`}>
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        הוסף שירות
                      </button>
                      <button onClick={() => setShowAdd(false)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isNight ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-700'}`}>
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {PRESET_SUGGESTIONS.map(p => {
                        const already = activeNames.has(p.name);
                        return (
                          <button key={p.name} onClick={() => { if (!already) { quickAdd(p); setShowAdd(false); } }}
                            disabled={already}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                              already
                                ? 'border-[#f43f5e]/25 bg-[#f43f5e]/8 text-[#f43f5e]/50 cursor-default'
                                : isNight
                                  ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/15 hover:text-white'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-[#f43f5e]/30 hover:bg-[#fff1eb] hover:text-[#f43f5e] shadow-sm'
                            }`}>
                            {already && <Check size={10} />}
                            {p.name}
                            <span className={`font-normal ${already ? 'opacity-40' : isNight ? 'text-gray-500' : 'text-gray-400'}`}>₪{p.price}</span>
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={() => setShowAdd(false)}
                      className={`mt-3 text-xs transition-colors ${isNight ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                      סגור
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Service rows */}
        {activeServices.length === 0 && !showAdd ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${isNight ? 'bg-white/5' : 'bg-gray-100'}`}>
              <Scissors size={22} className={mutedText} />
            </div>
            <p className={`font-semibold text-sm ${isNight ? 'text-gray-400' : 'text-gray-500'}`}>עדיין לא הוספת שירותים</p>
            <p className={`text-xs mt-1 ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>לחץ "הוסף שירות" למעלה כדי להתחיל</p>
          </div>
        ) : (
          activeServices.map((svc, idx) => (
            <div key={svc.id}
              className={`border-b last:border-0 transition-all ${rowBorder} ${
                editingId === svc.id
                  ? isNight ? 'bg-[#f43f5e]/5' : 'bg-[#fff1eb]'
                  : isNight ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'
              }`}>
              {editingId === svc.id ? (
                // Edit mode
                <div className="flex items-center gap-2 px-4 py-3">
                  <input value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className={inputCls(isNight) + ' flex-1 py-2'} />
                  <div className="flex items-center gap-1 shrink-0">
                    <input type="number" value={editForm.duration_minutes}
                      onChange={e => setEditForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                      className={inputCls(isNight) + ' w-16 py-2 text-center'} />
                    <span className={`text-xs shrink-0 ${mutedText}`}>דק׳</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <input type="number" value={editForm.price}
                      onChange={e => setEditForm(f => ({ ...f, price: Number(e.target.value) }))}
                      className={inputCls(isNight) + ' w-20 py-2 text-center'} />
                    <span className={`text-xs shrink-0 ${mutedText}`}>₪</span>
                  </div>
                  <button onClick={() => handleUpdate(svc.id)}
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-[#f43f5e] to-[#06b6d4] flex items-center justify-center text-white shrink-0">
                    <Check size={13} />
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isNight ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                    <X size={13} />
                  </button>
                </div>
              ) : (
                // View mode
                <div className="flex items-center gap-3 px-4 py-3.5">
                  {/* Index number */}
                  <span className={`text-xs font-bold w-5 text-center shrink-0 ${mutedText}`}>{idx + 1}</span>
                  {/* Name */}
                  <span className={`flex-1 font-semibold text-sm ${isNight ? 'text-white' : 'text-gray-900'}`}>{svc.name}</span>
                  {/* Duration pill */}
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${isNight ? 'bg-white/8 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                    {svc.duration_minutes} דק׳
                  </span>
                  {/* Price */}
                  <span className={`font-bold text-sm w-16 text-left shrink-0 ${isNight ? 'text-white' : 'text-gray-900'}`}>
                    ₪{svc.price}
                  </span>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setEditingId(svc.id); setEditForm({ name: svc.name, duration_minutes: svc.duration_minutes, price: svc.price }); }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isNight ? 'hover:bg-white/10 text-gray-500 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}>
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(svc.id)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isNight ? 'hover:bg-red-500/20 text-gray-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Staff Settings ──────────────────────────────────────────────────────────
function StaffSettings() {
  const isNight = useContext(NightCtx);
  const { business } = useAuthStore();
  const businessApi = useBusinessApi();
  const queryClient = useQueryClient();
  const { data: staff = [] } = useQuery({ queryKey: ['staff-full'], queryFn: () => businessApi.getStaff().then(r => r.data) });
  const [newStaff, setNewStaff] = useState({ name: '', role: 'staff', color: STAFF_COLORS[0] });
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!newStaff.name) return;
    setSaving(true);
    try {
      await businessApi.createStaff(newStaff);
      queryClient.invalidateQueries(['staff-full']);
      queryClient.invalidateQueries(['staff']);
      setNewStaff({ name: '', role: 'staff', color: STAFF_COLORS[0] });
      setShowAdd(false);
    } catch { alert('שגיאה'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('להסיר עובד זה?')) return;
    try {
      await businessApi.deleteStaff(id);
      queryClient.invalidateQueries(['staff-full']);
      queryClient.invalidateQueries(['staff']);
    } catch { alert('שגיאה'); }
  }

  return (
    <div className="space-y-3">
      {business?.plan === 'basic' && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold text-amber-600 text-sm">תוכנית Basic: עובד אחד בלבד</div>
            <div className="text-amber-500/70 text-xs mt-0.5">שדרג לתוכנית Business כדי להוסיף עובדים נוספים</div>
          </div>
        </div>
      )}

      {staff.map(s => (
        <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isNight ? 'border-white/[0.08] bg-white/[0.03]' : 'border-gray-200 bg-white'}`}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: s.color }}>
            {s.name?.[0]}
          </div>
          <div className="flex-1">
            <div className={`font-semibold text-sm ${isNight ? 'text-white' : 'text-gray-900'}`}>{s.name}</div>
            <div className={`text-xs ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>{s.role === 'owner' ? 'בעלים' : 'עובד'}</div>
          </div>
          <div className="flex gap-1 shrink-0">
            {STAFF_COLORS.map(c => (
              <div key={c} className="w-4 h-4 rounded-full cursor-pointer transition-all"
                style={{ background: c, outline: s.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
            ))}
          </div>
          {s.role !== 'owner' && (
            <button onClick={() => handleDelete(s.id)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isNight ? 'bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400' : 'bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500'}`}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}

      {showAdd ? (
        <Section title="עובד חדש">
          <div>
            <label className={labelCls(isNight)}>שם</label>
            <input value={newStaff.name} onChange={e => setNewStaff(f => ({ ...f, name: e.target.value }))} className={inputCls(isNight)} placeholder="שם העובד" />
          </div>
          <div>
            <label className={labelCls(isNight)}>צבע יומן</label>
            <div className="flex gap-2 flex-wrap">
              {STAFF_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setNewStaff(f => ({ ...f, color: c }))}
                  className="w-8 h-8 rounded-full transition-all"
                  style={{ background: c, outline: newStaff.color === c ? `3px solid ${c}` : 'none', outlineOffset: 2 }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} disabled={saving}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${ACCENT} flex items-center justify-center gap-2`}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              הוסף עובד
            </button>
            <button onClick={() => setShowAdd(false)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isNight ? 'bg-white/5 border border-white/10 text-gray-500 hover:text-white' : 'bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-700'}`}>
              <X size={14} />
            </button>
          </div>
        </Section>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className={`w-full py-3 rounded-xl border border-dashed text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            isNight ? 'border-white/15 text-gray-500 hover:text-gray-300 hover:border-white/25' : 'border-gray-300 text-gray-400 hover:text-gray-600 hover:border-gray-400'
          }`}>
          <Plus size={15} />
          הוסף עובד
        </button>
      )}
    </div>
  );
}

// ─── Billing Settings ─────────────────────────────────────────────────────────
const PLANS = [
  { id: 'basic',    label: 'Basic',    price: '₪99',  period: '/חודש', highlight: false,
    features: ['עובד אחד', 'תורים ללא הגבלה', 'בוט AI 24/7', 'תזכורות WhatsApp', 'דשבורד ניהול'] },
  { id: 'business', label: 'Business', price: '₪200', period: '/חודש', highlight: true,
    features: ['עד 4 עובדים', 'דוחות מתקדמים', 'גוגל קלנדר', 'חשבוניות ירוקות', 'כל הפיצ׳רים'] },
];

function CheckoutForm({ plan, onSuccess, onCancel }) {
  const isNight = useContext(NightCtx);
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/stripe/subscribe', { plan });
      if (!data.clientSecret) throw new Error('לא התקבל client secret');
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (stripeError) throw new Error(stripeError.message);
      if (paymentIntent?.status === 'succeeded') onSuccess();
    } catch (err) { setError(err.message || 'שגיאה בתשלום'); }
    finally { setLoading(false); }
  }

  const planMeta = PLANS.find(p => p.id === plan);
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-1">
        <span className={`font-semibold ${isNight ? 'text-white' : 'text-gray-900'}`}>{planMeta?.label}</span>
        <span className="font-bold text-[#f43f5e]">{planMeta?.price}{planMeta?.period}</span>
      </div>
      <div className={`border rounded-xl p-4 ${isNight ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
        <CardElement options={{ style: { base: { fontSize: '15px', color: isNight ? '#fff' : '#111827', '::placeholder': { color: '#6b7280' } }, invalid: { color: '#ef4444' } } }} />
      </div>
      {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2"><AlertCircle size={14} />{error}</div>}
      <div className="flex gap-3">
        <button type="submit" disabled={!stripe || loading}
          className={`flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${ACCENT} flex items-center justify-center gap-2 disabled:opacity-50`}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
          {loading ? 'מעבד...' : 'שלם עכשיו'}
        </button>
        <button type="button" onClick={onCancel} className={`px-5 py-3 rounded-xl border text-sm transition-colors ${isNight ? 'border-white/10 text-gray-400 hover:text-white' : 'border-gray-200 text-gray-500 hover:text-gray-700'}`}>ביטול</button>
      </div>
    </form>
  );
}

function BillingSettings() {
  const isNight = useContext(NightCtx);
  const { business, updateBusiness } = useAuthStore();
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [success, setSuccess] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isActive = ['basic', 'business'].includes(business?.plan);
  const isTrial = business?.plan === 'trial';
  const isCancelled = business?.plan === 'cancelled';
  const trialDaysLeft = (() => {
    if (!business?.trial_ends_at) return null;
    return Math.max(0, Math.ceil((new Date(business.trial_ends_at) - new Date()) / 86400000));
  })();

  async function openPortal() {
    setPortalLoading(true);
    try { const { data } = await api.get('/stripe/portal'); window.location.href = data.url; }
    catch { setPortalLoading(false); }
  }
  async function handleCancel() {
    setCancelLoading(true);
    try {
      await api.post('/stripe/cancel');
      updateBusiness({ ...business, plan: 'cancelled', subscription_status: 'cancelled' });
      setConfirmCancel(false);
    } catch {}
    finally { setCancelLoading(false); }
  }
  function handleSuccess() {
    setSuccess(true); setCheckoutPlan(null);
    updateBusiness({ ...business, plan: checkoutPlan, subscription_status: 'active' });
  }

  if (!stripePromise) return (
    <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-6 text-center text-sm text-amber-600">
      Stripe לא מוגדר. הוסף <code className="font-mono bg-amber-500/10 px-1 rounded">VITE_STRIPE_PUBLISHABLE_KEY</code> לקובץ .env
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Current plan */}
      <div className={`rounded-2xl p-5 border ${isActive ? 'border-[#f43f5e]/30 bg-[#f43f5e]/5' : isTrial ? 'border-amber-500/30 bg-amber-500/5' : isNight ? 'border-white/10 bg-white/3' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${isActive ? `bg-gradient-to-r from-[#f43f5e] to-[#06b6d4] text-white` : isTrial ? 'bg-amber-500 text-white' : isNight ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
              {isActive ? (business.plan === 'basic' ? 'Basic' : 'Business') : isTrial ? 'תקופת ניסיון' : 'מנוי לא פעיל'}
            </span>
            <div className={`text-3xl font-black mt-3 ${isNight ? 'text-white' : 'text-gray-900'}`}>
              {isActive ? (business.plan === 'basic' ? '₪99' : '₪200') : isTrial ? 'חינם' : '—'}
              {isActive && <span className={`text-sm font-normal ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>/חודש</span>}
            </div>
            {isTrial && trialDaysLeft !== null && (
              <div className={`text-sm mt-1 font-medium ${trialDaysLeft <= 3 ? 'text-red-500' : 'text-amber-500'}`}>
                {trialDaysLeft === 0 ? 'הניסיון פג היום!' : `${trialDaysLeft} ימים נותרו`}
              </div>
            )}
            {isActive && <div className={`text-sm mt-1 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>מנוי פעיל · חידוש אוטומטי</div>}
          </div>
          {isActive && (
            <button onClick={openPortal} disabled={portalLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all ${isNight ? 'border-white/10 text-gray-400 hover:text-white' : 'border-gray-200 text-gray-500 hover:text-gray-700'}`}>
              {portalLoading ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} />}
              ניהול מנוי
            </button>
          )}
        </div>
      </div>

      {success && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-green-500/10 border border-green-500/25 rounded-xl px-5 py-4 text-green-600 text-sm font-medium">
          <Check size={16} />המנוי הופעל בהצלחה! הבוט שלך פעיל
        </motion.div>
      )}

      {checkoutPlan && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={`border rounded-2xl p-6 ${isNight ? 'border-white/10 bg-white/3' : 'border-gray-200 bg-gray-50'}`}>
          <Elements stripe={stripePromise}>
            <CheckoutForm plan={checkoutPlan} onSuccess={handleSuccess} onCancel={() => setCheckoutPlan(null)} />
          </Elements>
        </motion.div>
      )}

      {!checkoutPlan && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLANS.map(p => {
            const isCurrent = business?.plan === p.id;
            return (
              <div key={p.id} className={`relative rounded-2xl border p-5 flex flex-col ${
                isCurrent ? 'border-[#f43f5e]/40 bg-[#f43f5e]/5' :
                p.highlight ? isNight ? 'border-white/15 bg-white/5' : 'border-gray-200 bg-gray-50' :
                isNight ? 'border-white/[0.08] bg-white/[0.03]' : 'border-gray-200 bg-white'
              }`}>
                {p.highlight && <div className="absolute -top-3 right-5">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full text-white bg-gradient-to-r ${ACCENT}`}>פופולרי</span>
                </div>}
                <div className={`font-bold mb-1 ${isNight ? 'text-white' : 'text-gray-900'}`}>{p.label}</div>
                <div className="flex items-end gap-1 mb-4">
                  <span className={`text-3xl font-black ${isNight ? 'text-white' : 'text-gray-900'}`}>{p.price}</span>
                  <span className={`text-sm mb-1 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>{p.period}</span>
                </div>
                <ul className="space-y-2 mb-5 flex-1">
                  {p.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${isNight ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Check size={13} className="text-[#f43f5e] shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                {isCurrent
                  ? <div className={`w-full text-center py-2.5 rounded-xl text-sm font-semibold ${isNight ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>תוכנית נוכחית</div>
                  : <button onClick={() => { setCheckoutPlan(p.id); setSuccess(false); }}
                      className={`w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${ACCENT} flex items-center justify-center gap-2`}>
                      {isTrial || isCancelled ? 'התחל עכשיו' : 'עבור לתוכנית'}
                    </button>
                }
              </div>
            );
          })}
        </div>
      )}

      {isActive && !checkoutPlan && (
        <div className={`border rounded-xl p-4 ${isNight ? 'border-white/[0.06]' : 'border-gray-100'}`}>
          {confirmCancel ? (
            <div className="space-y-3">
              <p className={`text-sm ${isNight ? 'text-gray-400' : 'text-gray-500'}`}>האם לבטל את המנוי? הבוט יופסק בסוף תקופת החיוב.</p>
              <div className="flex gap-3">
                <button onClick={handleCancel} disabled={cancelLoading}
                  className="flex items-center gap-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl transition-colors">
                  {cancelLoading && <Loader2 size={13} className="animate-spin" />}כן, בטל מנוי
                </button>
                <button onClick={() => setConfirmCancel(false)} className={`px-4 py-2 rounded-xl border text-sm transition-colors ${isNight ? 'border-white/10 text-gray-500 hover:text-white' : 'border-gray-200 text-gray-500 hover:text-gray-700'}`}>חזור</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmCancel(true)} className={`text-sm transition-colors hover:text-red-500 ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>ביטול מנוי</button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Integrations ─────────────────────────────────────────────────────────────
function IntegrationsSettings() {
  const isNight = useContext(NightCtx);
  const { business, updateBusiness } = useAuthStore();
  const queryClient = useQueryClient();

  const [apiKey, setApiKey] = useState(business?.green_invoice_api_key || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const isGreenConnected = !!business?.green_invoice_enabled;

  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [googleNotice, setGoogleNotice] = useState(null);

  const { data: integStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['integrations-status-full'],
    queryFn: () => api.get('/integrations/status').then(r => r.data),
    staleTime: 10_000,
  });

  const isGoogleConnected = !!integStatus?.google_calendar?.connected;
  const googleSyncedAt = integStatus?.google_calendar?.synced_at;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleResult = params.get('google');
    if (!googleResult) return;
    if (googleResult === 'success') {
      const imported = params.get('imported') || '0';
      const customers = params.get('customers') || '0';
      setGoogleNotice({ type: 'success', msg: `יובאו בהצלחה ${imported} תורים ו-${customers} לקוחות חדשים מהיומן!` });
      refetchStatus();
      queryClient.invalidateQueries(['appointments']);
      queryClient.invalidateQueries(['customers']);
    } else {
      setGoogleNotice({ type: 'error', msg: 'החיבור לגוגל נכשל. נסה שוב.' });
    }
    window.history.replaceState({}, '', window.location.pathname + '?tab=integrations');
  }, []);

  async function handleGoogleConnect() {
    setGoogleLoading(true);
    try {
      const { data } = await api.get('/integrations/google/auth');
      window.location.href = data.url;
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'שגיאה לא ידועה';
      setGoogleNotice({ type: 'error', msg: `שגיאה: ${msg}` });
      setGoogleLoading(false);
    }
  }

  async function handleGoogleSync() {
    setGoogleSyncing(true);
    setGoogleNotice(null);
    try {
      const { data } = await api.post('/integrations/google/sync');
      setGoogleNotice({ type: 'success', msg: `סנכרון הושלם — ${data.appointmentsCreated} תורים, ${data.customersCreated} לקוחות חדשים.` });
      refetchStatus();
      queryClient.invalidateQueries(['appointments']);
    } catch {
      setGoogleNotice({ type: 'error', msg: 'הסנכרון נכשל, נסה שוב' });
    } finally { setGoogleSyncing(false); }
  }

  async function handleGoogleDisconnect() {
    await api.delete('/integrations/google');
    setGoogleNotice(null);
    refetchStatus();
  }

  async function handleGreenSave() {
    if (!apiKey.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.put('/businesses/settings', { green_invoice_api_key: apiKey, green_invoice_enabled: 1 });
      updateBusiness(data); setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {}
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      {/* ── Google Calendar */}
      <div className={`border rounded-2xl p-5 transition-all ${isGoogleConnected ? 'border-[#06b6d4]/40 bg-[#06b6d4]/5' : isNight ? 'border-white/[0.10] bg-white/[0.03]' : 'border-gray-300 bg-white shadow-sm'}`}>
        <div className="flex items-start gap-4">
          {/* Google Calendar official logo */}
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm border border-gray-100 overflow-hidden">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Calendar body */}
              <rect x="1" y="3" width="22" height="19" rx="2" fill="white" stroke="#dadce0" strokeWidth="1"/>
              {/* Blue header */}
              <rect x="1" y="3" width="22" height="7" rx="2" fill="#1a73e8"/>
              <rect x="1" y="7" width="22" height="3" fill="#1a73e8"/>
              {/* Ring pegs */}
              <rect x="7" y="1" width="2" height="4" rx="1" fill="#1565c0"/>
              <rect x="15" y="1" width="2" height="4" rx="1" fill="#1565c0"/>
              {/* Day number "31" */}
              <text x="12" y="19" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#1a73e8" fontFamily="Arial,sans-serif">31</text>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-semibold ${isNight ? 'text-white' : 'text-gray-900'}`}>Google Calendar</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isGoogleConnected ? 'bg-[#06b6d4]/15 text-[#06b6d4]' : isNight ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                {isGoogleConnected ? 'מחובר' : 'לא מחובר'}
              </span>
            </div>
            <p className={`text-sm mb-4 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>
              ייבא תורים ולקוחות מהיומן שלך ישירות לטורי — פעם אחת, בלחיצה.
            </p>
            {googleNotice && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl mb-3 border ${
                googleNotice.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}>
                <Check size={14} />{googleNotice.msg}
              </div>
            )}
            {isGoogleConnected ? (
              <div className="space-y-3">
                {googleSyncedAt && (
                  <p className={`text-xs ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>
                    סנכרון אחרון: {new Date(googleSyncedAt).toLocaleString('he-IL')}
                  </p>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <button onClick={handleGoogleSync} disabled={googleSyncing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${ACCENT} disabled:opacity-50`}>
                    {googleSyncing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {googleSyncing ? 'מסנכרן...' : 'סנכרן עכשיו'}
                  </button>
                  <button onClick={handleGoogleDisconnect} className={`text-sm transition-colors hover:text-red-500 ${isNight ? 'text-gray-600' : 'text-gray-400'}`}>נתק</button>
                </div>
              </div>
            ) : (
              <button onClick={handleGoogleConnect} disabled={googleLoading}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all disabled:opacity-50 ${
                  isNight ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white' : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800'
                }`}>
                {googleLoading ? <Loader2 size={15} className="animate-spin" /> : (
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                {googleLoading ? 'מתחבר...' : 'התחבר עם Google'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Green Invoice */}
      <div className={`border rounded-2xl p-5 ${isGreenConnected ? 'border-green-500/40 bg-green-500/5' : isNight ? 'border-white/[0.10] bg-white/[0.03]' : 'border-gray-300 bg-white shadow-sm'}`}>
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm border border-gray-100 overflow-hidden">
            {/* Green Invoice official-style logo */}
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Document */}
              <rect x="3" y="1" width="14" height="18" rx="1.5" fill="white" stroke="#16a34a" strokeWidth="1.5"/>
              {/* Folded corner */}
              <path d="M13 1 L17 5 L13 5 Z" fill="#dcfce7" stroke="#16a34a" strokeWidth="1" strokeLinejoin="round"/>
              {/* Lines */}
              <line x1="6" y1="8" x2="14" y2="8" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="6" y1="11" x2="14" y2="11" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="6" y1="14" x2="10" y2="14" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round"/>
              {/* Green checkmark circle */}
              <circle cx="18" cy="18" r="5.5" fill="#16a34a"/>
              <path d="M15.5 18l1.8 1.8 3.2-3.2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-semibold ${isNight ? 'text-white' : 'text-gray-900'}`}>חשבונית ירוקה</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isGreenConnected ? 'bg-green-500/20 text-green-600' : isNight ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                {isGreenConnected ? 'מחובר' : 'לא מחובר'}
              </span>
            </div>
            <p className={`text-sm mb-4 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>הפק חשבוניות אוטומטיות לכל תור.</p>
            {isGreenConnected ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 px-3 py-2 rounded-xl">
                  <Check size={13} />חשבוניות ירוקות פעילות
                </div>
                <button onClick={() => api.put('/businesses/settings', { green_invoice_enabled: 0 }).then(() => updateBusiness({ ...business, green_invoice_enabled: 0 }))}
                  className={`text-sm transition-colors hover:text-red-500 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>נתק</button>
              </div>
            ) : (
              <div className="space-y-3">
                <input value={apiKey} onChange={e => setApiKey(e.target.value)} className={inputCls(isNight)} placeholder="API Key" dir="ltr" />
                <div className="flex items-center gap-3">
                  <SaveBtn onClick={handleGreenSave} saving={saving} saved={saved} label="חבר חשבונית ירוקה" />
                  <a href="https://app.greeninvoice.co.il" target="_blank" rel="noopener noreferrer"
                    className="text-sm text-[#f43f5e] hover:underline flex items-center gap-1">
                    <ExternalLink size={11} />פתח חשבונית ירוקה
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`border rounded-xl p-4 text-xs ${isNight ? 'border-white/[0.06] text-gray-500' : 'border-gray-100 text-gray-400'}`}>
        <strong className={isNight ? 'text-gray-400' : 'text-gray-500'}>לתמיכה:</strong> עומרי — 050-960-3671 · מרדכי — 058-453-2944
      </div>
    </div>
  );
}

// ─── QR Code ─────────────────────────────────────────────────────────────────
function QRSettings() {
  const isNight = useContext(NightCtx);
  const [copied, setCopied] = useState(false);
  const { data: status } = useQuery({
    queryKey: ['integrations-status'],
    queryFn: () => api.get('/integrations/status').then(r => r.data),
    staleTime: 30_000,
  });

  const phoneId = status?.whatsapp?.phone_id;
  const waLink = phoneId ? `https://wa.me/${String(phoneId).replace(/\D/g, '')}` : null;
  const qrUrl = waLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(waLink)}&color=f43f5e&bgcolor=${isNight ? '08080F' : 'ffffff'}`
    : null;

  function copyLink() {
    if (!waLink) return;
    navigator.clipboard.writeText(waLink);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  if (!waLink) return (
    <div className="space-y-4">
      <div className="border border-amber-500/25 bg-amber-500/5 rounded-2xl p-6 text-center">
        <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <QrCode size={24} className="text-amber-500" />
        </div>
        <h3 className={`font-bold text-lg mb-2 ${isNight ? 'text-white' : 'text-gray-900'}`}>הבוט עדיין לא מחובר</h3>
        <p className={`text-sm mb-2 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>לחיבור הבוט, צור קשר: <strong className={isNight ? 'text-gray-300' : 'text-gray-700'}>050-960-3671</strong></p>
      </div>
      <div className="border border-[#06b6d4]/20 bg-[#06b6d4]/5 rounded-xl p-5">
        <h3 className={`font-semibold mb-2 ${isNight ? 'text-white' : 'text-gray-900'}`}>מה תקבל לאחר החיבור?</h3>
        <ul className={`space-y-1.5 text-sm ${isNight ? 'text-gray-400' : 'text-gray-500'}`}>
          <li>• קוד QR ייחודי לעסק שלך</li>
          <li>• קישור ישיר לשיחה עם הבוט</li>
          <li>• שיתוף בביו אינסטגרם, באתר ובכרטיס ביקור</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className={`border rounded-2xl p-6 text-center ${isNight ? 'border-white/[0.08] bg-white/[0.02]' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex justify-center mb-5">
          <div className={`p-3 rounded-2xl border ${isNight ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
            <img src={qrUrl} alt="קוד QR" width={200} height={200} className="rounded-xl block" />
          </div>
        </div>
        <h3 className={`font-bold text-lg mb-1 ${isNight ? 'text-white' : 'text-gray-900'}`}>קוד QR לבוט</h3>
        <p className={`text-sm mb-4 ${isNight ? 'text-gray-500' : 'text-gray-400'}`}>הלקוחות יסרקו את הקוד כדי לפתוח שיחה</p>
        <div className={`flex items-center gap-2 border rounded-xl p-3 text-sm font-mono mb-4 ${isNight ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`}>
          <span className="flex-1 truncate">{waLink}</span>
          <button onClick={copyLink} className={`p-1.5 rounded-lg transition-all ${isNight ? 'hover:bg-white/10 text-gray-500 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}>
            {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
          </button>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={copyLink}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all ${isNight ? 'border-white/10 text-gray-400 hover:text-white' : 'border-gray-200 text-gray-500 hover:text-gray-700'}`}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'הועתק!' : 'העתק קישור'}
          </button>
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${ACCENT}`}>
            <ExternalLink size={13} />פתח וואטסאפ
          </a>
        </div>
      </div>
      <div className="border border-[#06b6d4]/20 bg-[#06b6d4]/5 rounded-xl p-5">
        <h3 className={`font-semibold mb-2 ${isNight ? 'text-white' : 'text-gray-900'}`}>איך לשתף?</h3>
        <ul className={`space-y-1.5 text-sm ${isNight ? 'text-gray-400' : 'text-gray-500'}`}>
          <li>• שים בביו האינסטגרם</li>
          <li>• הוסף לאתר האינטרנט</li>
          <li>• שלח ללקוחות קיימים</li>
          <li>• הדפס על כרטיס ביקור</li>
        </ul>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const isNight = useNightMode();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    return TABS.find(t => t.id === tab) ? tab : 'general';
  });

  const tabContent = {
    general:      <GeneralSettings />,
    hours:        <HoursSettings />,
    services:     <ServicesSettings />,
    staff:        <StaffSettings />,
    billing:      <BillingSettings />,
    integrations: <IntegrationsSettings />,
    qr:           <QRSettings />,
  };

  return (
    <NightCtx.Provider value={isNight}>
      <div className="p-3 sm:p-6" dir="rtl">
        <h2 className={`text-xl sm:text-2xl font-black mb-4 sm:mb-6 ${isNight ? 'text-white' : 'text-gray-900'}`}>הגדרות</h2>

        {/* Mobile tabs */}
        <div className="sm:hidden mb-4 -mx-3 px-3">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 shrink-0 px-3.5 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${ACCENT} text-white shadow-sm`
                    : isNight ? 'bg-white/5 text-gray-400 border border-white/10' : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}>
                <tab.icon size={14} />{tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:flex gap-5">
          {/* Desktop sidebar */}
          <div className="hidden sm:block w-44 shrink-0">
            <div className={`border rounded-2xl p-2 space-y-0.5 ${isNight ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-gray-50 border-gray-300 shadow-sm'}`}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${ACCENT} text-white shadow-sm`
                      : isNight ? 'text-gray-400 hover:bg-white/[0.06] hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }`}>
                  <tab.icon size={15} />{tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className={`border rounded-2xl p-4 sm:p-6 ${isNight ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-white border-gray-300 shadow-sm'}`}>
                <h3 className={`font-bold text-base sm:text-lg mb-5 ${isNight ? 'text-white' : 'text-gray-900'}`}>
                  {TABS.find(t => t.id === activeTab)?.label}
                </h3>
                {tabContent[activeTab]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </NightCtx.Provider>
  );
}
