const rateLimit = require('express-rate-limit');

// Strict limiter for auth endpoints (login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'יותר מדי ניסיונות, נסה שוב בעוד 15 דקות' },
  skipSuccessfulRequests: true, // only count failures
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'יותר מדי בקשות, נסה שוב בעוד דקה' },
});

// WhatsApp webhook limiter (Meta sends bursts; allow more but still cap)
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded' },
});

// Owner Bot limiter — AI calls cost money; cap per business (by JWT is handled in middleware,
// here we limit by IP as a secondary layer)
const ownerBotLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'יותר מדי שאלות, נסה שוב בעוד דקה' },
  skipSuccessfulRequests: false,
});

// 2FA verify limiter — 5 attempts per 10 minutes, never skip
const twoFaLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'יותר מדי ניסיונות אימות, נסה שוב בעוד 10 דקות' },
  skipSuccessfulRequests: false,
});

// Admin reset limiter — very strict: 3 attempts per hour, count everything
const adminResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'יותר מדי ניסיונות, נסה שוב בעוד שעה' },
  skipSuccessfulRequests: false, // count all requests, not just failures
});

module.exports = { authLimiter, apiLimiter, webhookLimiter, ownerBotLimiter, adminResetLimiter, twoFaLimiter };
