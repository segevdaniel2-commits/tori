import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import api from '../../hooks/useApi';
import { useAuthStore } from '../../store/useStore';

const SUGGESTIONS = [
  'כמה תורים יש לי היום?',
  'מי הלקוחות הכי נאמנים שלי?',
  'כמה הכנסתי החודש?',
  'מה התורים הקרובים שלי?',
  'איזה שירותים אני מציע?',
  'מה שעות הפעילות שלי?',
];

function useNightMode() {
  const [isNight, setIsNight] = useState(() => { const h = new Date().getHours(); return h >= 20 || h < 6; });
  useEffect(() => {
    const id = setInterval(() => { const h = new Date().getHours(); setIsNight(h >= 20 || h < 6); }, 60000);
    return () => clearInterval(id);
  }, []);
  return isNight;
}

export default function OwnerBotPage() {
  const { business } = useAuthStore();
  const isNight = useNightMode();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const isEmpty = messages.length === 0;

  const surface  = isNight ? '#0d1117' : '#ffffff';
  const outerBg  = isNight ? '#08080F' : '#f9fafb';
  const border   = isNight ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const muted    = isNight ? 'rgba(255,255,255,0.35)' : '#9ca3af';
  const titleClr = isNight ? '#ffffff' : '#111827';
  const inputBg  = isNight ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const inputBdr = isNight ? 'rgba(255,255,255,0.10)' : '#d1d5db';

  useEffect(() => {
    if (!isEmpty) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  async function send(text) {
    const msg = (typeof text === 'string' ? text : input).trim();
    if (!msg || loading) return;
    setInput('');
    setError(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg = { role: 'user', content: msg, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data } = await api.post('/owner-bot/chat', {
        message: msg,
        history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, id: Date.now() + 1 }]);
    } catch (err) {
      const detail = err?.response?.data?.error || err?.message || '';
      setError(`משהו השתבש. נסה שוב.${detail ? ` (${detail})` : ''}`);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  function reset() {
    setMessages([]);
    setInput('');
    setError(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  // ── Shared input box JSX (rendered inline, not as a sub-component) ────────
  const inputBox = (
    <div
      className="flex items-center gap-2 px-5 py-3 transition-all"
      style={{
        background: inputBg,
        border: `1px solid ${inputBdr}`,
        borderRadius: 999,
        boxShadow: isNight ? '0 0 0 1px rgba(255,255,255,0.04)' : '0 2px 12px rgba(0,0,0,0.08)',
      }}
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={e => { setInput(e.target.value); autoResize(); }}
        onKeyDown={handleKey}
        placeholder='חמישי בשלוש פנוי?'
        rows={1}
        className="flex-1 bg-transparent resize-none text-sm focus:outline-none leading-relaxed"
        style={{ color: titleClr, maxHeight: 120, scrollbarWidth: 'none' }}
      />
      <button
        onClick={() => send(input)}
        disabled={!input.trim() || loading}
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all"
        style={{
          background: input.trim() && !loading
            ? 'linear-gradient(135deg, #f97316, #f43f5e)'
            : isNight ? 'rgba(255,255,255,0.06)' : '#e5e7eb',
        }}
      >
        {loading
          ? <Loader2 size={14} className="animate-spin" style={{ color: input.trim() ? '#fff' : muted }} />
          : <ArrowUp size={15} style={{ color: input.trim() && !loading ? '#fff' : muted }} />
        }
      </button>
    </div>
  );

  return (
    <div className="h-full flex flex-col" dir="rtl" style={{ background: outerBg }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 py-3.5 border-b shrink-0"
        style={{ background: surface, borderColor: border }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#f97316] via-[#f43f5e] to-[#06b6d4] flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-sm" style={{ color: titleClr }}>עוזר AI</span>
            <span className="text-xs mr-2" style={{ color: muted }}>מבוסס על נתוני {business?.name || 'העסק'}</span>
          </div>
        </div>
        {!isEmpty && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all"
            style={{ color: muted, borderColor: border, background: isNight ? 'rgba(255,255,255,0.03)' : '#f9fafb' }}
          >
            <RotateCcw size={11} />
            שיחה חדשה
          </button>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto relative">
        {isEmpty ? (
          /* CENTER — empty state with input in the middle */
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-8"
            >
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #f97316, #f43f5e)', boxShadow: '0 8px 24px rgba(244,63,94,0.22)' }}
              >
                <Sparkles size={24} className="text-white" />
              </div>
              <h2 className="font-bold text-lg mb-1" style={{ color: titleClr }}>
                שלום, {business?.owner_name?.split(' ')[0] || 'בעל העסק'}
              </h2>
              <p className="text-sm" style={{ color: muted }}>
                אני מכיר את כל הנתונים של העסק שלך. שאל אותי כל דבר.
              </p>
            </motion.div>

            <div style={{ width: '100%', maxWidth: 600 }}>
              {/* Suggestion chips */}
              <div className="flex flex-wrap gap-2 justify-center mb-5">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    onClick={() => send(s)}
                    className="px-3.5 py-2 rounded-full text-xs font-medium border transition-all"
                    style={{
                      background: inputBg,
                      borderColor: border,
                      color: isNight ? 'rgba(255,255,255,0.6)' : '#4b5563',
                      boxShadow: isNight ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                      cursor: 'pointer',
                    }}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>

              {inputBox}

              <p className="text-center text-xs mt-2.5" style={{ color: muted, opacity: 0.5 }}>
                Enter לשליחה · Shift+Enter לשורה חדשה
              </p>
            </div>
          </div>
        ) : (
          /* CHAT — messages list */
          <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  {msg.role === 'assistant' && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-0.5"
                      style={{ background: 'linear-gradient(135deg, #f97316, #f43f5e)' }}
                    >
                      <Sparkles size={11} className="text-white" />
                    </div>
                  )}
                  <div
                    className="max-w-[76%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                    style={msg.role === 'user' ? {
                      background: 'linear-gradient(135deg, #f97316, #f43f5e)',
                      color: '#ffffff',
                      borderRadius: '18px 18px 4px 18px',
                    } : {
                      background: isNight ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
                      color: isNight ? 'rgba(255,255,255,0.88)' : '#1f2937',
                      border: `1px solid ${isNight ? 'rgba(255,255,255,0.07)' : '#e5e7eb'}`,
                      borderRadius: '18px 18px 18px 4px',
                    }}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-2.5 justify-end"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #f97316, #f43f5e)' }}
                >
                  <Sparkles size={11} className="text-white" />
                </div>
                <div
                  className="px-4 py-3 flex items-center gap-1.5"
                  style={{
                    background: isNight ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
                    border: `1px solid ${isNight ? 'rgba(255,255,255,0.07)' : '#e5e7eb'}`,
                    borderRadius: '18px 18px 18px 4px',
                  }}
                >
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: muted }}
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.18 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {error && (
              <div className="text-center text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Bottom input bar (only during conversation) ──────────────────── */}
      <AnimatePresence>
        {!isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 border-t px-4 py-4"
            style={{ background: surface, borderColor: border }}
          >
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              {inputBox}
              <p className="text-center text-xs mt-2.5" style={{ color: muted, opacity: 0.5 }}>
                Enter לשליחה · Shift+Enter לשורה חדשה
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
