import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Sparkles, Loader2, RotateCcw, CalendarPlus, CalendarX2, UserPlus } from 'lucide-react';
import api from '../../hooks/useApi';
import { useAuthStore } from '../../store/useStore';

const ACTION_CARDS = [
  {
    id: 'new-customer',
    icon: UserPlus,
    title: 'לקוח חדש',
    desc: 'שם + טלפון + שעה',
    prompt: 'אני רוצה לקבוע תור ללקוח חדש שלא ביקר אצלי',
  },
  {
    id: 'cancel',
    icon: CalendarX2,
    title: 'ביטול תור',
    desc: 'ביטול לפי שם ותאריך',
    prompt: 'אני רוצה לבטל תור קיים',
  },
  {
    id: 'existing-customer',
    icon: CalendarPlus,
    title: 'לקוח קיים',
    desc: 'שם פרטי + שם משפחה + שעה',
    prompt: 'אני רוצה לקבוע תור ללקוח שכבר ביקר אצלי',
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
const CHAT_TTL_MS = 60 * 60 * 1000;

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

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv || !containerRef.current) return;
    const onResize = () => {
      if (containerRef.current) containerRef.current.style.height = vv.height + 'px';
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    onResize();
    return () => { vv.removeEventListener('resize', onResize); vv.removeEventListener('scroll', onResize); };
  }, []);

  const isEmpty = messages.length === 0;

  const surface  = isNight ? '#0d1117' : '#ffffff';
  const outerBg  = isNight ? '#08080F' : '#f9fafb';
  const border   = isNight ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const muted    = isNight ? 'rgba(255,255,255,0.35)' : '#9ca3af';
  const titleClr = isNight ? '#ffffff' : '#111827';
  const inputBg  = isNight ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const inputBdr = isNight ? 'rgba(255,255,255,0.10)' : '#d1d5db';

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

  const inputBox = (
    <div
      className="flex items-center gap-2 px-4 py-2.5 transition-all"
      style={{
        background: inputBg,
        border: `1px solid ${inputBdr}`,
        borderRadius: 999,
        boxShadow: isNight ? '0 0 0 1px rgba(255,255,255,0.04)' : '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={e => { setInput(e.target.value); autoResize(); }}
        onKeyDown={handleKey}
        placeholder='שאל כל דבר...'
        rows={1}
        className="flex-1 bg-transparent resize-none text-sm focus:outline-none leading-relaxed"
        style={{ color: titleClr, maxHeight: 120, scrollbarWidth: 'none' }}
      />
      <button
        onClick={() => send(input)}
        disabled={!input.trim() || loading}
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
        style={{
          background: input.trim() && !loading
            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
            : isNight ? 'rgba(255,255,255,0.06)' : '#e5e7eb',
        }}
      >
        {loading
          ? <Loader2 size={12} className="animate-spin" style={{ color: input.trim() ? '#fff' : muted }} />
          : <ArrowUp size={13} style={{ color: input.trim() && !loading ? '#fff' : muted }} />
        }
      </button>
    </div>
  );

  return (
    <div ref={containerRef} className="h-full flex flex-col overflow-hidden" dir="rtl" style={{ background: outerBg }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b shrink-0"
        style={{ background: surface, borderColor: border }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
            <Sparkles size={13} className="text-white" />
          </div>
          <span className="font-bold text-sm" style={{ color: titleClr }}>טורי</span>
          <span className="text-xs" style={{ color: muted }}>· {business?.name || 'העסק'}</span>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto relative">
        {isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="text-center mb-7"
            >
              <h2 className="font-bold text-base mb-1" style={{ color: titleClr }}>
                שלום, {business?.owner_name?.split(' ')[0] || 'בעל העסק'}
              </h2>
              <p className="text-xs" style={{ color: muted }}>
                במה אפשר לעזור?
              </p>
            </motion.div>

            <div style={{ width: '100%', maxWidth: 560 }}>
              {/* 3 action cards */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {ACTION_CARDS.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <motion.button
                      key={card.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + i * 0.06 }}
                      onClick={() => send(card.prompt)}
                      className="flex flex-col items-start gap-2 p-3 rounded-2xl border text-right transition-all"
                      style={{
                        background: inputBg,
                        borderColor: border,
                        cursor: 'pointer',
                      }}
                    >
                      <Icon size={16} style={{ color: muted }} />
                      <div>
                        <div className="text-xs font-bold leading-tight mb-0.5" style={{ color: titleClr }}>
                          {card.title}
                        </div>
                        <div className="text-[10px] leading-snug" style={{ color: muted }}>
                          {card.desc}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {inputBox}

              <p className="text-center text-[10px] mt-2" style={{ color: muted, opacity: 0.4 }}>
                Enter לשליחה · Shift+Enter לשורה חדשה
              </p>
            </div>
          </div>
        ) : (
          /* CHAT */
          <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`flex ${msg.role === 'user' ? 'justify-start flex-row-reverse' : 'justify-start'}`}
                >
                  {msg.role === 'user' ? (
                    /* User: simple gray bubble */
                    <div
                      className="max-w-[78%] px-3.5 py-2 text-sm leading-relaxed"
                      style={{
                        background: isNight ? 'rgba(255,255,255,0.08)' : '#f3f4f6',
                        color: isNight ? 'rgba(255,255,255,0.88)' : '#1f2937',
                        borderRadius: '16px 4px 16px 16px',
                      }}
                    >
                      {msg.content}
                    </div>
                  ) : (
                    /* Assistant: plain text, no bubble */
                    <div className="max-w-[84%] text-sm leading-relaxed" style={{ color: isNight ? 'rgba(255,255,255,0.75)' : '#374151' }}>
                      {msg.content.replace(/[■▪▸●►]/g, '•')}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing dots */}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5 items-center py-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: muted }}
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                  />
                ))}
              </motion.div>
            )}

            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Bottom bar (only during conversation) ──────────────────────────── */}
      <AnimatePresence>
        {!isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
            className="shrink-0 border-t px-4 py-3"
            style={{ background: surface, borderColor: border }}
          >
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              {inputBox}
              {/* New conversation button — accessible from bottom bar */}
              <div className="flex justify-center mt-2">
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full transition-all"
                  style={{ color: muted, background: 'transparent' }}
                >
                  <RotateCcw size={10} />
                  שיחה חדשה
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
