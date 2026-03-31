import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, Eye, EyeOff, Loader2, Zap, Minus, Plus, X, Calendar, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../../store/useStore';
import api from '../../hooks/useApi';

const TOTAL_STEPS = 7;

const BUSINESS_TYPES = [
  { id: 'barber_men',   label: 'מספרה גברים',        desc: 'תספורות, זקן, גוונים' },
  { id: 'barber_women', label: 'מספרה נשים',         desc: 'תספורות, צבע, פן' },
  { id: 'barber_both',  label: 'מספרה גברים ונשים',  desc: 'שירותים לגברים ולנשים' },
  { id: 'nails',        label: 'ציפורניים',            desc: "ג'ל, אקריל, פדיקור" },
  { id: 'lashes',       label: 'ריסים וגבות',         desc: 'ריסים, גבות, עיצוב' },
  { id: 'massage',      label: 'עיסויים',              desc: 'שוודי, ספורט, רקמות' },
  { id: 'tattoo',       label: 'קעקועים',              desc: 'קעקועים, פירסינג' },
  { id: 'cosmetics',    label: 'קוסמטיקה',            desc: 'טיפולי פנים, קיסרי' },
];

const PRESET_SERVICES = {
  barber_men:   [
    { name: 'תספורת', duration_minutes: 30, price: 60 },
    { name: 'זקן', duration_minutes: 20, price: 30 },
    { name: 'תספורת + זקן', duration_minutes: 45, price: 80 },
    { name: 'גוונים', duration_minutes: 60, price: 120 },
    { name: 'כיורה', duration_minutes: 20, price: 25 },
  ],
  barber_women: [
    { name: 'תספורת', duration_minutes: 45, price: 100 },
    { name: 'פן', duration_minutes: 30, price: 80 },
    { name: 'צבע', duration_minutes: 90, price: 200 },
    { name: 'גוונים', duration_minutes: 120, price: 280 },
    { name: 'החלקה', duration_minutes: 120, price: 350 },
  ],
  nails:        [
    { name: 'לק רגיל', duration_minutes: 30, price: 60 },
    { name: "ג'ל", duration_minutes: 45, price: 100 },
    { name: 'אקריל', duration_minutes: 60, price: 140 },
    { name: 'פדיקור', duration_minutes: 45, price: 80 },
    { name: 'הסרה', duration_minutes: 30, price: 40 },
  ],
  lashes:       [
    { name: 'ריסים קלאסי', duration_minutes: 90, price: 200 },
    { name: 'ריסים וליום', duration_minutes: 120, price: 280 },
    { name: 'עיצוב גבות', duration_minutes: 30, price: 80 },
    { name: 'הסרת ריסים', duration_minutes: 30, price: 60 },
  ],
  massage:      [
    { name: 'עיסוי שוודי 60 דק', duration_minutes: 60, price: 250 },
    { name: 'עיסוי שוודי 90 דק', duration_minutes: 90, price: 350 },
    { name: 'עיסוי ספורט', duration_minutes: 60, price: 280 },
    { name: 'עיסוי רקמות עמוק', duration_minutes: 60, price: 300 },
  ],
  tattoo:       [
    { name: 'קעקוע קטן', duration_minutes: 60, price: 300 },
    { name: 'קעקוע בינוני', duration_minutes: 120, price: 600 },
    { name: 'קעקוע גדול', duration_minutes: 180, price: 1000 },
    { name: 'ייעוץ עיצוב', duration_minutes: 30, price: 0 },
  ],
  barber_both:  [
    { name: 'תספורת גבר', duration_minutes: 30, price: 60 },
    { name: 'זקן', duration_minutes: 20, price: 30 },
    { name: 'תספורת + זקן', duration_minutes: 45, price: 80 },
    { name: 'תספורת אישה', duration_minutes: 45, price: 100 },
    { name: 'פן', duration_minutes: 30, price: 80 },
    { name: 'צבע', duration_minutes: 90, price: 200 },
    { name: 'גוונים', duration_minutes: 120, price: 260 },
  ],
  cosmetics:    [
    { name: 'טיפול פנים בסיסי', duration_minutes: 60, price: 200 },
    { name: 'טיפול פנים מעמיק', duration_minutes: 90, price: 300 },
    { name: 'קיסרי', duration_minutes: 60, price: 250 },
    { name: 'פילינג', duration_minutes: 45, price: 180 },
  ],
};

