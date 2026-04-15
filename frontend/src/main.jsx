import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

// ─── Global error boundary ────────────────────────────────────────────────────
// Catches any render-time crash and shows a Hebrew fallback instead of
// a blank black screen. Especially important for WebGL / Three.js failures
// on mobile devices where the GPU context may not be available.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#08080F', color: '#f9f9f9',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          minHeight: '100dvh', padding: 24, textAlign: 'center',
          fontFamily: "'Heebo', sans-serif",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, marginBottom: 20,
            background: 'linear-gradient(135deg,#f97316,#f43f5e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 900, color: '#fff',
          }}>T</div>
          <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>משהו השתבש</p>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>
            אירעה שגיאה בטעינת הדף. אנא רענן.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 28px', borderRadius: 14,
              background: 'linear-gradient(135deg,#f97316,#f43f5e)',
              color: '#fff', border: 'none', fontSize: 15,
              fontWeight: 700, cursor: 'pointer',
            }}
          >
            רענן דף
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
