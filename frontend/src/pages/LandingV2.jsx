import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  MessageCircle, Calendar, BarChart3, Users, Bell, FileText,
  Zap, Check, Star, Sparkles, Bot, ChevronLeft, X,
} from 'lucide-react';
import { WebGLShader } from '@/components/ui/web-gl-shader';

// ─── Logo ─────────────────────────────────────────────────────────────────────
function ToriLogo({ size = 34 }) {
  const id = 'tori-logo-grad';
  return (
    <svg width={size * 0.85} height={size * 0.85} viewBox="0 0 40 40" style={{ display: 'inline-block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#f97316" />
          <stop offset="50%"  stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <text
        x="50%" y="78%"
        textAnchor="middle"
        fill={`url(#${id})`}
        style={{ fontFamily: "'Inter','Heebo',sans-serif", fontWeight: 900, fontSize: 38, letterSpacing: '-2px' }}
      >T</text>
    </svg>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = '', prefix = '', duration = 2.2 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, to, duration]);

  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>;
}

// ─── WhatsApp chat bubbles ─────────────────────────────────────────────────────
const CHAT = [
  { from: 'user', text: 'היי אפשר לקבוע תספורת למחר בערב?' },
  { from: 'bot',  text: 'היי! בשמחה, מחר יש לי פנוי בשש ובשבע וחצי. מה מתאים?' },
  { from: 'user', text: 'שש מושלם!' },
  { from: 'bot',  text: 'קבענו למחר בשעה שש, נתראה!' },
];

function ChatBubbles() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= CHAT.length) return;
    const t = setTimeout(() => setVisible(v => v + 1), visible === 0 ? 800 : 2400);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <div className="flex flex-col gap-8 w-full max-w-[420px] mx-auto py-8 px-4">
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