// Default hours: ראשון-חמישי 09:00-20:00, שישי 09:00-14:00, שבת סגור
const DEFAULT_HOURS = [
  { day_of_week: 0, label: 'ראשון',  is_open: true,  open_time: '09:00', close_time: '20:00' },
  { day_of_week: 1, label: 'שני',    is_open: true,  open_time: '09:00', close_time: '20:00' },
  { day_of_week: 2, label: 'שלישי', is_open: true,  open_time: '09:00', close_time: '20:00' },
  { day_of_week: 3, label: 'רביעי', is_open: true,  open_time: '09:00', close_time: '20:00' },
  { day_of_week: 4, label: 'חמישי', is_open: true,  open_time: '09:00', close_time: '20:00' },
  { day_of_week: 5, label: 'שישי',  is_open: true,  open_time: '09:00', close_time: '14:00' },
  { day_of_week: 6, label: 'שבת',   is_open: false, open_time: '09:00', close_time: '20:00' },
];

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>שלב {step} מתוך {total}</span>
        <span>{Math.round((step / total) * 100)}%</span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(step / total) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}

// ─── Pill button ──────────────────────────────────────────────────────────────
function Pill({ selected, onClick, children, className = '' }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
        selected
          ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
          : 'bg-white/8 text-gray-300 hover:bg-white/12 border border-white/10'
      } ${className}`}
    >
      {children}
    </motion.button>
  );
}

// ─── Stepper control (±) ──────────────────────────────────────────────────────
function Stepper({ value, onDec, onInc, label }) {
  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-2 py-1">
      <button onClick={onDec}
        className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 text-white flex items-center justify-center transition-colors">
        <Minus size={14} />
      </button>
      <span className="text-white font-bold text-sm min-w-[60px] text-center">{label}</span>
      <button onClick={onInc}
        className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 text-white flex items-center justify-center transition-colors">
        <Plus size={14} />
      </button>
    </div>
  );
}

// ─── Success + Google Calendar import screen ──────────────────────────────────
function SuccessScreen({ onDone }) {
  const [phase, setPhase] = useState('success'); // 'success' | 'gcal' | 'done'
  const [icalUrl, setIcalUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');

  async function handleImport() {
    if (!icalUrl.trim()) return;
    setImporting(true);
    setImportError('');
    try {
      const { data } = await api.post('/calendar/import', { ical_url: icalUrl.trim() });
      setImportResult(data);
      setPhase('done');
    } catch (err) {
      setImportError(err.response?.data?.error || 'שגיאה בייבוא. נסה שוב.');
    } finally {
      setImporting(false);
    }
  }

  if (phase === 'success') {
    return (
      <div className="min-h-screen bg-[#08080F] flex items-center justify-center px-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 bg-gradient-to-br from-tori-600 to-coral-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-tori-500/30"
          >
            <Check size={40} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-3">העסק שלך מוכן!</h1>
          <p className="text-gray-400 mb-8">הבוט פעיל ומוכן לקבל תורים. שתף את הלינק הזה עם הלקוחות שלך:</p>
          <div className="bg-[#0d1117] border border-tori-500/30 rounded-xl p-4 mb-8 font-mono text-tori-300 text-sm break-all">
            https://wa.me/972584532944
          </div>

          {/* Google Calendar import prompt */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 mb-5 text-right">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <Calendar size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">יש לך תורים ביומן גוגל?</p>
                <p className="text-gray-500 text-xs">ייבא את כל התורים שלך בלחיצה אחת</p>
              </div>
            </div>
            <button
              onClick={() => setPhase('gcal')}
              className="w-full mt-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-semibold py-2.5 rounded-xl text-sm transition-all"
            >
              ייבא תורים מגוגל קלנדר
            </button>
          </div>

          <button
            onClick={onDone}
            className="w-full bg-gradient-to-r from-tori-600 to-tori-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg"
          >
            כניסה לדשבורד
          </button>
        </motion.div>
      </div>
    );
  }

  if (phase === 'gcal') {
    return (
      <div className="min-h-screen bg-[#08080F] flex items-center justify-center px-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Calendar size={28} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">ייבוא מגוגל קלנדר</h2>
            <p className="text-gray-400 text-sm">הבוט יייבא את כל התורים הקיימים ויישמור עליהם</p>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 mb-4">
            <p className="text-gray-300 font-semibold text-sm mb-3">איך מקבלים את הקישור?</p>
            <ol className="text-gray-400 text-xs space-y-2 list-decimal list-inside leading-relaxed">
              <li>פתח <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Google Calendar</a> במחשב</li>
              <li>לחץ על ⚙️ הגדרות ← הגדרות</li>
              <li>בצד שמאל, לחץ על שם היומן שלך</li>
              <li>גלול למטה עד "שילוב יומן"</li>
              <li>העתק את הכתובת "כתובת ציבורית בפורמט iCal"</li>
            </ol>
            <a
              href="https://calendar.google.com/calendar/r/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-blue-400 text-xs hover:underline"
            >
              <ExternalLink size={12} />
              פתח הגדרות גוגל קלנדר
            </a>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">הכנס את כתובת ה-iCal:</label>
            <input
              value={icalUrl}
              onChange={e => setIcalUrl(e.target.value)}
              placeholder="https://calendar.google.com/calendar/ical/..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all text-sm"
              dir="ltr"
            />
            {importError && (
              <p className="text-red-400 text-xs mt-2">{importError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setPhase('success')}
              className="flex-1 border border-white/10 text-gray-400 hover:text-white font-semibold py-3 rounded-xl transition-all text-sm"
            >
              חזרה
            </button>
            <button
              onClick={handleImport}
              disabled={importing || !icalUrl.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
            >
              {importing ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
              {importing ? 'מייבא...' : 'ייבא תורים'}
            </button>
          </div>

          <button onClick={onDone} className="w-full mt-3 text-gray-600 hover:text-gray-400 text-sm transition-colors">
            דלג, אעשה זאת מאוחר יותר
          </button>
        </motion.div>
      </div>
    );
  }

  // Phase: done (import completed)
  return (
    <div className="min-h-screen bg-[#08080F] flex items-center justify-center px-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-tori-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <Check size={36} className="text-white" />
        </div>
        <h2 className="text-2xl font-black text-white mb-3">
          {importResult?.imported > 0 ? `${importResult.imported} תורים ייובאו!` : 'ייבוא הושלם'}
        </h2>
        <p className="text-gray-400 mb-8 text-sm">
          {importResult?.message || 'הייבוא הושלם. כל התורים זמינים ביומן שלך.'}
        </p>
        <button
          onClick={onDone}
          className="bg-gradient-to-r from-tori-600 to-tori-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg w-full"
        >
          כניסה לדשבורד
        </button>
      </motion.div>
    </div>
  );
}

// Google Places autocomplete for business name + address
function BusinessNameInput({ value, onChange, onPlaceSelect }) {
  const inputRef = useRef(null);
  const apiKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GOOGLE_PLACES_API_KEY : null;

  useEffect(() => {
    if (!apiKey || !inputRef.current) return;

    function initAC() {
      if (!window.google?.maps?.places) return;
      const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['establishment'],
        componentRestrictions: { country: 'il' },
        fields: ['name', 'formatted_address'],
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (place?.name) onPlaceSelect(place.name, place.formatted_address || '');
      });
    }

    if (window.google?.maps?.places) {
      initAC();
    } else if (!document.getElementById('gplaces-script')) {
      const s = document.createElement('script');
      s.id = 'gplaces-script';
      s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      s.async = true;
      s.onload = initAC;
      document.head.appendChild(s);
    }
  }, [apiKey]);

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-all"
      placeholder={apiKey ? 'חפש שם עסק בגוגל...' : 'למשל: אבי ספר, סלון יופי ריבה...'}
    />
  );
}

export default function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);

  // Form data
  const [businessType, setBusinessType] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [staffCount, setStaffCount] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]);
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  function nextStep() {
    setError('');
    if (step < TOTAL_STEPS) setStep(s => s + 1);
  }
  function prevStep() {
    setError('');
    if (step > 1) setStep(s => s - 1);
  }

  function toggleService(svc) {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.name === svc.name);
      if (exists) return prev.filter(s => s.name !== svc.name);
      return [...prev, { ...svc }];
    });
  }

  function updateServiceField(name, field, value) {
    setSelectedServices(prev => prev.map(s => s.name === name ? { ...s, [field]: Math.max(0, value) } : s));
  }

  // Hours helpers: ראשון-חמישי share the same time
  function setWeekdayTime(field, value) {
    setHours(prev => prev.map((h, i) => i <= 4 ? { ...h, [field]: value } : h));
  }
  function setDayTime(dayIndex, field, value) {
    setHours(prev => prev.map((h, i) => i === dayIndex ? { ...h, [field]: value } : h));
  }
  function setDayOpen(dayIndex, isOpen) {
    setHours(prev => prev.map((h, i) => i === dayIndex ? { ...h, is_open: isOpen } : h));
  }

  async function handleSubmit() {
    if (!termsAccepted) { setError('יש לאשר את תנאי השימוש'); return; }
    if (!ownerName || !email || !password) { setError('יש למלא את כל השדות'); return; }
    if (password.length < 8) { setError('הסיסמה חייבת להיות לפחות 8 תווים'); return; }
    if (password !== confirmPassword) { setError('הסיסמאות אינן תואמות'); return; }

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', {
        name: businessName,
        type: businessType,
        owner_name: ownerName,
        email,
        password,
        phone,
        address,
        staff_count: staffCount,
        services: selectedServices.length > 0 ? selectedServices : undefined,
        hours: hours.map(h => ({
          day_of_week: h.day_of_week,
          is_open: h.is_open,
          open_time: h.open_time,
          close_time: h.close_time,
        })),
        buffer_minutes: bufferMinutes,
      });
      setAuth(data.token, data.business);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בהרשמה');
    } finally {
      setLoading(false);
    }
  }

  // ─── Success screen + optional Google Calendar import ────────────────────────
  if (success) {
    return <SuccessScreen onDone={() => navigate('/dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-[#08080F] flex items-center justify-center px-4 py-8" dir="rtl">
      {/* Ambient bg orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-80 h-80 bg-violet-600/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-coral-500/6 rounded-full blur-[90px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-5">
            <img src="/logo.svg" alt="Tori" className="w-8 h-8" />
            <span className="font-black text-xl text-white tracking-tight">Tori</span>
          </div>
          <ProgressBar step={step} total={TOTAL_STEPS} />
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* ─── Step 1: Business Type ─── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-black text-white mb-2 text-center">מה סוג העסק שלך?</h2>
                <p className="text-gray-400 mb-8 text-center text-sm">בחר כדי שנוכל להכין לך שירותים מותאמים</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {BUSINESS_TYPES.map(bt => (
                    <Pill
                      key={bt.id}
                      selected={businessType === bt.id}
                      onClick={() => { setBusinessType(bt.id); setSelectedServices([]); }}
                      className="text-sm"
                    >
                      {bt.label}
                    </Pill>
                  ))}
                </div>
                {businessType && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-gray-500 text-xs mt-6">
                    {BUSINESS_TYPES.find(b => b.id === businessType)?.desc}
                  </motion.p>
                )}
              </motion.div>
            )}

            {/* ─── Step 2: Business Details ─── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-black text-white mb-2">פרטי העסק</h2>
                <p className="text-gray-400 mb-6 text-sm">הלקוחות יראו את השם הזה בבוט</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">שם העסק *</label>
                    <BusinessNameInput
                      value={businessName}
                      onChange={setBusinessName}
                      onPlaceSelect={(name, addr) => { setBusinessName(name); setAddress(addr); }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">כתובת העסק</label>
                    <input
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-all"
                      placeholder="רחוב הרצל 12, תל אביב"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">טלפון עסק</label>
                    <input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-all"
                      placeholder="050-1234567"
                      dir="ltr"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── Step 3: Staff Count ─── */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-black text-white mb-2 text-center">כמה עובדים יש לך?</h2>
                <p className="text-gray-400 mb-8 text-center text-sm">זה משפיע על התוכנית</p>
                <div className="flex gap-4">
                  {[
                    { count: 1, label: 'עובד אחד',       plan: '₪89/חודש', planName: 'Basic' },
                    { count: 2, label: '2 עובדים ומעלה', plan: '₪200/חודש', planName: 'Business' },
                  ].map(({ count, label, plan, planName }) => (
                    <motion.button
                      key={count}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setStaffCount(count)}
                      className={`flex-1 py-7 rounded-2xl font-bold transition-all text-center ${
                        (count === 1 && staffCount === 1) || (count === 2 && staffCount >= 2)
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                          : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/8'
                      }`}
                    >
                      <div className="text-lg font-black mb-1">{label}</div>
                      <div className="text-sm opacity-75">{plan}</div>
                      <div className="text-xs opacity-55 mt-0.5">{planName}</div>
                    </motion.button>
                  ))}
                </div>
                <p className="text-center text-gray-500 text-sm mt-5">30 יום ניסיון חינמי לכל התוכניות!</p>
              </motion.div>
            )}

            {/* ─── Step 4: Services ─── */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-black text-white mb-2">אילו שירותים אתה מציע?</h2>
                <p className="text-gray-400 mb-5 text-sm">לחץ על שירות כדי לבחור אותו ולערוך את המחיר</p>

                <div className="flex flex-wrap gap-2 mb-5">
                  {(PRESET_SERVICES[businessType] || []).map(svc => {
                    const selected = selectedServices.find(s => s.name === svc.name);
                    return (
                      <Pill key={svc.name} selected={!!selected} onClick={() => toggleService(svc)}>
                        {svc.name}
                        <span className="opacity-60 text-xs mr-1.5">₪{svc.price}</span>
                      </Pill>
                    );
                  })}
                </div>

                {selectedServices.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-xs mb-3">ערוך שירותים שנבחרו:</p>
                    <div className="space-y-2.5 max-h-52 overflow-y-auto">
                      {selectedServices.map(svc => (
                        <div key={svc.name} className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-2xl px-4 py-3">
                          <span className="text-white text-sm font-medium flex-1">{svc.name}</span>

                          <Stepper
                            value={svc.price}
                            label={`₪${svc.price}`}
                            onDec={() => updateServiceField(svc.name, 'price', svc.price - 10)}
                            onInc={() => updateServiceField(svc.name, 'price', svc.price + 10)}
                          />

                          <Stepper
                            value={svc.duration_minutes}
                            label={`${svc.duration_minutes} דק׳`}
                            onDec={() => updateServiceField(svc.name, 'duration_minutes', svc.duration_minutes - 5)}
                            onInc={() => updateServiceField(svc.name, 'duration_minutes', svc.duration_minutes + 5)}
                          />

                          <button onClick={() => toggleService(svc)} className="text-gray-600 hover:text-red-400 mr-1 transition-colors">
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-gray-600 text-xs mt-3">אפשר לשנות ולהוסיף שירותים בכל עת מהדשבורד</p>
              </motion.div>
            )}

            {/* ─── Step 5: Hours ─── */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-black text-white mb-2">שעות פעילות</h2>
                <p className="text-gray-400 mb-6 text-sm">הבוט לא יקבע תורים מחוץ לשעות האלה</p>

                <div className="space-y-3">
                  {/* ראשון–חמישי as one row */}
                  {(() => {
                    const h = hours[0]; // representative
                    return (
                      <div className={`flex items-center gap-3 p-4 rounded-2xl border ${h.is_open ? 'border-white/10 bg-white/4' : 'border-white/5 bg-white/2 opacity-60'}`}>
                        <button
                          onClick={() => [0,1,2,3,4].forEach(i => setDayOpen(i, !h.is_open))}
                          className={`w-10 h-6 rounded-full transition-all relative flex-shrink-0 ${h.is_open ? 'bg-violet-600' : 'bg-gray-700'}`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${h.is_open ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                        <span className="text-white font-medium text-sm w-28 flex-shrink-0">ראשון – חמישי</span>
                        {h.is_open ? (
                          <div className="flex items-center gap-2 mr-auto">
                            <input type="time" value={h.open_time}
                              onChange={e => setWeekdayTime('open_time', e.target.value)}
                              className="bg-white/[0.08] border border-white/[0.15] text-white text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:border-violet-400" />
                            <span className="text-gray-500 text-sm">עד</span>
                            <input type="time" value={h.close_time}
                              onChange={e => setWeekdayTime('close_time', e.target.value)}
                              className="bg-white/[0.08] border border-white/[0.15] text-white text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:border-violet-400" />
                          </div>
                        ) : (
                          <span className="text-gray-600 text-sm mr-auto">סגור</span>
                        )}
                      </div>
                    );
                  })()}

                  {/* שישי */}
                  {(() => {
                    const h = hours[5];
                    return (
                      <div className={`flex items-center gap-3 p-4 rounded-2xl border ${h.is_open ? 'border-white/10 bg-white/4' : 'border-white/5 bg-white/2 opacity-60'}`}>
                        <button
                          onClick={() => setDayOpen(5, !h.is_open)}
                          className={`w-10 h-6 rounded-full transition-all relative flex-shrink-0 ${h.is_open ? 'bg-violet-600' : 'bg-gray-700'}`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${h.is_open ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                        <span className="text-white font-medium text-sm w-28 flex-shrink-0">שישי</span>
                        {h.is_open ? (
                          <div className="flex items-center gap-2 mr-auto">
                            <input type="time" value={h.open_time}
                              onChange={e => setDayTime(5, 'open_time', e.target.value)}
                              className="bg-white/[0.08] border border-white/[0.15] text-white text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:border-violet-400" />
                            <span className="text-gray-500 text-sm">עד</span>
                            <input type="time" value={h.close_time}
                              onChange={e => setDayTime(5, 'close_time', e.target.value)}
                              className="bg-white/[0.08] border border-white/[0.15] text-white text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:border-violet-400" />
                          </div>
                        ) : (
                          <span className="text-gray-600 text-sm mr-auto">סגור</span>
                        )}
                      </div>
                    );
                  })()}

                  {/* שבת: fixed closed */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/5 bg-white/2 opacity-50">
                    <div className="w-10 h-6 rounded-full bg-gray-700 relative flex-shrink-0">
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow" />
                    </div>
                    <span className="text-gray-400 font-medium text-sm w-28 flex-shrink-0">שבת</span>
                    <span className="text-gray-600 text-sm mr-auto">סגור</span>
                  </div>
                </div>

                <p className="text-gray-600 text-xs mt-4 text-center">ניתן לשנות שעות לכל יום בנפרד בהגדרות</p>
              </motion.div>
            )}

            {/* ─── Step 6: Buffer ─── */}
            {step === 6 && (
              <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-black text-white mb-2 text-center">זמן פנוי בין תורים</h2>
                <p className="text-gray-400 mb-8 text-center text-sm">כמה דקות אתה צריך בין תור לתור, לנקיון והכנה</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {[0, 10, 15, 20, 30, 45].map(m => (
                    <Pill
                      key={m}
                      selected={bufferMinutes === m}
                      onClick={() => setBufferMinutes(m)}
                      className="px-7 py-3"
                    >
                      {m === 0 ? 'ללא הפסקה' : `${m} דקות`}
                    </Pill>
                  ))}
                </div>
                <p className="text-gray-600 text-xs mt-6 text-center">
                  אם תבחר 15 דקות, אחרי תור שמסתיים ב-14:00 הסלוט הבא יהיה 14:15
                </p>
              </motion.div>
            )}

            {/* ─── Step 7: Account ─── */}
            {step === 7 && (
              <motion.div key="step7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-black text-white mb-2">פרטי חשבון</h2>
                <p className="text-gray-400 mb-6 text-sm">אלה הפרטים לכניסה לדשבורד</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">שמך המלא *</label>
                    <input
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-all"
                      placeholder="אבי כהן"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">אימייל *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-all"
                      placeholder="avi@example.com"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">סיסמה *</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-all pl-12"
                        placeholder="לפחות 8 תווים"
                        dir="ltr"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">אישור סיסמה *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gray-600 focus:outline-none transition-all pl-12 ${
                          confirmPassword && confirmPassword !== password
                            ? 'border-red-500/60 focus:border-red-500'
                            : confirmPassword && confirmPassword === password
                            ? 'border-green-500/60 focus:border-green-500'
                            : 'border-white/10 focus:border-violet-500'
                        }`}
                        placeholder="הכנס סיסמה שוב"
                        dir="ltr"
                      />
                      <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                        {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-red-400 text-xs mt-1.5">הסיסמאות אינן תואמות</p>
                    )}
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div
                      onClick={() => setTermsAccepted(!termsAccepted)}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        termsAccepted ? 'bg-violet-600 border-violet-600' : 'border-gray-600'
                      }`}
                    >
                      {termsAccepted && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-gray-400 text-sm">אני מסכים לתנאי השימוש ומדיניות הפרטיות של טורי</span>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="flex items-center gap-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <ChevronRight size={18} />
              חזרה
            </button>

            {step < TOTAL_STEPS ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (step === 1 && !businessType) { setError('בחר סוג עסק'); return; }
                  if (step === 2 && !businessName) { setError('הכנס שם עסק'); return; }
                  nextStep();
                }}
                className="bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-violet-500/20 flex items-center gap-2"
              >
                המשך
                <ChevronLeft size={18} />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-violet-600 to-coral-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                {loading ? 'יוצר חשבון...' : 'צור חשבון חינם'}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
