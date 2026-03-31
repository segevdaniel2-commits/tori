import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Clock, Scissors, Users, CreditCard, Puzzle, QrCode,
  Plus, Trash2, Edit3, Check, X, Loader2, Save, Copy, ExternalLink,
  ChevronDown, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/useStore';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;
import api, { useBusinessApi } from '../../hooks/useApi';

const TABS = [
  { id: 'general', label: 'כללי', icon: Building2 },
  { id: 'hours', label: 'שעות', icon: Clock },
  { id: 'services', label: 'שירותים', icon: Scissors },
  { id: 'staff', label: 'עובדים', icon: Users },
  { id: 'billing', label: 'תשלום', icon: CreditCard },
  { id: 'integrations', label: 'אינטגרציות', icon: Puzzle },
  { id: 'qr', label: 'קוד QR', icon: QrCode },
];

const DAY_LABELS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

// ─── General Settings ────────────────────────────────────────────────────────
function GeneralSettings() {
  const { business, updateBusiness } = useAuthStore();
  const [form, setForm] = useState({
    name: business?.name || '',
    description: business?.description || '',
    address: business?.address || '',
    city: business?.city || '',
    phone: business?.phone || '',
    buffer_minutes: business?.buffer_minutes || 15,
    cancellation_hours: business?.cancellation_hours || 24,
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
    } catch (err) {
      alert('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Business identity */}
      <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">פרטי העסק</p>
        <div>
          <label className="form-label">שם העסק</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="form-input" />
        </div>
        <div>
          <label className="form-label">תיאור קצר</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="form-input resize-none" rows={2} placeholder="תיאור שיופיע ללקוחות בבוט..." />
        </div>
      </div>

      {/* Location + phone */}
      <div className="border border-gray-200 rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">מיקום ויצירת קשר</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">כתובת</label>
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="form-input" />
          </div>
          <div>
            <label className="form-label">עיר</label>
            <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="form-input" />
          </div>
          <div className="col-span-2">
            <label className="form-label">טלפון עסק</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="form-input" dir="ltr" />
          </div>
        </div>
      </div>

      {/* Scheduling */}
      <div className="border border-gray-200 rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">תזמון תורים</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">זמן בין תורים (דק׳)</label>
            <select value={form.buffer_minutes} onChange={e => setForm(f => ({ ...f, buffer_minutes: Number(e.target.value) }))} className="form-input">
              {[0, 5, 10, 15, 20, 30, 45, 60].map(m => <option key={m} value={m}>{m === 0 ? 'ללא הפסקה' : `${m} דקות`}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">שעות לביטול מראש</label>
            <select value={form.cancellation_hours} onChange={e => setForm(f => ({ ...f, cancellation_hours: Number(e.target.value) }))} className="form-input">
              {[1, 2, 4, 8, 12, 24, 48].map(h => <option key={h} value={h}>{h} שעות</option>)}
            </select>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
        {saving ? 'שומר...' : saved ? 'נשמר!' : 'שמור שינויים'}
      </button>
    </div>
  );
}

// ─── Hours Settings ──────────────────────────────────────────────────────────
function HoursSettings() {
  const businessApi = useBusinessApi();
  const { data: hoursData, isLoading } = useQuery({ queryKey: ['hours'], queryFn: () => businessApi.getHours().then(r => r.data) });
  const [hours, setHours] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hoursData && !hours) {
      const defaults = DAY_LABELS.map((label, i) => ({ day_of_week: i, is_open: i < 5, open_time: '09:00', close_time: i === 5 ? '14:00' : '20:00' }));
      setHours(defaults.map(d => {
        const found = hoursData.find(h => h.day_of_week === d.day_of_week);
        return found ? { ...d, is_open: !!found.is_open, open_time: found.open_time, close_time: found.close_time } : d;
      }));
    }
  }, [hoursData]);

  async function handleSave() {
    setSaving(true);
    try {
      await businessApi.updateHours({ hours });
    } catch (err) {
      alert('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !hours) return <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-tori-400" /></div>;

  return (
    <div className="space-y-3">
      {hours.map((h, i) => (
        <div key={h.day_of_week} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${h.is_open ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
          <button
            onClick={() => setHours(prev => prev.map((d, j) => j === i ? { ...d, is_open: !d.is_open } : d))}
            className={`w-11 h-6 rounded-full transition-all shrink-0 ${h.is_open ? 'bg-tori-600' : 'bg-gray-300'} relative`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${h.is_open ? 'right-0.5' : 'left-0.5'}`} />
          </button>
          <span className="font-semibold text-gray-900 w-16">{DAY_LABELS[h.day_of_week]}</span>
          {h.is_open ? (
            <div className="flex items-center gap-2">
              <input type="time" value={h.open_time} onChange={e => setHours(prev => prev.map((d, j) => j === i ? { ...d, open_time: e.target.value } : d))} className="form-input py-2 w-32" />
              <span className="text-gray-400">עד</span>
              <input type="time" value={h.close_time} onChange={e => setHours(prev => prev.map((d, j) => j === i ? { ...d, close_time: e.target.value } : d))} className="form-input py-2 w-32" />
            </div>
          ) : (
            <span className="text-gray-400 text-sm">סגור</span>
          )}
        </div>
      ))}
      <button onClick={handleSave} disabled={saving} className="btn-primary mt-2">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? 'שומר...' : 'שמור שעות'}
      </button>
    </div>
  );
}

// ─── Services Settings ───────────────────────────────────────────────────────
function ServicesSettings() {
  const businessApi = useBusinessApi();
  const queryClient = useQueryClient();
  const { data: services = [], isLoading } = useQuery({ queryKey: ['services'], queryFn: () => businessApi.getServices().then(r => r.data) });
  const [editingId, setEditingId] = useState(null);
  const [newService, setNewService] = useState({ name: '', duration_minutes: 30, price: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({});

  async function handleAdd() {
    if (!newService.name || newService.price === '') return;
    setSaving(true);
    try {
      await businessApi.createService({ ...newService, price: Number(newService.price) });
      queryClient.invalidateQueries(['services']);
      setNewService({ name: '', duration_minutes: 30, price: '' });
      setShowAdd(false);
    } catch (err) { alert('שגיאה'); }
    finally { setSaving(false); }
  }

  async function handleUpdate(id) {
    setSaving(true);
    try {
      await businessApi.updateService(id, editForm);
      queryClient.invalidateQueries(['services']);
      setEditingId(null);
    } catch (err) { alert('שגיאה'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('למחוק שירות זה?')) return;
    try {
      await businessApi.deleteService(id);
      queryClient.invalidateQueries(['services']);
    } catch (err) { alert('שגיאה'); }
  }

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-tori-400" /></div>;

  return (
    <div className="space-y-3">
      {services.filter(s => s.is_active).map(svc => (
        <div key={svc.id} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-tori-200 transition-all">
          {editingId === svc.id ? (
            <>
              <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="form-input flex-1 py-2 text-sm" />
              <input type="number" value={editForm.duration_minutes} onChange={e => setEditForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} className="form-input w-20 py-2 text-sm" />
              <span className="text-gray-400 text-sm">דק׳</span>
              <input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: Number(e.target.value) }))} className="form-input w-20 py-2 text-sm" />
              <span className="text-gray-400 text-sm">₪</span>
              <button onClick={() => handleUpdate(svc.id)} className="p-2 bg-tori-100 text-tori-600 rounded-lg hover:bg-tori-200"><Check size={16} /></button>
              <button onClick={() => setEditingId(null)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><X size={16} /></button>
            </>
          ) : (
            <>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{svc.name}</div>
                <div className="text-gray-500 text-sm">{svc.duration_minutes} דק׳ • ₪{svc.price}</div>
              </div>
              <button onClick={() => { setEditingId(svc.id); setEditForm({ name: svc.name, duration_minutes: svc.duration_minutes, price: svc.price }); }} className="p-2 text-gray-400 hover:text-tori-600 hover:bg-tori-50 rounded-lg">
                <Edit3 size={16} />
              </button>
              <button onClick={() => handleDelete(svc.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      ))}

      {showAdd ? (
        <div className="p-4 bg-tori-50 border border-tori-200 rounded-xl space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <input value={newService.name} onChange={e => setNewService(f => ({ ...f, name: e.target.value }))} className="form-input text-sm col-span-3" placeholder="שם שירות" />
            <div>
              <input type="number" value={newService.duration_minutes} onChange={e => setNewService(f => ({ ...f, duration_minutes: Number(e.target.value) }))} className="form-input text-sm" placeholder="משך (דק׳)" />
            </div>
            <div>
              <input type="number" value={newService.price} onChange={e => setNewService(f => ({ ...f, price: e.target.value }))} className="form-input text-sm" placeholder="מחיר ₪" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1 py-2 text-sm">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </button>
              <button onClick={() => setShowAdd(false)} className="btn-secondary py-2 px-3 text-sm">
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="btn-secondary w-full justify-center py-3 border-dashed">
          <Plus size={16} />
          הוסף שירות
        </button>
      )}
    </div>
  );
}

// ─── Staff Settings ──────────────────────────────────────────────────────────
function StaffSettings() {
  const { business } = useAuthStore();
  const businessApi = useBusinessApi();
  const queryClient = useQueryClient();
  const { data: staff = [] } = useQuery({ queryKey: ['staff-full'], queryFn: () => businessApi.getStaff().then(r => r.data) });
  const [newStaff, setNewStaff] = useState({ name: '', role: 'staff', color: '#7C3AED' });
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const isPlan = business?.plan === 'business' || (business?.plan === 'trial');

  async function handleAdd() {
    if (!newStaff.name) return;
    setSaving(true);
    try {
      await businessApi.createStaff(newStaff);
      queryClient.invalidateQueries(['staff-full']);
      queryClient.invalidateQueries(['staff']);
      setNewStaff({ name: '', role: 'staff', color: '#7C3AED' });
      setShowAdd(false);
    } catch (err) { alert('שגיאה'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('להסיר עובד זה?')) return;
    try {
      await businessApi.deleteStaff(id);
      queryClient.invalidateQueries(['staff-full']);
      queryClient.invalidateQueries(['staff']);
    } catch (err) { alert('שגיאה'); }
  }

  return (
    <div className="space-y-4">
      {business?.plan === 'basic' && !isPlan && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-800 text-sm">תוכנית Basic: עובד אחד בלבד</div>
            <div className="text-amber-700 text-xs mt-0.5">שדרג לתוכנית Business כדי להוסיף עובדים נוספים</div>
          </div>
        </div>
      )}

      {staff.map(s => (
        <div key={s.id} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: s.color }}>
            {s.name[0]}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{s.name}</div>
            <div className="text-gray-400 text-sm">{s.role === 'owner' ? 'בעלים' : 'עובד'}</div>
          </div>
          <input type="color" value={s.color} className="w-8 h-8 rounded-lg border-0 cursor-pointer" />
          {s.role !== 'owner' && (
            <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}

      {showAdd ? (
        <div className="p-4 bg-tori-50 border border-tori-200 rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={newStaff.name} onChange={e => setNewStaff(f => ({ ...f, name: e.target.value }))} className="form-input text-sm" placeholder="שם עובד" />
            <input type="color" value={newStaff.color} onChange={e => setNewStaff(f => ({ ...f, color: e.target.value }))} className="form-input text-sm h-11 cursor-pointer" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1 py-2 text-sm">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              הוסף
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary py-2 px-3 text-sm"><X size={14} /></button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="btn-secondary w-full justify-center py-3 border-dashed">
          <Plus size={16} />
          הוסף עובד
        </button>
      )}
    </div>
  );
}

// ─── Billing Settings ────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'basic',
    label: 'Basic',
    price: '₪89',
    period: '/חודש',
    features: ['עובד אחד', 'תורים ללא הגבלה', 'בוט AI 24/7', 'תזכורות WhatsApp', 'דשבורד ניהול'],
    highlight: false,
  },
  {
    id: 'business',
    label: 'Business',
    price: '₪200',
    period: '/חודש',
    features: ['עד 4 עובדים', 'דוחות מתקדמים', 'אינטגרציית יומן גוגל', 'חשבוניות ירוקות', 'כל הפיצ׳רים'],
    highlight: true,
  },
];

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '15px',
      fontFamily: '"Inter", system-ui, sans-serif',
      color: '#111827',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
};

// Inner checkout form — must be rendered inside <Elements>
function CheckoutForm({ plan, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/stripe/subscribe', { plan });
      if (!data.clientSecret) throw new Error('לא התקבל client secret');

      const cardElement = elements.getElement(CardElement);
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: cardElement },
      });

      if (stripeError) throw new Error(stripeError.message);
      if (paymentIntent?.status === 'succeeded') onSuccess();
    } catch (err) {
      setError(err.message || 'שגיאה בתשלום');
    } finally {
      setLoading(false);
    }
  }

  const planMeta = PLANS.find(p => p.id === plan);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-gray-900">תשלום עבור {planMeta?.label}</span>
        <span className="text-tori-600 font-bold">{planMeta?.price}{planMeta?.period}</span>
      </div>

      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 focus-within:border-tori-400 transition-colors">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="btn-primary flex-1 justify-center py-3"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
          {loading ? 'מעבד...' : 'שלם עכשיו'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary py-3 px-5">
          ביטול
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
        תשלום מאובטח דרך Stripe
      </p>
    </form>
  );
}

function BillingSettings() {
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
    const diff = new Date(business.trial_ends_at) - new Date();
    return Math.max(0, Math.ceil(diff / 86400000));
  })();

  async function openPortal() {
    setPortalLoading(true);
    try {
      const { data } = await api.get('/stripe/portal');
      window.location.href = data.url;
    } catch {
      setPortalLoading(false);
    }
  }

  async function handleCancel() {
    setCancelLoading(true);
    try {
      await api.post('/stripe/cancel');
      updateBusiness({ ...business, plan: 'cancelled', subscription_status: 'cancelled' });
      setConfirmCancel(false);
    } catch {
      // ignore
    } finally {
      setCancelLoading(false);
    }
  }

  function handleSuccess() {
    setSuccess(true);
    setCheckoutPlan(null);
    updateBusiness({ ...business, plan: checkoutPlan, subscription_status: 'active' });
  }

  if (!stripePromise) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center text-sm text-amber-700">
        Stripe is not configured. Add <code className="font-mono bg-amber-100 px-1 rounded">VITE_STRIPE_PUBLISHABLE_KEY</code> to your .env file.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Current plan banner */}
      <div className={`rounded-2xl p-5 border ${
        isActive ? 'bg-tori-50 border-tori-200' :
        isTrial ? 'bg-amber-50 border-amber-200' :
        'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              isActive ? 'bg-tori-600 text-white' :
              isTrial ? 'bg-amber-500 text-white' :
              'bg-gray-400 text-white'
            }`}>
              {isActive ? (business.plan === 'basic' ? 'Basic' : 'Business') :
               isTrial ? 'תקופת ניסיון' : 'מנוי לא פעיל'}
            </span>
            <div className="text-2xl font-black text-gray-900 mt-3">
              {isActive ? (business.plan === 'basic' ? '₪89' : '₪200') : isTrial ? 'חינם' : '—'}
              {isActive && <span className="text-sm font-normal text-gray-500">/חודש</span>}
            </div>
            {isTrial && trialDaysLeft !== null && (
              <div className={`text-sm mt-1 font-medium ${trialDaysLeft <= 3 ? 'text-red-600' : 'text-amber-700'}`}>
                {trialDaysLeft === 0 ? 'הניסיון פג היום!' : `${trialDaysLeft} ימים נותרו בניסיון`}
              </div>
            )}
            {isCancelled && <div className="text-sm text-gray-500 mt-1">המנוי בוטל. שדרג כדי להפעיל מחדש את הבוט.</div>}
            {isActive && <div className="text-sm text-gray-500 mt-1">מנוי פעיל · חידוש אוטומטי</div>}
          </div>
          {isActive && (
            <button onClick={openPortal} disabled={portalLoading} className="btn-secondary text-sm flex items-center gap-2 shrink-0">
              {portalLoading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
              ניהול מנוי
            </button>
          )}
        </div>
      </div>

      {/* Success message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-green-700 text-sm font-medium"
        >
          <Check size={16} className="text-green-500" />
          המנוי הופעל בהצלחה! הבוט שלך פעיל 🎉
        </motion.div>
      )}

      {/* Checkout form */}
      {checkoutPlan && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-2xl p-6"
        >
          <Elements stripe={stripePromise}>
            <CheckoutForm
              plan={checkoutPlan}
              onSuccess={handleSuccess}
              onCancel={() => setCheckoutPlan(null)}
            />
          </Elements>
        </motion.div>
      )}

      {/* Plan cards */}
      {!checkoutPlan && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLANS.map(p => {
            const isCurrent = business?.plan === p.id;
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border p-5 flex flex-col ${
                  p.highlight
                    ? 'border-tori-400 bg-gradient-to-br from-tori-50 to-white'
                    : 'border-gray-200 bg-white'
                } ${isCurrent ? 'ring-2 ring-tori-500' : ''}`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 right-5">
                    <span className="bg-tori-600 text-white text-xs font-bold px-3 py-1 rounded-full">פופולרי</span>
                  </div>
                )}
                <div className="font-bold text-gray-900 text-base mb-1">{p.label}</div>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-3xl font-black text-gray-900">{p.price}</span>
                  <span className="text-gray-400 text-sm mb-1">{p.period}</span>
                </div>
                <ul className="space-y-2 mb-5 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={14} className="text-tori-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="w-full text-center py-2.5 rounded-xl bg-tori-100 text-tori-700 text-sm font-semibold">
                    תוכנית נוכחית
                  </div>
                ) : (
                  <button
                    onClick={() => { setCheckoutPlan(p.id); setSuccess(false); }}
                    className={p.highlight ? 'btn-primary w-full justify-center py-2.5' : 'btn-secondary w-full justify-center py-2.5'}
                  >
                    {isTrial || isCancelled ? 'התחל עכשיו' : 'עבור לתוכנית'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel subscription */}
      {isActive && !checkoutPlan && (
        <div className="border border-gray-100 rounded-2xl p-4">
          {confirmCancel ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 font-medium">האם לבטל את המנוי? הבוט יופסק בסוף תקופת החיוב.</p>
              <div className="flex gap-3">
                <button onClick={handleCancel} disabled={cancelLoading} className="flex items-center gap-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl transition-colors">
                  {cancelLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                  כן, בטל מנוי
                </button>
                <button onClick={() => setConfirmCancel(false)} className="btn-secondary text-sm py-2 px-4">חזור</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmCancel(true)} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
              ביטול מנוי
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Integrations ─────────────────────────────────────────────────────────────
function IntegrationsSettings() {
  const { data: status, isLoading } = useQuery({
    queryKey: ['integrations-status'],
    queryFn: () => api.get('/integrations/status').then(r => r.data),
    staleTime: 30_000,
  });

  const integrations = [
    {
      key: 'whatsapp',
      label: 'WhatsApp (Meta Cloud API)',
      desc: status?.whatsapp?.connected
        ? `מחובר · ${status.whatsapp.phone || status.whatsapp.phone_id}`
        : 'לא מחובר — הוסף WHATSAPP_TOKEN ו-WHATSAPP_PHONE_ID ל-.env',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-green-500">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      connected: status?.whatsapp?.connected,
      setupUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started',
      setupLabel: 'מדריך חיבור Meta',
      envVars: ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_ID', 'WHATSAPP_VERIFY_TOKEN', 'WHATSAPP_APP_SECRET'],
    },
    {
      key: 'stripe',
      label: 'Stripe — תשלומים',
      desc: status?.stripe?.connected
        ? 'מחובר · תשלומים פעילים'
        : 'לא מחובר — הוסף STRIPE_SECRET_KEY ל-.env',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-indigo-500">
          <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.929 3.477 1.63 3.477 2.623 0 .84-.74 1.316-1.985 1.316-1.863 0-4.664-.897-6.544-2.168l-.83 5.504C6.048 22.89 8.869 24 12.172 24c2.655 0 4.898-.62 6.379-1.855 1.586-1.316 2.42-3.22 2.42-5.558-.017-3.993-2.502-5.73-6.995-7.437z"/>
        </svg>
      ),
      connected: status?.stripe?.connected,
      setupUrl: 'https://dashboard.stripe.com/apikeys',
      setupLabel: 'Stripe Dashboard',
      envVars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_BASIC_PRICE_ID', 'STRIPE_BUSINESS_PRICE_ID'],
    },
    {
      key: 'groq',
      label: 'Groq AI — מנוע השפה',
      desc: status?.groq?.connected
        ? 'מחובר · Llama 3.3 70B פעיל'
        : 'לא מחובר — הוסף GROQ_API_KEY ל-.env',
      icon: (
        <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-black">G</div>
      ),
      connected: status?.groq?.connected,
      setupUrl: 'https://console.groq.com/keys',
      setupLabel: 'Groq Console',
      envVars: ['GROQ_API_KEY'],
    },
    {
      key: 'email',
      label: 'Resend — שליחת מיילים',
      desc: status?.email?.connected
        ? `מחובר · שולח מ-${status.email.from || 'לא הוגדר'}`
        : 'לא מחובר — הוסף RESEND_API_KEY ל-.env',
      icon: (
        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-black">@</div>
      ),
      connected: status?.email?.connected,
      setupUrl: 'https://resend.com/api-keys',
      setupLabel: 'Resend Dashboard',
      envVars: ['RESEND_API_KEY', 'FROM_EMAIL'],
    },
  ];

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      )}

      {!isLoading && integrations.map(int => (
        <div
          key={int.key}
          className={`bg-white border rounded-2xl p-5 transition-colors ${
            int.connected ? 'border-green-200' : 'border-gray-200'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              int.connected ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              {int.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900">{int.label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  int.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {int.connected ? 'פעיל' : 'לא מחובר'}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-0.5">{int.desc}</div>

              {!int.connected && (
                <details className="mt-3">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                    הוראות חיבור
                  </summary>
                  <div className="mt-2 space-y-2 text-xs text-gray-500">
                    <div className="bg-gray-50 rounded-xl p-3 font-mono space-y-1">
                      {int.envVars.map(v => (
                        <div key={v}>{v}=<span className="text-gray-400">your_value_here</span></div>
                      ))}
                    </div>
                    <p>הוסף לקובץ <code className="bg-gray-100 px-1 rounded">backend/.env</code> ואתחל את השרת.</p>
                  </div>
                </details>
              )}
            </div>

            <a
              href={int.setupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-1.5 px-3 shrink-0"
            >
              <ExternalLink size={12} />
              {int.setupLabel}
            </a>
          </div>
        </div>
      ))}

      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs text-gray-500 leading-relaxed">
        <strong className="text-gray-700">לתמיכה טכנית:</strong> עומרי — 050-960-3671 · מרדכי — 058-453-2944
      </div>
    </div>
  );
}

// ─── QR Code ─────────────────────────────────────────────────────────────────
function QRSettings() {
  const [copied, setCopied] = useState(false);
  const { data: status } = useQuery({
    queryKey: ['integrations-status'],
    queryFn: () => api.get('/integrations/status').then(r => r.data),
    staleTime: 30_000,
  });

  const phoneId = status?.whatsapp?.phone_id;
  const waNumber = phoneId ? String(phoneId).replace(/\D/g, '') : null;
  const waLink = waNumber ? `https://wa.me/${waNumber}` : null;
  const qrUrl = waLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(waLink)}&color=7C3AED&bgcolor=F5F3FF`
    : null;

  function copyLink() {
    if (!waLink) return;
    navigator.clipboard.writeText(waLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!waLink) {
    return (
      <div className="space-y-5">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <QrCode size={28} className="text-amber-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-2">הבוט עדיין לא מחובר</h3>
          <p className="text-gray-500 text-sm mb-4">כדי לשתף קישור לבוט, יש לחבר מספר WhatsApp לשרת.</p>
          <p className="text-gray-400 text-sm">לחיבור הבוט, צור קשר: <strong className="text-gray-700">050-960-3671</strong></p>
        </div>
        <div className="bg-tori-50 border border-tori-100 rounded-2xl p-5">
          <h3 className="font-semibold text-tori-800 mb-2">מה תקבל לאחר החיבור?</h3>
          <ul className="space-y-2 text-tori-700 text-sm">
            <li>• קוד QR ייחודי לעסק שלך</li>
            <li>• קישור ישיר לשיחה עם הבוט</li>
            <li>• אפשרות לשתף בביו האינסטגרם, באתר ובכרטיס ביקור</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
        <div className="flex justify-center mb-5">
          <div className="p-3 bg-violet-50 rounded-2xl border border-violet-100">
            <img src={qrUrl} alt="קוד QR לבוט" width={200} height={200} className="rounded-xl block" />
          </div>
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-1">קוד QR לבוט</h3>
        <p className="text-gray-500 text-sm mb-4">הלקוחות יסרקו את הקוד כדי לפתוח שיחה</p>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-mono text-gray-700 mb-4">
          <span className="flex-1 truncate">{waLink}</span>
          <button onClick={copyLink} className="p-1.5 rounded-lg hover:bg-gray-200 transition-all text-gray-500">
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={copyLink} className="btn-secondary text-sm">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'הועתק!' : 'העתק קישור'}
          </button>
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
            <ExternalLink size={14} />
            פתח וואטסאפ
          </a>
        </div>
      </div>

      <div className="bg-tori-50 border border-tori-100 rounded-2xl p-5">
        <h3 className="font-semibold text-tori-800 mb-2">איך לשתף?</h3>
        <ul className="space-y-2 text-tori-700 text-sm">
          <li>• שים את הקישור בביו האינסטגרם</li>
          <li>• הוסף לאתר האינטרנט שלך</li>
          <li>• שלח ללקוחות קיימים</li>
          <li>• הדפס על כרטיס הביקור</li>
        </ul>
      </div>
    </div>
  );
}

// ─── Main Settings ────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabContent = {
    general: <GeneralSettings />,
    hours: <HoursSettings />,
    services: <ServicesSettings />,
    staff: <StaffSettings />,
    billing: <BillingSettings />,
    integrations: <IntegrationsSettings />,
    qr: <QRSettings />,
  };

  return (
    <div className="p-6" dir="rtl">
      <h2 className="text-2xl font-black text-gray-900 mb-6">הגדרות</h2>

      <div className="flex gap-5">
        {/* Tab sidebar */}
        <div className="w-44 shrink-0">
          <div className="bg-white border border-gray-200 rounded-2xl p-2 space-y-0.5 shadow-sm">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-tori-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
            >
              <h3 className="font-bold text-gray-900 text-lg mb-5">
                {TABS.find(t => t.id === activeTab)?.label}
              </h3>
              {tabContent[activeTab]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
