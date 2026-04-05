import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Eye, EyeOff, Loader2, Zap, X,
  Calendar, ExternalLink, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/useStore';
import api from '../../hooks/useApi';

const TOTAL_STEPS = 5;

// ─── Data ─────────────────────────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { id: 'barber_men',   emoji: '✂️',  label: 'מספרה גברים',      desc: 'תספורות, זקן, גוונים' },
  { id: 'barber_women', emoji: '💇‍♀️', label: 'מספרה נשים',       desc: 'תספורות, צבע, פן' },
  { id: 'barber_both',  emoji: '💈',  label: 'ספר לגברים ונשים', desc: 'שירותים לכולם' },
  { id: 'nails',        emoji: '💅',  label: 'ציפורניים',          desc: "ג'ל, אקריל, פדיקור" },
  { id: 'lashes',       emoji: '👁️',  label: 'ריסים וגבות',       desc: 'ריסים, גבות, עיצוב' },
  { id: 'massage',      emoji: '🫧',  label: 'עיסויים',            desc: 'שוודי, ספורט, רקמות' },
  { id: 'tattoo',       emoji: '🎨',  label: 'קעקועים',            desc: 'קעקועים, פירסינג' },
  { id: 'cosmetics',    emoji: '✨',  label: 'קוסמטיקה',          desc: 'טיפולי פנים, קיסרי' },
];

const PRESET_SERVICES = {
  barber_men: [
    { name: 'תספורת', duration_minutes: 30, price: 60 },
    { name: 'זקן', duration_minutes: 20, price: 30 },
    { name: 'תספורת + זקן', duration_minutes: 45, price: 80 },
    { name: 'גוונים', duration_minutes: 60, price: 120 },
    { name: 'כיורה', duration_minutes: 20, price: 25 },
  ],
  barber_women: [
    { name: 'תספורת', duration_minutes: 45, price: 100 },
    { name: 'תספורת + פן', duration_minutes: 60, price: 160 },
    { name: 'פן', duration_minutes: 30, price: 80 },
    { name: 'שמפו + פן', duration_minutes: 30, price: 60 },
    { name: 'צבע', duration_minutes: 90, price: 200 },
    { name: 'גוונים', duration_minutes: 120, price: 280 },
    { name: 'החלקה', duration_minutes: 120, price: 350 },
    { name: 'טיפול שיער', duration_minutes: 45, price: 120 },
  ],
  nails: [
    { name: 'לק רגיל', duration_minutes: 30, price: 60 },
    { name: "ג'ל", duration_minutes: 45, price: 100 },
    { name: 'אקריל', duration_minutes: 60, price: 140 },
    { name: 'פדיקור', duration_minutes: 45, price: 80 },
    { name: 'הסרה', duration_minutes: 30, price: 40 },
  ],
  lashes: [
    { name: 'ריסים קלאסי', duration_minutes: 90, price: 200 },
    { name: 'ריסים וליום', duration_minutes: 120, price: 280 },
    { name: 'עיצוב גבות', duration_minutes: 30, price: 80 },
    { name: 'הסרת ריסים', duration_minutes: 30, price: 60 },
  ],
  massage: [
    { name: 'עיסוי שוודי 60 דק׳', duration_minutes: 60, price: 250 },
    { name: 'עיסוי שוודי 90 דק׳', duration_minutes: 90, price: 350 },
    { name: 'עיסוי ספורט', duration_minutes: 60, price: 280 },
    { name: 'עיסוי רקמות עמוק', duration_minutes: 60, price: 300 },
  ],
  tattoo: [
    { name: 'קעקוע קטן', duration_minutes: 60, price: 300 },
    { name: 'קעקוע בינוני', duration_minutes: 120, price: 600 },
    { name: 'קעקוע גדול', duration_minutes: 180, price: 1000 },
    { name: 'ייעוץ עיצוב', duration_minutes: 30, price: 0 },
  ],
  barber_both: [
    { name: 'תספורת גבר', duration_minutes: 30, price: 60 },
    { name: 'זקן', duration_minutes: 20, price: 30 },
    { name: 'תספורת + זקן', duration_minutes: 45, price: 80 },
    { name: 'תספורת אישה', duration_minutes: 45, price: 100 },
    { name: 'תספורת + פן', duration_minutes: 60, price: 160 },
    { name: 'פן', duration_minutes: 30, price: 80 },
    { name: 'צבע', duration_minutes: 90, price: 200 },
    { name: 'גוונים', duration_minutes: 120, price: 260 },
  ],
  cosmetics: [
    { name: 'טיפול פנים בסיסי', duration_minutes: 60, price: 200 },
    { name: 'טיפול פנים מעמיק', duration_minutes: 90, price: 300 },
    { name: 'קיסרי', duration_minutes: 60, price: 250 },
    { name: 'פילינג', duration_minutes: 45, price: 180 },
  ],
};

