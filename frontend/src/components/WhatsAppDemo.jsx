import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_URL || 'https://tori-production.up.railway.app';

const INITIAL_MESSAGES = [
  { id: 1, role: 'assistant', text: 'שלום! 👋 אני טורי, הבוט של סלון יפעת.\nאשמח לקבוע לך תור, לענות על שאלות על השירותים שלנו ועוד.\nאיך אוכל לעזור? 😊', time: '10:32' },
];

function getTime() {
  return new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

function BotAvatar() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #25D366, #128C7E)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, color: 'white', fontWeight: 700,
    }}>ט</div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 4 }}>
      <BotAvatar />
      <div style={{
        background: '#fff',
        borderRadius: '8px 18px 18px 2px',
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
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'flex',
        flexDirection: isBot ? 'row' : 'row-reverse',
        alignItems: 'flex-end',
        gap: 6,
        marginBottom: 4,
      }}
    >
      {isBot && <BotAvatar />}
      <div style={{
        maxWidth: '72%',
        background: isBot ? '#fff' : '#dcf8c6',
        borderRadius: isBot ? '8px 18px 18px 2px' : '18px 8px 2px 18px',
        padding: '8px 12px 6px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.13)',
        position: 'relative',
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
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 3,
          marginTop: 2,
        }}>
          <span style={{ fontSize: 11, color: '#667781', lineHeight: 1 }}>{msg.time}</span>
          {!isBot && (
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
              <path d="M1 5.5L4.5 9L14 1" stroke="#53bdeb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 5.5L8.5 9" stroke="#53bdeb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg = { id: Date.now(), role: 'user', text, time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.text }));
      const res = await fetch(`${API_BASE}/api/demo-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: data.reply || 'אופס, נסה שוב 🙏',
        time: getTime(),
      }]);
    } catch {
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
      width: '100%', maxWidth: 380,
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      direction: 'rtl',
      userSelect: 'none',
    }}>
      {/* WhatsApp header */}
      <div style={{
        background: '#075e54',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, #25D366, #128C7E)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: 'white', fontWeight: 800, flexShrink: 0,
        }}>ט</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 15, lineHeight: 1.2 }}>סלון יפעת 💇‍♀️</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>מופעל על ידי TORI AI</div>
        </div>
        <div style={{ display: 'flex', gap: 18, color: 'rgba(255,255,255,0.85)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.47 11.47 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z"/></svg>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
        </div>
      </div>

      {/* Chat background */}
      <div style={{
        flex: 1,
        minHeight: 380,
        maxHeight: 380,
        overflowY: 'auto',
        padding: '12px 10px',
        background: '#efeae2',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M0 0h80v80H0z' fill='%23e5ddd5'/%3E%3Ccircle cx='20' cy='20' r='2' fill='%23d4ccc4' opacity='.4'/%3E%3Ccircle cx='60' cy='20' r='2' fill='%23d4ccc4' opacity='.4'/%3E%3Ccircle cx='20' cy='60' r='2' fill='%23d4ccc4' opacity='.4'/%3E%3Ccircle cx='60' cy='60' r='2' fill='%23d4ccc4' opacity='.4'/%3E%3Ccircle cx='40' cy='40' r='2' fill='%23d4ccc4' opacity='.4'/%3E%3C/svg%3E")`,
        direction: 'rtl',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: 12,
        }}>
          <span style={{
            background: 'rgba(11,20,26,0.55)', color: '#fff',
            fontSize: 11.5, padding: '4px 10px', borderRadius: 8, backdropFilter: 'blur(4px)',
          }}>היום</span>
        </div>

        {messages.map(msg => <Message key={msg.id} msg={msg} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        background: '#f0f2f5',
        padding: '8px 10px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button style={{
          width: 38, height: 38, borderRadius: '50%', border: 'none',
          background: 'none', cursor: 'pointer', color: '#54656f',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a5 5 0 100 10A5 5 0 0012 2zm0 8a3 3 0 110-6 3 3 0 010 6zm9 11a1 1 0 01-1 1H4a1 1 0 010-2 8 8 0 0116 0 1 1 0 011 1z"/></svg>
        </button>

        <div style={{
          flex: 1, background: '#fff', borderRadius: 24,
          display: 'flex', alignItems: 'center', padding: '6px 14px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
        }}>
          <textarea
            ref={inputRef}
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
          whileTap={{ scale: 0.9 }}
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          style={{
            width: 42, height: 42, borderRadius: '50%', border: 'none',
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
