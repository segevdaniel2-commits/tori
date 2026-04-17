const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getDb } = require('../config/database');

router.use(authMiddleware);

function sanitize(val, maxLen = 200) {
  if (val === null || val === undefined) return null;
  if (typeof val !== 'string') return null;
  return val.trim().slice(0, maxLen) || null;
}

function safeUrl(val) {
  if (!val) return null;
  // Accept base64-encoded image data URIs (from direct upload)
  if (typeof val === 'string' && val.startsWith('data:image/')) {
    const allowed = ['data:image/jpeg;base64,', 'data:image/png;base64,', 'data:image/webp;base64,'];
    if (!allowed.some(prefix => val.startsWith(prefix))) return null;
    if (val.length > 200_000) return null; // ~150 KB max
    return val;
  }
  try {
    const u = new URL(val);
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    return u.href.slice(0, 500);
  } catch { return null; }
}

const CSS_COLOR_RE = /^(#[0-9A-Fa-f]{3,8}|linear-gradient\([^)]{1,200}\))$/;
function safeCssColor(val) {
  if (!val) return null;
  if (typeof val !== 'string') return null;
  return CSS_COLOR_RE.test(val.trim()) ? val.trim().slice(0, 200) : null;
}

const VALID_HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const VALID_STAFF_ROLES = ['owner', 'staff', 'manager'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
function validDatetime(v) { return typeof v === 'string' && DATETIME_RE.test(v) && !isNaN(Date.parse(v)); }

// GET /api/businesses/settings
router.get('/settings', (req, res) => {
  const db = getDb();
  // Fetch full settings row but strip sensitive fields before sending to client
  const settings = db.prepare(`
    SELECT id, name, type, owner_name, email, phone, address, city, description,
           logo_url, brand_color, plan, is_active, whatsapp_number, buffer_minutes,
           cancellation_hours, trial_ends_at, created_at, updated_at,
           terms_text, bot_tone, green_invoice_enabled, hide_stats, security_alerts,
           subscription_status, stripe_customer_id, stripe_subscription_id
    FROM businesses WHERE id = ?
  `).get(req.business.id);
  // Never expose: password, google_refresh_token, green_invoice_api_key
  res.json(settings);
});

// PUT /api/businesses/settings
router.put('/settings', (req, res) => {
  try {
    const db = getDb();
    const { name, type, owner_name, phone, address, city, description, logo_url, brand_color, buffer_minutes, cancellation_hours, terms_text, bot_tone, green_invoice_api_key, green_invoice_enabled, hide_stats, security_alerts } = req.body;

    const cleanLogoUrl   = logo_url   !== undefined ? safeUrl(logo_url)          : null;
    const cleanBrandColor = brand_color !== undefined ? safeCssColor(brand_color) : null;

    let cleanBufferMin = null;
    if (buffer_minutes !== undefined) {
      const bv = parseInt(buffer_minutes);
      if (isNaN(bv) || bv < 0 || bv > 120) return res.status(400).json({ error: 'buffer_minutes must be 0–120' });
      cleanBufferMin = bv;
    }

    let cleanCancelHours = null;
    if (cancellation_hours !== undefined) {
      const cv = parseInt(cancellation_hours);
      if (isNaN(cv) || cv < 0 || cv > 168) return res.status(400).json({ error: 'cancellation_hours must be 0–168' });
      cleanCancelHours = cv;
    }

    db.prepare(`
      UPDATE businesses SET
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        owner_name = COALESCE(?, owner_name),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        description = COALESCE(?, description),
        logo_url    = COALESCE(?, logo_url),
        brand_color = COALESCE(?, brand_color),
        buffer_minutes = COALESCE(?, buffer_minutes),
        cancellation_hours = COALESCE(?, cancellation_hours),
        terms_text = COALESCE(?, terms_text),
        bot_tone = COALESCE(?, bot_tone),
        green_invoice_api_key = COALESCE(?, green_invoice_api_key),
        green_invoice_enabled = COALESCE(?, green_invoice_enabled),
        hide_stats = COALESCE(?, hide_stats),
        security_alerts = COALESCE(?, security_alerts),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      sanitize(name, 100), sanitize(type, 50), sanitize(owner_name, 100),
      sanitize(phone, 20), sanitize(address, 200), sanitize(city, 100),
      sanitize(description, 500), cleanLogoUrl, cleanBrandColor,
      cleanBufferMin, cleanCancelHours,
      sanitize(terms_text, 2000),
      ['friendly', 'professional', 'formal'].includes(bot_tone) ? bot_tone : null,
      green_invoice_api_key !== undefined ? sanitize(green_invoice_api_key, 200) : null,
      green_invoice_enabled !== undefined ? (green_invoice_enabled ? 1 : 0) : null,
      hide_stats !== undefined ? (hide_stats ? 1 : 0) : null,
      security_alerts !== undefined ? (security_alerts ? 1 : 0) : null,
      req.business.id
    );
    const updated = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.business.id);
    delete updated.password;
    res.json(updated);
  } catch (err) {
    console.error('[Businesses] Settings update error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// GET /api/businesses/hours
router.get('/hours', (req, res) => {
  const db = getDb();
  const hours = db.prepare('SELECT * FROM business_hours WHERE business_id = ? ORDER BY day_of_week').all(req.business.id);
  res.json(hours);
});

// PUT /api/businesses/hours
router.put('/hours', (req, res) => {
  try {
    const db = getDb();
    const { hours } = req.body;
    if (!Array.isArray(hours) || hours.length > 7) return res.status(400).json({ error: 'Hours must be an array of up to 7 days' });

    // Validate time format HH:MM
    const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const h of hours) {
      const day = parseInt(h.day_of_week);
      if (isNaN(day) || day < 0 || day > 6) return res.status(400).json({ error: 'Invalid day_of_week' });
      if (h.open_time && !timeRe.test(h.open_time)) return res.status(400).json({ error: 'Invalid time format' });
      if (h.close_time && !timeRe.test(h.close_time)) return res.status(400).json({ error: 'Invalid time format' });
    }

    const upsert = db.prepare(`
      INSERT OR REPLACE INTO business_hours (business_id, day_of_week, is_open, open_time, close_time)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const h of hours) {
      upsert.run(req.business.id, parseInt(h.day_of_week), h.is_open ? 1 : 0, h.open_time || '09:00', h.close_time || '20:00');
    }
    const updated = db.prepare('SELECT * FROM business_hours WHERE business_id = ? ORDER BY day_of_week').all(req.business.id);
    res.json(updated);
  } catch (err) {
    console.error('[Businesses] Hours update error:', err);
    res.status(500).json({ error: 'Failed to update hours' });
  }
});

// GET /api/businesses/staff
router.get('/staff', (req, res) => {
  const db = getDb();
  const staff = db.prepare('SELECT * FROM staff WHERE business_id = ? ORDER BY id').all(req.business.id);
  res.json(staff);
});

// POST /api/businesses/staff
router.post('/staff', (req, res) => {
  try {
    const db = getDb();
    const { name, role, phone, color } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name required' });

    const cleanName  = sanitize(name, 100);
    const cleanRole  = VALID_STAFF_ROLES.includes(role) ? role : 'staff';
    const cleanPhone = sanitize(phone, 20);
    const cleanColor = VALID_HEX_COLOR.test(color) ? color : '#7C3AED';

    const result = db.prepare('INSERT INTO staff (business_id, name, role, phone, color) VALUES (?, ?, ?, ?, ?)')
      .run(req.business.id, cleanName, cleanRole, cleanPhone, cleanColor);
    const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(staff);
  } catch (err) {
    console.error('[Businesses] Staff create error:', err);
    res.status(500).json({ error: 'Failed to create staff' });
  }
});

// PUT /api/businesses/staff/:id
router.put('/staff/:id', (req, res) => {
  try {
    const db = getDb();
    const staffMember = db.prepare('SELECT * FROM staff WHERE id = ? AND business_id = ?').get(req.params.id, req.business.id);
    if (!staffMember) return res.status(404).json({ error: 'Staff not found' });

    const { name, role, phone, color, is_active } = req.body;

    const cleanName  = name  !== undefined ? sanitize(name, 100) : null;
    const cleanRole  = role  !== undefined ? (VALID_STAFF_ROLES.includes(role) ? role : null) : null;
    const cleanPhone = phone !== undefined ? sanitize(phone, 20) : null;
    const cleanColor = color !== undefined ? (VALID_HEX_COLOR.test(color) ? color : null) : null;

    db.prepare(`
      UPDATE staff SET
        name      = COALESCE(?, name),
        role      = COALESCE(?, role),
        phone     = COALESCE(?, phone),
        color     = COALESCE(?, color),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(cleanName, cleanRole, cleanPhone, cleanColor, is_active !== undefined ? (is_active ? 1 : 0) : null, req.params.id);

    const updated = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('[Businesses] Staff update error:', err);
    res.status(500).json({ error: 'Failed to update staff' });
  }
});

// DELETE /api/businesses/staff/:id
router.delete('/staff/:id', (req, res) => {
  try {
    const db = getDb();
    const staffMember = db.prepare('SELECT * FROM staff WHERE id = ? AND business_id = ?').get(req.params.id, req.business.id);
    if (!staffMember) return res.status(404).json({ error: 'Staff not found' });
    db.prepare('UPDATE staff SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Businesses] Staff delete error:', err);
    res.status(500).json({ error: 'Failed to delete staff' });
  }
});

// GET /api/businesses/services
router.get('/services', (req, res) => {
  const db = getDb();
  const services = db.prepare('SELECT * FROM services WHERE business_id = ? ORDER BY sort_order').all(req.business.id);
  res.json(services);
});

// ── Service field validators ───────────────────────────────────────────────────
function validateServiceFields(db, businessId, { staff_id, name, duration_minutes, price, sort_order }, requireName = false) {
  if (requireName && (!name || !String(name).trim())) return 'Name required';
  if (name && String(name).length > 100) return 'Name too long (max 100)';
  if (price !== undefined) {
    const p = parseFloat(price);
    if (isNaN(p) || p < 0 || p > 1_000_000) return 'price must be 0–1,000,000';
  }
  if (duration_minutes !== undefined) {
    const d = parseInt(duration_minutes);
    if (isNaN(d) || d < 5 || d > 480) return 'duration_minutes must be 5–480';
  }
  if (sort_order !== undefined) {
    const s = parseInt(sort_order);
    if (isNaN(s) || s < 0 || s > 10000) return 'sort_order must be 0–10,000';
  }
  if (staff_id !== undefined && staff_id !== null) {
    const row = db.prepare('SELECT id FROM staff WHERE id = ? AND business_id = ?').get(staff_id, businessId);
    if (!row) return 'Staff not found';
  }
  return null;
}

// POST /api/businesses/services
router.post('/services', (req, res) => {
  try {
    const db = getDb();
    const { staff_id, name, duration_minutes, price, sort_order } = req.body;
    if (price === undefined) return res.status(400).json({ error: 'Name and price required' });

    const err = validateServiceFields(db, req.business.id, { staff_id, name, duration_minutes, price, sort_order }, true);
    if (err) return res.status(400).json({ error: err });

    const result = db.prepare('INSERT INTO services (business_id, staff_id, name, duration_minutes, price, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
      .run(
        req.business.id,
        staff_id || null,
        sanitize(name, 100),
        parseInt(duration_minutes) || 30,
        parseFloat(price),
        parseInt(sort_order) || 0,
      );
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(service);
  } catch (err) {
    console.error('[Businesses] Service create error:', err);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// PUT /api/businesses/services/:id
router.put('/services/:id', (req, res) => {
  try {
    const db = getDb();
    const service = db.prepare('SELECT * FROM services WHERE id = ? AND business_id = ?').get(req.params.id, req.business.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    const { staff_id, name, duration_minutes, price, is_active, sort_order } = req.body;

    const validErr = validateServiceFields(db, req.business.id, { staff_id, name, duration_minutes, price, sort_order });
    if (validErr) return res.status(400).json({ error: validErr });

    db.prepare(`
      UPDATE services SET
        staff_id         = COALESCE(?, staff_id),
        name             = COALESCE(?, name),
        duration_minutes = COALESCE(?, duration_minutes),
        price            = COALESCE(?, price),
        is_active        = COALESCE(?, is_active),
        sort_order       = COALESCE(?, sort_order)
      WHERE id = ?
    `).run(
      staff_id         !== undefined ? (staff_id ?? null) : null,
      name             !== undefined ? sanitize(name, 100) : null,
      duration_minutes !== undefined ? parseInt(duration_minutes) : null,
      price            !== undefined ? parseFloat(price) : null,
      is_active        !== undefined ? (is_active ? 1 : 0) : null,
      sort_order       !== undefined ? parseInt(sort_order) : null,
      req.params.id,
    );
    const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('[Businesses] Service update error:', err);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// DELETE /api/businesses/services/:id
router.delete('/services/:id', (req, res) => {
  try {
    const db = getDb();
    const service = db.prepare('SELECT * FROM services WHERE id = ? AND business_id = ?').get(req.params.id, req.business.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    db.prepare('UPDATE services SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Businesses] Service delete error:', err);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// GET /api/businesses/blocked-times
router.get('/blocked-times', (req, res) => {
  const db = getDb();
  const { date } = req.query;
  let query = 'SELECT * FROM blocked_times WHERE business_id = ?';
  const params = [req.business.id];
  if (date) {
    query += ' AND date(starts_at) = ?';
    params.push(date);
  }
  const blocked = db.prepare(query).all(...params);
  res.json(blocked);
});

// POST /api/businesses/blocked-times
router.post('/blocked-times', (req, res) => {
  try {
    const db = getDb();
    const { staff_id, starts_at, ends_at, reason } = req.body;
    if (!starts_at || !ends_at) return res.status(400).json({ error: 'starts_at and ends_at required' });
    if (!validDatetime(starts_at)) return res.status(400).json({ error: 'Invalid starts_at format' });
    if (!validDatetime(ends_at))   return res.status(400).json({ error: 'Invalid ends_at format' });
    if (staff_id) {
      const staffRow = db.prepare('SELECT id FROM staff WHERE id = ? AND business_id = ?').get(staff_id, req.business.id);
      if (!staffRow) return res.status(400).json({ error: 'Staff not found' });
    }
    const result = db.prepare('INSERT INTO blocked_times (business_id, staff_id, starts_at, ends_at, reason) VALUES (?, ?, ?, ?, ?)')
      .run(req.business.id, staff_id || null, starts_at, ends_at, sanitize(reason, 200));
    const blocked = db.prepare('SELECT * FROM blocked_times WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(blocked);
  } catch (err) {
    console.error('[Businesses] Blocked time create error:', err);
    res.status(500).json({ error: 'Failed to create blocked time' });
  }
});

// DELETE /api/businesses/blocked-times/:id
router.delete('/blocked-times/:id', (req, res) => {
  try {
    const db = getDb();
    const blocked = db.prepare('SELECT * FROM blocked_times WHERE id = ? AND business_id = ?').get(req.params.id, req.business.id);
    if (!blocked) return res.status(404).json({ error: 'Blocked time not found' });
    db.prepare('DELETE FROM blocked_times WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Businesses] Blocked time delete error:', err);
    res.status(500).json({ error: 'Failed to delete blocked time' });
  }
});

module.exports = router;
