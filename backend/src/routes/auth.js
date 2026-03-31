const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { getDb } = require('../config/database');
const { sendWelcome } = require('../services/email');
const authMiddleware = require('../middleware/auth');

const JWT_OPTS = { algorithm: 'HS256', expiresIn: '30d' };

function sanitizeString(str, maxLen = 200) {
  if (typeof str !== 'string') return null;
  return str.trim().slice(0, maxLen) || null;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const {
      name, type, owner_name, email, password, phone,
      address, city, description,
      staff_count, services, hours, buffer_minutes
    } = req.body;

    if (!name || !type || !owner_name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Input validation
    if (!validator.isEmail(String(email))) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (String(password).length > 128) {
      return res.status(400).json({ error: 'Password too long' });
    }
    if (String(name).length > 100 || String(owner_name).length > 100) {
      return res.status(400).json({ error: 'Name too long' });
    }

    const cleanEmail = validator.normalizeEmail(String(email));
    const cleanName = sanitizeString(name, 100);
    const cleanOwner = sanitizeString(owner_name, 100);
    const cleanType = sanitizeString(type, 50);
    const cleanPhone = sanitizeString(phone, 20);
    const cleanAddress = sanitizeString(address, 200);
    const cleanCity = sanitizeString(city, 100);
    const cleanDesc = sanitizeString(description, 500);

    const db = getDb();
    const existing = db.prepare('SELECT id FROM businesses WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const plan = (staff_count && staff_count >= 2) ? 'business' : 'basic';

    const insertBusiness = db.prepare(`
      INSERT INTO businesses (name, type, owner_name, email, password, phone, address, city, description, plan, trial_ends_at, buffer_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'trial', ?, ?)
    `);
    const parsedBuf = parseInt(buffer_minutes);
    const bufMin = Math.min(Math.max(isNaN(parsedBuf) ? 0 : parsedBuf, 0), 120);
    const result = insertBusiness.run(cleanName, cleanType, cleanOwner, cleanEmail, hashedPassword, cleanPhone, cleanAddress, cleanCity, cleanDesc, trialEndsAt, bufMin);
    const businessId = result.lastInsertRowid;

    // Insert default business hours
    const defaultHours = [
      { day: 0, is_open: 1, open: '09:00', close: '20:00' }, // Sunday
      { day: 1, is_open: 1, open: '09:00', close: '20:00' },
      { day: 2, is_open: 1, open: '09:00', close: '20:00' },
      { day: 3, is_open: 1, open: '09:00', close: '20:00' },
      { day: 4, is_open: 1, open: '09:00', close: '20:00' },
      { day: 5, is_open: 1, open: '09:00', close: '14:00' }, // Friday
      { day: 6, is_open: 0, open: '09:00', close: '20:00' }, // Saturday
    ];

    const insertHours = db.prepare(`
      INSERT OR REPLACE INTO business_hours (business_id, day_of_week, is_open, open_time, close_time)
      VALUES (?, ?, ?, ?, ?)
    `);

    if (hours && Array.isArray(hours)) {
      for (const h of hours) {
        insertHours.run(businessId, h.day_of_week, h.is_open ? 1 : 0, h.open_time || '09:00', h.close_time || '20:00');
      }
    } else {
      for (const h of defaultHours) {
        insertHours.run(businessId, h.day, h.is_open, h.open, h.close);
      }
    }

    // Insert default staff
    const staffCount = staff_count || 1;
    const insertStaff = db.prepare(`
      INSERT INTO staff (business_id, name, role, color) VALUES (?, ?, ?, ?)
    `);
    const staffColors = ['#7C3AED', '#F43F5E', '#06B6D4', '#10B981'];
    const firstStaffResult = insertStaff.run(businessId, owner_name, 'owner', staffColors[0]);
    const defaultStaffId = firstStaffResult.lastInsertRowid;

    if (staffCount >= 2) {
      insertStaff.run(businessId, 'עובד 2', 'staff', staffColors[1]);
    }

    // Insert services
    const insertService = db.prepare(`
      INSERT INTO services (business_id, staff_id, name, duration_minutes, price, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    if (services && Array.isArray(services) && services.length > 0) {
      services.forEach((svc, i) => {
        insertService.run(businessId, defaultStaffId, svc.name, svc.duration_minutes || 30, svc.price || 0, i);
      });
    } else {
      // Default services by type
      const defaultServices = getDefaultServices(type);
      defaultServices.forEach((svc, i) => {
        insertService.run(businessId, defaultStaffId, svc.name, svc.duration, svc.price, i);
      });
    }

    const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId);
    delete business.password;

    const token = jwt.sign({ businessId }, process.env.JWT_SECRET, JWT_OPTS);

    // Send welcome email (non-blocking)
    sendWelcome(business).catch(err => console.error('[Email] Welcome error:', err));

    res.status(201).json({ token, business });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    if (!validator.isEmail(String(email))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (String(password).length > 128) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const cleanEmail = validator.normalizeEmail(String(email));

    const db = getDb();
    const business = db.prepare('SELECT * FROM businesses WHERE email = ?').get(cleanEmail);

    // Always run bcrypt even on not-found to prevent timing attacks
    const dummyHash = '$2a$12$invalidhashtopreventtimingattacksonuserenum00000000000';
    const valid = business
      ? await bcrypt.compare(String(password), business.password)
      : await bcrypt.compare(String(password), dummyHash).then(() => false);

    if (!business || !valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!business.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    delete business.password;
    const token = jwt.sign({ businessId: business.id }, process.env.JWT_SECRET, JWT_OPTS);

    res.json({ token, business });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const db = getDb();
  const staff = db.prepare('SELECT * FROM staff WHERE business_id = ? AND is_active = 1').all(req.business.id);
  const services = db.prepare('SELECT * FROM services WHERE business_id = ? AND is_active = 1 ORDER BY sort_order').all(req.business.id);
  res.json({ business: req.business, staff, services });
});

function getDefaultServices(type) {
  const map = {
    barber_men: [
      { name: 'תספורת', duration: 30, price: 60 },
      { name: 'זקן', duration: 20, price: 30 },
      { name: 'תספורת + זקן', duration: 45, price: 80 },
      { name: 'גוונים', duration: 60, price: 120 },
      { name: 'כיורה', duration: 20, price: 25 },
    ],
    barber_women: [
      { name: 'תספורת', duration: 45, price: 100 },
      { name: 'פן', duration: 30, price: 80 },
      { name: 'צבע', duration: 90, price: 200 },
      { name: 'גוונים', duration: 120, price: 280 },
      { name: 'החלקה', duration: 120, price: 350 },
    ],
    nails: [
      { name: 'לק רגיל', duration: 30, price: 60 },
      { name: "ג'ל", duration: 45, price: 100 },
      { name: 'אקריל', duration: 60, price: 140 },
      { name: 'פדיקור', duration: 45, price: 80 },
      { name: 'הסרה', duration: 30, price: 40 },
    ],
    lashes: [
      { name: 'ריסים קלאסי', duration: 90, price: 200 },
      { name: 'ריסים וליום', duration: 120, price: 280 },
      { name: 'עיצוב גבות', duration: 30, price: 80 },
      { name: 'הסרת ריסים', duration: 30, price: 60 },
    ],
    massage: [
      { name: 'עיסוי שוודי 60 דק', duration: 60, price: 250 },
      { name: 'עיסוי שוודי 90 דק', duration: 90, price: 350 },
      { name: 'עיסוי ספורט', duration: 60, price: 280 },
      { name: 'עיסוי רקמות עמוק', duration: 60, price: 300 },
    ],
    tattoo: [
      { name: 'קעקוע קטן', duration: 60, price: 300 },
      { name: 'קעקוע בינוני', duration: 120, price: 600 },
      { name: 'קעקוע גדול', duration: 180, price: 1000 },
      { name: 'ייעוץ עיצוב', duration: 30, price: 0 },
    ],
    cosmetics: [
      { name: 'טיפול פנים בסיסי', duration: 60, price: 200 },
      { name: 'טיפול פנים מעמיק', duration: 90, price: 300 },
      { name: 'קיסרי', duration: 60, price: 250 },
      { name: 'פילינג', duration: 45, price: 180 },
    ],
  };
  return map[type] || [{ name: 'שירות בסיסי', duration: 30, price: 100 }];
}

module.exports = router;