// ─── Glass card ────────────────────────────────────────────────────────────────
function GlassCard({ children, className = '', delay = 0, hover = true }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={hover ? { y: -5 } : {}}
      className={`relative rounded-2xl border border-gray-800 transition-colors duration-300 hover:border-[#f43f5e]/30 ${className}`}
      style={{ background: 'rgba(13,17,27,0.75)', backdropFilter: 'blur(12px)' }}
    >
      {children}
    </motion.div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
const colorMap = {
  cyan:  { from: 'from-cyan-500',  to: 'to-cyan-700',  glow: 'rgba(6,182,212,0.12)' },
  tori:  { from: 'from-[#f43f5e]', to: 'to-[#06b6d4]', glow: 'rgba(244,63,94,0.12)' },
  coral: { from: 'from-coral-400', to: 'to-coral-600', glow: 'rgba(244,63,94,0.12)' },
  green: { from: 'from-green-400', to: 'to-green-600', glow: 'rgba(34,197,94,0.12)' },
  amber: { from: 'from-amber-400', to: 'to-amber-600', glow: 'rgba(245,158,11,0.12)' },
  pink:  { from: 'from-pink-400',  to: 'to-pink-600',  glow: 'rgba(236,72,153,0.12)' },
};

function FeatureCard({ icon: Icon, title, desc, color = 'tori', delay = 0 }) {
  const c = colorMap[color];
  return (
    <GlassCard delay={delay} className="p-6 group cursor-default overflow-hidden">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.from} ${c.to} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
        <Icon size={20} className="text-white" />
      </div>
      <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${c.glow}, transparent 70%)` }} />
    </GlassCard>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
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
        className="bg-[#0d1117] border border-gray-800 rounded-2xl p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
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

// ─── Marquee ──────────────────────────────────────────────────────────────────
const BUSINESS_TYPES = [
  'מספרות גברים', 'סלוני ציפורניים', 'ריסים ועיצוב גבות',
  'מעסות', 'קוסמטיקאיות', 'אמני קעקועים',
  'מספרות נשים', 'טיפולי פנים', 'ספא ורווחה', 'פילאטיס',
];

function InfiniteMarquee() {
  // 2 copies → marquee keyframe goes to -50% = exactly 1 set width (seamless)
  const items = [...BUSINESS_TYPES, ...BUSINESS_TYPES];
  return (
    <div className="py-3" style={{ overflow: 'hidden', position: 'relative' }}>
      <div className="absolute inset-y-0 right-0 w-20 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, rgba(8,8,15,1), transparent)' }} />
      <div className="absolute inset-y-0 left-0 w-20 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(8,8,15,1), transparent)' }} />
      <div style={{
        display: 'flex',
        width: 'max-content',
        animation: 'marquee 30s linear infinite',
      }}>
        {items.map((b, i) => (
          <span key={i} className="flex items-center gap-3 text-gray-600 text-sm font-medium whitespace-nowrap"
            style={{ padding: '0 1.5rem' }}>
            {b}
            <span className="w-1 h-1 rounded-full bg-gray-700 inline-block shrink-0" />
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Testimonial card ─────────────────────────────────────────────────────────
function TestimonialCard({ t, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      className="bg-[#0d1117] border border-gray-800 rounded-2xl p-6 hover:border-[#f43f5e]/30 transition-colors cursor-pointer"
    >
      <div className="flex gap-1 mb-4">
        {Array(5).fill(0).map((_, j) => <Star key={j} size={14} className="fill-amber-400 text-amber-400" />)}
      </div>
      <p className="text-gray-300 text-sm leading-relaxed mb-5">"{t.text}"</p>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatar} flex items-center justify-center text-white font-bold shrink-0`}>
          {t.name[0]}
        </div>
        <div>
          <div className="text-white font-semibold text-sm">{t.name}</div>
          <div className="text-gray-500 text-xs">{t.role}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingV2() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <MotionConfig reducedMotion={isMobile ? 'always' : 'never'}>
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#08080F', color: '#e8e8f0', direction: 'rtl' }}>

      {/* ─── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/50"
        style={{ background: 'rgba(8,8,15,0.88)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-[#f97316] via-[#f43f5e] to-[#06b6d4] bg-clip-text text-transparent">Tori</span>
            <ToriLogo size={32} />
          </Link>

          {/* Links — center */}
          <div className="hidden md:flex items-center gap-8">
            {[['פיצ׳רים', '#features'], ['מחירים', '#pricing'], ['עדויות', '#testimonials']].map(([label, href]) => (
              <a key={href} href={href} className="text-gray-400 hover:text-white text-sm font-medium transition-colors">{label}</a>
            ))}
          </div>

          {/* CTAs — LEFT in RTL (last in HTML) */}
          <div className="flex items-center gap-5">
            <Link to="/login" className="text-gray-400 hover:text-white text-sm font-medium transition-colors hidden sm:block">כניסה</Link>
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-gradient-to-r from-[#f97316] via-[#f43f5e] to-[#06b6d4] text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-[#f43f5e]/25"
              >
                התחל בחינם
              </motion.button>
            </Link>
          </div>

        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-20 pb-12 px-4 md:px-6 overflow-hidden">
        <WebGLShader className="absolute inset-0 w-full h-full block" />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-56 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to bottom, transparent, #08080F)' }} />
        {/* Side vignette */}
        <div className="absolute inset-0 pointer-events-none z-10"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(8,8,15,0.55) 100%)' }} />

        <div className="relative z-20 max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Text */}
            <div className="text-center lg:text-right">
              <motion.h1
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight mb-5"
                style={{ fontFamily: 'Heebo, sans-serif' }}
              >
                <span className="relative inline-block">
                  הסוכן
                  {/* WhatsApp logo leaning on the word */}
                  <motion.span
                    initial={{ opacity: 0, rotate: 20, y: 8 }}
                    animate={{ opacity: 1, rotate: 15, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute -top-5 -right-7 inline-block"
                  >
                    <svg viewBox="0 0 24 24" fill="#25D366" className="w-8 h-8 drop-shadow-lg" style={{ filter: 'drop-shadow(0 4px 12px rgba(37,211,102,0.5))' }}>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </motion.span>
                </span>{' '}שמנהל לך
                <br />
                <span style={{
                  background: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 38%, #22d3ee 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  את העסק
                </span>
                {' '}24/7
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.17 }}
                className="text-gray-400 text-base md:text-lg lg:text-xl leading-relaxed mb-7 max-w-xl mx-auto lg:mx-0"
              >
                טורי הוא סוכן AI שמקבל תורים, עונה ללקוחות ומנהל את היומן שלך ישירות בוואטסאפ. הלקוחות שלך מדברים עם בוט שמרגיש כמו אדם אמיתי, אתה פשוט עובד.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.26 }}
                className="flex flex-col lg:flex-row gap-3 mb-7"
              >
                <Link to="/register" className="w-full lg:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0 20px 40px rgba(244,63,94,0.35)' }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full bg-gradient-to-r from-[#f97316] via-[#f43f5e] to-[#06b6d4] text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-xl shadow-coral-500/25 inline-flex items-center justify-center gap-2"
                  >
                    <Zap size={19} />
                    התחל 30 יום חינם
                  </motion.button>
                </Link>
                <motion.a
                  href="#features"
                  whileHover={{ scale: 1.02 }}
                  className="w-full lg:w-auto border border-gray-700 hover:border-[#f43f5e]/50 text-gray-300 hover:text-white font-semibold text-base px-8 py-3.5 rounded-2xl transition-all inline-flex items-center gap-2 justify-center"
                >
                  ראה איך זה עובד
                  <ChevronLeft size={16} />
                </motion.a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-4 items-center justify-center lg:justify-start"
              >
                {['ללא כרטיס אשראי', 'ביטול בכל עת', 'הגדרה תוך דקה'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <Check size={13} className="text-green-400" />
                    {t}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Chat preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="hidden sm:flex justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 -z-10 blur-3xl opacity-25 bg-gradient-to-b from-[#f43f5e] to-[#06b6d4] rounded-full scale-90" />
                {/* WhatsApp header bar */}
                <div className="flex items-center gap-3 px-4 py-3 mb-1 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center shrink-0 shadow-md shadow-green-500/30">
                    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">Tori - Jonson Barber</div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                      <span className="text-green-400 text-xs">מחובר עכשיו</span>
                    </div>
                  </div>
                </div>
                <ChatBubbles />
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ─── Infinite marquee ─────────────────────────────────────────────── */}
      <div className="border-y border-gray-800/50 bg-[#0a0a12]">
        <InfiniteMarquee />
      </div>

      {/* ─── Stats ────────────────────────────────────────────────────────── */}
      <section className="py-12 md:py-16 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {[
              { value: 24, suffix: '/7',   label: 'זמינות הבוט' },
              { value: 30, suffix: ' יום', label: 'ניסיון חינמי' },
              { value: 2,  suffix: ' דק׳', label: 'זמן הגדרה ממוצע' },
              { value: 98, suffix: '%',    label: 'לקוחות מרוצים' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-5 md:p-8 rounded-2xl border border-gray-800 bg-[#0d1117] hover:border-[#f43f5e]/30 transition-all"
              >
                <div className="text-4xl font-black text-white mb-1" style={{ fontFamily: 'Heebo, sans-serif' }}>
                  <Counter to={s.value} suffix={s.suffix} />
                </div>
                <div className="text-gray-500 text-sm">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-14 md:py-24 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3"
            >
              כל מה שהעסק שלך צריך
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg max-w-2xl mx-auto"
            >
              לא עוד שיחות טלפון, לא עוד ניהול ידני, טורי עושה הכל בשבילך.
            </motion.p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon={MessageCircle} color="cyan"  delay={0}    title="בוט וואטסאפ AI"       desc="מקבל תורים, מבטל ועונה על שאלות בעברית שוטפת, 24 שעות ביממה. הלקוחות מרגישים שמדברים עם אדם אמיתי." />
            <FeatureCard icon={Calendar}      color="tori"  delay={0.06}  title="יומן חכם בזמן אמת"    desc="ממשק ויזואלי נוח לניהול כל התורים. הוסף ידנית, חסום זמנים, ראה את כל הפעילות במקום אחד." />
            <FeatureCard icon={BarChart3}     color="coral" delay={0.12}  title="אנליטיקות ודוחות"     desc="גרפים של הכנסות, שירותים פופולריים ושעות עמוסות. דוח חודשי שיעזור לך לקבל החלטות חכמות." />
            <FeatureCard icon={Users}         color="green" delay={0.18}  title="ריבוי עובדים"          desc="כמה עובדים עם לוחות זמנים וצבעים נפרדים. מושלם לסלון שמעסיק מספר אנשים במקביל." />
            <FeatureCard icon={Bell}          color="amber" delay={0.24}  title="תזכורות אוטומטיות"    desc="הבוט שולח ללקוח תזכורת יום לפני התור. פחות ביטולי רגע אחרון ויותר כסף בכיס." />
            <FeatureCard icon={FileText}      color="pink"  delay={0.30}  title="חשבוניות ירוקות"      desc="אינטגרציה עם מערכת חשבוניות ירוקות לניהול חשבוניות ישירות מתוך היומן, בלי לצאת מהמסך." />
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────────── */}
      <section className="py-14 md:py-24 px-4 md:px-6 border-y border-gray-800/50" style={{ background: '#0a0a12' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3">מה התהליך?</h2>
            <p className="text-gray-400 text-base md:text-lg">3 צעדים ואתה מוכן</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                emoji: '⚡',
                step: '01',
                title: 'נרשמים תוך 2 דקות',
                desc: 'שם העסק, שירותים, מחירים ושעות עבודה, הכל בממשק פשוט ומהיר.',
                from: '#f43f5e', to: '#fb923c',
                border: 'hover:border-rose-500/40',
              },
              {
                emoji: '🌐',
                step: '02',
                title: 'מחברים את הוואטסאפ',
                desc: 'שולחים ללקוחות קישור אחד, מהרגע הזה הבוט מקבל תורים במקומך.',
                from: '#f43f5e', to: '#06b6d4',
                border: 'hover:border-[#06b6d4]/40',
              },
              {
                emoji: '🦾',
                step: '03',
                title: 'הבוט עובד, אתה נח',
                desc: 'תורים, ביטולים, תזכורות, הכל רץ לבד 24/7, גם כשאתה ישן.',
                from: '#06b6d4', to: '#10b981',
                border: 'hover:border-cyan-500/40',
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.4 }}
                className={`relative bg-[#0d1117] border border-gray-800 ${s.border} rounded-2xl p-6 md:p-8 transition-colors duration-300 group`}
              >
                {/* Step number */}
                <div className="absolute top-6 left-6 text-5xl font-black select-none pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.04)', fontFamily: 'Heebo, sans-serif' }}>{s.step}</div>

                {/* Emoji icon with gradient glow */}
                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-3xl"
                  style={{ background: `linear-gradient(135deg, ${s.from}22, ${s.to}22)`, border: `1px solid ${s.from}44` }}>
                  <div className="absolute inset-0 rounded-2xl blur-md opacity-30"
                    style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }} />
                  <span className="relative z-10">{s.emoji}</span>
                </div>

                <h3 className="text-white font-bold text-xl mb-3">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>

              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-14 md:py-24 px-4 md:px-6 border-t border-gray-800/50" style={{ background: '#0a0a12' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3">מה אומרים עלינו</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {[
              { name: 'שירלי ב.',  role: 'סלון ריסים, תל אביב',     avatar: 'from-[#f97316] to-[#f43f5e]',  text: 'לפני טורי הייתי מפסידה תורים כי לא תמיד עניתי לטלפון. עכשיו הבוט עונה בשבילי גם בשתיים בלילה וגם ביום שישי בצהריים. לא מבינה איך עבדתי בלעדיו.' },
              { name: 'ניצן מ.',  role: 'סלון ציפורניים, תל אביב', avatar: 'from-[#f43f5e] to-[#06b6d4]',   text: 'הלקוחות שלי קובעות תורים בלילה כשאני ישנה, ואני מגיעה בבוקר עם לוח מלא. שלושה שבועות אחרי שעברתי לטורי ההכנסות עלו בעשרים אחוז.' },
              { name: 'רועי ח.',  role: 'ספר, ירושלים',             avatar: 'from-[#06b6d4] to-[#f43f5e]',   text: 'יש לי שתי עובדות וחשבתי שיהיה מסובך לנהל שני לוחות זמנים, אבל טורי מסדר הכל לבד, אני כמעט לא צריך לגעת ביומן.' },
            ].map((t, i) => (
              <TestimonialCard key={i} t={t} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-14 md:py-24 px-4 md:px-6 border-t border-gray-800/50" style={{ background: '#0a0a12' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3">מחירים פשוטים ושקופים</h2>
            <p className="text-gray-400 text-base md:text-lg">ללא הפתעות. ביטול בכל עת.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 items-stretch">
            {[
              {
                plan: 'ניסיון חינמי', price: 0, highlight: false, badge: 'ללא כרטיס אשראי', delay: 0,
                features: ['30 יום מלאים חינם', 'בוט וואטסאפ פעיל', 'יומן וניהול לקוחות', 'ללא כרטיס אשראי', 'עובד אחד'],
              },
              {
                plan: 'Basic', price: 99, highlight: true, badge: 'הכי פופולרי', delay: 0.1,
                features: ['עובד אחד', 'תורים ללא הגבלה', 'בוט AI 24 שעות', 'יומן ואנליטיקות', 'תמיכה בוואטסאפ'],
              },
              {
                plan: 'Business', price: 200, highlight: false, badge: null, delay: 0.2,
                features: ['עד 4 עובדים', 'תורים ללא הגבלה', 'בוט AI 24 שעות', 'דוחות מתקדמים', 'גוגל קלנדר', 'חשבוניות ירוקות'],
              },
            ].map(({ plan, price, highlight, badge, delay, features }) => (
                <motion.div
                  key={plan}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.18, delay: delay * 0.5, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4 }}
                  className={`relative rounded-2xl p-6 md:p-8 transition-all duration-300 flex flex-col h-full ${
                    highlight
                      ? 'bg-gradient-to-b from-[#be123c] to-[#0e7490] shadow-2xl shadow-[#f43f5e]/20'
                      : 'border border-gray-800 hover:border-[#f43f5e]/30 bg-[#0d1117]'
                  }`}
                >
                  {badge && (
                    <div className={`absolute -top-3 right-6 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg ${
                      badge === 'ללא כרטיס אשראי'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-400 shadow-green-500/25'
                        : 'bg-gradient-to-r from-coral-500 to-coral-400 shadow-coral-500/25'
                    }`}>
                      {badge}
                    </div>
                  )}
                  <div className={`text-sm font-semibold uppercase tracking-wider mb-2 ${highlight ? 'text-white/70' : 'text-gray-400'}`}>{plan}</div>
                  <div className="flex items-end gap-1 mb-6">
                    {price === 0
                      ? <span className="text-4xl font-black text-white">חינם</span>
                      : <>
                        <span className="text-4xl font-black text-white">₪{price}</span>
                        <span className={`text-sm mb-1 ${highlight ? 'text-white/70' : 'text-gray-400'}`}>/חודש</span>
                      </>
                    }
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {features.map((f, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${highlight ? 'text-white/90' : 'text-gray-300'}`}>
                        <Check size={16} className={`mt-0.5 shrink-0 ${highlight ? 'text-[#06b6d4]' : 'text-[#f43f5e]'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="mt-auto">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                        highlight
                          ? 'bg-white text-[#be123c] hover:bg-gray-50'
                          : 'bg-transparent text-white border border-white/20 hover:border-white/40 hover:bg-white/5'
                      }`}
                    >
                      התחל עכשיו
                    </motion.button>
                  </Link>
                </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-28 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(244,63,94,0.06))' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.1), transparent 70%)' }} />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-5">מוכן להפסיק לנהל תורים ידנית?</h2>
            <p className="text-gray-400 text-base md:text-xl mb-8">הצטרף לעסקים שכבר חוסכים שעות בשבוע עם טורי.</p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto md:max-w-none md:flex-row md:justify-center">
              <Link to="/register" className="w-full md:w-auto">
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 20px 40px rgba(244,63,94,0.35)' }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-gradient-to-r from-[#f97316] via-[#f43f5e] to-[#06b6d4] text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-xl shadow-coral-500/25 inline-flex items-center justify-center gap-2"
                >
                  <Zap size={20} />
                  התחל 30 יום חינם
                </motion.button>
              </Link>
              <Link to="/login" className="w-full md:w-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full border border-gray-700 hover:border-[#f43f5e]/40 text-gray-400 hover:text-white font-semibold text-lg px-8 py-4 rounded-2xl transition-all"
                >
                  יש לי חשבון
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800/50 py-10 px-4 md:px-6" style={{ background: '#08080F' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="font-black text-xl text-white">Tori</span>
              <ToriLogo size={26} />
            </div>
            <div className="flex flex-wrap gap-4 text-gray-500 text-sm justify-center">
              <button onClick={() => setTermsOpen(true)} className="hover:text-white transition-colors">תנאי שימוש</button>
              <button onClick={() => setPrivacyOpen(true)} className="hover:text-white transition-colors">פרטיות</button>
              <button onClick={() => setAccessOpen(true)} className="hover:text-white transition-colors">הצהרת נגישות</button>
              <a href="https://wa.me/972584532944" className="hover:text-green-400 transition-colors">תמיכה: מרדכי 058-453-2944</a>
              <a href="https://wa.me/972509603671" className="hover:text-green-400 transition-colors">עומרי 050-960-3671</a>
              <a href="mailto:supporttori@gmail.com" className="hover:text-[#f43f5e] transition-colors">supporttori@gmail.com</a>
            </div>
            <p className="text-gray-600 text-sm">© {new Date().getFullYear()} Tori</p>
          </div>
        </div>
      </footer>

      {/* ─── Modals ───────────────────────────────────────────────────────── */}
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
        <p><strong className="text-white">זכויות:</strong> יש לך זכות לצפות, לתקן ולמחוק את המידע שלך. לפנייה: <a href="mailto:privacy@tori.co.il" className="text-[#f43f5e]">privacy@tori.co.il</a></p>
        <p className="text-gray-600 text-xs">עודכן לאחרונה: מרץ 2026</p>
      </Modal>

      <Modal open={accessOpen} onClose={() => setAccessOpen(false)} title="הצהרת נגישות">
        <p>טורי מחויבת לנגישות דיגיטלית בהתאם לתקן הישראלי 5568 ולהנחיות WCAG 2.1.</p>
        <p><strong className="text-white">רמת תאימות:</strong> אנו שואפים לעמוד ברמת AA של WCAG 2.1. חלק מהתכנים עשויים להיות בתהליך שיפור.</p>
        <p><strong className="text-white">תכונות נגישות:</strong> ניווט מקלדת מלא, תמיכה בקוראי מסך, יחסי ניגוד עומדים בתקן, תמיכה בהגדלת טקסט.</p>
        <p><strong className="text-white">בעיות ידועות:</strong> אנו עובדים על שיפור נגישות מרכיבי הגרפים. מחויבים לסיים עד יוני 2026.</p>
        <p><strong className="text-white">דיווח על בעיות:</strong> נתקלת בבעיית נגישות? נשמח לשמוע: <a href="mailto:access@tori.co.il" className="text-[#f43f5e]">access@tori.co.il</a></p>
        <p className="text-gray-600 text-xs">עודכן לאחרונה: מרץ 2026</p>
      </Modal>

    </div>
    </MotionConfig>
  );
}
