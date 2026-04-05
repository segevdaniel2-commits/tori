const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { processMessage } = require('../services/ai-agent');
const { getDb } = require('../config/database');
const axios = require('axios');

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET; // Meta App Secret for signature verification

// Verify Meta's X-Hub-Signature-256 header
function verifyMetaSignature(req) {
  if (!APP_SECRET) return true; // skip in dev if not configured (warn at startup)
  const sig = req.headers['x-hub-signature-256'];
  if (!sig) return false;
  const expected = 'sha256=' + crypto
    .createHmac('sha256', APP_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

// GET /webhook: Meta verification challenge
router.get('/webhook', (req, res) => {
  if (!VERIFY_TOKEN) {
    console.warn('[WhatsApp] WHATSAPP_VERIFY_TOKEN not set, rejecting verification');
    return res.status(403).json({ error: 'Webhook not configured' });
  }
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ error: 'Forbidden' });
});

// POST /webhook: incoming messages
router.post('/webhook', async (req, res) => {
  // Verify Meta signature before processing
  if (!verifyMetaSignature(req)) {
    console.warn('[WhatsApp] Invalid signature on webhook request');
    return res.status(403).json({ error: 'Invalid signature' });
  }

  // Always respond 200 quickly to Meta
  res.status(200).json({ status: 'ok' });

  try {
    const body = req.body;
    if (!body.object || body.object !== 'whatsapp_business_account') return;

    for (const entry of (body.entry || [])) {
      for (const change of (entry.changes || [])) {
        if (change.field !== 'messages') continue;
        const value = change.value;
        if (!value.messages || !value.messages.length) continue;

        for (const message of value.messages) {
          if (message.type !== 'text') continue;

          const phone = message.from;
          const text = message.text?.body || '';

          // Validate phone (digits only, 7–15 chars per E.164)
          if (!/^\d{7,15}$/.test(phone)) continue;
          if (!text.trim() || text.length > 4000) continue;

          // Log inbound message (truncated to prevent log injection)
          try {
            const db = getDb();
            const assoc = db.prepare('SELECT * FROM customer_associations WHERE whatsapp_phone = ?').get(phone);
            const businessId = assoc ? assoc.business_id : null;
            db.prepare('INSERT INTO message_logs (business_id, whatsapp_phone, direction, content) VALUES (?, ?, ?, ?)').run(businessId, phone, 'inbound', text.slice(0, 500));
          } catch (e) { /* non-critical */ }

          const reply = await processMessage(phone, text, req.app.get('io'));

          if (reply) {
            await sendWhatsAppMessage(phone, reply);

            try {
              const db = getDb();
              const assoc = db.prepare('SELECT * FROM customer_associations WHERE whatsapp_phone = ?').get(phone);
              const businessId = assoc ? assoc.business_id : null;
              db.prepare('INSERT INTO message_logs (business_id, whatsapp_phone, direction, content) VALUES (?, ?, ?, ?)').run(businessId, phone, 'outbound', reply.slice(0, 500));
            } catch (e) { /* non-critical */ }
          }
        }
      }
    }
  } catch (err) {
    console.error('[WhatsApp] Webhook processing error:', err.message);
  }
});

async function sendWhatsAppMessage(to, text) {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_TOKEN;

  if (!phoneId || !token) {
    console.log(`[WhatsApp] DEV MODE - Would send to ${to}: ${text.slice(0, 80)}`);
    return;
  }

  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(phoneId)}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
  } catch (err) {
    console.error('[WhatsApp] Send error:', err.response?.status || err.message);
  }
}

// POST /api/whatsapp/simulate — dashboard bot simulator (auth required)
const authMiddleware = require('../middleware/auth');

router.post('/simulate', authMiddleware, async (req, res) => {
  const { text, session_id } = req.body;
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required' });

  // Fixed fake phone per business — one simulator customer per business, no accumulation
  const fakePhone = `999${String(req.business.id).padStart(9, '0')}`;

  try {
    // Pre-lock the fake phone to this specific business so the bot skips
    // the business-selection stage and talks directly as this business's bot
    const db = getDb();
    db.prepare(
      'INSERT OR IGNORE INTO customer_associations (whatsapp_phone, business_id) VALUES (?, ?)'
    ).run(fakePhone, req.business.id);
    db.prepare(
      'INSERT OR IGNORE INTO customers (business_id, whatsapp_phone) VALUES (?, ?)'
    ).run(req.business.id, fakePhone);

    const reply = await processMessage(fakePhone, text.slice(0, 1000), req.app.get('io'));
    res.json({ reply: reply || null });
  } catch (err) {
    console.error('[Simulate] Error:', err.message);
    res.status(500).json({ error: 'Bot error', detail: err.message });
  }
});

router.post('/simulate/reset', authMiddleware, async (req, res) => {
  try {
    const { getDb } = require('../config/database');
    const db = getDb();
    // Delete ALL simulator phones for this business (pattern 999...)
    db.prepare("DELETE FROM conversations WHERE whatsapp_phone LIKE '999%'").run();
    db.prepare("DELETE FROM customer_associations WHERE whatsapp_phone LIKE '999%'").run();
    db.prepare("DELETE FROM customers WHERE business_id = ? AND whatsapp_phone LIKE '999%'").run(req.business.id);
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false });
  }
});

module.exports = router;
module.exports.sendWhatsAppMessage = sendWhatsAppMessage;
