const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getDb } = require('../config/database');

router.use(authMiddleware);

// GET /api/customers
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const search = req.query.search;
    const offset = (page - 1) * limit;

    let where = "WHERE c.business_id = ? AND c.whatsapp_phone NOT LIKE '999%'";
    const params = [req.business.id];

    if (search) {
      where += ' AND (c.name LIKE ? OR c.whatsapp_phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const customers = db.prepare(`
      SELECT
        c.*,
        COALESCE(SUM(CASE WHEN a.status = 'completed' THEN a.price ELSE 0 END), 0) as total_spent,
        COUNT(CASE WHEN a.status IN ('confirmed','completed') THEN 1 END) as upcoming_count
      FROM customers c
      LEFT JOIN appointments a ON a.customer_id = c.id
      ${where}
      GROUP BY c.id
      ORDER BY c.last_visit_at DESC NULLS LAST, c.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM customers c ${where}`).get(...params).count;

    res.json({ customers, total, page, limit });
  } catch (err) {
    console.error('[Customers] List error:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/customers/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND business_id = ?').get(req.params.id, req.business.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const appointments = db.prepare(`
      SELECT a.*, s.name as staff_name, sv.name as service_name
      FROM appointments a
      LEFT JOIN staff s ON a.staff_id = s.id
      LEFT JOIN services sv ON a.service_id = sv.id
      WHERE a.customer_id = ? AND a.business_id = ?
      ORDER BY a.starts_at DESC
      LIMIT 50
    `).all(req.params.id, req.business.id);

    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_appointments,
        COALESCE(SUM(CASE WHEN status IN ('confirmed','completed') THEN price ELSE 0 END), 0) as total_spent,
        MAX(starts_at) as last_appointment
      FROM appointments
      WHERE customer_id = ? AND business_id = ?
    `).get(req.params.id, req.business.id);

    res.json({ customer, appointments, stats });
  } catch (err) {
    console.error('[Customers] Get error:', err);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST /api/customers/quick: quick create or find customer
router.post('/quick', (req, res) => {
  try {
    const db = getDb();
    const { name, whatsapp_phone } = req.body;
    if (!whatsapp_phone) return res.status(400).json({ error: 'whatsapp_phone required' });

    let customer = db.prepare('SELECT * FROM customers WHERE business_id = ? AND whatsapp_phone = ?').get(req.business.id, whatsapp_phone);
    if (customer) {
      if (name) db.prepare('UPDATE customers SET name = ? WHERE id = ?').run(name, customer.id);
      return res.json(customer);
    }

    const result = db.prepare('INSERT INTO customers (business_id, whatsapp_phone, name) VALUES (?, ?, ?)').run(req.business.id, whatsapp_phone, name || null);
    customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(customer);
  } catch (err) {
    console.error('[Customers] Quick create error:', err);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// PUT /api/customers/:id
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND business_id = ?').get(req.params.id, req.business.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const { name, notes } = req.body;
    db.prepare('UPDATE customers SET name = COALESCE(?, name), notes = COALESCE(?, notes) WHERE id = ?').run(name, notes, req.params.id);

    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('[Customers] Update error:', err);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

module.exports = router;
