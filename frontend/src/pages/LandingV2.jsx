import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  Calendar, BarChart3, Users, Bell, FileText,
  Zap, Check, Star, Bot, ChevronLeft, X, Menu,
  Smartphone, TrendingUp, Clock,
} from 'lucide-react';
import { SplineScene } from '@/components/ui/splite';

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

// ─── Style helpers ─────────────────────────────────────────────────────────────
const glassCard = {
  background: 'rgba(255,255,255,0.85)',
  backdropFilter: 'blur(16px) saturate(140%)',
  WebkitBackdropFilter: 'blur(16px) saturate(140%)',
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
};

const glassNav = {
  background: 'rgba(255,255,255,0.82)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(0,0,0,0.09)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
};

// ─── Logo ──────────────────────────────────────────────────────────────────────
function ToriLogo({ size = 34 }) {
  const id = React.useId();
  return (
    <svg width={size * 0.85} height={size * 0.85} viewBox="0 0 40 40" style={{ display: 'inline-block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#f97316" />
          <stop offset="50%"  stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <text x="50%" y="78%" textAnchor="middle" fill={`url(#${id})`}
        style={{ fontFamily: "'Inter','Heebo',sans-serif", fontWeight: 900, fontSize: 38, letterSpacing: '-2px' }}>T</text>
    </svg>
  );
}

// ─── 3D Clay Icon ──────────────────────────────────────────────────────────────
function Icon3D({ icon: Icon, size = 22, boxSize = 56, glow = true }) {
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{
      width: boxSize, height: boxSize,
      borderRadius: boxSize * 0.32,
      background: 'linear-gradient(145deg, #fff7ed 0%, #fed7aa 25%, #f97316 55%, #f43f5e 80%, #06b6d4 100%)',
      boxShadow: glow
        ? '0 10px 30px rgba(249,115,22,0.45), 0 3px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -2px 5px rgba(154,52,18,0.2)'
        : '0 4px 14px rgba(249,115,22,0.3), inset 0 1px 0 rgba(255,255,255,0.7)',
    }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        borderRadius: 'inherit',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
      }} />
      <Icon size={size} className="relative z-10 text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
    </div>
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
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, to, duration]);

  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
}

// ─── Glass Feature Card ────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={{ y: -6 }}
      className="relative rounded-2xl p-6 group cursor-default overflow-hidden transition-all duration-300"
      style={{ ...glassCard, borderRadius: 20 }}
    >
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 40% 0%, rgba(249,115,22,0.06), transparent 65%)' }} />
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.06) 50%, transparent)' }} />
      <div className="mb-5 group-hover:scale-105 transition-transform duration-300">
        <Icon3D icon={icon} size={22} boxSize={54} />
      </div>
      <h3 className="text-gray-900 font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
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
        className="rounded-2xl p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 24px 60px rgba(0,0,0,0.12)' }}
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

// ─── Testimonial card ──────────────────────────────────────────────────────────
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
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.06) 50%, transparent)' }} />
      <div className="flex gap-1 mb-4">
        {Array(5).fill(0).map((_, j) => <Star key={j} size={14} className="fill-amber-400 text-amber-400" />)}
      </div>
      <p className="text-gray-600 text-sm leading-relaxed mb-5">"{t.text}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
          style={{ background: 'linear-gradient(135deg, #f97316, #f43f5e, #06b6d4)', boxShadow: '0 4px 14px rgba(244,63,94,0.3)' }}>
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

