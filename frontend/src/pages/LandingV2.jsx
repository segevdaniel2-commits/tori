import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  Zap, Check, Star, ChevronLeft, X, Menu,
} from 'lucide-react';
import { SplineScene } from '@/components/ui/splite';
import robotWaveImg from '../assets/robot-wave.png';
import robotBarberImg from '../assets/robot-barber.png';
import robotCosmeticianImg from '../assets/robot-cosmetician.png';
import WhatsAppDemo from '../components/WhatsAppDemo';

// ─── Global SVG Glass Filter ───────────────────────────────────────────────────
function GlassFilter() {
  return (
    <svg className="hidden" aria-hidden="true">
      <defs>
        <filter id="lg-filter" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.06 0.06" numOctaves="1" seed="2" result="turbulence" />
          <feGaussianBlur in="turbulence" stdDeviation="1.5" result="blurredNoise" />
          <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="55" xChannelSelector="R" yChannelSelector="B" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="3" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

// ─── Liquid Glass style helpers ────────────────────────────────────────────────
const glassCard = {
  background: 'rgba(255,255,255,0.38)',
  backdropFilter: 'blur(44px) saturate(220%)',
  WebkitBackdropFilter: 'blur(44px) saturate(220%)',
  border: '1.5px solid rgba(255,255,255,0.88)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1.5px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.04)',
};

const glassNav = {
  background: 'rgba(255,255,255,0.44)',
  backdropFilter: 'blur(48px) saturate(220%)',
  WebkitBackdropFilter: 'blur(48px) saturate(220%)',
  border: '1.5px solid rgba(255,255,255,0.92)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.07), inset 0 1.5px 0 rgba(255,255,255,1)',
};

// ─── Logo ──────────────────────────────────────────────────────────────────────
function ToriLogo({ size = 34 }) {
  const id = React.useId();
  return (
    <svg width={size * 0.85} height={size * 0.85} viewBox="0 0 40 40" style={{ display: 'inline-block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#22c55e" />
          <stop offset="50%"  stopColor="#16a34a" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
      </defs>
      <text x="50%" y="78%" textAnchor="middle" fill={`url(#${id})`}
        style={{ fontFamily: "'Inter','Heebo',sans-serif", fontWeight: 900, fontSize: 38, letterSpacing: '-2px' }}>T</text>
    </svg>
  );
}

// ─── Animated counter ──────────────────────────────────────────────────────────
function Counter({ to, suffix = '', duration = 2.2 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / (duration * 1000), 1);
      setDisplay(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, to, duration]);
  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
}

// ─── Feature Card ──────────────────────────────────────────────────────────────
function FeatureCard({ title, desc, delay = 0, accent = '#16a34a' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, boxShadow: '0 20px 56px rgba(0,0,0,0.10), inset 0 1.5px 0 rgba(255,255,255,1)' }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="feature-card relative rounded-3xl p-8 group cursor-default overflow-hidden"
      style={{ ...glassCard, borderRadius: 26 }}
    >
      {/* animated top accent line */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-px pointer-events-none"
        animate={hovered
          ? { width: '90%', opacity: 1, y: 0 }
          : { width: '55%', opacity: 0.6, y: 0 }
        }
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: `linear-gradient(90deg, transparent, ${accent}88, ${accent}, ${accent}88, transparent)` }}
      />
      {/* shimmer sweep */}
      <div className="feature-shimmer absolute inset-0 pointer-events-none" />
      {/* hover glow from top */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-24 pointer-events-none"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent}22, transparent 70%)` }}
      />

      <h3 className="text-gray-900 font-bold text-lg mb-3 relative z-10">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed relative z-10">{desc}</p>
    </motion.div>
  );
}

// ─── Testimonial Card ──────────────────────────────────────────────────────────
function TestimonialCard({ t, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="rounded-2xl p-6 transition-all duration-300 relative overflow-hidden"
      style={{ ...glassCard, borderRadius: 20 }}
    >
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9) 50%, transparent)' }} />
      <div className="flex gap-1 mb-4">
        {Array(5).fill(0).map((_, j) => <Star key={j} size={14} className="fill-amber-400 text-amber-400" />)}
      </div>
      <p className="text-gray-600 text-sm leading-relaxed mb-5">"{t.text}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a, #065f46)', boxShadow: '0 4px 14px rgba(22,163,74,0.3)' }}>
          {t.name[0]}
        </div>
        <div>
          <div className="text-gray-900 font-semibold text-sm">{t.name}</div>
          <div className="text-gray-400 text-xs">{t.role}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.25 }}
        className="rounded-2xl p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto"
        style={{ ...glassCard, background: 'rgba(255,255,255,0.95)', boxShadow: '0 24px 60px rgba(0,0,0,0.14)' }}
        onClick={e => e.stopPropagation()} dir="rtl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors"><X size={20} /></button>
        </div>
        <div className="text-gray-600 text-sm leading-relaxed space-y-4">{children}</div>
      </motion.div>
    </div>
  );
}

