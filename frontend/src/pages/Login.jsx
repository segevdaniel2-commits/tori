import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Zap } from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import api from '../hooks/useApi';

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
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-tori-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-coral-500/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tori-600 to-coral-500 flex items-center justify-center text-white font-black">T</div>
            <span className="font-black text-2xl text-white">Tori</span>
            <span className="text-coral-500 text-2xl font-black">.</span>
          </Link>
          <p className="text-gray-400 mt-2">כניסה לדשבורד</p>
        </div>

        <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-8">
          <h1 className="text-2xl font-black text-white mb-6">ברוך הבא חזרה 👋</h1>

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
                className="w-full px-4 py-3 rounded-xl bg-[#1a1a2e] border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-tori-500 focus:ring-1 focus:ring-tori-500 transition-all"
                placeholder="you@example.com"
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
                  className="w-full px-4 py-3 rounded-xl bg-[#1a1a2e] border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-tori-500 focus:ring-1 focus:ring-tori-500 transition-all pl-12"
                  placeholder="••••••••"
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
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-gradient-to-r from-tori-600 to-tori-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-tori-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
              {loading ? 'מתחבר...' : 'כניסה'}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              אין לך חשבון?{' '}
              <Link to="/register" className="text-tori-400 hover:text-tori-300 font-semibold transition-colors">
                הצטרף חינם
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