const DEFAULT_HOURS = [
  { day_of_week: 0, label: 'ראשון',  is_open: true,  open_time: '09:00', close_time: '20:00' },
  { day_of_week: 1, label: 'שני',    is_open: true,  open_time: '09:00', close_time: '20:00' },
  { day_of_week: 2, label: 'שלישי', is_open: true,  open_time: '09:00', close_time: '20:00' },
  { day_of_week: 3, label: 'רביעי', is_open: true,  open_time: '09:00', close_time: '20:00' },
  { day_of_week: 4, label: 'חמישי', is_open: true,  open_time: '09:00', close_time: '20:00' },
  { day_of_week: 5, label: 'שישי',  is_open: true,  open_time: '09:00', close_time: '14:00' },
  { day_of_week: 6, label: 'שבת',   is_open: false, open_time: '09:00', close_time: '20:00' },
];

const ISRAELI_CITIES = [
  'תל אביב', 'ירושלים', 'חיפה', 'ראשון לציון', 'פתח תקווה',
  'אשדוד', 'נתניה', 'בני ברק', 'באר שבע', 'רמת גן',
  'אשקלון', 'רחובות', 'בת ים', 'הרצליה', 'חולון',
  'כפר סבא', 'מודיעין', 'לוד', 'רמלה', 'נהריה',
  'חדרה', 'גבעתיים', 'אילת', 'עכו', 'טבריה',
  'צפת', 'כרמיאל', 'הוד השרון', 'רעננה', 'קרית אונו',
  'גבעת שמואל', 'אלעד', 'יבנה', 'קרית גת', 'אור יהודה',
  'שוהם', 'גדרה', 'מזכרת בתיה', 'יהוד', 'דימונה',
];

const ISRAELI_STREETS = [
  'הרצל', 'דיזנגוף', 'רוטשילד', 'ויצמן', 'בן גוריון', 'בן יהודה',
  'אלנבי', 'ז\'בוטינסקי', 'בגין', 'שנקר', 'שדרות רוטשילד',
  'אחד העם', 'לילנבלום', 'הנביאים', 'יפו', 'המלך ג\'ורג',
  'שלמה המלך', 'דוד המלך', 'ארלוזורוב', 'פינסקר', 'נורדאו',
  'ביאליק', 'שינקין', 'מאפו', 'גורדון', 'פרישמן', 'חובבי ציון',
  'רמב"ם', 'רש"י', 'הגפן', 'הזית', 'התאנה', 'הדקל',
  'השקמה', 'הברוש', 'האלה', 'הבוסתן', 'הפרחים', 'הגנים',
  'הציונות', 'העצמאות', 'השלום', 'האחדות', 'הגבורה',
  'הפלמ"ח', 'ההגנה', 'הנח"ל', 'המנוחה', 'החלוצים',
  'הסיבים', 'תרצה', 'הדגן', 'הכורם', 'הזורע',
];

// ─── Logo ─────────────────────────────────────────────────────────────────────
function ToriLogo() {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span style={{ fontSize: 26, fontFamily: "'Inter','Heebo',sans-serif", fontWeight: 900, color: '#4ade80', lineHeight: 1, letterSpacing: '-0.05em' }}>T</span>
      <span className="font-black text-lg text-white tracking-tight">Tori</span>
    </div>
  );
}

// ─── Step dots ────────────────────────────────────────────────────────────────
function StepDots({ step, total }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mt-4">
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          animate={{ width: i + 1 === step ? 20 : 8, opacity: i + 1 <= step ? 1 : 0.25 }}
          transition={{ duration: 0.3 }}
          className="h-1.5 rounded-full bg-violet-500"
        />
      ))}
    </div>
  );
}

