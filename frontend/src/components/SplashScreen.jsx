import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
    }, 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 32,
            background: '#f8f6f2',
          }}
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 16,
              background: 'linear-gradient(135deg, #f97316, #f43f5e, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 28px rgba(249,115,22,0.35)',
            }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: 22, fontFamily: 'Inter, sans-serif' }}>T</span>
            </div>
            <span style={{ fontWeight: 900, fontSize: 32, color: '#18120a', fontFamily: 'Heebo, sans-serif', letterSpacing: '-1px' }}>
              TORI
            </span>
          </motion.div>

          {/* Loaders */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{ display: 'flex', alignItems: 'center', gap: 24 }}
          >
            <div className="loader" style={{ '--dot': '#f97316', '--path': 'rgba(249,115,22,0.25)' }}>
              <svg viewBox="0 0 80 80"><circle r="32" cy="40" cx="40" /></svg>
            </div>
            <div className="loader triangle" style={{ '--dot': '#f43f5e', '--path': 'rgba(244,63,94,0.25)' }}>
              <svg viewBox="0 0 86 80"><polygon points="43 8 79 72 7 72" /></svg>
            </div>
            <div className="loader" style={{ '--dot': '#06b6d4', '--path': 'rgba(6,182,212,0.25)' }}>
              <svg viewBox="0 0 80 80"><rect height="64" width="64" y="8" x="8" /></svg>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
