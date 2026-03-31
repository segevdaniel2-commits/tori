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
  try {
    const u = new URL(val);
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    return u.href.slice(0, 500);
  } catch { return null; }
}

// GET /api/businesses/settings
router.get('/settings', (req, res) => {
  res.json(req.business);
});

// PUT /api/businesses/settings
router.put('/settings', (req, res) => {
  try {
    const db = getDb();
    const { name, type, owner_name, phone, address, city, description, logo_url, buffer_minutes, cancellation_hours, terms_text } = req.body;

    const cleanLogoUrl = safeUrl(logo_url);
    const cleanBufferMin = buffer_minutes !== undefined
      ? Math.min(Math.max(parseInt(buffer_minutes) || 0, 0), 120) : null;
    const cleanCancelHours = cancellation_hours !== undefined
      ? Math.min(Math.max(parseInt(cancellation_hours) || 0, 0), 168) : null;

    db.prepare(`
      UPDATE businesses SET
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        owner_name = COALESCE(?, owner_name),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        description = COALESCE(?, description),
        logo_url = COALESCE(?, logo_url),
        buffer_minutes = COALESCE(?, buffer_minutes),
        cancellation_hours = COALESCE(?, cancellation_hours),
        terms_text = COALESCE(?, terms_text),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      sanitize(name, 100), sanitize(type, 50), sanitize(owner_name, 100),
      sanitize(phone, 20), sanitize(address, 200), sanitize(city, 100),
      sanitize(description, 500), cleanLogoUrl,
      cleanBufferMin, cleanCancelHours,
      sanitize(terms_text, 2000), req.business.id
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
    const updateMany = db.transaction((items) => {
      for (const h of items) {
        upsert.run(req.business.id, parseInt(h.day_of_week), h.is_open ? 1 : 0, h.open_time || '09:00', h.close_time || '20:00');
      }
    });
    updateMany(hours);
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
    if (!name) return res.status(400).json({ error: 'Name required' });
    const result = db.prepare('INSERT INTO staff (business_id, name, role, phone, color) VALUES (?, ?, ?, ?, ?)').run(req.business.id, name, role || 'staff', phone || null, color || '#7C3AED');
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
    const { name, role, phone, color, is_active } = req.body;
    const staffMember = db.prepare('SELECT * FROM staff WHERE id = ? AND business_id = ?').get(req.params.id, req.business.id);
    if (!staffMember) return res.status(404).json({ error: 'Staff not found' });
    db.prepare(`
      UPDATE staff SET
        name = COALESCE(?, name),
        role = COALESCE(?, role),
        phone = COALESCE(?, phone),
        color = COALESCE(?, color),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(name, role, phone, color, is_active !== undefined ? (is_active ? 1 : 0) : null, req.params.id);
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

// POST /api/businesses/services
router.post('/services', (req, res) => {
  try {
    const db = getDb();
    const { staff_id, name, duration_minutes, price, sort_order } = req.body;
    if (!name || price === undefined) return res.status(400).json({ error: 'Name and price required' });
    const result = db.prepare('INSERT INTO services (business_id, staff_id, name, duration_minutes, price, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(req.business.id, staff_id || null, name, duration_minutes || 30, price, sort_order || 0);
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
    const { staff_id, name, duration_minutes, price, is_active, sort_order } = req.body;
    const service = db.prepare('SELECT * FROM services WHERE id = ? AND business_id = ?').get(req.params.id, req.business.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    db.prepare(`
      UPDATE services SET
        staff_id = COALESCE(?, staff_id),
        name = COALESCE(?, name),
        duration_minutes = COALESCE(?, duration_minutes),
        price = COALESCE(?, price),
        is_active = COALESCE(?, is_active),
        sort_order = COALESCE(?, sort_order)
      WHERE id = ?
    `).run(staff_id, name, duration_minutes, price, is_active !== undefined ? (is_active ? 1 : 0) : null, sort_order, req.params.id);
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
    const result = db.prepare('INSERT INTO blocked_times (business_id, staff_id, starts_at, ends_at, reason) VALUES (?, ?, ?, ?, ?)').run(req.business.id, staff_id || null, starts_at, ends_at, reason || null);
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