// ─── Address autocomplete ─────────────────────────────────────────────────────
function AddressInput({ value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('city'); // 'city' | 'street'

  function handleChange(val) {
    onChange(val);
    const hasComma = val.includes(',');
    const q = val.split(',').pop().trim();

    if (!hasComma) {
      // Before comma: suggest cities
      setMode('city');
      if (q.length >= 2) {
        const filtered = ISRAELI_CITIES.filter(c => c.includes(q)).slice(0, 5);
        setSuggestions(filtered);
        setOpen(filtered.length > 0);
      } else {
        setOpen(false);
      }
    } else {
      // After comma: suggest streets
      setMode('street');
      if (q.length >= 2) {
        const filtered = ISRAELI_STREETS.filter(s => s.includes(q)).slice(0, 5);
        setSuggestions(filtered);
        setOpen(filtered.length > 0);
      } else {
        setOpen(false);
      }
    }
  }

  function pick(item) {
    if (mode === 'city') {
      // Replace entire value with chosen city + comma for street
      onChange(item + ', ');
      setMode('street');
    } else {
      // Replace the street part (after last comma)
      const parts = value.split(',');
      parts[parts.length - 1] = ' ' + item + ' ';
      onChange(parts.join(','));
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        value={value}
        onChange={e => handleChange(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={inputCls}
        placeholder="תל אביב, הרצל 12"
      />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 w-full mt-1 bg-[#16162a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            {suggestions.map(item => (
              <button
                key={item}
                onMouseDown={() => pick(item)}
                className="w-full text-right px-4 py-3 text-sm text-gray-200 hover:bg-white/8 transition-colors flex items-center gap-2"
              >
                <span className="text-violet-400 text-xs shrink-0">{mode === 'city' ? '🏙️' : '📍'}</span>
                {item}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Google Places business name input ───────────────────────────────────────
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
      className={inputCls}
      placeholder="למשל: סלון יופי ריבה, אבי הספר..."
    />
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputCls = "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-all text-sm";

// ─── Legal modal ──────────────────────────────────────────────────────────────
function LegalModal({ type, onClose }) {
  const isTerms = type === 'terms';
  return (
    <AnimatePresence>
      {type && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="bg-[#13131f] border border-white/10 rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] shrink-0">
              <h3 className="text-white font-black text-lg">{isTerms ? 'תנאי שימוש' : 'מדיניות פרטיות'}</h3>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-all">
                <X size={16} />
              </button>
            </div>
            {/* Content */}
            <div className="overflow-y-auto px-6 py-5 text-sm text-gray-400 leading-relaxed space-y-4">
              {isTerms ? (
                <>
                  <p><strong className="text-gray-200">1. קבלת התנאים</strong><br />
                  שימוש בשירות Tori מהווה הסכמה לתנאים אלו. אם אינך מסכים, אנא הפסק את השימוש.</p>
                  <p><strong className="text-gray-200">2. השירות</strong><br />
                  Tori מספקת מערכת ניהול תורים חכמה מבוססת WhatsApp לעסקים. אנו שומרים על הזכות לשנות, להשעות או להפסיק כל חלק מהשירות בכל עת.</p>
                  <p><strong className="text-gray-200">3. חשבון משתמש</strong><br />
                  אתה אחראי לשמירה על סודיות פרטי הגישה לחשבונך ולכל הפעילות המתרחשת תחתיו.</p>
                  <p><strong className="text-gray-200">4. תשלום</strong><br />
                  השירות כולל תקופת ניסיון חינמית של 30 יום. לאחר מכן יחויב חשבונך בהתאם לתוכנית שנבחרה. ניתן לבטל בכל עת.</p>
                  <p><strong className="text-gray-200">5. שימוש הוגן</strong><br />
                  אין להשתמש בשירות לצורך שליחת ספאם, הפרת חוקי פרטיות, או כל שימוש שאינו חוקי.</p>
                  <p><strong className="text-gray-200">6. אחריות</strong><br />
                  Tori אינה אחראית לנזקים עקיפים הנובעים משימוש בשירות. השירות ניתן "כמות שהוא".</p>
                  <p><strong className="text-gray-200">7. שינויים בתנאים</strong><br />
                  נודיע על שינויים מהותיים בתנאים באמצעות דוא"ל. המשך שימוש לאחר ההודעה מהווה הסכמה לתנאים החדשים.</p>
                </>
              ) : (
                <>
                  <p><strong className="text-gray-200">1. מידע שאנו אוספים</strong><br />
                  אנו אוספים מידע שאתה מספק (שם עסק, כתובת, שירותים) ומידע על השימוש בשירות (תורים, לקוחות, שעות).</p>
                  <p><strong className="text-gray-200">2. שימוש במידע</strong><br />
                  המידע משמש להפעלת השירות, שיפורו ושליחת עדכונים רלוונטיים. לא נמכור את המידע שלך לצדדים שלישיים.</p>
                  <p><strong className="text-gray-200">3. שמירת מידע</strong><br />
                  המידע מאוחסן בשרתים מאובטחים בישראל. נשמור על המידע כל עוד חשבונך פעיל.</p>
                  <p><strong className="text-gray-200">4. שיתוף מידע</strong><br />
                  המידע משותף רק עם ספקי שירות הכרחיים (אחסון, שליחת הודעות) ובהתאם לדרישות החוק.</p>
                  <p><strong className="text-gray-200">5. WhatsApp</strong><br />
                  השירות משתמש ב-WhatsApp Business API. שיחות עם לקוחותיך עוברות דרך שרתי Meta בהתאם למדיניות הפרטיות שלהם.</p>
                  <p><strong className="text-gray-200">6. זכויותיך</strong><br />
                  יש לך הזכות לעיין, לתקן ולמחוק את המידע שלך. לפנייה: privacy@tori.ai</p>
                  <p><strong className="text-gray-200">7. עוגיות</strong><br />
                  אנו משתמשים בעוגיות לצורך שמירת הגדרות וניתוח שימוש. ניתן להגדיר את הדפדפן לחסום עוגיות.</p>
                </>
              )}
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/[0.07] shrink-0">
              <button onClick={onClose}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                הבנתי, סגור
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ label, onDecrement, onIncrement }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={onDecrement}
        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white flex items-center justify-center transition-all font-bold text-lg leading-none"
      >-</button>
      <span className="text-gray-300 text-xs font-medium text-center" style={{ minWidth: 52 }}>{label}</span>
      <button
        type="button"
        onClick={onIncrement}
        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white flex items-center justify-center transition-all font-bold text-lg leading-none"
      >+</button>
    </div>
  );
}

function stepTime(timeStr, deltaMins) {
  const [h, m] = timeStr.split(':').map(Number);
  let total = h * 60 + m + deltaMins;
  total = Math.max(0, Math.min(23 * 60 + 30, total));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${value ? 'bg-violet-600' : 'bg-gray-700'}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${value ? 'right-0.5' : 'left-0.5'}`} />
    </button>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ onDone }) {
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleConnect() {
    setGoogleLoading(true);
    try {
      const { data } = await api.get('/integrations/google/auth');
      window.location.href = data.url;
    } catch {
      setGoogleLoading(false);
    }
  }

  // DEAD CODE BELOW — kept only so legacy if-blocks don't break scope
  const [phase] = useState('success');
  const [importing] = useState(false);
  const [importResult] = useState(null);
  const [importError] = useState('');
  async function handleImport() {
    try {
      const { data } = await api.post('/calendar/import', { ical_url: icalUrl.trim() });
      setImportResult(data); setPhase('done');
    } catch (err) {
      setImportError(err.response?.data?.error || 'שגיאה בייבוא. נסה שוב.');
    } finally { setImporting(false); }
  }

  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-[#08080F] flex items-center justify-center px-4" dir="rtl">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Check size={36} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">
            {importResult?.imported > 0 ? `${importResult.imported} תורים ייובאו!` : 'ייבוא הושלם'}
          </h2>
          <p className="text-gray-400 mb-8 text-sm">{importResult?.message || 'כל התורים זמינים ביומן שלך.'}</p>
          <button onClick={onDone} className="w-full bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg">
            כניסה לדשבורד
          </button>
        </motion.div>
      </div>
    );
  }

  if (phase === 'gcal') {
    return (
      <div className="min-h-screen bg-[#08080F] flex items-center justify-center px-4" dir="rtl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Calendar size={24} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-black text-white mb-1">ייבוא מגוגל קלנדר</h2>
            <p className="text-gray-400 text-sm">הבוט יייבא את כל התורים הקיימים</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 mb-4">
            <p className="text-gray-300 font-semibold text-sm mb-3">איך מקבלים את הקישור?</p>
            <ol className="text-gray-400 text-xs space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>פתח <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Google Calendar</a> במחשב</li>
              <li>⚙️ הגדרות ← שם היומן ← "שילוב יומן"</li>
              <li>העתק "כתובת ציבורית בפורמט iCal"</li>
            </ol>
            <a href="https://calendar.google.com/calendar/r/settings" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-blue-400 text-xs hover:underline">
              <ExternalLink size={11} /> פתח הגדרות גוגל קלנדר
            </a>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 mb-4">
            <input value={icalUrl} onChange={e => setIcalUrl(e.target.value)}
              placeholder="https://calendar.google.com/calendar/ical/..."
              className={inputCls} dir="ltr" />
            {importError && <p className="text-red-400 text-xs mt-2">{importError}</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setPhase('success')}
              className="flex-1 border border-white/10 text-gray-400 hover:text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              חזרה
            </button>
            <button onClick={handleImport} disabled={importing || !icalUrl.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
              {importing ? <Loader2 size={15} className="animate-spin" /> : <Calendar size={15} />}
              {importing ? 'מייבא...' : 'ייבא תורים'}
            </button>
          </div>
          <button onClick={onDone} className="w-full mt-3 text-gray-600 hover:text-gray-400 text-sm transition-colors py-2">
            דלג, אעשה זאת מאוחר יותר
          </button>
        </motion.div>
      </div>
    );
  }

  // phase === 'success'
  return (
    <div className="min-h-screen bg-[#08080F] flex items-center justify-center px-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.93 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="max-w-md w-full"
      >
        {/* Success checkmark */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-[#f43f5e]/30"
            style={{ background: 'linear-gradient(135deg,#f97316,#f43f5e,#06b6d4)' }}
          >
            <Check size={36} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-2">העסק שלך מוכן!</h1>
          <p className="text-gray-400 text-sm">ברוך הבא לטורי. הכל מוגדר ומוכן.</p>
        </div>

        {/* Google Calendar card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="border border-white/[0.08] rounded-2xl bg-white/[0.03] p-6 mb-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-[#06b6d4]/10 border border-[#06b6d4]/20 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="17" rx="2" stroke="#06b6d4" strokeWidth="1.5"/>
                <path d="M3 9h18" stroke="#06b6d4" strokeWidth="1.5"/>
                <path d="M8 2v4M16 2v4" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="7" y="13" width="4" height="3" rx="0.5" fill="#06b6d4" opacity="0.7"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-base">בואו נעביר את הנתונים בקלות</p>
              <p className="text-gray-500 text-sm">ייבא תורים ולקוחות מ-Google Calendar ישירות לטורי</p>
            </div>
          </div>

          <ul className="space-y-2 mb-5">
            {[
              'כל התורים מהיום ואילך עוברים לטבלת התורים',
              'לקוחות עם מספר טלפון נכנסים לרשימת הלקוחות',
              'מ-3 חודשים אחורה עד חודש קדימה',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-gray-400">
                <div className="w-4 h-4 rounded-full bg-[#06b6d4]/15 flex items-center justify-center shrink-0">
                  <Check size={10} className="text-[#06b6d4]" />
                </div>
                {item}
              </li>
            ))}
          </ul>

          <button
            onClick={handleGoogleConnect}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-all disabled:opacity-50"
          >
            {googleLoading ? <Loader2 size={16} className="animate-spin" /> : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {googleLoading ? 'מתחבר לגוגל...' : 'התחבר עם Google Calendar'}
          </button>
        </motion.div>

        {/* Skip */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          onClick={onDone}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all"
          style={{ background: 'linear-gradient(to right,#f97316,#f43f5e,#06b6d4)' }}
        >
          כניסה לדשבורד
        </motion.button>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-center text-gray-700 text-xs mt-3"
        >
          ניתן לחבר את Google Calendar גם מאוחר יותר דרך הגדרות ← חיבורים
        </motion.p>
      </motion.div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);

  // Form state
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
  const [legalModal, setLegalModal] = useState(null); // 'terms' | 'privacy' | null

  function next() {
    setError('');
    if (step === 1 && !businessType) { setError('בחר סוג עסק להמשיך'); return; }
    if (step === 2 && !businessName) { setError('הכנס שם עסק'); return; }
    if (step < TOTAL_STEPS) setStep(s => s + 1);
  }
  function prev() {
    setError('');
    if (step === 1) { navigate('/v2'); return; }
    setStep(s => s - 1);
  }

  // Services helpers
  const presets = PRESET_SERVICES[businessType] || [];
  const allSelected = presets.length > 0 && presets.every(p => selectedServices.find(s => s.name === p.name));

  function toggleAll() {
    if (allSelected) setSelectedServices([]);
    else setSelectedServices(presets.map(s => ({ ...s })));
  }
  function toggleService(svc) {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.name === svc.name);
      if (exists) return prev.filter(s => s.name !== svc.name);
      return [...prev, { ...svc }];
    });
  }
  function updateService(name, field, delta) {
    setSelectedServices(prev => prev.map(s =>
      s.name === name ? { ...s, [field]: Math.max(0, s[field] + delta) } : s
    ));
  }

  // Hours helpers
  function setDayOpen(idx, val) {
    setHours(prev => prev.map((h, i) => i === idx ? { ...h, is_open: val } : h));
  }
  function stepWeekdayTime(field, delta) {
    setHours(prev => {
      const next = stepTime(prev[0][field], delta);
      return prev.map((h, i) => i <= 4 ? { ...h, [field]: next } : h);
    });
  }
  function stepDayTime(idx, field, delta) {
    setHours(prev => {
      const next = stepTime(prev[idx][field], delta);
      return prev.map((h, i) => i === idx ? { ...h, [field]: next } : h);
    });
  }

  async function handleSubmit() {
    if (!termsAccepted) { setError('יש לאשר את תנאי השימוש'); return; }
    if (!ownerName || !email || !password) { setError('יש למלא את כל השדות'); return; }
    if (password.length < 8) { setError('הסיסמה חייבת להיות לפחות 8 תווים'); return; }
    if (password !== confirmPassword) { setError('הסיסמאות אינן תואמות'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/register', {
        name: businessName, type: businessType, owner_name: ownerName,
        email, password, phone, address,
        staff_count: staffCount,
        services: selectedServices.length > 0 ? selectedServices : undefined,
        hours: hours.map(h => ({ day_of_week: h.day_of_week, is_open: h.is_open, open_time: h.open_time, close_time: h.close_time })),
        buffer_minutes: bufferMinutes,
      });
      setAuth(data.token, data.business);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בהרשמה');
    } finally { setLoading(false); }
  }

  if (success) return <SuccessScreen onDone={() => navigate('/dashboard')} />;

  const STEP_LABELS = ['סוג עסק', 'פרטי עסק', 'שירותים', 'הגדרות', 'חשבון'];

  return (
    <div className="min-h-screen bg-[#08080F] flex flex-col items-center justify-center px-4 py-6 md:py-10" dir="rtl">
      {/* Ambient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-80 h-80 bg-violet-600/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-green-500/5 rounded-full blur-[90px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo + progress */}
        <div className="text-center mb-6">
          <Link to="/v2"><ToriLogo /></Link>
          <StepDots step={step} total={TOTAL_STEPS} />
          <p className="text-gray-600 text-xs mt-2">{STEP_LABELS[step - 1]}</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-sm">

          {error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* ── Step 1: Business type ─────────────────────────────────── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-black text-white mb-1 text-center">מה סוג העסק שלך?</h2>
                <p className="text-gray-500 text-sm text-center mb-6">בחר כדי שנכין לך שירותים מותאמים</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {BUSINESS_TYPES.map(bt => (
                    <motion.button
                      key={bt.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        const p = PRESET_SERVICES[bt.id] || [];
                        setBusinessType(bt.id);
                        setSelectedServices(p.map(s => ({ ...s })));
                      }}
                      className={`px-4 py-3 rounded-2xl border text-right transition-all duration-200 flex items-center justify-between gap-2 ${
                        businessType === bt.id
                          ? 'bg-violet-600/20 border-violet-500/60 shadow-lg shadow-violet-500/10'
                          : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07]'
                      }`}
                    >
                      <div>
                        <div className={`text-sm font-bold ${businessType === bt.id ? 'text-white' : 'text-gray-200'}`}>{bt.label}</div>
                        <div className="text-gray-500 text-xs mt-0.5 leading-tight">{bt.desc}</div>
                      </div>
                      {businessType === bt.id && (
                        <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Business details ──────────────────────────────── */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">פרטי העסק</h2>
                  <p className="text-gray-500 text-sm mb-5">הלקוחות יראו את השם הזה בשיחת הוואטסאפ</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">שם העסק *</label>
                  <BusinessNameInput
                    value={businessName}
                    onChange={setBusinessName}
                    onPlaceSelect={(name, addr) => { setBusinessName(name); setAddress(addr); }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">כתובת <span className="text-gray-600">(אופציונלי)</span></label>
                  <AddressInput value={address} onChange={setAddress} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">טלפון עסק <span className="text-gray-600">(אופציונלי)</span></label>
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    className={inputCls} placeholder="050-1234567" dir="ltr" type="tel" />
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Services ──────────────────────────────────────── */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-black text-white mb-1">השירותים שלך</h2>
                <p className="text-gray-500 text-sm mb-5">כל השירותים נבחרו — הסר מה שאינך מציע ועדכן מחירים</p>

                {/* Service list - all in one line style */}
                <div className="space-y-2">
                  {/* Select-all row — same style as service rows */}
                  <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] px-3 py-2.5 bg-white/[0.02]">
                    <button
                      onClick={toggleAll}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                        allSelected ? 'bg-violet-600 border-violet-600' : 'border-gray-600 hover:border-violet-500'
                      }`}
                    >
                      {allSelected && <Check size={11} className="text-white" />}
                    </button>
                    <span className="text-gray-400 text-sm font-semibold flex-1">הכל</span>
                  </div>

                  {presets.map(svc => {
                    const sel = selectedServices.find(s => s.name === svc.name);
                    return (
                      <div key={svc.name} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                        sel ? 'border-violet-500/30 bg-violet-600/5' : 'border-white/[0.06] bg-white/[0.02] opacity-50'
                      }`}>
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleService(svc)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                            sel ? 'bg-violet-600 border-violet-600' : 'border-gray-600 hover:border-violet-500'
                          }`}
                        >
                          {sel && <Check size={11} className="text-white" />}
                        </button>

                        {/* Name */}
                        <span className={`text-sm font-medium flex-1 ${sel ? 'text-white' : 'text-gray-500'}`}>{svc.name}</span>

                        {/* Duration stepper */}
                        {sel && (
                          <Stepper
                            label={`${sel.duration_minutes} דק׳`}
                            onDecrement={() => updateService(svc.name, 'duration_minutes', -5)}
                            onIncrement={() => updateService(svc.name, 'duration_minutes', +5)}
                          />
                        )}

                        {/* Price stepper */}
                        {sel && (
                          <Stepper
                            label={`₪${sel.price}`}
                            onDecrement={() => updateService(svc.name, 'price', -10)}
                            onIncrement={() => updateService(svc.name, 'price', +10)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <p className="text-gray-600 text-xs mt-3">ניתן לשנות ולהוסיף שירותים בכל עת מהדשבורד</p>
              </motion.div>
            )}

            {/* ── Step 4: Settings (staff + hours + buffer) ─────────────── */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-black text-white mb-1">הגדרות</h2>
                <p className="text-gray-500 text-sm mb-6">כל ההגדרות ניתנות לשינוי בכל עת</p>

                {/* Staff count */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-300 mb-3">כמה עובדים?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { v: 1, label: 'עובד אחד', plan: '₪89/חודש' },
                      { v: 2, label: '2 עובדים ומעלה', plan: '₪200/חודש' },
                    ].map(({ v, label, plan }) => (
                      <button key={v} onClick={() => setStaffCount(v)}
                        className={`py-4 rounded-2xl font-bold text-center transition-all ${
                          (v === 1 && staffCount === 1) || (v === 2 && staffCount >= 2)
                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                            : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/8'
                        }`}
                      >
                        <div className="text-sm font-black">{label}</div>
                        <div className="text-xs opacity-70 mt-0.5">{plan}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-gray-600 text-xs mt-2 text-center">30 יום ניסיון חינמי לכל התוכניות</p>
                </div>

                {/* Hours */}
                <div className="border-t border-white/5 pt-5 mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-300">שעות פעילות</p>
                    <button onClick={() => setHours(DEFAULT_HOURS)} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                      אפס לברירת מחדל
                    </button>
                  </div>
                  <div className="space-y-2">
                    {/* Sun–Thu */}
                    {(() => {
                      const h = hours[0];
                      return (
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${h.is_open ? 'border-white/10 bg-white/5' : 'border-white/5 opacity-50'}`}>
                          <Toggle value={h.is_open} onChange={v => [0,1,2,3,4].forEach(i => setDayOpen(i, v))} />
                          <span className="text-white text-sm font-medium shrink-0">א׳–ה׳</span>
                          {h.is_open ? (
                            <div className="flex items-center gap-2 mr-auto">
                              <Stepper
                                label={h.open_time}
                                onDecrement={() => stepWeekdayTime('open_time', -30)}
                                onIncrement={() => stepWeekdayTime('open_time', +30)}
                              />
                              <span className="text-gray-600 text-xs">–</span>
                              <Stepper
                                label={h.close_time}
                                onDecrement={() => stepWeekdayTime('close_time', -30)}
                                onIncrement={() => stepWeekdayTime('close_time', +30)}
                              />
                            </div>
                          ) : <span className="text-gray-600 text-sm mr-auto">סגור</span>}
                        </div>
                      );
                    })()}

                    {/* Friday */}
                    {(() => {
                      const h = hours[5];
                      return (
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${h.is_open ? 'border-white/10 bg-white/5' : 'border-white/5 opacity-50'}`}>
                          <Toggle value={h.is_open} onChange={v => setDayOpen(5, v)} />
                          <span className="text-white text-sm font-medium shrink-0">שישי</span>
                          {h.is_open ? (
                            <div className="flex items-center gap-2 mr-auto">
                              <Stepper
                                label={h.open_time}
                                onDecrement={() => stepDayTime(5, 'open_time', -30)}
                                onIncrement={() => stepDayTime(5, 'open_time', +30)}
                              />
                              <span className="text-gray-600 text-xs">–</span>
                              <Stepper
                                label={h.close_time}
                                onDecrement={() => stepDayTime(5, 'close_time', -30)}
                                onIncrement={() => stepDayTime(5, 'close_time', +30)}
                              />
                            </div>
                          ) : <span className="text-gray-600 text-sm mr-auto">סגור</span>}
                        </div>
                      );
                    })()}

                    {/* Saturday — fixed closed */}
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 opacity-40">
                      <div className="w-10 h-6 rounded-full bg-gray-700 relative shrink-0">
                        <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow" />
                      </div>
                      <span className="text-gray-400 text-sm font-medium w-24 shrink-0">שבת</span>
                      <span className="text-gray-600 text-sm mr-auto">סגור</span>
                    </div>
                  </div>
                </div>

                {/* Buffer */}
                <div className="border-t border-white/5 pt-5">
                  <p className="text-sm font-semibold text-gray-300 mb-3">הפסקה בין תורים</p>
                  <Stepper
                    label={bufferMinutes === 0 ? 'ללא' : `${bufferMinutes} דק׳`}
                    onDecrement={() => setBufferMinutes(m => Math.max(0, m - 5))}
                    onIncrement={() => setBufferMinutes(m => Math.min(60, m + 5))}
                  />
                  <p className="text-gray-600 text-xs mt-3">זמן ניקיון והכנה בין תור לתור</p>
                </div>
              </motion.div>
            )}

            {/* ── Step 5: Account ───────────────────────────────────────── */}
            {step === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-black text-white mb-1">פרטי כניסה</h2>
                <p className="text-gray-500 text-sm mb-6">אלה הפרטים שלך לכניסה לדשבורד</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">שמך המלא *</label>
                    <input value={ownerName} onChange={e => setOwnerName(e.target.value)}
                      className={inputCls} placeholder="אבי כהן" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">אימייל *</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className={inputCls} placeholder="avi@example.com" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">סיסמה * <span className="text-gray-600 font-normal">(לפחות 8 תווים)</span></label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)}
                        className={`${inputCls} pl-11`} placeholder="••••••••" dir="ltr" />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                        {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">אישור סיסמה *</label>
                    <div className="relative">
                      <input type={showConfirmPass ? 'text' : 'password'} value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className={`${inputCls} pl-11 ${
                          confirmPassword && confirmPassword !== password ? 'border-red-500/60' :
                          confirmPassword && confirmPassword === password ? 'border-green-500/50' : ''
                        }`}
                        placeholder="••••••••" dir="ltr" />
                      <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                        {showConfirmPass ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-red-400 text-xs mt-1.5">הסיסמאות אינן תואמות</p>
                    )}
                  </div>
                  <div className="flex items-start gap-3 pt-1">
                    <button type="button" onClick={() => setTermsAccepted(!termsAccepted)}
                      className={`mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-all ${
                        termsAccepted ? 'bg-violet-600 border-violet-600' : 'border-gray-600 hover:border-violet-500'
                      }`}>
                      {termsAccepted && <Check size={11} className="text-white" />}
                    </button>
                    <span className="text-gray-400 text-sm leading-relaxed">
                      אני מסכים ל
                      <button type="button" onClick={() => setLegalModal('terms')} className="text-violet-400 hover:underline mx-1">תנאי השימוש</button>
                      ו
                      <button type="button" onClick={() => setLegalModal('privacy')} className="text-violet-400 hover:underline mx-1">מדיניות הפרטיות</button>
                      של Tori
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-7 pt-5 border-t border-white/5">
            <button onClick={prev}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors font-medium text-sm py-2 px-1">
              <ChevronRight size={17} />
              {step === 1 ? 'חזרה לאתר' : 'חזרה'}
            </button>

            {step < TOTAL_STEPS ? (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={next}
                className="bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold px-7 py-3 rounded-xl shadow-lg shadow-violet-500/20 text-sm">
                המשך
              </motion.button>
            ) : (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSubmit} disabled={loading}
                className="bg-gradient-to-r from-violet-600 to-green-500 text-white font-bold px-7 py-3 rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50 text-sm">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                {loading ? 'יוצר חשבון...' : 'צור חשבון חינם'}
              </motion.button>
            )}
          </div>
        </div>

        {/* Already have account */}
        <p className="text-center text-gray-600 text-sm mt-5">
          יש לך חשבון?{' '}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
            כניסה
          </Link>
        </p>
      </div>

      <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
    </div>
  );
}