// ─── ROI Calculator ────────────────────────────────────────────────────────────
function ROICalculator() {
  const [appts, setAppts] = useState(80);
  const avgPrice = 120, noShowRate = 0.13, planCost = 99, minsPerAppt = 7;
  const savedRevenue = Math.round(appts * noShowRate) * avgPrice;
  const timeSaved    = Math.round(appts * minsPerAppt / 60 * 10) / 10;
  const roi          = Math.round((savedRevenue / planCost) * 10) / 10;
  const pct = ((appts - 10) / (300 - 10)) * 100;

  return (
    <section className="py-14 md:py-24 px-4 md:px-6" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#f2efe8' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-3">כמה טורי יחסוך לך?</motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
            className="text-gray-500 text-base md:text-lg">הזז את הסליידר וראה את החיסכון החודשי שלך</motion.p>
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="rounded-2xl p-6 md:p-10 relative overflow-hidden" style={{ ...glassCard, borderRadius: 24 }}>
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.07) 50%, transparent)' }} />

          <div className="mb-8 md:mb-10" dir="ltr">
            <div className="flex items-center justify-between mb-5">
              <span className="text-gray-500 text-sm font-medium">תורים בחודש</span>
              <span className="text-gray-900 font-black text-3xl tabular-nums">{appts}</span>
            </div>
            <input type="range" min={10} max={300} step={5} value={appts} onChange={e => setAppts(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none"
              style={{ background: `linear-gradient(to right, #f97316 0%, #f43f5e ${pct * 0.6}%, #06b6d4 ${pct}%, rgba(0,0,0,0.1) ${pct}%, rgba(0,0,0,0.1) 100%)` }} />
            <div className="flex justify-between mt-2.5 text-gray-400 text-xs"><span>10</span><span>150</span><span>300</span></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: TrendingUp, label: 'הכנסה שחוזרת אליך\nמביטולי רגע אחרון', value: `₪${savedRevenue.toLocaleString()}` },
              { icon: Clock,      label: 'שעות עבודה שנחסכות\nמתיאומים ידניים',  value: `${timeSaved} שע׳` },
              { icon: Zap,        label: 'תשואה על המנוי\nהחזר השקעה חודשי',   value: `${roi}×` },
            ].map(({ icon, label, value }, i) => (
              <div key={i} className="rounded-xl p-5 text-center relative overflow-hidden"
                style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)', borderRadius: 16 }}>
                <div className="mx-auto mb-3 flex justify-center"><Icon3D icon={icon} size={18} boxSize={42} /></div>
                <div className="text-2xl md:text-3xl font-black text-gray-900 mb-1.5 tabular-nums">{value}</div>
                <div className="text-gray-500 text-xs leading-relaxed whitespace-pre-line">{label}</div>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            * מחושב לפי תור ממוצע ₪{avgPrice} ושיעור ביטולי רגע אחרון ({Math.round(noShowRate * 100)}%)
          </p>
        </motion.div>
      </div>
    </section>
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
          style={{ width: 'min(860px, 100%)' }}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="rounded-full px-2 py-2 flex items-center justify-between gap-4 transition-all duration-300"
            style={glassNav}>
            <Link to="/" className="flex items-center gap-2 px-2 shrink-0">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #f97316, #f43f5e, #06b6d4)' }}>
                <span className="text-xs font-black text-white">T</span>
              </div>
              <span className="font-black text-base text-gray-900 tracking-tight">TORI</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
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
                  style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}>
                  כניסה
                </button>
              </Link>
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: '0 6px 20px rgba(249,115,22,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-full px-4 py-2 text-sm text-white font-bold"
                  style={{ background: 'linear-gradient(135deg, #f97316, #f43f5e, #06b6d4)', boxShadow: '0 3px 12px rgba(244,63,94,0.25)' }}
                >
                  <span className="hidden sm:inline">התחל בחינם</span>
                  <span className="sm:hidden">הצטרף</span>
                </motion.button>
              </Link>
              <button
                className="md:hidden rounded-full w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)' }}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="פתח תפריט"
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
            style={{ background: 'rgba(248,246,242,0.97)', backdropFilter: 'blur(20px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <nav className="flex flex-col items-center gap-7">
              {NAV_ITEMS.map((item, i) => (
                <motion.a key={item.href} href={item.href}
                  className="text-4xl font-black text-gray-700 hover:text-gray-900 transition-colors"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => setMobileOpen(false)}>
                  {item.label}
                </motion.a>
              ))}
              <Link to="/register" onClick={() => setMobileOpen(false)}>
                <motion.button
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: NAV_ITEMS.length * 0.07 }}
                  className="mt-4 rounded-full px-8 py-3 text-white font-bold text-lg"
                  style={{ background: 'linear-gradient(135deg, #f97316, #f43f5e, #06b6d4)', boxShadow: '0 6px 24px rgba(244,63,94,0.3)' }}
                >
                  התחל ניסיון חינמי
                </motion.button>
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

      <GlassFilter />
      <NavBar />

      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen overflow-hidden" style={{ background: '#f8f6f2' }}>

        {/* Spline — right side, bottom-anchored, receives mouse events across full hero */}
        <div className="absolute bottom-0 right-0 hidden sm:block"
          style={{ width: '52%', height: '95%' }}>
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>

        {/* Gradient fade from white (left) into Spline (right) — pointer-events-none */}
        <div className="absolute inset-0 pointer-events-none hidden sm:block"
          style={{ background: 'linear-gradient(to right, #f8f6f2 38%, rgba(248,246,242,0.7) 52%, transparent 68%)' }} />

        {/* Mobile solid bg */}
        <div className="absolute inset-0 sm:hidden" style={{ background: '#f8f6f2' }} />

        {/* Text content — pointer-events-none on wrapper, auto on interactive children */}
        <div className="relative z-10 min-h-screen flex items-center pt-20 pb-12 px-4 md:px-6 pointer-events-none">
          <div className="max-w-7xl mx-auto w-full">
            <div className="lg:w-1/2">

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-6 pointer-events-auto"
                style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#ea6c00' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse inline-block" />
                סוכן AI לעסקי שירות
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight mb-5 text-gray-900"
                style={{ fontFamily: 'Heebo, sans-serif' }}>
                <span className="relative inline-block">
                  הסוכן
                  <motion.span initial={{ opacity: 0, rotate: 20, y: 8 }} animate={{ opacity: 1, rotate: 15, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute -top-5 -right-7 inline-block">
                    <svg viewBox="0 0 24 24" fill="#25D366" className="w-8 h-8 drop-shadow-lg"
                      style={{ filter: 'drop-shadow(0 4px 12px rgba(37,211,102,0.4))' }}>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </motion.span>
                </span>{' '}שמנהל לך
                <br />
                <span style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 38%, #22d3ee 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
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
                  <motion.button whileHover={{ scale: 1.03, boxShadow: '0 20px 40px rgba(244,63,94,0.3)' }} whileTap={{ scale: 0.97 }}
                    className="w-full text-white font-bold text-lg px-8 py-4 rounded-2xl inline-flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #f97316, #f43f5e, #06b6d4)', boxShadow: '0 8px 24px rgba(244,63,94,0.3)' }}>
                    <Zap size={19} />
                    התחל 30 יום חינם
                  </motion.button>
                </Link>
                <motion.a href="#features" whileHover={{ scale: 1.02 }}
                  className="w-full lg:w-auto text-gray-600 hover:text-gray-900 font-semibold text-base px-8 py-3.5 rounded-2xl transition-all inline-flex items-center gap-2 justify-center"
                  style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)' }}>
                  ראה איך זה עובד
                  <ChevronLeft size={16} />
                </motion.a>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-4 items-center mb-5">
                {['ללא כרטיס אשראי', 'ביטול בכל עת', 'הגדרה תוך דקה'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-gray-400 text-sm">
                    <Check size={13} className="text-[#f97316]" />{t}
                  </div>
                ))}
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-gray-500"
                  style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)' }}>
                  <Smartphone size={12} className="text-[#f97316]" />
                  אפליקציה לאייפון ואנדרואיד — בקרוב
                </div>
              </motion.div>

            </div>
          </div>
        </div>

        {/* Bottom fade to page background */}
        <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to bottom, transparent, #f8f6f2)' }} />
      </section>

      {/* ─── Stats ─────────────────────────────────────────────────────────── */}
      <section className="pt-0 pb-12 md:pb-16 px-4 md:px-6">
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
                className="text-center p-5 md:p-8 rounded-2xl relative overflow-hidden"
                style={{ ...glassCard, borderRadius: 20 }}>
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.06) 50%, transparent)' }} />
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
      <section id="features" className="py-14 md:py-24 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-3">כל מה שהעסק שלך צריך</motion.h2>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="text-gray-500 text-lg max-w-2xl mx-auto">לא עוד שיחות טלפון, לא עוד ניהול ידני — טורי עושה הכל בשבילך.</motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon={Bot}       delay={0}    title="בוט וואטסאפ AI"     desc="מקבל תורים, מבטל ועונה על שאלות בעברית שוטפת, 24 שעות ביממה." />
            <FeatureCard icon={Calendar}  delay={0.07} title="יומן חכם בזמן אמת"  desc="ממשק ויזואלי נוח לניהול כל התורים. הוסף ידנית, חסום זמנים, ראה הכל במקום אחד." />
            <FeatureCard icon={BarChart3} delay={0.14} title="אנליטיקות ודוחות"   desc="גרפים של הכנסות, שירותים פופולריים ושעות עמוסות. דוח חודשי לקבלת החלטות חכמות." />
            <FeatureCard icon={Users}     delay={0.21} title="ריבוי עובדים"        desc="כמה עובדים עם לוחות זמנים וצבעים נפרדים. מושלם לסלון שמעסיק מספר אנשים." />
            <FeatureCard icon={Bell}      delay={0.28} title="תזכורות אוטומטיות"  desc="הבוט שולח ללקוח תזכורת יום לפני התור. פחות ביטולי רגע אחרון ויותר כסף בכיס." />
            <FeatureCard icon={FileText}  delay={0.35} title="חשבוניות ירוקות"    desc="אינטגרציה עם חשבוניות ירוקות לניהול חשבוניות ישירות מתוך היומן." />
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="mt-8 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden"
            style={{ ...glassCard, borderRadius: 20 }}>
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.06) 50%, transparent)' }} />
            <div className="flex items-center gap-3">
              <Icon3D icon={Smartphone} size={17} boxSize={40} glow={false} />
              <div>
                <div className="text-gray-900 font-semibold text-sm">אפליקציה לאייפון ואנדרואיד</div>
                <div className="text-gray-400 text-xs">נהל את העסק שלך מהסמארטפון בכל מקום — בקרוב</div>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-[#ea6c00]"
              style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.18)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse inline-block" />
              בפיתוח
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── How it works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative py-28 md:py-40" style={{ background: '#f2efe8', borderTop: '1px solid rgba(0,0,0,0.06)', padding: 'clamp(80px,10vw,160px) clamp(20px,4.2vw,56px)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <div className="flex flex-col items-start gap-4" style={{ marginBottom: 64 }}>
            <span className="rounded-full px-4 py-1.5 text-xs font-medium"
              style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)', color: '#6b6055', fontFamily: "'Rubik', sans-serif" }}>
              איך זה עובד
            </span>
            <h2 style={{ fontFamily: "'Secular One', sans-serif", fontSize: 'clamp(36px,6vw,72px)', lineHeight: 0.9, letterSpacing: '-0.02em', color: '#18120a', margin: 0 }}>
              פשוט. מהיר. עובד.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {[
              { step: '01', title: 'נרשמים תוך 2 דקות', desc: 'שם העסק, שירותים, מחירים ושעות עבודה — הכל בממשק פשוט ומהיר.' },
              { step: '02', title: 'מחברים את הוואטסאפ', desc: 'שולחים ללקוחות קישור אחד, מהרגע הזה הבוט מקבל תורים במקומך.' },
              { step: '03', title: 'הבוט עובד, אתה נח',  desc: 'תורים, ביטולים, תזכורות — הכל רץ לבד 24/7, גם כשאתה ישן.' },
            ].map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.14, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex flex-col gap-4 items-start"
                style={{
                  padding: 'clamp(40px,5vw,56px) clamp(24px,4vw,40px)',
                  borderBottom: '1px solid rgba(0,0,0,0.08)',
                  borderInlineEnd: i < 2 ? '1px solid rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <span className="leading-none select-none" style={{
                  fontFamily: "'Secular One', sans-serif",
                  fontSize: 'clamp(72px, 10vw, 130px)',
                  color: 'rgba(0,0,0,0.07)',
                  marginBottom: -16,
                  display: 'block',
                }}>
                  {s.step}
                </span>
                <h3 style={{ fontFamily: "'Secular One', sans-serif", fontSize: 'clamp(22px,2.5vw,30px)', color: '#18120a', margin: 0, fontWeight: 400 }}>{s.title}</h3>
                <p style={{ fontFamily: "'Rubik', sans-serif", fontSize: 14, lineHeight: 1.7, color: '#6b6055', margin: 0, maxWidth: '28ch' }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROI Calculator ────────────────────────────────────────────────── */}
      <ROICalculator />

      {/* ─── Testimonials ──────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-14 md:py-24 px-4 md:px-6" style={{ background: '#f2efe8', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-3">מה אומרים עלינו</h2>
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
      <section id="pricing" className="py-14 md:py-24 px-4 md:px-6" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-3">מחירים פשוטים ושקופים</h2>
            <p className="text-gray-500 text-base md:text-lg">ללא הפתעות. ביטול בכל עת.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 items-stretch">
            {[
              { plan: 'ניסיון חינמי', price: 0,   highlight: false, badge: 'ללא כרטיס אשראי', delay: 0,   features: ['30 יום מלאים חינם','בוט וואטסאפ פעיל','יומן וניהול לקוחות','ללא כרטיס אשראי','עובד אחד'] },
              { plan: 'Basic',        price: 99,  highlight: true,  badge: 'הכי פופולרי',     delay: 0.1, features: ['עובד אחד','תורים ללא הגבלה','בוט AI 24 שעות','יומן ואנליטיקות','תמיכה טכנית'] },
              { plan: 'Business',     price: 250, highlight: false, badge: null,               delay: 0.2, features: ['עד 4 עובדים','תורים ללא הגבלה','בוט AI 24 שעות','דוחות מתקדמים','תזכורות אוטומטיות','גוגל קלנדר','חשבוניות ירוקות'] },
            ].map(({ plan, price, highlight, badge, delay, features }) => (
              <motion.div key={plan}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.2, delay: delay * 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="relative rounded-2xl p-6 md:p-8 transition-all duration-300 flex flex-col h-full overflow-hidden"
                style={highlight
                  ? { background: 'linear-gradient(145deg, #be123c, #0e7490)', border: '1px solid rgba(244,63,94,0.4)', boxShadow: '0 0 40px rgba(244,63,94,0.15), inset 0 1px 0 rgba(255,255,255,0.12)' }
                  : { ...glassCard, borderRadius: 20 }
                }>
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.07) 50%, transparent)' }} />
                {badge && (
                  <div className="absolute -top-3 right-6 text-white text-xs font-bold px-3 py-1 rounded-full"
                    style={{
                      background: badge === 'ללא כרטיס אשראי' ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #f97316, #f43f5e)',
                      boxShadow: badge === 'ללא כרטיס אשראי' ? '0 4px 12px rgba(22,163,74,0.35)' : '0 4px 12px rgba(244,63,94,0.35)',
                    }}>{badge}</div>
                )}
                <div className={`text-sm font-semibold uppercase tracking-wider mb-2 ${highlight ? 'text-orange-200' : 'text-gray-500'}`}>{plan}</div>
                <div className="flex items-end gap-1 mb-6">
                  {price === 0
                    ? <span className={`text-4xl font-black ${highlight ? 'text-white' : 'text-gray-900'}`}>חינם</span>
                    : <><span className={`text-4xl font-black ${highlight ? 'text-white' : 'text-gray-900'}`}>₪{price}</span><span className={`text-sm mb-1 ${highlight ? 'text-orange-200' : 'text-gray-500'}`}>/חודש</span></>
                  }
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {features.map((f, i) => (
                    <li key={i} className={`flex items-start gap-2 text-sm ${highlight ? 'text-orange-100' : 'text-gray-600'}`}>
                      <Check size={16} className="mt-0.5 shrink-0 text-[#f97316]" />{f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="mt-auto">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
                    style={highlight
                      ? { background: 'linear-gradient(135deg, #f97316, #f43f5e, #06b6d4)', color: 'white', boxShadow: '0 4px 16px rgba(244,63,94,0.3)' }
                      : { background: 'rgba(0,0,0,0.05)', color: '#18120a', border: '1px solid rgba(0,0,0,0.1)' }
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
      <section className="py-16 md:py-28 px-4 md:px-6 relative overflow-hidden" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#f2efe8' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.04), rgba(234,88,12,0.02))' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.06), transparent 70%)' }} />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="flex justify-center mb-6"><Icon3D icon={Zap} size={28} boxSize={68} /></div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-5">מוכן להפסיק לנהל תורים ידנית?</h2>
            <p className="text-gray-500 text-base md:text-xl mb-8">הצטרף לעסקים שכבר חוסכים שעות בשבוע עם טורי.</p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto md:max-w-none md:flex-row md:justify-center">
              <Link to="/register" className="w-full md:w-auto">
                <motion.button whileHover={{ scale: 1.03, boxShadow: '0 20px 40px rgba(244,63,94,0.3)' }} whileTap={{ scale: 0.97 }}
                  className="w-full text-white font-bold text-lg px-10 py-4 rounded-2xl inline-flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #f97316, #f43f5e, #06b6d4)', boxShadow: '0 8px 24px rgba(244,63,94,0.25)' }}>
                  <Zap size={20} />התחל 30 יום חינם
                </motion.button>
              </Link>
              <Link to="/login" className="w-full md:w-auto">
                <motion.button whileHover={{ scale: 1.02 }}
                  className="w-full text-gray-600 hover:text-gray-900 font-semibold text-lg px-8 py-4 rounded-2xl transition-all"
                  style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)' }}>
                  יש לי חשבון
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <footer className="py-10 px-4 md:px-6" style={{ borderTop: '1px solid rgba(0,0,0,0.07)', background: '#f0ede6' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="font-black text-xl text-gray-900">Tori</span>
              <ToriLogo size={26} />
            </div>
            <div className="flex flex-wrap gap-4 text-gray-500 text-sm justify-center">
              <button onClick={() => setTermsOpen(true)} className="hover:text-gray-900 transition-colors">תקנון ותנאי שימוש</button>
              <button onClick={() => setPrivacyOpen(true)} className="hover:text-gray-900 transition-colors">מדיניות פרטיות</button>
              <button onClick={() => setAccessOpen(true)} className="hover:text-gray-900 transition-colors">הצהרת נגישות</button>
              <a href="https://wa.me/972584532944" className="hover:text-green-600 transition-colors">תמיכה: מרדכי 058-453-2944</a>
              <a href="https://wa.me/972509603671" className="hover:text-green-600 transition-colors">עומרי 050-960-3671</a>
              <a href="mailto:supporttori@gmail.com" className="hover:text-[#f97316] transition-colors">supporttori@gmail.com</a>
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
        <p><strong className="text-gray-900">5. יצירת קשר</strong><br /><a href="mailto:supporttori@gmail.com" className="text-[#f97316]">supporttori@gmail.com</a></p>
      </Modal>

      <Modal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="מדיניות פרטיות">
        <p className="text-gray-700 font-semibold">עודכן לאחרונה: אפריל 2026</p>
        <p>טורי מתחייבת להגן על פרטיות המשתמשים בהתאם לחוק הגנת הפרטיות ו-GDPR.</p>
        <p><strong className="text-gray-900">מידע שנאסף</strong><br />שם, אימייל, טלפון, שם העסק, נתוני תורים. היסטוריית שיחות לצרכי שיפור בלבד.</p>
        <p><strong className="text-gray-900">שימוש במידע</strong><br />להפעלת השירות ותמיכה טכנית בלבד. לא נשלח דיוור שיווקי ללא הסכמה.</p>
        <p><strong className="text-gray-900">אבטחה</strong><br />הצפנה מלאה (TLS). גישה מוגבלת לעובדים מורשים.</p>
        <p><strong className="text-gray-900">זכויות</strong><br />עיון, תיקון ומחיקת מידע: <a href="mailto:supporttori@gmail.com" className="text-[#f97316]">supporttori@gmail.com</a></p>
      </Modal>

      <Modal open={accessOpen} onClose={() => setAccessOpen(false)} title="הצהרת נגישות">
        <p>טורי מחויבת לנגישות דיגיטלית בהתאם לתקן הישראלי 5568 ו-WCAG 2.1 רמת AA.</p>
        <p><strong className="text-gray-900">תכונות נגישות:</strong> ניווט מקלדת מלא, תמיכה בקוראי מסך, יחסי ניגוד תקניים, תמיכה בהגדלת טקסט.</p>
        <p><strong className="text-gray-900">דיווח על בעיות:</strong> <a href="mailto:supporttori@gmail.com" className="text-[#f97316]">supporttori@gmail.com</a></p>
        <p className="text-gray-400 text-xs">עודכן לאחרונה: אפריל 2026</p>
      </Modal>

    </div>
    </MotionConfig>
  );
}
