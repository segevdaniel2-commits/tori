import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Zap, Calendar, BarChart3, Users, Bell, FileText,
  ChevronLeft, Star, Check, Sparkles, MessageCircle, Bot, X
} from 'lucide-react';

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ from = 0, to, suffix = '', duration = 2 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    if (!inView) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, from, to, duration]);

  return <span ref={ref}>{display}{suffix}</span>;
}

// ─── WhatsApp Chat Bubbles ────────────────────────────────────────────────────
const CHAT = [
  { from: 'user', text: 'שלום, אפשר לקבוע תספורת למחר בערב?' },
  { from: 'bot',  text: 'היי! 😊 בשמחה, מחר יש לי פנוי ב-18:00 וב-19:30. מה מתאים?' },
  { from: 'user', text: '18:00 מושלם' },
  { from: 'bot',  text: '✅ נקבע!\nמחר שלישי בשעה 18:00\nתספורת · ₪60\nמחכים לך!' },
];

function ChatBubbles() {
  const [visible, setVisible] = useState(0);
  const [loops, setLoops] = useState(0);

  useEffect(() => {
    if (loops >= 2) {
      // Stay static — show all bubbles
      if (visible < CHAT.length) setVisible(CHAT.length);
      return;
    }
    if (visible >= CHAT.length) {
      const reset = setTimeout(() => { setVisible(0); setLoops(l => l + 1); }, 3500);
      return () => clearTimeout(reset);
    }
    const t = setTimeout(() => setVisible(v => v + 1), visible === 0 ? 800 : 2400);
    return () => clearTimeout(t);
  }, [visible, loops]);

  return (
    <div className="flex flex-col gap-3 w-full max-w-[340px] mx-auto py-6 px-2">
      {CHAT.slice(0, visible).map((msg, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex"
          style={{ justifyContent: msg.from === 'user' ? 'flex-start' : 'flex-end' }}
        >
          <div
            className={`max-w-[82%] px-4 py-3 text-sm leading-relaxed whitespace-pre-line shadow-md ${
              msg.from === 'user'
                ? 'bg-[#005C4B] text-white rounded-2xl rounded-tr-sm'
                : 'bg-[#1F2C34] text-gray-100 border border-white/5 rounded-2xl rounded-tl-sm'
            }`}
          >
            {msg.text}
            {msg.from === 'user' && (
              <span className="block text-left text-[10px] text-teal-300/70 mt-1 leading-none">✓✓</span>
            )}
          </div>
        </motion.div>
      ))}

      {visible < CHAT.length && visible > 0 && (
        <div className="flex" style={{ justifyContent: 'flex-end' }}>
          <div className="bg-[#1F2C34] border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm">
            <div className="flex gap-1.5 items-center h-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.18}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color = 'tori', delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const colorMap = {
    tori:  'from-tori-500 to-tori-700',
    coral: 'from-coral-400 to-coral-600',
    cyan:  'from-cyan-400 to-cyan-600',
    green: 'from-green-400 to-green-600',
    amber: 'from-amber-400 to-amber-600',
    pink:  'from-pink-400 to-pink-600',
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="group relative bg-[#0d1117] border border-gray-800 rounded-2xl p-6 hover:border-tori-500/50 transition-all duration-300 hover:-translate-y-1"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
        <Icon size={22} className="text-white" />
      </div>
      <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${colorMap[color]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
    </motion.div>
  );
}

// ─── Pricing card ─────────────────────────────────────────────────────────────
function PricingCard({ plan, price, features, highlight = false, badge }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`relative rounded-2xl p-8 border transition-all duration-300 ${
        highlight
          ? 'bg-gradient-to-b from-tori-600 to-tori-800 border-tori-500 shadow-2xl shadow-tori-500/30'
          : 'bg-[#0d1117] border-gray-800 hover:border-tori-500/40'
      }`}
    >
      {badge && (
        <div className="absolute -top-3 right-6 bg-gradient-to-r from-coral-500 to-coral-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          {badge}
        </div>
      )}
      <div className={`text-sm font-semibold uppercase tracking-wider mb-2 ${highlight ? 'text-tori-200' : 'text-gray-400'}`}>{plan}</div>
      <div className="flex items-end gap-1 mb-6">
        {price === 0 ? (
          <span className="text-4xl font-black text-white">חינם</span>
        ) : (
          <>
            <span className="text-4xl font-black text-white">₪{price}</span>
            <span className={`text-sm mb-1 ${highlight ? 'text-tori-200' : 'text-gray-400'}`}>/חודש</span>
          </>
        )}
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f, i) => (
          <li key={i} className={`flex items-start gap-2 text-sm ${highlight ? 'text-tori-100' : 'text-gray-300'}`}>
            <Check size={16} className={`mt-0.5 shrink-0 ${highlight ? 'text-white' : 'text-tori-400'}`} />
            {f}
          </li>
        ))}
      </ul>
      <Link to="/register">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
            highlight
              ? 'bg-white text-tori-700 hover:bg-tori-50'
              : 'bg-tori-600/20 text-tori-300 border border-tori-500/30 hover:bg-tori-600/30'
          }`}
        >
          התחל עכשיו
        </motion.button>
      </Link>
    </motion.div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="bg-[#0d1117] border border-gray-700 rounded-2xl p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="text-gray-400 text-sm leading-relaxed space-y-4">{children}</div>
      </motion.div>
    </div>
  );
}

// ─── Main Landing ─────────────────────────────────────────────────────────────
export default function Landing() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: '#08080F', color: '#e8e8f0', direction: 'rtl' }}>

      {/* ─── Nav ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5" style={{ background: 'rgba(8,8,15,0.88)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Tori" className="w-7 h-7" />
            <span className="font-black text-xl text-white tracking-tight">Tori</span>
            <span className="text-violet-400 font-black">.</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[['פיצ׳רים', 'features'], ['מחירים', 'pricing'], ['עדויות', 'testimonials']].map(([label, id]) => (
              <a key={id} href={`#${id}`} className="text-gray-400 hover:text-white text-sm font-medium transition-colors">{label}</a>
            ))}
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <Link to="/login" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">כניסה</Link>
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-gradient-to-r from-tori-600 to-tori-500 text-white text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl shadow-lg shadow-tori-500/25 hover:shadow-tori-500/40 transition-shadow"
              >
                התחל בחינם
              </motion.button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative min-h-screen flex items-center pt-20 pb-10 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `linear-gradient(rgba(124,58,237,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.15) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-tori-600/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-coral-500/15 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-tori-500/10 border border-tori-500/30 text-tori-300 text-sm font-medium px-4 py-2 rounded-full mb-6"
              >
                <Sparkles size={14} className="text-tori-400" />
                מופעל על ידי Llama 3 AI
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl lg:text-6xl xl:text-7xl font-black leading-tight mb-6"
                style={{ fontFamily: 'Heebo, sans-serif' }}
              >
                הבוט שמנהל לך
                <br />
                <span className="bg-gradient-to-l from-coral-500 via-tori-400 to-tori-600 bg-clip-text text-transparent">
                  את העסק 24/7
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-gray-400 text-lg lg:text-xl leading-relaxed mb-8 max-w-xl"
              >
                טורי הוא בוט וואטסאפ חכם שמקבל תורים, מבטל ועונה על שאלות בעברית מושלמת, כמו עובד אמיתי. בלי לנמנם. בלי לאחר.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 mb-10"
              >
                <Link to="/register" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0 20px 40px rgba(124,58,237,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full sm:w-auto bg-gradient-to-r from-tori-600 to-tori-500 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-xl shadow-tori-500/30 transition-all inline-flex items-center justify-center gap-2"
                  >
                    <Zap size={20} />
                    התחל בחינם
                  </motion.button>
                </Link>
                <motion.a
                  href="#features"
                  whileHover={{ scale: 1.02 }}
                  className="w-full sm:w-auto border border-gray-700 hover:border-tori-500/50 text-gray-300 hover:text-white font-semibold text-lg px-8 py-4 rounded-2xl transition-all inline-flex items-center gap-2 justify-center"
                >
                  ראה איך זה עובד
                  <ChevronLeft size={18} />
                </motion.a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-4 items-center"
              >
                {['ללא כרטיס אשראי', 'ביטול בכל עת', '30 יום חינם'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <Check size={14} className="text-green-400" />
                    {t}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Chat bubbles — hidden on mobile to keep hero clean */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="hidden sm:flex justify-center"
            >
              <div className="relative">
                {/* Ambient glow behind bubbles */}
                <div className="absolute inset-0 -z-10 blur-3xl opacity-25 bg-gradient-to-b from-tori-600 to-emerald-500 rounded-full scale-90" />

                {/* Floating WhatsApp badge */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                  className="absolute -top-5 -left-6 z-10"
                >
                  <div className="flex items-center gap-2 bg-[#25D366] text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg shadow-green-500/30">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </div>
                </motion.div>

                <ChatBubbles />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Marquee ─── */}
      <div className="border-y border-gray-800/50 py-4 overflow-hidden bg-[#0a0a12]">
        <div className="animate-marquee" style={{ display: 'flex', width: 'max-content' }}>
          {[0, 1].map(k => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', padding: '0 1.25rem', flexShrink: 0 }}>
              {['מספרות גברים', 'סלוני ציפורניים', 'ריסים ועיצוב גבות', 'מעסות', 'קוסמטיקאיות', 'אמני קעקועים', 'מספרות נשים', 'טיפולי פנים', 'ספא'].map((b, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#4b5563', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.025em', whiteSpace: 'nowrap' }}>
                  {b}
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#374151', display: 'inline-block', flexShrink: 0 }} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Stats ─── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: 24, suffix: '/7',   label: 'זמינות הבוט',        icon: Bot },
              { value: 30, suffix: ' יום', label: 'ניסיון חינמי',       icon: Calendar },
              { value: 2,  suffix: ' דק׳', label: 'זמן הגדרה ממוצע',   icon: Zap },
              { value: 98, suffix: '%',    label: 'לקוחות מרוצים',      icon: Star },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-8 rounded-2xl border border-gray-800 bg-[#0d1117] hover:border-tori-500/30 transition-all"
              >
                <div className="text-4xl font-black text-white mb-1">
                  <Counter to={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium px-4 py-2 rounded-full mb-4"
            >
              <Sparkles size={14} />
              פיצ׳רים
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl lg:text-5xl font-black text-white mb-4"
            >
              כל מה שהעסק שלך צריך
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg max-w-2xl mx-auto"
            >
              לא עוד שיחות טלפון, לא עוד ניהול ידני. טורי עושה הכל בשבילך.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={MessageCircle} title="בוט וואטסאפ AI" desc="מקבל תורים, מבטל ועונה על שאלות בעברית מושלמת, 24/7. הלקוחות שלך ידברו עם בוט שמרגיש כמו בן אדם אמיתי." color="cyan" delay={0} />
            <FeatureCard icon={Calendar} title="יומן חכם" desc="יומן ויזואלי בזמן אמת. ראה את כל התורים, הוסף ידנית, חסום זמנים, הכל בממשק אחד נוח ופשוט." color="tori" delay={0.1} />
            <FeatureCard icon={BarChart3} title="אנליטיקות" desc="גרפים של הכנסות, שירותים פופולריים ושעות עמוסות. דוח חודשי מפורט שיעזור לך לקבל החלטות חכמות." color="coral" delay={0.2} />
            <FeatureCard icon={Users} title="ריבוי עובדים" desc="כמה עובדים עם לוחות זמנים וצבעים נפרדים, מושלם לסלון שמעסיק מספר אנשים במקביל." color="green" delay={0.3} />
            <FeatureCard icon={Bell} title="תזכורות אוטומטיות" desc="הבוט שולח ללקוח תזכורת יום לפני התור, כך יש פחות ביטולים של הרגע האחרון ויותר כסף בכיס." color="amber" delay={0.4} />
            <FeatureCard icon={FileText} title="חשבוניות ירוקות" desc="אינטגרציה עם מערכת חשבוניות ירוקות לניהול חשבוניות ישירות מתוך היומן, בלי לצאת מהמסך." color="pink" delay={0.5} />
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-20 px-6 border-y border-gray-800/50" style={{ background: '#0a0a12' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">איך זה עובד?</h2>
            <p className="text-gray-400">3 צעדים ואתה מוכן</p>
          </div>

          <div className="flex flex-col md:flex-row items-start gap-4">
            {[
              { title: 'הרשמה: 2 דקות',    desc: 'מגדיר את העסק שלך: שם, שירותים, מחירים ושעות עבודה, בדיוק כמו שנוח לך.',                    icon: Zap },
              { title: 'חיבור וואטסאפ',   desc: 'שתף ברקוד וקישור של הבוט ללקוחות. מספר אחד לכל העסקים.',                                     icon: MessageCircle },
              { title: 'הבוט עובד בשבילך', desc: 'מהיום הבוט עובד בשבילך, מקבל תורים, מייעץ ללקוחות, ועובד 24/7. כן גם כשאתה ישן.', icon: Bot },
            ].map((s, i) => (
              <React.Fragment key={i}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="flex-1 text-center px-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-tori-600 to-tori-800 border border-tori-500/50 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-tori-500/20">
                    <s.icon size={26} className="text-tori-200" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                </motion.div>

                {i < 2 && (
                  <div className="hidden md:flex items-center pt-7 flex-shrink-0 text-tori-600/40 text-3xl font-thin select-none">
                    ←
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">מחירים פשוטים ושקופים</h2>
            <p className="text-gray-400">ללא הפתעות. ביטול בכל עת.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <PricingCard
              plan="ניסיון חינמי"
              price={0}
              features={[
                '30 יום מלאים חינם',
                'בוט וואטסאפ פעיל',
                'יומן ולקוחות',
                'ללא כרטיס אשראי',
                'עובד אחד',
              ]}
            />
            <PricingCard
              plan="Basic"
              price={99}
              highlight={true}
              badge="הכי פופולרי"
              features={[
                'עובד אחד',
                'תורים ללא הגבלה',
                'בוט AI 24/7',
                'יומן ואנליטיקות',
                'תמיכה בוואטסאפ',
              ]}
            />
            <PricingCard
              plan="Business"
              price={200}
              features={[
                'עד 4 עובדים',
                'תורים ללא הגבלה',
                'בוט AI 24/7',
                'דוחות מתקדמים',
                'אינטגרציית יומן גוגל',
                'חשבוניות ירוקות',
              ]}
            />
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="py-20 px-6 border-t border-gray-800/50" style={{ background: '#0a0a12' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">מה אומרים עלינו</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'שירלי ב.',
                role: 'ספרית, תל אביב',
                text: 'לפני טורי הייתי מפסידה תורים כי לא תמיד עניתי לטלפון, עכשיו הבוט עונה בשבילי גם בשתיים בלילה וגם ביום שישי בצהריים. לא מבינה איך עבדתי בלעדיו.',
                stars: 5,
              },
              {
                name: 'ניצן מ.',
                role: 'סלון ציפורניים, חיפה',
                text: 'הלקוחות שלי קובעות תורים בלילה כשאני ישנה, ואני מגיעה בבוקר עם לוח מלא. שלושה שבועות אחרי שעברתי לטורי ההכנסות עלו בעשרים אחוז.',
                stars: 5,
              },
              {
                name: 'רועי ח.',
                role: 'סלון ריסים, ירושלים',
                text: 'יש לי שתי עובדות וחשבתי שיהיה מסובך לנהל שני לוחות זמנים, אבל טורי מסדר הכל לבד, אני כמעט לא צריך לגעת ביומן.',
                stars: 5,
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#0d1117] border border-gray-800 rounded-2xl p-6 hover:border-tori-500/30 transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {Array(t.stars).fill(0).map((_, j) => (
                    <Star key={j} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tori-600 to-coral-500 flex items-center justify-center text-white font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{t.name}</div>
                    <div className="text-gray-500 text-xs">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-tori-900/50 to-coral-900/30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-tori-600/10 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-black text-white mb-6">מוכן להפסיק לנהל תורים ידנית?</h2>
            <p className="text-gray-400 text-xl mb-10">הצטרף לעשרות בעלי עסקים שכבר חוסכים שעות בשבוע עם טורי.</p>
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 25px 50px rgba(124,58,237,0.45)' }}
                whileTap={{ scale: 0.97 }}
                className="bg-gradient-to-r from-tori-600 to-tori-500 text-white font-black text-xl px-12 py-5 rounded-2xl shadow-2xl shadow-tori-500/30 inline-flex items-center gap-3"
              >
                <Zap size={24} />
                התחל 30 יום חינם
              </motion.button>
            </Link>
            <p className="text-gray-600 text-sm mt-4">ללא כרטיס אשראי · ביטול בכל עת · הגדרה תוך 2 דקות</p>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-800/50 py-12 px-6" style={{ background: '#08080F' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="Tori" className="w-6 h-6" />
              <span className="font-black text-xl text-white">Tori</span>
              <span className="text-violet-400 font-black">.</span>
            </div>
            <div className="flex flex-wrap gap-6 text-gray-500 text-sm justify-center">
              <button onClick={() => setTermsOpen(true)} className="hover:text-white transition-colors">תנאי שימוש</button>
              <button onClick={() => setPrivacyOpen(true)} className="hover:text-white transition-colors">פרטיות</button>
              <button onClick={() => setAccessOpen(true)} className="hover:text-white transition-colors">הצהרת נגישות</button>
              <a href="https://wa.me/972584532944" className="hover:text-green-400 transition-colors">תמיכה: מרדכי 058-453-2944</a>
              <a href="https://wa.me/972509603671" className="hover:text-green-400 transition-colors">עומרי 050-960-3671</a>
            </div>
            <p className="text-gray-600 text-sm">© {new Date().getFullYear()} Tori</p>
          </div>
        </div>
      </footer>

      {/* ─── Modals ─── */}
      <Modal open={termsOpen} onClose={() => setTermsOpen(false)} title="תנאי שימוש">
        <p>ברוכים הבאים לטורי. השימוש בפלטפורמה מהווה הסכמה לתנאים הבאים.</p>
        <p><strong className="text-white">1. השירות:</strong> טורי מספקת תוכנה לניהול תורים באמצעות בוט וואטסאפ. הגישה לשירות מותנית בתשלום חודשי לאחר תקופת הניסיון.</p>
        <p><strong className="text-white">2. אחריות:</strong> טורי אינה אחראית לנזקים עקיפים הנובעים משימוש בשירות. האחריות המקסימלית מוגבלת לדמי המנוי החודשיים.</p>
        <p><strong className="text-white">3. ביטול:</strong> ניתן לבטל את המנוי בכל עת דרך הגדרות החשבון. לא יינתן החזר על תקופה שכבר שולמה.</p>
        <p><strong className="text-white">4. שינויים:</strong> טורי רשאית לעדכן תנאים אלו עם הודעה מוקדמת של 14 יום.</p>
        <p className="text-gray-600 text-xs">עודכן לאחרונה: מרץ 2026</p>
      </Modal>

      <Modal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="מדיניות פרטיות">
        <p>טורי מתחייבת להגן על פרטיות המשתמשים שלה בהתאם לחוק הגנת הפרטיות הישראלי.</p>
        <p><strong className="text-white">מידע שנאסף:</strong> שם, כתובת אימייל, טלפון, ופרטי העסק שהוזנו בעת ההרשמה. היסטוריית שיחות הבוט לצרכי שיפור השירות.</p>
        <p><strong className="text-white">שימוש במידע:</strong> המידע משמש אך ורק לצרכי הפעלת השירות, שיפורו ותמיכה טכנית.</p>
        <p><strong className="text-white">שיתוף מידע:</strong> טורי אינה מוכרת מידע לצדדים שלישיים. שיתוף מוגבל לספקי תשתית הכרחיים.</p>
        <p><strong className="text-white">זכויות:</strong> יש לך זכות לצפות, לתקן ולמחוק את המידע שלך. לפנייה: <a href="mailto:privacy@tori.co.il" className="text-tori-400">privacy@tori.co.il</a></p>
        <p className="text-gray-600 text-xs">עודכן לאחרונה: מרץ 2026</p>
      </Modal>

      <Modal open={accessOpen} onClose={() => setAccessOpen(false)} title="הצהרת נגישות">
        <p>טורי מחויבת לנגישות דיגיטלית בהתאם לתקן הישראלי 5568 ולהנחיות WCAG 2.1.</p>
        <p><strong className="text-white">רמת תאימות:</strong> אנו שואפים לעמוד ברמת AA של WCAG 2.1. חלק מהתכנים עשויים להיות בתהליך שיפור.</p>
        <p><strong className="text-white">תכונות נגישות:</strong> ניווט מקלדת מלא, תמיכה בקוראי מסך, יחסי ניגוד עומדים בתקן, תמיכה בהגדלת טקסט.</p>
        <p><strong className="text-white">בעיות ידועות:</strong> אנו עובדים על שיפור נגישות מרכיבי הגרפים. מחויבים לסיים עד יוני 2026.</p>
        <p><strong className="text-white">דיווח על בעיות:</strong> נתקלת בבעיית נגישות? נשמח לשמוע:<br />
          <a href="mailto:access@tori.co.il" className="text-tori-400">access@tori.co.il</a>
        </p>
        <p><strong className="text-white">עדכון אחרון:</strong> מרץ 2026. ביצענו בדיקת נגישות עצמית.</p>
      </Modal>
    </div>
  );
}
