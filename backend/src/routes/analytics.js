const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getDb } = require('../config/database');

router.use(authMiddleware);

// GET /api/analytics/overview
router.get('/overview', (req, res) => {
  try {
    const db = getDb();
    const businessId = req.business.id;

    const totalAppointments = db.prepare(`
      SELECT COUNT(*) as count FROM appointments
      WHERE business_id = ? AND status NOT IN ('cancelled')
    `).get(businessId).count;

    const totalRevenue = db.prepare(`
      SELECT COALESCE(SUM(price), 0) as total FROM appointments
      WHERE business_id = ? AND status IN ('confirmed', 'completed')
    `).get(businessId).total;

    const totalCustomers = db.prepare(`
      SELECT COUNT(*) as count FROM customers WHERE business_id = ?
    `).get(businessId).count;

    const thisMonth = new Date();
    const monthStart = `${thisMonth.getFullYear()}-${String(thisMonth.getMonth() + 1).padStart(2, '0')}-01`;

    const monthlyAppointments = db.prepare(`
      SELECT COUNT(*) as count FROM appointments
      WHERE business_id = ? AND status NOT IN ('cancelled') AND starts_at >= ?
    `).get(businessId, monthStart).count;

    const monthlyRevenue = db.prepare(`
      SELECT COALESCE(SUM(price), 0) as total FROM appointments
      WHERE business_id = ? AND status IN ('confirmed', 'completed') AND starts_at >= ?
    `).get(businessId, monthStart).total;

    const avgPerDay = monthlyAppointments > 0
      ? (monthlyAppointments / new Date().getDate()).toFixed(1)
      : 0;

    res.json({
      totalAppointments,
      totalRevenue,
      totalCustomers,
      monthlyAppointments,
      monthlyRevenue,
      avgPerDay: Number(avgPerDay),
    });
  } catch (err) {
    console.error('[Analytics] Overview error:', err);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// GET /api/analytics/daily-revenue?days=30
router.get('/daily-revenue', (req, res) => {
  try {
    const db = getDb();
    const days = Math.min(Number(req.query.days) || 30, 365);
    const businessId = req.business.id;

    const rows = db.prepare(`
      SELECT
        date(starts_at) as date,
        COALESCE(SUM(price), 0) as revenue,
        COUNT(*) as appointments
      FROM appointments
      WHERE business_id = ?
        AND status IN ('confirmed', 'completed')
        AND starts_at >= datetime('now', ? || ' days')
      GROUP BY date(starts_at)
      ORDER BY date ASC
    `).all(businessId, `-${days}`);

    // Fill in missing days
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const row = rows.find(r => r.date === dateStr);
      result.push({ date: dateStr, revenue: row ? row.revenue : 0, appointments: row ? row.appointments : 0 });
    }

    res.json(result);
  } catch (err) {
    console.error('[Analytics] Daily revenue error:', err);
    res.status(500).json({ error: 'Failed to fetch daily revenue' });
  }
});

// GET /api/analytics/popular-services
router.get('/popular-services', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT
        sv.name,
        COUNT(a.id) as count,
        COALESCE(SUM(a.price), 0) as revenue
      FROM appointments a
      JOIN services sv ON a.service_id = sv.id
      WHERE a.business_id = ? AND a.status NOT IN ('cancelled')
      GROUP BY sv.id, sv.name
      ORDER BY count DESC
      LIMIT 10
    `).all(req.business.id);
    res.json(rows);
  } catch (err) {
    console.error('[Analytics] Popular services error:', err);
    res.status(500).json({ error: 'Failed to fetch popular services' });
  }
});

// GET /api/analytics/peak-hours
router.get('/peak-hours', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT
        strftime('%H', starts_at) as hour,
        COUNT(*) as count
      FROM appointments
      WHERE business_id = ? AND status NOT IN ('cancelled')
      GROUP BY hour
      ORDER BY hour ASC
    `).all(req.business.id);
    res.json(rows);
  } catch (err) {
    console.error('[Analytics] Peak hours error:', err);
    res.status(500).json({ error: 'Failed to fetch peak hours' });
  }
});

// GET /api/analytics/monthly-report?month=YYYY-MM
router.get('/monthly-report', (req, res) => {
  try {
    const db = getDb();
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const businessId = req.business.id;

    const monthStart = `${month}-01`;
    const monthEnd = `${month}-31`;

    const appointments = db.prepare(`
      SELECT a.*, c.name as customer_name, sv.name as service_name, s.name as staff_name
      FROM appointments a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN services sv ON a.service_id = sv.id
      LEFT JOIN staff s ON a.staff_id = s.id
      WHERE a.business_id = ? AND date(a.starts_at) >= ? AND date(a.starts_at) <= ?
        AND a.status NOT IN ('cancelled')
      ORDER BY a.starts_at ASC
    `).all(businessId, monthStart, monthEnd);

    const summary = {
      total: appointments.length,
      revenue: appointments.reduce((s, a) => s + (a.price || 0), 0),
      completed: appointments.filter(a => a.status === 'completed').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
    };

    const byDay = {};
    for (const a of appointments) {
      const d = a.starts_at.split('T')[0];
      if (!byDay[d]) byDay[d] = { date: d, count: 0, revenue: 0 };
      byDay[d].count++;
      byDay[d].revenue += a.price || 0;
    }

    const newCustomers = db.prepare(`
      SELECT COUNT(*) as count FROM customers
      WHERE business_id = ? AND date(created_at) >= ? AND date(created_at) <= ?
    `).get(businessId, monthStart, monthEnd).count;

    res.json({
      month,
      summary,
      appointments,
      byDay: Object.values(byDay),
      newCustomers,
    });
  } catch (err) {
    console.error('[Analytics] Monthly report error:', err);
    res.status(500).json({ error: 'Failed to fetch monthly report' });
  }
});

module.exports = router;
