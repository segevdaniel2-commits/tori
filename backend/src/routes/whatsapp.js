const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { processMessage } = require('../services/ai-agent');
const { getDb } = require('../config/database');
const axios = require('axios');

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'tori-verify-2024-xR7vN4kL';
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;
const FormData = require('form-data');

// ─── Message deduplication ────────────────────────────────────────────────────
const processedMessageIds = new Set();
const DEDUP_MAX = 5000; // keep at most 5000 IDs before clearing the oldest half
function isDuplicate(msgId) {
  if (!msgId) return false;
  if (processedMessageIds.has(msgId)) return true;
  processedMessageIds.add(msgId);
  if (processedMessageIds.size > DEDUP_MAX) {
    const entries = [...processedMessageIds];
    entries.slice(0, DEDUP_MAX / 2).forEach(id => processedMessageIds.delete(id));
  }
  return false;
}

// ─── Whisper transcription via Groq ──────────────────────────────────────────
async function transcribeAudio(mediaId) {
  const token = process.env.WHATSAPP_TOKEN || process.env.WA_TOKEN_FALLBACK;
  const groqKey = process.env.GROQ_API_KEY;
  if (!token || !groqKey) return null;

  try {
    // 1. Get media URL from WhatsApp
    const mediaRes = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    const mediaUrl = mediaRes.data?.url;
    if (!mediaUrl) return null;

    // 2. Download audio
    const audioRes = await axios.get(mediaUrl, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    // 3. Send to Groq Whisper
    const form = new FormData();
    form.append('file', Buffer.from(audioRes.data), { filename: 'audio.ogg', contentType: 'audio/ogg' });
    form.append('model', 'whisper-large-v3');
    form.append('language', 'he');
    form.append('response_format', 'text');
    form.append('prompt', 'שיחה בעברית ישראלית. הלקוח מדבר על קביעת תור לספר, תספורת, גוונים, צבע, פן, ג\'ל, ריסים, עיסוי, קוסמטיקה. מילים נפוצות: תור, שלום, רוצה, מתי, שעה, יום, ראשון, שני, שלישי, רביעי, חמישי, שישי, מחר, היום, שעה, בוקר, צהריים, ערב.');

    const whisperRes = await axios.post(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      form,
      { headers: { ...form.getHeaders(), Authorization: `Bearer ${groqKey}` }, timeout: 30000 }
    );
    return typeof whisperRes.data === 'string' ? whisperRes.data.trim() : null;
  } catch (err) {
    console.error('[Whisper] Transcription error:', err.response?.data || err.message);
    return null;
  }
}

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
          if (isDuplicate(message.id)) continue;

          const phone = message.from;
          let text = '';

          if (message.type === 'text') {
            text = message.text?.body || '';
          } else if (message.type === 'audio') {
            const mediaId = message.audio?.id;
            if (mediaId) {
              const transcribed = await transcribeAudio(mediaId);
              if (transcribed) {
                text = transcribed;
                console.log(`[WhatsApp] Audio transcribed for ${phone}: ${text.slice(0, 80)}`);
              } else {
                await sendWhatsAppMessage(phone, 'לא הצלחתי לשמוע את ההקלטה. תוכל לכתוב?');
                continue;
              }
            } else continue;
          } else {
            continue;
          }

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
  const phoneId = process.env.WHATSAPP_PHONE_ID || '1064513836752035';
  const token = process.env.WHATSAPP_TOKEN || process.env.WA_TOKEN_FALLBACK;

  if (!phoneId || !token) {
    console.log(`[WhatsApp] DEV MODE - Would send to ${to}: ${text.slice(0, 80)}`);
    return;
  }

  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
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
