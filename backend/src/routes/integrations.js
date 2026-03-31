const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

/**
 * GET /api/integrations/status
 * Returns which external services are configured (keys present), without exposing secrets.
 */
router.get('/status', (req, res) => {
  const wa = !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);

  // Format phone for display: e.g. 972501234567 → +972 50-123-4567
  let waPhone = null;
  if (wa && process.env.WHATSAPP_PHONE_ID) {
    const raw = String(process.env.WHATSAPP_PHONE_ID).replace(/\D/g, '');
    waPhone = raw.startsWith('972')
      ? `+972 ${raw.slice(3, 5)}-${raw.slice(5, 8)}-${raw.slice(8)}`
      : `+${raw}`;
  }

  res.json({
    whatsapp: {
      connected: wa,
      phone: waPhone,
      phone_id: wa ? process.env.WHATSAPP_PHONE_ID : null,
    },
    stripe: {
      connected: !!(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')),
      publishable_key_set: !!process.env.STRIPE_PUBLISHABLE_KEY,
    },
    groq: {
      connected: !!process.env.GROQ_API_KEY,
    },
    email: {
      connected: !!process.env.RESEND_API_KEY,
      from: process.env.FROM_EMAIL || null,
    },
  });
});

module.exports = router;
