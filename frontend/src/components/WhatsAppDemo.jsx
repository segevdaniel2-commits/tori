import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const INITIAL_MESSAGES = [
  { id: 1, role: 'assistant', text: 'היי, סלון יפעת. רוצה לקבוע תור או שיש משהו שאתה רוצה לדעת?', time: '10:32' },
];

function getTime() {
  return new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

function BotAvatar() {
  return (
    <img src="/favicon.png" alt="TORI" style={{
      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
      objectFit: 'cover',
    }} />
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 4, direction: 'ltr' }}>
      <BotAvatar />
      <div style={{
        background: '#fff',
        borderRadius: '2px 18px 18px 18px',
        padding: '10px 14px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.13)',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            style={{ width: 7, height: 7, borderRadius: '50%', background: '#90959a' }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        display: 'flex',
        flexDirection: isBot ? 'row' : 'row-reverse',
        alignItems: 'flex-end',
        gap: 6,
        marginBottom: 6,
        direction: 'ltr',
      }}
    >
      {isBot && <BotAvatar />}
      <div style={{
        maxWidth: '72%',
        background: isBot ? '#fff' : '#dcf8c6',
        borderRadius: isBot ? '2px 18px 18px 18px' : '18px 2px 18px 18px',
        padding: '8px 12px 5px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.13)',
      }}>
        <p style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.5,
          color: '#111b21',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          direction: 'rtl',
          textAlign: 'right',
        }}>{msg.text}</p>
        <div style={{
          display: 'flex',
          justifyContent: isBot ? 'flex-start' : 'flex-end',
          alignItems: 'center',
          gap: 3,
          marginTop: 2,
        }}>
          <span style={{ fontSize: 11, color: '#667781' }}>{msg.time}</span>
          {!isBot && (
            <svg width="15" height="11" viewBox="0 0 16 11" fill="none">
              <path d="M1 5.5L5 9.5L15 1.5" stroke="#53bdeb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5.5 5.5L9.5 9.5" stroke="#53bdeb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function WhatsAppDemo() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { id: Date.now(), role: 'user', text: msg, time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.text }));
      const res = await fetch(`${API_BASE}/demo-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: data.reply || 'אופס, נסה שוב 🙏',
        time: getTime(),
      }]);
    } catch (err) {
      console.error('[WhatsAppDemo]', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'אופס, משהו השתבש. נסה שוב 🙏',
        time: getTime(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <div style={{
      width: '100%', maxWidth: 390,
      borderRadius: 22,
      overflow: 'hidden',
      boxShadow: '0 28px 72px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.1)',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: '#075e54',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        direction: 'rtl',
      }}>
        <img src="/favicon.png" alt="TORI" style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0, objectFit: 'cover',
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>סלון יפעת</div>
          <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12 }}>מופעל על ידי TORI AI</div>
        </div>
        <div style={{ display: 'flex', gap: 16, color: 'rgba(255,255,255,0.85)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.47 11.47 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z"/></svg>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
        </div>
      </div>

      {/* Chat area */}
      <div ref={chatRef} style={{
        flex: 1,
        height: 400,
        overflowY: 'auto',
        padding: '12px 10px',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e5ddd5'/%3E%3Ccircle cx='25' cy='25' r='2.5' fill='%23d4ccc4' opacity='.5'/%3E%3Ccircle cx='75' cy='25' r='2.5' fill='%23d4ccc4' opacity='.5'/%3E%3Ccircle cx='25' cy='75' r='2.5' fill='%23d4ccc4' opacity='.5'/%3E%3Ccircle cx='75' cy='75' r='2.5' fill='%23d4ccc4' opacity='.5'/%3E%3Ccircle cx='50' cy='50' r='2.5' fill='%23d4ccc4' opacity='.5'/%3E%3C/svg%3E")`,
        direction: 'ltr',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <span style={{
            background: 'rgba(11,20,26,0.5)', color: '#fff',
            fontSize: 11.5, padding: '4px 10px', borderRadius: 7,
          }}>היום</span>
        </div>
        {messages.map(msg => <Message key={msg.id} msg={msg} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        background: '#f0f2f5',
        padding: '8px 10px',
        display: 'flex', alignItems: 'center', gap: 8,
        direction: 'ltr',
      }}>
        <div style={{
          flex: 1, background: '#fff', borderRadius: 24,
          display: 'flex', alignItems: 'center', padding: '7px 14px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="הקלד הודעה..."
            rows={1}
            style={{
              flex: 1, border: 'none', outline: 'none', resize: 'none',
              fontSize: 14, color: '#111b21', background: 'transparent',
              fontFamily: 'inherit', direction: 'rtl', textAlign: 'right',
              maxHeight: 80, overflowY: 'auto', lineHeight: 1.5,
            }}
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none',
            background: input.trim() && !loading ? '#25D366' : '#b0bec5',
            cursor: input.trim() && !loading ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.2s',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ transform: 'rotate(180deg)' }}>
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
