const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getDb } = require('../config/database');

router.use(authMiddleware);

// Validate ISO-ish datetime: YYYY-MM-DDTHH:MM:SS or YYYY-MM-DDTHH:MM
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
function validDatetime(v) { return typeof v === 'string' && DATETIME_RE.test(v) && !isNaN(Date.parse(v)); }

function getAppointmentsWithDetails(db, businessId, where, params) {
  return db.prepare(`
    SELECT
      a.*,
      c.name as customer_name, c.whatsapp_phone as customer_phone,
      s.name as staff_name, s.color as staff_color,
      sv.name as service_name, sv.duration_minutes as service_duration
    FROM appointments a
    LEFT JOIN customers c ON a.customer_id = c.id
    LEFT JOIN staff s ON a.staff_id = s.id
    LEFT JOIN services sv ON a.service_id = sv.id
    WHERE a.business_id = ? ${where}
    ORDER BY a.starts_at ASC
  `).all(businessId, ...params);
}

// GET /api/appointments
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { date, start, end, status } = req.query;

    let where = '';
    const params = [];

    if (date) {
      where += ' AND date(a.starts_at) = ?';
      params.push(date);
    } else if (start && end) {
      where += ' AND date(a.starts_at) >= ? AND date(a.starts_at) <= ?';
      params.push(start, end);
    }

    const allowedStatuses = ['confirmed', 'pending', 'completed', 'cancelled'];
    if (status && allowedStatuses.includes(status)) {
      where += ' AND a.status = ?';
      params.push(status);
    }

    const appointments = getAppointmentsWithDetails(db, req.business.id, where, params);
    res.json(appointments);
  } catch (err) {
    console.error('[Appointments] List error:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// POST /api/appointments
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { customer_id, staff_id, service_id, starts_at, ends_at, price, notes, status } = req.body;

    if (!customer_id || !starts_at || !ends_at) {
      return res.status(400).json({ error: 'customer_id, starts_at, ends_at required' });
    }
    if (!validDatetime(starts_at) || !validDatetime(ends_at)) {
      return res.status(400).json({ error: 'Invalid datetime format' });
    }
    const cleanNotes = notes ? String(notes).slice(0, 1000) : null;
    const allowedStatus = ['confirmed', 'pending', 'completed', 'cancelled'];
    const cleanStatus = allowedStatus.includes(status) ? status : 'confirmed';

    // Verify customer belongs to this business
    const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND business_id = ?').get(customer_id, req.business.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const result = db.prepare(`
      INSERT INTO appointments (business_id, customer_id, staff_id, service_id, starts_at, ends_at, price, notes, status, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')
    `).run(req.business.id, customer_id, staff_id || null, service_id || null, starts_at, ends_at, price || null, cleanNotes, cleanStatus);

    const appointment = db.prepare(`
      SELECT a.*, c.name as customer_name, c.whatsapp_phone as customer_phone,
             s.name as staff_name, sv.name as service_name
      FROM appointments a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN staff s ON a.staff_id = s.id
      LEFT JOIN services sv ON a.service_id = sv.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`business_${req.business.id}`).emit('appointment:created', appointment);
    }

    res.status(201).json(appointment);
  } catch (err) {
    console.error('[Appointments] Create error:', err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// PUT /api/appointments/:id
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const appt = db.prepare('SELECT * FROM appointments WHERE id = ? AND business_id = ?').get(req.params.id, req.business.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    const { staff_id, service_id, starts_at, ends_at, price, status, notes } = req.body;

    db.prepare(`
      UPDATE appointments SET
        staff_id = COALESCE(?, staff_id),
        service_id = COALESCE(?, service_id),
        starts_at = COALESCE(?, starts_at),
        ends_at = COALESCE(?, ends_at),
        price = COALESCE(?, price),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(staff_id, service_id, starts_at, ends_at, price, status, notes, req.params.id);

    const updated = db.prepare(`
      SELECT a.*, c.name as customer_name, c.whatsapp_phone as customer_phone,
             s.name as staff_name, sv.name as service_name
      FROM appointments a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN staff s ON a.staff_id = s.id
      LEFT JOIN services sv ON a.service_id = sv.id
      WHERE a.id = ?
    `).get(req.params.id);

    const io = req.app.get('io');
    if (io) {
      io.to(`business_${req.business.id}`).emit('appointment:updated', updated);
    }

    res.json(updated);
  } catch (err) {
    console.error('[Appointments] Update error:', err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const appt = db.prepare('SELECT * FROM appointments WHERE id = ? AND business_id = ?').get(req.params.id, req.business.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    db.prepare("UPDATE appointments SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(req.params.id);

    const io = req.app.get('io');
    if (io) {
      io.to(`business_${req.business.id}`).emit('appointment:cancelled', { id: Number(req.params.id) });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Appointments] Cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

module.exports = router;
