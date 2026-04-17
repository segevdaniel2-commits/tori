import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Zap, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import api from '../hooks/useApi';

function ToriLogo() {
  const id = 'login-logo-grad';
  return (
    <Link to="/v2" className="inline-flex items-center gap-1.5">
      <svg width={28} height={28} viewBox="0 0 40 40" style={{ overflow: 'visible' }}>
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
      <span className="font-black text-xl tracking-tight bg-gradient-to-r from-[#f97316] via-[#f43f5e] to-[#06b6d4] bg-clip-text text-transparent">Tori</span>
    </Link>
  );
}

export default function Login() {
  const [loginMode, setLoginMode] = useState('email'); // 'email' | 'phone'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // 2FA state
  const [step, setStep] = useState('credentials'); // 'credentials' | '2fa'
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

  return (
    <div className="min-h-screen bg-[#08080F] flex items-center justify-center px-4" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-[#f43f5e]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-[#06b6d4]/8 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <ToriLogo />
        </div>

        <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-8">
          <h1 className="text-2xl font-black text-white mb-6">
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
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f97316] to-[#f43f5e] flex items-center justify-center">
                  <ShieldCheck size={26} className="text-white" />
                </div>
                <p className="text-gray-400 text-sm text-center">
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
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#f43f5e]/60 text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
                dir="ltr"
                required
              />
              <motion.button
                type="submit"
                disabled={loading || totpCode.length < 6}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full bg-gradient-to-r from-[#f97316] via-[#f43f5e] to-[#06b6d4] text-white font-bold py-3.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                {loading ? 'מאמת...' : 'אמת'}
              </motion.button>
              <button type="button" onClick={() => { setStep('credentials'); setError(''); setTotpCode(''); }}
                className="w-full text-gray-500 text-sm hover:text-gray-300 transition-colors">
                ← חזור
              </button>
            </form>
          )}

          {/* ── Credentials step ─────────────────────────────────────────── */}
          {step === 'credentials' && <>
          {/* Toggle email/phone */}
          <div className="flex rounded-xl overflow-hidden border border-white/10 mb-4">
            <button type="button" onClick={() => { setLoginMode('email'); setIdentifier(''); }}
              className={`flex-1 py-2 text-sm font-semibold transition-all ${loginMode === 'email' ? 'bg-[#f97316] text-white' : 'text-gray-400 hover:text-gray-200'}`}>
              אימייל
            </button>
            <button type="button" onClick={() => { setLoginMode('phone'); setIdentifier(''); }}
              className={`flex-1 py-2 text-sm font-semibold transition-all ${loginMode === 'phone' ? 'bg-[#f97316] text-white' : 'text-gray-400 hover:text-gray-200'}`}>
              טלפון
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1.5">
                {loginMode === 'email' ? 'אימייל' : 'מספר טלפון'}
              </label>
              <input
                type={loginMode === 'email' ? 'email' : 'tel'}
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#f43f5e]/60 transition-all"
                placeholder={loginMode === 'email' ? 'you@example.com' : '050-0000000'}
                dir="ltr"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1.5">סיסמה</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#f43f5e]/60 transition-all pl-12"
                  placeholder="••••••••"
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-0 top-0 h-full w-12 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01, boxShadow: '0 12px 28px rgba(244,63,94,0.3)' }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-gradient-to-r from-[#f97316] via-[#f43f5e] to-[#06b6d4] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#f43f5e]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
              {loading ? 'מתחבר...' : 'כניסה'}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              אין לך חשבון?{' '}
              <Link to="/register" className="bg-gradient-to-r from-[#f97316] via-[#f43f5e] to-[#06b6d4] bg-clip-text text-transparent font-semibold hover:opacity-80 transition-opacity">
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