// ─── Navbar ────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'פיצ׳רים',    href: '#features' },
  { label: 'איך זה עובד', href: '#how-it-works' },
  { label: 'עדויות',     href: '#testimonials' },
  { label: 'מחירים',     href: '#pricing' },
];

function NavBar() {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div className={`fixed z-50 inset-x-0 flex justify-center px-4 transition-all duration-300 ${scrolled ? 'top-2' : 'top-4'}`}>
        <motion.header
          style={{ width: 'min(880px, 100%)' }}
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="rounded-full px-2 py-1.5 flex items-center justify-between gap-4 transition-all duration-300"
            style={glassNav}>
            <Link to="/" className="flex items-center gap-2 px-2 shrink-0">
              <img src="/favicon.png" alt="TORI" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
              <span className="font-black text-base text-gray-900 tracking-tight">TORI</span>
            </Link>

            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_ITEMS.map(item => (
                <a key={item.href} href={item.href}
                  className="px-3.5 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium rounded-full hover:bg-black/5">
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <Link to="/login" className="hidden md:block">
                <button className="rounded-full px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
                  style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.07)' }}>
                  כניסה
                </button>
              </Link>
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: '0 6px 22px rgba(22,163,74,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-full px-5 py-2 text-sm text-white font-bold"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a, #065f46)', boxShadow: '0 3px 14px rgba(22,163,74,0.28)' }}
                >
                  <span className="hidden sm:inline">התחל בחינם</span>
                  <span className="sm:hidden">הצטרף</span>
                </motion.button>
              </Link>
              <button
                className="md:hidden rounded-full w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.6)' }}
                onClick={() => setMobileOpen(!mobileOpen)} aria-label="פתח תפריט"
              >
                {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </motion.header>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col items-center justify-center"
            style={{ background: 'rgba(248,246,242,0.96)', backdropFilter: 'blur(24px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <nav className="flex flex-col items-center gap-7">
              {NAV_ITEMS.map((item, i) => (
                <motion.a key={item.href} href={item.href}
                  className="text-4xl font-black text-gray-700 hover:text-gray-900 transition-colors"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => setMobileOpen(false)}>{item.label}
                </motion.a>
              ))}
              <Link to="/register" onClick={() => setMobileOpen(false)}>
                <motion.button
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: NAV_ITEMS.length * 0.07 }}
                  className="mt-4 rounded-full px-8 py-3 text-white font-bold text-lg"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a, #065f46)' }}
                >התחל ניסיון חינמי</motion.button>
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function LandingV2() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen]     = useState(false);
  const [accessOpen, setAccessOpen]   = useState(false);
  const [isMobile, setIsMobile]       = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <MotionConfig reducedMotion={isMobile ? 'always' : 'never'}>
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#f8f6f2', color: '#18120a', direction: 'rtl' }}>

      {/* ─── Global background gradient orbs ─────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-5%', right: '-8%',  width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(22,163,74,0.10) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', top: '35%', left: '-12%',  width: 650, height: 650, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.09) 0%, transparent 70%)',  filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,63,94,0.07) 0%, transparent 70%)',  filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', bottom: '50%', left: '40%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',  filter: 'blur(50px)' }} />
      </div>

      <GlassFilter />
      <NavBar />

      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen overflow-hidden" style={{ background: 'transparent', zIndex: 1 }}>
        <div className="absolute bottom-0 hidden sm:block" style={{ left: '-50%', width: '150%', height: '105%' }}>
          <SplineScene scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" className="w-full h-full" />
        </div>
        <div className="absolute inset-0 pointer-events-none hidden sm:block"
          style={{ background: 'linear-gradient(to left, #f8f6f2 42%, rgba(248,246,242,0.6) 56%, transparent 72%)', zIndex: 1 }} />
        <div className="absolute inset-0 sm:hidden" style={{ background: '#f8f6f2', zIndex: 1 }} />

        <div className="relative z-10 min-h-screen flex items-center pt-20 pb-12 px-4 md:px-6 pointer-events-none">
          <div className="max-w-7xl mx-auto w-full">
            <div className="lg:w-1/2">
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight mb-5 text-gray-900"
                style={{ fontFamily: 'Heebo, sans-serif' }}>
                <span className="relative inline-block">
                  הסוכן
                  <motion.span initial={{ opacity: 0, rotate: 20, y: 8 }} animate={{ opacity: 1, rotate: 15, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute -top-5 -right-7 inline-block">
                    <svg viewBox="0 0 24 24" fill="#25D366" className="w-8 h-8" style={{ filter: 'drop-shadow(0 4px 12px rgba(37,211,102,0.4))' }}>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </motion.span>
                </span>{' '}שמנהל לך
                <br />
                <span style={{ background: 'linear-gradient(135deg, #4ade80 0%, #16a34a 50%, #065f46 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  את העסק
                </span>{' '}24/7
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.17 }}
                className="text-gray-500 text-base md:text-lg lg:text-xl leading-relaxed mb-7 max-w-xl">
                טורי הוא סוכן AI שמקבל תורים, עונה ללקוחות ומנהל את היומן שלך ישירות בוואטסאפ. הלקוחות שלך מדברים עם בוט שמרגיש כמו אדם אמיתי, אתה פשוט עובד.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.26 }}
                className="flex flex-col lg:flex-row gap-3 mb-6 pointer-events-auto">
                <Link to="/register" className="w-full lg:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0 24px 48px rgba(22,163,74,0.38)' }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full text-white font-bold text-lg px-9 py-4 rounded-2xl inline-flex items-center justify-center gap-2 relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 55%, #065f46 100%)',
                      boxShadow: '0 8px 28px rgba(22,163,74,0.32), inset 0 1px 0 rgba(255,255,255,0.25)',
                    }}>
                    <span className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 60%)' }} />
                    <Zap size={19} className="relative z-10" />
                    <span className="relative z-10">התחל 30 יום חינם</span>
                  </motion.button>
                </Link>
                <motion.a href="#try-it"
                  whileHover={{ scale: 1.02, boxShadow: '0 12px 36px rgba(0,0,0,0.1), inset 0 1.5px 0 rgba(255,255,255,1)' }}
                  className="w-full lg:w-auto text-gray-700 font-semibold text-base px-8 py-4 rounded-2xl transition-all inline-flex items-center gap-2 justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.52)',
                    backdropFilter: 'blur(44px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(44px) saturate(200%)',
                    border: '1.5px solid rgba(255,255,255,0.9)',
                    boxShadow: '0 6px 24px rgba(0,0,0,0.07), inset 0 1.5px 0 rgba(255,255,255,1)',
                  }}>
                  ראה איך זה עובד <ChevronLeft size={16} />
                </motion.a>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-4 items-center mb-5">
                {['ללא כרטיס אשראי', 'ביטול בכל עת', 'הגדרה תוך דקה'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-gray-400 text-sm">
                    <Check size={13} className="text-[#16a34a]" />{t}
                  </div>
                ))}
              </motion.div>

            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-80 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, #f8f6f2 65%)' }} />
      </section>

      {/* ─── Stats ─────────────────────────────────────────────────────────── */}
      <section className="pb-12 md:pb-16 px-4 md:px-6 mt-4" style={{ position: 'relative', zIndex: 1, background: 'linear-gradient(to bottom, #f8f6f2 0%, #f8f6f2 60%, transparent 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {[
              { value: 24, suffix: '/7',   label: 'זמינות הבוט' },
              { value: 30, suffix: ' יום', label: 'ניסיון חינמי' },
              { value: 2,  suffix: ' דק׳', label: 'זמן הגדרה ממוצע' },
              { value: 98, suffix: '%',    label: 'לקוחות מרוצים' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center p-5 md:p-8 rounded-2xl"
                style={{ ...glassCard, borderRadius: 20 }}>
                <div className="text-4xl font-black text-gray-900 mb-1" style={{ fontFamily: 'Heebo, sans-serif' }}>
                  <Counter to={s.value} suffix={s.suffix} />
                </div>
                <div className="text-gray-400 text-sm">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-14 md:py-20 px-4 md:px-6" style={{ position: 'relative', zIndex: 1 }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-3">כל מה שהעסק שלך צריך</motion.h2>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
              className="text-gray-500 text-lg max-w-2xl mx-auto">לא עוד שיחות טלפון, לא עוד ניהול ידני — טורי עושה הכל בשבילך.</motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard delay={0}    accent="#25D366" title="בוט וואטסאפ AI"    desc="מקבל תורים, מבטל ועונה על שאלות בעברית שוטפת, 24 שעות ביממה." />
            <FeatureCard delay={0.07} accent="#06b6d4" title="יומן חכם בזמן אמת" desc="ממשק ויזואלי נוח לניהול כל התורים. הוסף ידנית, חסום זמנים, ראה הכל במקום אחד." />
            <FeatureCard delay={0.14} accent="#16a34a" title="אנליטיקות ודוחות"  desc="גרפים של הכנסות, שירותים פופולריים ושעות עמוסות. דוח חודשי לקבלת החלטות חכמות." />
            <FeatureCard delay={0.21} accent="#8b5cf6" title="ריבוי עובדים"       desc="כמה עובדים עם לוחות זמנים וצבעים נפרדים. מושלם לסלון שמעסיק מספר אנשים." />
            <FeatureCard delay={0.28} accent="#f43f5e" title="תזכורות אוטומטיות" desc="הבוט שולח ללקוח תזכורת יום לפני התור. פחות ביטולי רגע אחרון ויותר כסף בכיס." />
            <FeatureCard delay={0.35} accent="#10b981" title="חשבוניות ירוקות"   desc="אינטגרציה עם חשבוניות ירוקות לניהול חשבוניות ישירות מתוך היומן." />
          </div>
        </div>
      </section>

      {/* ─── How it works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ background: 'transparent', borderTop: '1px solid rgba(0,0,0,0.06)', padding: 'clamp(80px,10vw,160px) clamp(20px,4.2vw,56px)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <div className="flex flex-col items-start gap-4" style={{ marginBottom: 64 }}>
            <span className="rounded-full px-4 py-1.5 text-xs font-medium"
              style={{ ...glassCard, background: 'rgba(255,255,255,0.6)', color: '#6b6055', fontFamily: "'Rubik', sans-serif" }}>
              איך זה עובד?
            </span>
            <h2 style={{ fontFamily: "'Secular One', sans-serif", fontSize: 'clamp(36px,6vw,72px)', lineHeight: 0.9, letterSpacing: '-0.02em', color: '#18120a', margin: 0 }}>
              פשוט ומהיר
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {[
              { step: '01', title: 'נרשמים תוך 2 דקות', desc: 'שם העסק, שירותים, מחירים ושעות עבודה. הכל בממשק פשוט ומהיר.' },
              { step: '02', title: 'מחברים את הוואטסאפ', desc: 'שולחים ללקוחות קישור אחד, מהרגע הזה הבוט מקבל תורים במקומך.' },
              { step: '03', title: 'הבוט עובד, אתה נח',  desc: 'תורים, ביטולים, תזכורות. הכל רץ לבד 24/7, גם כשאתה ישן.' },
            ].map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.14, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex flex-col gap-4 items-start group"
                style={{
                  padding: 'clamp(40px,5vw,56px) clamp(24px,4vw,40px)',
                  borderInlineEnd: i < 2 ? '1px solid rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <motion.span
                  className="leading-none select-none"
                  style={{
                    fontFamily: "'Secular One', sans-serif",
                    fontSize: 'clamp(72px, 10vw, 130px)',
                    marginBottom: -16,
                    display: 'block',
                  }}
                  initial={{ color: 'rgba(0,0,0,0.07)' }}
                  whileHover={{ color: 'rgba(22,163,74,0.25)' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >{s.step}</motion.span>
                <h3 style={{ fontFamily: "'Secular One', sans-serif", fontSize: 'clamp(22px,2.5vw,30px)', color: '#18120a', margin: 0, fontWeight: 400 }}>{s.title}</h3>
                <p style={{ fontFamily: "'Rubik', sans-serif", fontSize: 14, lineHeight: 1.7, color: '#6b6055', margin: 0, maxWidth: '28ch' }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Try It Live ───────────────────────────────────────────────────── */}
      <section id="try-it" className="py-16 md:py-28 px-4 md:px-6" style={{ background: 'transparent', borderTop: '1px solid rgba(0,0,0,0.06)', position: 'relative', zIndex: 1 }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">

            {/* text — right side in RTL */}
            <motion.div
              className="flex-1 text-right"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-block text-xs font-semibold tracking-widest uppercase mb-5 px-3 py-1 rounded-full"
                style={{ background: 'rgba(37,211,102,0.1)', color: '#128C7E', border: '1px solid rgba(37,211,102,0.2)' }}>
                נסה בעצמך
              </span>
              <h2 className="font-black leading-tight mb-5"
                style={{ fontFamily: 'Heebo, sans-serif', fontSize: 'clamp(34px, 6vw, 68px)', letterSpacing: '-0.03em', color: '#18120a' }}>
                דבר עם TORI
                <br />
                <span style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  עכשיו, בחינם.
                </span>
              </h2>
              <p className="text-gray-500 leading-relaxed mb-8" style={{ fontSize: 'clamp(15px, 1.8vw, 18px)', maxWidth: 460 }}>
                זו לא הדגמה מוקלטת. זה הבוט האמיתי של TORI בפעולה.
                שאל על שירותים, קבע תור, בדוק מחירים ושעות.
                תרגיש בדיוק מה הלקוחות שלך יחוו כשתפעיל את הבוט בעסק שלך.
              </p>
              <div className="flex flex-col gap-2" style={{ alignItems: 'flex-start' }}>
                {[
                  'כמה עולה תספורת?',
                  'אפשר לקבוע תור לחמישי בצהריים?',
                  'מה השעות שלכם?',
                ].map(hint => (
                  <span key={hint} style={{
                    display: 'inline-block',
                    padding: '8px 18px',
                    borderRadius: 999,
                    fontSize: 14,
                    color: '#6b7280',
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    letterSpacing: '0.01em',
                  }}>"{hint}"</span>
                ))}
              </div>
            </motion.div>

            {/* WhatsApp chat — left side */}
            <motion.div
              className="w-full lg:w-auto flex justify-center"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <WhatsAppDemo />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-14 md:py-24 px-4 md:px-6" style={{ background: 'transparent', borderTop: '1px solid rgba(0,0,0,0.06)', position: 'relative', overflow: 'visible' }}>

        {/* cosmetician robot — breaks out from left edge */}
        <motion.div
          className="hidden lg:block absolute pointer-events-none"
          style={{ bottom: -40, left: -40, width: 520, zIndex: 0 }}
          initial={{ opacity: 0, x: -60, rotate: 45 }}
          whileInView={{ opacity: 1, x: 0, rotate: 45 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src={robotCosmeticianImg}
            alt="TORI robot cosmetician"
            style={{
              width: '100%',
              height: 'auto',
              mixBlendMode: 'multiply',
              maskImage: 'radial-gradient(ellipse 62% 62% at 42% 48%, black 25%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.2) 62%, transparent 72%)',
              WebkitMaskImage: 'radial-gradient(ellipse 62% 62% at 42% 48%, black 25%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.2) 62%, transparent 72%)',
            }}
          />
        </motion.div>

        {/* barber robot — breaks out from right edge */}
        <motion.div
          className="hidden lg:block absolute pointer-events-none"
          style={{ bottom: -40, right: -40, width: 520, zIndex: 0 }}
          initial={{ opacity: 0, x: 60, rotate: -45 }}
          whileInView={{ opacity: 1, x: 0, rotate: -45 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src={robotBarberImg}
            alt="TORI robot barber"
            style={{
              width: '100%',
              height: 'auto',
              mixBlendMode: 'multiply',
              maskImage: 'radial-gradient(ellipse 80% 80% at 60% 50%, black 40%, rgba(0,0,0,0.6) 62%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 60% 50%, black 40%, rgba(0,0,0,0.6) 62%, transparent 80%)',
              filter: 'drop-shadow(0 30px 50px rgba(0,0,0,0.2))',
            }}
          />
        </motion.div>

        <div className="max-w-6xl mx-auto" style={{ position: 'relative', zIndex: 1 }}>
          <div className="text-center mb-10 md:mb-16">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900">מה אומרים עלינו</motion.h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {[
              { name: 'שירלי ב.', role: 'סלון ריסים, תל אביב',     text: 'לפני טורי הייתי מפסידה תורים כי לא תמיד עניתי לטלפון. עכשיו הבוט עונה בשבילי גם בשתיים בלילה. לא מבינה איך עבדתי בלעדיו.' },
              { name: 'ניצן מ.', role: 'סלון ציפורניים, תל אביב', text: 'הלקוחות קובעות תורים בלילה כשאני ישנה, ואני מגיעה בבוקר עם לוח מלא. שלושה שבועות אחרי — ההכנסות עלו בעשרים אחוז.' },
              { name: 'רועי ח.', role: 'ספר, ירושלים',             text: 'יש לי שתי עובדות וחשבתי שיהיה מסובך לנהל שני לוחות זמנים, אבל טורי מסדר הכל לבד, אני כמעט לא צריך לגעת ביומן.' },
            ].map((t, i) => <TestimonialCard key={i} t={t} delay={i * 0.1} />)}
          </div>
        </div>
      </section>

      {/* ─── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-14 md:py-24 px-4 md:px-6" style={{ background: 'transparent', position: 'relative', zIndex: 1 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="font-black text-gray-900 mb-3"
              style={{ fontSize: 'clamp(28px,5vw,48px)', letterSpacing: '-0.02em' }}>
              מחירים פשוטים ושקופים
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="text-gray-400">ללא הפתעות. ביטול בכל עת.</motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-5 items-stretch">
            {[
              { plan: 'ניסיון חינמי', price: 0,   popular: false, delay: 0,   features: ['30 יום מלאים חינם','בוט וואטסאפ פעיל','יומן וניהול לקוחות','ללא כרטיס אשראי','עובד אחד'] },
              { plan: 'Basic',        price: 99,  popular: true,  delay: 0.1, features: ['עובד אחד','תורים ללא הגבלה','בוט AI 24 שעות','יומן ואנליטיקות','תמיכה טכנית'] },
              { plan: 'Business',     price: 250, popular: false, delay: 0.2, features: ['עד 4 עובדים','תורים ללא הגבלה','בוט AI 24 שעות','דוחות מתקדמים','תזכורות אוטומטיות','גוגל קלנדר','חשבוניות ירוקות'] },
            ].map(({ plan, price, popular, delay, features }) => (
              <motion.div key={plan}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, boxShadow: '0 20px 56px rgba(0,0,0,0.09), inset 0 1.5px 0 rgba(255,255,255,1)' }}
                className="relative rounded-3xl p-7 md:p-9 flex flex-col overflow-hidden"
                style={{ ...glassCard, borderRadius: 26 }}>

                {/* accent top line for popular */}
                {popular && (
                  <div className="absolute top-0 inset-x-8 h-px pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, #22c55e, #16a34a, transparent)' }} />
                )}

                {/* header row */}
                <div className="flex items-center justify-between mb-8">
                  <span className="text-xs tracking-widest uppercase text-gray-400 font-medium">{plan}</span>
                  {popular && (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(22,163,74,0.08)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.18)' }}>
                      מומלץ
                    </span>
                  )}
                </div>

                {/* price */}
                <div className="mb-8">
                  {price === 0
                    ? <span className="text-5xl font-semibold text-gray-900" style={{ letterSpacing: '-0.02em' }}>חינם</span>
                    : <span className="text-gray-900" style={{ fontSize: 48, fontWeight: 600, letterSpacing: '-0.03em' }}>
                        ₪{price}<span className="text-gray-400 text-sm font-normal" style={{ letterSpacing: 0 }}> /חודש</span>
                      </span>
                  }
                </div>

                {/* divider */}
                <div className="mb-6 h-px" style={{ background: 'rgba(0,0,0,0.06)' }} />

                {/* features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-gray-500">
                      <Check size={13} className="shrink-0 text-[#16a34a]" />{f}
                    </li>
                  ))}
                </ul>

                <Link to="/register" className="mt-auto">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="w-full py-3.5 rounded-xl text-sm font-medium transition-all"
                    style={popular
                      ? { background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', boxShadow: '0 4px 18px rgba(22,163,74,0.28)', border: 'none' }
                      : { background: 'rgba(0,0,0,0.04)', color: '#374151', border: '1px solid rgba(0,0,0,0.08)' }
                    }>
                    התחל עכשיו
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="relative" style={{ background: 'transparent', position: 'relative', zIndex: 1, overflow: 'visible' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 110%, rgba(22,163,74,0.08) 0%, transparent 70%)',
        }} />

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-24 md:py-36 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-0">

            {/* text + button — first child in RTL flex-row = rightmost */}
            <motion.div
              className="flex-1 w-full"
              style={{ textAlign: 'right' }}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-sm font-semibold mb-5"
                style={{ color: '#16a34a', letterSpacing: '0.18em' }}>
                30 יום חינם · ללא כרטיס אשראי
              </p>

              <h2 className="font-black leading-none mb-7"
                style={{
                  fontFamily: 'Heebo, sans-serif',
                  fontSize: 'clamp(40px, 5.5vw, 76px)',
                  letterSpacing: '-0.03em',
                  color: '#18120a',
                }}>
                <span style={{ display: 'block', whiteSpace: 'nowrap' }}>תפסיק לנהל תורים</span>
                <span style={{
                  display: 'block',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #065f46 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>בעצמך.</span>
              </h2>

              <p className="text-gray-400 mb-10"
                style={{ fontSize: 'clamp(15px, 1.8vw, 18px)', maxWidth: 420, lineHeight: 1.7, marginRight: 0 }}>
                TORI עושה את זה בשבילך, 24 שעות ביממה, 7 ימים בשבוע, בלי הפסקה.
              </p>

              <div style={{ marginBottom: 28 }}>
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: '0 28px 60px rgba(22,163,74,0.38)' }}
                    whileTap={{ scale: 0.97 }}
                    className="relative overflow-hidden text-white font-bold inline-flex items-center gap-3 px-10 py-4 rounded-2xl"
                    style={{
                      fontSize: 17,
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 55%, #065f46 100%)',
                      boxShadow: '0 12px 36px rgba(22,163,74,0.28), inset 0 1px 0 rgba(255,255,255,0.22)',
                    }}>
                    <span className="absolute inset-0 pointer-events-none"
                      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.13) 0%, transparent 55%)' }} />
                    <Zap size={18} className="relative z-10" />
                    <span className="relative z-10">התחל 30 יום חינם</span>
                  </motion.button>
                </Link>
              </div>

              <div style={{ display: 'flex', direction: 'rtl', gap: 20, flexWrap: 'wrap' }}>
                {['ללא כרטיס אשראי', 'ביטול בכל עת', 'הגדרה תוך 2 דקות'].map(t => (
                  <span key={t} className="flex items-center gap-1.5 text-gray-400 text-sm">
                    <Check size={12} className="text-[#16a34a]" />{t}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* robot image — breaks out of section */}
            <motion.div
              className="hidden lg:block shrink-0 relative"
              style={{ width: 560, marginBottom: '-120px', marginTop: '-120px' }}
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src={robotWaveImg}
                alt="TORI"
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                  mixBlendMode: 'multiply',
                  maskImage: 'linear-gradient(to bottom, black 60%, rgba(0,0,0,0.5) 80%, transparent 96%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 60%, rgba(0,0,0,0.5) 80%, transparent 96%)',
                  filter: 'drop-shadow(0 40px 60px rgba(0,0,0,0.18))',
                }}
              />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <footer className="py-10 px-4 md:px-6" style={{ borderTop: '1px solid rgba(0,0,0,0.07)', background: 'rgba(240,237,230,0.7)', position: 'relative', zIndex: 1 }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="/favicon.png" alt="TORI" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
              <span className="font-black text-xl text-gray-900">TORI</span>
            </div>
            <div className="flex flex-wrap gap-4 text-gray-500 text-sm justify-center">
              <button onClick={() => setTermsOpen(true)} className="hover:text-gray-900 transition-colors">תקנון ותנאי שימוש</button>
              <button onClick={() => setPrivacyOpen(true)} className="hover:text-gray-900 transition-colors">מדיניות פרטיות</button>
              <button onClick={() => setAccessOpen(true)} className="hover:text-gray-900 transition-colors">הצהרת נגישות</button>
              <a href="mailto:supporttori@gmail.com" className="hover:text-[#16a34a] transition-colors">supporttori@gmail.com</a>
            </div>
            <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Tori</p>
          </div>
        </div>
      </footer>

      {/* ─── Modals ────────────────────────────────────────────────────────── */}
      <Modal open={termsOpen} onClose={() => setTermsOpen(false)} title="תקנון ותנאי שימוש">
        <p className="text-gray-700 font-semibold">עודכן לאחרונה: אפריל 2026</p>
        <p>ברוכים הבאים לטורי. השימוש בפלטפורמה מהווה הסכמה מלאה לתנאים המפורטים להלן.</p>
        <p><strong className="text-gray-900">1. השירות</strong><br />טורי מספקת תוכנה לניהול תורים עסקיים. הגישה לשירות מותנית בהרשמה ובתשלום חודשי לאחר 30 יום ניסיון חינמיים.</p>
        <p><strong className="text-gray-900">2. תשלומים וביטול</strong><br />30 יום חינמיים ללא כרטיס אשראי. לאחר מכן תשלום חודשי לפי התכנית שנבחרה. ביטול אפשרי בכל עת.</p>
        <p><strong className="text-gray-900">3. אחריות</strong><br />טורי מספקת את השירות "כפי שהוא". האחריות המקסימלית מוגבלת לסכום ששולם בחודש הקודם.</p>
        <p><strong className="text-gray-900">4. קניין רוחני</strong><br />כל הזכויות שייכות לטורי. אין לשכפל או לעשות שימוש מסחרי ללא אישור בכתב.</p>
        <p><strong className="text-gray-900">5. יצירת קשר</strong><br /><a href="mailto:supporttori@gmail.com" className="text-[#16a34a]">supporttori@gmail.com</a></p>
      </Modal>
      <Modal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="מדיניות פרטיות">
        <p className="text-gray-700 font-semibold">עודכן לאחרונה: אפריל 2026</p>
        <p>טורי מתחייבת להגן על פרטיות המשתמשים בהתאם לחוק הגנת הפרטיות ו-GDPR.</p>
        <p><strong className="text-gray-900">מידע שנאסף</strong><br />שם, אימייל, טלפון, שם העסק, נתוני תורים. היסטוריית שיחות לצרכי שיפור בלבד.</p>
        <p><strong className="text-gray-900">שימוש במידע</strong><br />להפעלת השירות ותמיכה טכנית בלבד. לא נשלח דיוור שיווקי ללא הסכמה.</p>
        <p><strong className="text-gray-900">אבטחה</strong><br />הצפנה מלאה (TLS). גישה מוגבלת לעובדים מורשים.</p>
        <p><strong className="text-gray-900">זכויות</strong><br />עיון, תיקון ומחיקת מידע: <a href="mailto:supporttori@gmail.com" className="text-[#16a34a]">supporttori@gmail.com</a></p>
      </Modal>
      <Modal open={accessOpen} onClose={() => setAccessOpen(false)} title="הצהרת נגישות">
        <p>טורי מחויבת לנגישות דיגיטלית בהתאם לתקן הישראלי 5568 ו-WCAG 2.1 רמת AA.</p>
        <p><strong className="text-gray-900">תכונות נגישות:</strong> ניווט מקלדת מלא, תמיכה בקוראי מסך, יחסי ניגוד תקניים, תמיכה בהגדלת טקסט.</p>
        <p><strong className="text-gray-900">דיווח על בעיות:</strong> <a href="mailto:supporttori@gmail.com" className="text-[#16a34a]">supporttori@gmail.com</a></p>
        <p className="text-gray-400 text-xs">עודכן לאחרונה: אפריל 2026</p>
      </Modal>

    </div>
    </MotionConfig>
  );
}
