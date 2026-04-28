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
          {/* Wordmark */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span style={{
              fontFamily: 'Heebo, sans-serif',
              fontWeight: 900,
              fontSize: 56,
              letterSpacing: '-3px',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 45%, #065f46 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1,
            }}>
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
            <div className="loader" style={{ '--dot': '#16a34a', '--path': 'rgba(22,163,74,0.25)' }}>
              <svg viewBox="0 0 80 80"><circle r="32" cy="40" cx="40" /></svg>
            </div>
            <div className="loader triangle" style={{ '--dot': '#059669', '--path': 'rgba(5,150,105,0.25)' }}>
              <svg viewBox="0 0 86 80"><polygon points="43 8 79 72 7 72" /></svg>
            </div>
            <div className="loader" style={{ '--dot': '#065f46', '--path': 'rgba(6,95,70,0.25)' }}>
              <svg viewBox="0 0 80 80"><rect height="64" width="64" y="8" x="8" /></svg>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
