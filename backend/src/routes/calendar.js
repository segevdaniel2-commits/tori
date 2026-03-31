const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getDb } = require('../config/database');
const axios = require('axios');

router.use(authMiddleware);

// ─── Simple iCal parser ───────────────────────────────────────────────────────

function parseICalDate(raw) {
  if (!raw) return null;
  // Strip TZID prefix if present: "TZID=Asia/Jerusalem:20240101T100000"
  const val = raw.includes(':') ? raw.split(':').slice(1).join(':') : raw;
  const clean = val.replace(/Z$/, '');

  if (clean.length === 8) {
    // Date only: 20240101
    return `${clean.slice(0,4)}-${clean.slice(4,6)}-${clean.slice(6,8)}T00:00:00`;
  }
  if (clean.length >= 15) {
    // Datetime: 20240101T100000
    const y = clean.slice(0,4), mo = clean.slice(4,6), d = clean.slice(6,8);
    const h = clean.slice(9,11), mi = clean.slice(11,13);
    return `${y}-${mo}-${d}T${h}:${mi}:00`;
  }
  return null;
}

function parseICal(text) {
  const events = [];

  // Normalize line endings and unfold continuation lines
  const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = [];
  for (const line of raw.split('\n')) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }

  let inEvent = false;
  let cur = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'BEGIN:VEVENT') { inEvent = true; cur = {}; continue; }
    if (trimmed === 'END:VEVENT') {
      if (cur.DTSTART) events.push(cur);
      inEvent = false; continue;
    }
    if (!inEvent) continue;

    const colon = trimmed.indexOf(':');
    if (colon < 0) continue;

    const rawKey = trimmed.slice(0, colon);
    const value = trimmed.slice(colon + 1)
      .replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');

    const semi = rawKey.indexOf(';');
    const key = semi >= 0 ? rawKey.slice(0, semi) : rawKey;
    const params = semi >= 0 ? rawKey.slice(semi + 1) : '';

    if (key === 'DTSTART') cur.DTSTART = params ? `${params}:${value}` : value;
    else if (key === 'DTEND') cur.DTEND = params ? `${params}:${value}` : value;
    else if (key === 'DURATION') cur.DURATION = value;
    else if (key === 'SUMMARY') cur.SUMMARY = value;
    else if (key === 'DESCRIPTION') cur.DESCRIPTION = value;
    else if (key === 'STATUS') cur.STATUS = value;
  }

  return events;
}

// ─── POST /api/calendar/import ────────────────────────────────────────────────

router.post('/import', async (req, res) => {
  const { ical_url } = req.body;
  if (!ical_url || typeof ical_url !== 'string') {
    return res.status(400).json({ error: 'ical_url required' });
  }

  // Validate URL
  let url;
  try {
    url = new URL(ical_url.trim());
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('bad protocol');
  } catch {
    return res.status(400).json({ error: 'כתובת URL לא תקינה' });
  }

  // Fetch iCal
  let icalText;
  try {
    const response = await axios.get(url.href, {
      timeout: 20000,
      maxContentLength: 3 * 1024 * 1024,
      headers: { 'User-Agent': 'Tori-Calendar-Import/1.0' },
      responseType: 'text',
    });
    icalText = typeof response.data === 'string' ? response.data : String(response.data);
  } catch (err) {
    return res.status(400).json({ error: 'לא הצלחנו להוריד את היומן. ודא שהכתובת נכונה והיומן ציבורי.' });
  }

  if (!icalText.includes('BEGIN:VCALENDAR')) {
    return res.status(400).json({ error: 'הקובץ אינו יומן iCal תקני' });
  }

  const events = parseICal(icalText);
  if (!events.length) {
    return res.json({ imported: 0, skipped: 0, total: 0, message: 'לא נמצאו אירועים ביומן' });
  }

  const db = getDb();
  const business = req.business;

  // Get or create the "Google Calendar Import" customer record
  let gcCustomer = db.prepare(
    'SELECT id FROM customers WHERE business_id = ? AND whatsapp_phone = ?'
  ).get(business.id, 'gcal_import');

  if (!gcCustomer) {
    const r = db.prepare(
      'INSERT INTO customers (business_id, whatsapp_phone, name) VALUES (?, ?, ?)'
    ).run(business.id, 'gcal_import', 'ייבוא מגוגל קלנדר');
    gcCustomer = { id: r.lastInsertRowid };
  }

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  let imported = 0;
  let skipped = 0;

  for (const event of events) {
    // Skip cancelled events
    if (event.STATUS === 'CANCELLED') { skipped++; continue; }

    const startsAt = parseICalDate(event.DTSTART);
    if (!startsAt) { skipped++; continue; }

    let endsAt = parseICalDate(event.DTEND);
    if (!endsAt && event.DURATION) {
      // Very basic duration handling: PT1H → +60min
      const durationMatch = event.DURATION.match(/PT(\d+)H(?:(\d+)M)?|PT(\d+)M/);
      if (durationMatch) {
        const hours = parseInt(durationMatch[1] || 0);
        const minutes = parseInt(durationMatch[2] || durationMatch[3] || 0);
        const endDate = new Date(startsAt);
        endDate.setHours(endDate.getHours() + hours, endDate.getMinutes() + minutes);
        endsAt = endDate.toISOString().slice(0, 19);
      }
    }
    endsAt = endsAt || startsAt;

    const eventDate = new Date(startsAt);
    if (eventDate < oneMonthAgo || eventDate > oneYearFromNow) { skipped++; continue; }

    const summary = (event.SUMMARY || 'תור מגוגל').slice(0, 200);
    const desc = (event.DESCRIPTION || '').slice(0, 300);
    const notes = desc ? `${summary} — ${desc}` : summary;

    try {
      db.prepare(`
        INSERT INTO appointments (business_id, customer_id, starts_at, ends_at, notes, source, status)
        VALUES (?, ?, ?, ?, ?, 'google_calendar', 'confirmed')
      `).run(business.id, gcCustomer.id, startsAt, endsAt, notes.slice(0, 500) || null);
      imported++;
    } catch {
      skipped++;
    }
  }

  res.json({
    imported,
    skipped,
    total: events.length,
    message: imported > 0
      ? `ייובאו ${imported} תורים בהצלחה מגוגל קלנדר`
      : 'לא ייובאו תורים (כולם ישנים מדי או לא תקניים)',
  });
});

module.exports = router;
