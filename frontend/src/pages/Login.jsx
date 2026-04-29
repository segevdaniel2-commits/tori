import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Zap, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import api from '../hooks/useApi';

function useNightMode() {
  const [isNight, setIsNight] = useState(() => { const h = new Date().getHours(); return h >= 20 || h < 6; });
  useEffect(() => {
    const id = setInterval(() => { const h = new Date().getHours(); setIsNight(h >= 20 || h < 6); }, 60000);
    return () => clearInterval(id);
  }, []);
  return isNight;
}

function ToriLogo({ isNight }) {
  return (
    <Link to="/v2" className="inline-flex items-center gap-2">
      <img src="/favicon.png" alt="TORI" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
      <span className={`font-black text-xl tracking-tight ${isNight ? 'text-white' : 'text-gray-900'}`}>TORI</span>
    </Link>
  );
}

export default function Login() {
  const isNight = useNightMode();
  const [loginMode, setLoginMode] = useState('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('credentials');
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const totpRef = useRef(null);

  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: identifier, password });
      if (data.requires2fa) {
        setTempToken(data.tempToken);
        setStep('2fa');
        setTimeout(() => totpRef.current?.focus(), 100);
      } else {
        setAuth(data.token, data.business);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  }

  async function handleTotpSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/2fa/verify-login', { tempToken, code: totpCode });
      setAuth(data.token, data.business);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'קוד שגוי');
      setTotpCode('');
      setTimeout(() => totpRef.current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = isNight
    ? "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#22c55e]/50 transition-all"
    : "w-full px-4 py-3 rounded-xl bg-white/70 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#16a34a]/60 focus:bg-white transition-all shadow-sm";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      dir="rtl"
      style={{ background: isNight ? '#08080F' : 'linear-gradient(135deg, #f0fdf4 0%, #e8f5f0 50%, #f0f2f5 100%)' }}
    >
      {/* Ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 right-1/3 w-96 h-96 rounded-full blur-[120px] ${isNight ? 'bg-[#16a34a]/12' : 'bg-[#16a34a]/8'}`} />
        <div className={`absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full blur-[100px] ${isNight ? 'bg-[#16a34a]/10' : 'bg-[#16a34a]/6'}`} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <ToriLogo isNight={isNight} />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={isNight
            ? { background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(24px) saturate(160%)', WebkitBackdropFilter: 'blur(24px) saturate(160%)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 8px 48px rgba(0,0,0,0.5)' }
            : { background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(44px) saturate(220%)', WebkitBackdropFilter: 'blur(44px) saturate(220%)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 8px 48px rgba(0,0,0,0.10)' }
          }
        >
          <h1 className={`text-2xl font-black mb-6 ${isNight ? 'text-white' : 'text-gray-900'}`}>
            {step === '2fa' ? 'אימות דו-שלבי' : 'ברוך הבא חזרה'}
          </h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          {/* ── 2FA step ─────────────────────────────────────────────────── */}
          {step === '2fa' && (
            <form onSubmit={handleTotpSubmit} className="space-y-4">
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center">
                  <ShieldCheck size={26} className="text-white" />
                </div>
                <p className={`text-sm text-center ${isNight ? 'text-gray-400' : 'text-gray-500'}`}>
                  הכנס את הקוד מ-Google Authenticator
                </p>
              </div>
              <input
                ref={totpRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className={`${inputCls} text-center text-2xl tracking-[0.5em] font-mono`}
                placeholder="000000"
                dir="ltr"
                required
              />
              <motion.button
                type="submit"
                disabled={loading || totpCode.length < 6}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full bg-gradient-to-r from-[#22c55e] via-[#16a34a] to-[#065f46] text-white font-bold py-3.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                {loading ? 'מאמת...' : 'אמת'}
              </motion.button>
              <button type="button" onClick={() => { setStep('credentials'); setError(''); setTotpCode(''); }}
                className={`w-full text-sm transition-colors ${isNight ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                ← חזור
              </button>
            </form>
          )}

          {/* ── Credentials step ─────────────────────────────────────────── */}
          {step === 'credentials' && <>
          {/* Toggle email/phone */}
          <div className={`flex rounded-xl overflow-hidden border mb-4 ${isNight ? 'border-white/10' : 'border-gray-200'}`}>
            <button type="button" onClick={() => { setLoginMode('email'); setIdentifier(''); }}
              className={`flex-1 py-2 text-sm font-semibold transition-all ${loginMode === 'email' ? 'bg-[#16a34a] text-white' : isNight ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'}`}>
              אימייל
            </button>
            <button type="button" onClick={() => { setLoginMode('phone'); setIdentifier(''); }}
              className={`flex-1 py-2 text-sm font-semibold transition-all ${loginMode === 'phone' ? 'bg-[#16a34a] text-white' : isNight ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'}`}>
              טלפון
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${isNight ? 'text-gray-400' : 'text-gray-600'}`}>
                {loginMode === 'email' ? 'אימייל' : 'מספר טלפון'}
              </label>
              <input
                type={loginMode === 'email' ? 'email' : 'tel'}
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className={inputCls}
                placeholder={loginMode === 'email' ? 'you@example.com' : '050-0000000'}
                dir="ltr"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${isNight ? 'text-gray-400' : 'text-gray-600'}`}>סיסמה</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`${inputCls} pl-12`}
                  placeholder="••••••••"
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className={`absolute left-0 top-0 h-full w-12 flex items-center justify-center transition-colors ${isNight ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-gradient-to-r from-[#22c55e] via-[#16a34a] to-[#065f46] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#16a34a]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
              {loading ? 'מתחבר...' : 'כניסה'}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm ${isNight ? 'text-gray-500' : 'text-gray-500'}`}>
              אין לך חשבון?{' '}
              <Link to="/register" className="text-[#16a34a] hover:text-[#15803d] font-semibold transition-colors">
                הצטרף חינם
              </Link>
            </p>
          </div>
          </>}
        </div>
      </motion.div>
    </div>
  );
}
