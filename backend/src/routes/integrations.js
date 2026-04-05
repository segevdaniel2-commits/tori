const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const authMiddleware = require('../middleware/auth');
const { getDb } = require('../config/database');

// ─── OAuth2 client (no auth middleware — callback is public) ──────────────────
function makeOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// ─── Fallback phone extractor (regex) ────────────────────────────────────────
function extractPhoneRegex(text) {
  if (!text) return null;
  const match = text.match(/0(5[0-9]|[2-9][0-9])[- ]?\d{3}[- ]?\d{4}/);
  return match ? match[0].replace(/[- ]/g, '') : null;
}

// ─── AI-powered event parser (Groq) ──────────────────────────────────────────
// Sends up to 20 events per call to minimize API requests
async function parseEventsWithAI(events) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return null;

  const eventsText = events.map((e, i) =>
    `[${i}] כותרת: "${e.summary || ''}" | תיאור: "${(e.description || '').slice(0, 200)}" | מיקום: "${e.location || ''}"`
  ).join('\n');

  const prompt = `אתה עוזר שמנתח אירועי יומן גוגל של עסקים ישראליים (ספרים, מספרות, קוסמטיקה וכו').

לכל אירוע חלץ:
- customerName: שם הלקוח (אם אין — "לקוח")
- serviceName: סוג השירות (תספורת, צבע, פן, גוונים, ריסים, ציפורניים וכו') — null אם לא ברור
- phone: מספר טלפון ישראלי בפורמט 05X-XXXXXXX — null אם אין

החזר JSON בלבד, מערך בסדר מדויק לפי הסדר שקיבלת:
[{"customerName":"...","serviceName":"...","phone":"..."},...]

האירועים:
${eventsText}`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content || '[]';
    // model might return {"results":[...]} or just [...]
    const parsed = JSON.parse(text);
    const arr = Array.isArray(parsed) ? parsed : (parsed.results || parsed[Object.keys(parsed)[0]] || []);
    return arr;
  } catch (err) {
    console.error('[Google Sync] AI parse error:', err.message);
    return null;
  }
}

// ─── Fallback parser (no AI) ──────────────────────────────────────────────────
function parseSummaryFallback(summary, description, location) {
  const phone = extractPhoneRegex(description) || extractPhoneRegex(location);
  if (!summary) return { customerName: 'לקוח', serviceName: null, phone };
  const parts = summary.split(/[-–|·,]/);
  if (parts.length >= 2) {
    return { customerName: parts[0].trim(), serviceName: parts[1].trim() || null, phone };
  }
  return { customerName: summary.trim(), serviceName: null, phone };
}

