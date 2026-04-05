import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Zap } from 'lucide-react';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.token, data.business);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בהתחברות');
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
          <h1 className="text-2xl font-black text-white mb-6">ברוך הבא חזרה</h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1.5">אימייל</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#f43f5e]/60 transition-all"
                placeholder="you@example.com"
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
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
        </div>
      </motion.div>
    </div>
  );
}
