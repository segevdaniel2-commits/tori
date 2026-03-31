import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, RefreshCw, Info, Loader2, Trash2 } from 'lucide-react';
import api from '../../hooks/useApi';
import { useAuthStore } from '../../store/useStore';

function WhatsAppBubble({ msg }) {
  const isBot = msg.from === 'bot';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex"
      style={{ justifyContent: isBot ? 'flex-end' : 'flex-start' }}
    >
      <div
        className={`max-w-[78%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line shadow-sm ${
          isBot
            ? 'bg-[#005C4B] text-white rounded-2xl rounded-tr-sm'
            : 'bg-[#1F2C34] text-gray-100 border border-white/5 rounded-2xl rounded-tl-sm'
        }`}
      >
        {msg.text}
        {isBot && (
          <span className="block text-left text-[10px] text-teal-300/60 mt-1 leading-none">✓✓</span>
        )}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex" style={{ justifyContent: 'flex-end' }}>
      <div className="bg-[#1F2C34] border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BotSimulatorPage() {
  const { business } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `sim_${Date.now()}`);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-start greeting
  useEffect(() => {
    sendMessage('שלום', true);
  }, []);

  async function sendMessage(text, silent = false) {
    if (!text.trim() || loading) return;

    if (!silent) {
      setMessages(prev => [...prev, { id: Date.now(), from: 'user', text }]);
      setInput('');
    }

    setLoading(true);
    try {
      const { data } = await api.post('/whatsapp/simulate', {
        text,
        session_id: sessionId,
        business_id: business?.id,
      });
      if (data.reply) {
        setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bot', text: data.reply }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        from: 'bot',
        text: 'שגיאה בחיבור לבוט. ודא שה-GROQ_API_KEY מוגדר בשרת.',
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  async function resetSession() {
    try {
      await api.post('/whatsapp/simulate/reset', { session_id: sessionId, business_id: business?.id });
    } catch (_) {}
    setMessages([]);
    setTimeout(() => sendMessage('שלום', true), 100);
  }

  const QUICK_MSGS = ['אני רוצה לקבוע תור', 'מה השירותים שלכם?', 'מה המחירים?', 'מה שעות הפעילות?', 'לבטל תור'];

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-gray-900 text-xl">סימולטור בוט</h2>
          <p className="text-gray-500 text-sm mt-0.5">בדוק איך הבוט שלך מגיב ללקוחות</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full">
            <Info size={13} />
            מצב בדיקה — הודעות לא נשלחות בפועל
          </div>
          <button
            onClick={resetSession}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all"
          >
            <RefreshCw size={14} />
            אפס שיחה
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Chat window */}
        <div className="flex-1 flex flex-col min-h-0 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          {/* WhatsApp top bar */}
          <div
            className="px-4 py-3 flex items-center gap-3 shrink-0"
            style={{ background: '#1F2C34' }}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shrink-0">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm">{business?.name || 'הבוט שלך'}</div>
              <div className="text-green-400 text-xs">מחובר · Tori Bot</div>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{ background: '#0B141A' }}
          >
            {messages.length === 0 && !loading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Bot size={36} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">השיחה תתחיל מיד...</p>
                </div>
              </div>
            )}
            {messages.map(msg => (
              <WhatsAppBubble key={msg.id} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          <div
            className="px-3 py-2 flex gap-2 overflow-x-auto shrink-0 border-t border-white/5"
            style={{ background: '#1F2C34' }}
          >
            {QUICK_MSGS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={loading}
                className="shrink-0 text-xs bg-white/10 hover:bg-white/20 text-white/80 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap disabled:opacity-40"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div
            className="px-3 py-3 flex items-end gap-2 shrink-0"
            style={{ background: '#1F2C34' }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={1}
              placeholder="הקלד הודעה..."
              className="flex-1 bg-[#2A3942] text-white text-sm placeholder-gray-500 rounded-xl px-4 py-2.5 resize-none focus:outline-none border border-white/5"
              style={{ maxHeight: 100 }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-[#005C4B] hover:bg-[#017561] text-white rounded-full flex items-center justify-center shrink-0 transition-colors disabled:opacity-40"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} style={{ transform: 'scaleX(-1)' }} />}
            </button>
          </div>
        </div>

        {/* Info panel — hidden on mobile */}
        <div className="hidden lg:block lg:w-64 shrink-0 space-y-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <h4 className="font-bold text-gray-900 text-sm mb-3">מה הבוט יודע לעשות</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {[
                '✅ לקבוע תורים בשפה טבעית',
                '✅ לבדוק שעות פנויות',
                '✅ לספר על שירותים ומחירים',
                '✅ לבטל תורים',
                '✅ לזהות תאריכים בעברית',
                '✅ לשלוח אישור הזמנה',
              ].map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <h4 className="font-bold text-amber-800 text-sm mb-2">הערות</h4>
            <p className="text-amber-700 text-xs leading-relaxed">
              בסימולטור הבוט פועל כאילו כל שיחה מגיעה ממספר ייחודי.
              תורים שנקבעים כאן נשמרים ממש ביומן שלך.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <h4 className="font-bold text-gray-900 text-sm mb-3">דוגמאות לניסוי</h4>
            <ul className="space-y-1.5 text-xs text-gray-500">
              {[
                '"אני רוצה תספורת מחר"',
                '"מה פנוי בשישי?"',
                '"תקבע לי ל-16:00"',
                '"תבטל את התור שלי"',
                '"כמה עולה תספורת?"',
              ].map(ex => (
                <li key={ex} className="font-mono bg-gray-50 rounded-lg px-2 py-1">{ex}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
