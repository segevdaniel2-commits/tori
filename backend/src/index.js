require('dotenv').config();

// ── Startup env validation ───────────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  console.warn('[Startup] JWT_SECRET not set — using fallback. Set it in environment variables!');
  process.env.JWT_SECRET = 'tori-super-secret-jwt-key-change-in-prod-2024-xK9mP2nQ';
}

if (!process.env.WHATSAPP_VERIFY_TOKEN) {
  console.warn('[Startup] WHATSAPP_VERIFY_TOKEN not set — WhatsApp webhook will be disabled.');
}

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const { init: initDb } = require('./config/database');
const { startScheduler } = require('./services/scheduler');
const { authLimiter, apiLimiter, webhookLimiter } = require('./middleware/rateLimiter');

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

  // Validate businessId is a positive integer before allowing room join
  io.on('connection', (socket) => {
    socket.on('join_business', (businessId) => {
      const id = parseInt(businessId, 10);
      if (!id || id <= 0 || !Number.isInteger(id)) return;
      socket.join(`business_${id}`);
    });
  });

  // Stripe webhook must use raw body, register before express.json()
  app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://api.qrserver.com'],
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
  app.use('/api/owner-bot', ownerBotRoutes);

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