// ─── Core sync logic ──────────────────────────────────────────────────────────
async function syncGoogleCalendar(businessId, refreshToken) {
  const db = getDb();
  const oauth2Client = makeOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const oneMonthAhead = new Date(now);
  oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 1);

  // Fetch all events in range
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: threeMonthsAgo.toISOString(),
    timeMax: oneMonthAhead.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 500,
  });

  const allEvents = (response.data.items || []).filter(
    e => e.status !== 'cancelled' && (e.start?.dateTime || e.start?.date)
  );
  const todayStr = now.toISOString().split('T')[0];
  console.log(`[Google Sync] Fetched ${allEvents.length} events, today=${todayStr}`);

  // ── AI parse in batches of 20 ─────────────────────────────────────────────
  const BATCH = 20;
  const parsedMap = [];
  for (let i = 0; i < allEvents.length; i += BATCH) {
    const batch = allEvents.slice(i, i + BATCH);
    const aiResults = await parseEventsWithAI(batch);
    if (aiResults && aiResults.length === batch.length) {
      parsedMap.push(...aiResults);
    } else {
      // Fallback for this batch
      batch.forEach(e => parsedMap.push(
        parseSummaryFallback(e.summary, e.description, e.location)
      ));
    }
  }

  let customersCreated = 0;
  let appointmentsCreated = 0;

  for (let idx = 0; idx < allEvents.length; idx++) {
    const event = allEvents[idx];
    const parsed = parsedMap[idx] || {};

    const startRaw = event.start.dateTime || `${event.start.date}T09:00:00`;
    const endRaw   = event.end?.dateTime   || `${event.end?.date}T10:00:00`;
    const startDate = startRaw.split('T')[0];

    const customerName = parsed.customerName || 'לקוח';
    const serviceName  = parsed.serviceName  || null;
    const phone = parsed.phone
      ? String(parsed.phone).replace(/[- ]/g, '')
      : extractPhoneRegex(event.description) || extractPhoneRegex(event.location);

    // ── Create/find customer if phone exists ──────────────────────────────────
    let customerId = null;
    if (phone) {
      const existing = db.prepare(
        'SELECT id FROM customers WHERE business_id = ? AND whatsapp_phone = ?'
      ).get(businessId, phone);

      if (existing) {
        customerId = existing.id;
      } else {
        const res = db.prepare(
          `INSERT INTO customers (business_id, name, whatsapp_phone, source)
           VALUES (?, ?, ?, 'google_calendar')`
        ).run(businessId, customerName, phone);
        customerId = res.lastInsertRowid;
        customersCreated++;
      }
    } else {
      // No phone — still create customer record (name only)
      const existing = db.prepare(
        'SELECT id FROM customers WHERE business_id = ? AND name = ? AND whatsapp_phone LIKE ?'
      ).get(businessId, customerName, 'gcal_%');

      if (existing) {
        customerId = existing.id;
      } else {
        const res = db.prepare(
          `INSERT INTO customers (business_id, name, whatsapp_phone, source)
           VALUES (?, ?, ?, 'google_calendar')`
        ).run(businessId, customerName, `gcal_${event.id}`);
        customerId = res.lastInsertRowid;
      }
    }

    // ── Create appointment only for today and future ──────────────────────────
    console.log(`[Google Sync] Event: "${event.summary}" startDate=${startDate} customerId=${customerId}`);
    if (startDate >= todayStr && customerId) {
      let alreadyExists = null;
      try {
        alreadyExists = db.prepare(
          `SELECT id FROM appointments WHERE business_id = ? AND (google_event_id = ? OR (customer_id = ? AND starts_at = ?))`
        ).get(businessId, event.id, customerId, startRaw);
      } catch (_) {
        alreadyExists = db.prepare(
          `SELECT id FROM appointments WHERE business_id = ? AND customer_id = ? AND starts_at = ?`
        ).get(businessId, customerId, startRaw);
      }

      if (!alreadyExists) {
        // Find matching service by name
        let serviceId = null;
        if (serviceName) {
          const svc = db.prepare(
            `SELECT id FROM services WHERE business_id = ? AND name LIKE ?`
          ).get(businessId, `%${serviceName}%`);
          if (svc) serviceId = svc.id;
        }

        // Find first staff (owner)
        const owner = db.prepare(
          `SELECT id FROM staff WHERE business_id = ? ORDER BY id LIMIT 1`
        ).get(businessId);

        try {
          db.prepare(
            `INSERT INTO appointments
               (business_id, customer_id, staff_id, service_id, google_event_id, starts_at, ends_at, status, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)`
          ).run(
            businessId,
            customerId,
            owner?.id || null,
            serviceId,
            event.id,
            startRaw,
            endRaw,
            event.description ? event.description.slice(0, 200) : null
          );
          appointmentsCreated++;
          console.log(`[Google Sync] Created appointment for ${customerName} at ${startRaw}`);
        } catch (insertErr) {
          console.error(`[Google Sync] Failed to insert appointment: ${insertErr.message}`);
        }
      }
    }
  }

  // Mark sync time
  db.prepare(
    `UPDATE businesses SET google_calendar_synced_at = datetime('now') WHERE id = ?`
  ).run(businessId);

  return { events: allEvents.length, customersCreated, appointmentsCreated };
}

