import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Sparkles, Loader2, RotateCcw, CalendarPlus, CalendarX2 } from 'lucide-react';
import api from '../../hooks/useApi';
import { useAuthStore } from '../../store/useStore';

const ACTION_CARDS = [
  {
    id: 'new',
    icon: CalendarPlus,
    title: 'קביעת תור חדש',
    desc: 'קבע תור ללקוח — שם, שירות ושעה',
    prompt: 'אני רוצה לקבוע תור חדש ללקוח',
    gradient: 'linear-gradient(135deg, #f97316, #f43f5e)',
    glow: 'rgba(249,115,22,0.22)',
  },
  {
    id: 'cancel',
    icon: CalendarX2,
    title: 'ביטול תור קיים',
    desc: 'בטל תור של לקוח לפי שם או תאריך',
    prompt: 'אני רוצה לבטל תור קיים',
    gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    glow: 'rgba(6,182,212,0.18)',
  },
];

function useNightMode() {
  const [isNight, setIsNight] = useState(() => { const h = new Date().getHours(); return h >= 20 || h < 6; });
  useEffect(() => {
    const id = setInterval(() => { const h = new Date().getHours(); setIsNight(h >= 20 || h < 6); }, 60000);
    return () => clearInterval(id);
  }, []);
  return isNight;
}

const CHAT_STORAGE_KEY = 'ownerbot_chat';
const CHAT_TTL_MS = 60 * 60 * 1000; // 1 hour

function loadSavedChat() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const { messages, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > CHAT_TTL_MS) { localStorage.removeItem(CHAT_STORAGE_KEY); return []; }
    return messages || [];
  } catch { return []; }
}

export default function OwnerBotPage() {
  const { business } = useAuthStore();
  const isNight = useNightMode();
  const [messages, setMessages] = useState(() => loadSavedChat());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  // On mobile: lock container height to the visual viewport so the layout
  // stays stable when the software keyboard opens/closes.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv || !containerRef.current) return;
    const onResize = () => {
      if (containerRef.current) {
        containerRef.current.style.height = vv.height + 'px';
      }
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    onResize();
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, []);

  const isEmpty = messages.length === 0;

  const surface  = isNight ? '#0d1117' : '#ffffff';
  const outerBg  = isNight ? '#08080F' : '#f9fafb';
  const border   = isNight ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const muted    = isNight ? 'rgba(255,255,255,0.35)' : '#9ca3af';
  const titleClr = isNight ? '#ffffff' : '#111827';
  const inputBg  = isNight ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const inputBdr = isNight ? 'rgba(255,255,255,0.10)' : '#d1d5db';

  // Save messages to localStorage on every change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ messages, savedAt: Date.now() }));
    }
  }, [messages]);

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
    localStorage.removeItem(CHAT_STORAGE_KEY);
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
    <div ref={containerRef} className="h-full flex flex-col overflow-hidden" dir="rtl" style={{ background: outerBg }}>

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
            <span className="font-bold text-sm" style={{ color: titleClr }}>טורי — הסוכן שלך</span>
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
      <div className="flex-1 min-h-0 overflow-y-auto relative">
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
                אני טורי, הסוכן שלך. מכיר את כל הנתונים של העסק — שאל אותי כל דבר.
              </p>
            </motion.div>

            <div style={{ width: '100%', maxWidth: 600 }}>
              {/* Action cards */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {ACTION_CARDS.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <motion.button
                      key={card.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                      onClick={() => send(card.prompt)}
                      className="flex flex-col items-start gap-3 p-4 rounded-2xl border text-right transition-all"
                      style={{
                        background: inputBg,
                        borderColor: border,
                        boxShadow: isNight
                          ? `0 0 0 1px rgba(255,255,255,0.04), 0 4px 20px ${card.glow}`
                          : `0 2px 12px rgba(0,0,0,0.07), 0 4px 20px ${card.glow}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: card.gradient, boxShadow: `0 4px 14px ${card.glow}` }}
                      >
                        <Icon size={18} className="text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold mb-0.5" style={{ color: titleClr }}>
                          {card.title}
                        </div>
                        <div className="text-xs leading-snug" style={{ color: muted }}>
                          {card.desc}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {inputBox}

              <p className="text-center text-xs mt-2.5" style={{ color: muted, opacity: 0.5 }}>
                Enter לשליחה · Shift+Enter לשורה חדשה
              </p>
            </div>
          </div>
        ) : (
          /* CHAT — messages list */
          <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-start flex-row-reverse' : 'justify-start'}`}
                >
                  {/* Avatar */}
                  <div className="shrink-0 mt-0.5">
                    {msg.role === 'assistant' ? (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #f97316, #f43f5e)', boxShadow: '0 2px 8px rgba(249,115,22,0.3)' }}
                      >
                        <Sparkles size={12} className="text-white" />
                      </div>
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: isNight ? 'rgba(255,255,255,0.1)' : '#e5e7eb', color: isNight ? 'rgba(255,255,255,0.6)' : '#6b7280' }}
                      >
                        {(business?.owner_name?.[0] || 'א').toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Bubble */}
                  <div className="max-w-[80%]">
                    {msg.role === 'user' ? (
                      <div
                        className="px-4 py-2.5 text-sm leading-relaxed"
                        style={{
                          background: isNight ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.1)',
                          color: isNight ? 'rgba(255,255,255,0.9)' : '#1f2937',
                          border: `1px solid ${isNight ? 'rgba(249,115,22,0.25)' : 'rgba(249,115,22,0.2)'}`,
                          borderRadius: '18px 4px 18px 18px',
                        }}
                      >
                        {msg.content}
                      </div>
                    ) : (
                      <div
                        className="text-sm leading-relaxed"
                        style={{ color: isNight ? 'rgba(255,255,255,0.85)' : '#1f2937' }}
                      >
                        {/* Render assistant text, replacing problematic unicode bullet chars */}
                        {msg.content.replace(/[■▪▸●►]/g, '•')}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-3 justify-start"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #f97316, #f43f5e)', boxShadow: '0 2px 8px rgba(249,115,22,0.3)' }}
                >
                  <Sparkles size={12} className="text-white" />
                </div>
                <div className="flex items-center gap-1.5 px-1 py-2">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full"
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
