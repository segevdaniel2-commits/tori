require('dotenv').config();

// ── Startup env validation ───────────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[Startup] FATAL: JWT_SECRET not set in production. Exiting.');
    process.exit(1);
  }
  console.warn('[Startup] JWT_SECRET not set — using dev-only fallback. NEVER do this in production!');
  process.env.JWT_SECRET = 'dev-only-fallback-change-me';
}

if (!process.env.WHATSAPP_VERIFY_TOKEN) {
  console.warn('[Startup] WHATSAPP_VERIFY_TOKEN not set — WhatsApp webhook will be disabled.');
}

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');

const { init: initDb } = require('./config/database');
const { startScheduler } = require('./services/scheduler');
const { authLimiter, apiLimiter, webhookLimiter, ownerBotLimiter, adminResetLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/businesses');
const appointmentRoutes = require('./routes/appointments');
const customerRoutes = require('./routes/customers');
const analyticsRoutes = require('./routes/analytics');
const whatsappRoutes = require('./routes/whatsapp');
const stripeRoutes = require('./routes/stripe');
const integrationsRoutes = require('./routes/integrations');
const calendarRoutes = require('./routes/calendar');
const ownerBotRoutes = require('./routes/ownerBot');
const demoChatRoutes = require('./routes/demoChat');

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

initDb().then(() => {
  const app = express();
  app.set('trust proxy', 1);
  const server = http.createServer(app);

  // Socket.io with CORS locked to client origin
  const io = new Server(server, {
    cors: {
      origin: CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  app.set('io', io);

  // Authenticate Socket.io connections via httpOnly cookie
  io.use((socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || '');
      const token = cookies.tori_token;
      if (!token || token.length > 512) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      const businessId = parseInt(payload.businessId, 10);
      if (!businessId || businessId <= 0) return next(new Error('Invalid token'));
      socket.businessId = businessId;
      next();
    } catch {
      next(new Error('Authentication required'));
    }
  });

  // Only allow joining your own business room
  io.on('connection', (socket) => {
    socket.on('join_business', (businessId) => {
      const id = parseInt(businessId, 10);
      if (!id || id <= 0 || !Number.isInteger(id)) return;
      if (id !== socket.businessId) return; // IDOR guard
      socket.join(`business_${id}`);
    });
  });

  // Stripe webhook must use raw body, register before express.json()
  app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

  // WhatsApp webhook must also use raw body for signature verification
  app.use('/api/whatsapp/webhook', express.raw({ type: 'application/json' }));
  app.use('/webhook/webhook', express.raw({ type: 'application/json' }));

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'], // no unsafe-inline
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'https://api.qrserver.com'], // removed data: URI (not needed on API backend)
        connectSrc: ["'self'", CLIENT_URL],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permittedCrossDomainPolicies: false,
    crossOriginEmbedderPolicy: false,
  }));

  // ── CORS ─────────────────────────────────────────────────────────────────────
  app.use(cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(cookieParser());
  app.use(compression());

  // Use 'combined' (not 'dev') to avoid verbose output in production
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Body size limits (small — no reason for 10mb on this API)
  app.use(express.json({ limit: '512kb' }));
  app.use(express.urlencoded({ extended: false, limit: '64kb' }));

  // ── Rate limiting ─────────────────────────────────────────────────────────────
  app.use('/api/', apiLimiter);
  app.use('/webhook', webhookLimiter);

  // ── Health check ──────────────────────────────────────────────────────────────
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Routes ─────────────────────────────────────────────────────────────────────
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/businesses', businessRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/whatsapp', whatsappRoutes);
  app.use('/api/stripe', stripeRoutes);
  app.use('/api/integrations', integrationsRoutes);
  app.use('/api/calendar', calendarRoutes);
  app.use('/api/owner-bot', ownerBotLimiter, ownerBotRoutes);
  app.use('/api/demo-chat', demoChatRoutes);

  // WhatsApp webhook also accessible at root /webhook
  app.use('/webhook', whatsappRoutes);

  // 404 handler — no internal info leaked
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Global error handler — never expose stack traces
  app.use((err, req, res, next) => {
    console.error('[Server] Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  server.listen(PORT, () => {
    console.log(`\nTori Backend: http://localhost:${PORT}`);
    startScheduler();
  });

  process.on('SIGTERM', () => server.close(() => process.exit(0)));
  process.on('SIGINT', () => server.close(() => process.exit(0)));

}).catch((err) => {
  console.error('Failed to initialize DB:', err);
  process.exit(1);
});