// ─── GET /api/integrations/status ─────────────────────────────────────────────
router.get('/status', authMiddleware, (req, res) => {
  const db = getDb();
  const biz = db.prepare(
    'SELECT google_refresh_token, google_calendar_synced_at FROM businesses WHERE id = ?'
  ).get(req.business.id);

  const wa = !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
  let waPhone = null;
  if (wa && process.env.WHATSAPP_PHONE_ID) {
    const raw = String(process.env.WHATSAPP_PHONE_ID).replace(/\D/g, '');
    waPhone = raw.startsWith('972')
      ? `+972 ${raw.slice(3, 5)}-${raw.slice(5, 8)}-${raw.slice(8)}`
      : `+${raw}`;
  }

  res.json({
    whatsapp: { connected: wa, phone: waPhone },
    stripe:   { connected: !!(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')) },
    groq:     { connected: !!process.env.GROQ_API_KEY },
    email:    { connected: !!process.env.RESEND_API_KEY },
    google_calendar: {
      connected: !!biz?.google_refresh_token,
      synced_at: biz?.google_calendar_synced_at || null,
    },
  });
});

// ─── GET /api/integrations/google/auth  (protected) ──────────────────────────
router.get('/google/auth', authMiddleware, (req, res) => {
  try {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: 'Google integration not configured' });
  }
  const oauth2Client = makeOAuth2Client();
  // Store businessId in state param (base64) so we get it back in callback
  const state = Buffer.from(JSON.stringify({
    businessId: req.business.id,
  })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    state,
  });
  res.json({ url });
  } catch (err) {
    console.error('[Google Auth] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/integrations/google/callback  (public — Google redirects here) ──
router.get('/google/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

  if (error || !code || !state) {
    return res.redirect(`${CLIENT_URL}/dashboard/settings?tab=integrations&google=error`);
  }

  try {
    const { businessId } = JSON.parse(Buffer.from(state.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    const oauth2Client = makeOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return res.redirect(`${CLIENT_URL}/dashboard/settings?tab=integrations&google=no_refresh_token`);
    }

    const db = getDb();
    db.prepare(
      `UPDATE businesses SET google_refresh_token = ? WHERE id = ?`
    ).run(tokens.refresh_token, businessId);

    // Run sync immediately
    oauth2Client.setCredentials(tokens);
    const result = await syncGoogleCalendar(businessId, tokens.refresh_token);

    return res.redirect(
      `${CLIENT_URL}/dashboard/settings?tab=integrations&google=success` +
      `&imported=${result.appointmentsCreated}&customers=${result.customersCreated}`
    );
  } catch (err) {
    console.error('[Google Calendar] Callback error:', err);
    return res.redirect(`${CLIENT_URL}/dashboard/settings?tab=integrations&google=error`);
  }
});

// ─── POST /api/integrations/google/sync  (manual re-sync) ────────────────────
router.post('/google/sync', authMiddleware, async (req, res) => {
  const db = getDb();
  const biz = db.prepare(
    'SELECT google_refresh_token FROM businesses WHERE id = ?'
  ).get(req.business.id);

  if (!biz?.google_refresh_token) {
    return res.status(400).json({ error: 'Google Calendar not connected' });
  }

  try {
    const result = await syncGoogleCalendar(req.business.id, biz.google_refresh_token);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Google Calendar] Sync error:', err);
    res.status(500).json({ error: 'Sync failed', details: err.message });
  }
});

// ─── DELETE /api/integrations/google  (disconnect) ───────────────────────────
router.delete('/google', authMiddleware, (req, res) => {
  const db = getDb();
  db.prepare(
    `UPDATE businesses SET google_refresh_token = NULL, google_calendar_synced_at = NULL WHERE id = ?`
  ).run(req.business.id);
  res.json({ success: true });
});

module.exports = router;
