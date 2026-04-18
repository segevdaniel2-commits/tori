const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const { getDb } = require('../config/database');
const { sendWelcome } = require('../services/email');
const authMiddleware = require('../middleware/auth');
const { adminResetLimiter, twoFaLimiter } = require('../middleware/rateLimiter');

const IS_PROD = process.env.NODE_ENV === 'production';
const JWT_OPTS = { algorithm: 'HS256', expiresIn: '7d' };
// Short-lived token used as a "bridge" while 2FA code is pending
const TEMP_JWT_OPTS = { algorithm: 'HS256', expiresIn: '5m' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeString(str, maxLen = 200) {
  if (typeof str !== 'string') return null;
  return str.trim().slice(0, maxLen) || null;
}

/** Set the auth JWT as a secure httpOnly cookie + still return it in the body
 *  so existing localStorage-based clients keep working during the transition.
 */
function setAuthCookie(res, token) {
  res.cookie('tori_token', token, {
    httpOnly: true,           // not accessible by JavaScript
    secure: IS_PROD,          // HTTPS only in production
    sameSite: IS_PROD ? 'none' : 'lax', // 'none' required for cross-origin cookies
    maxAge: 7 * 24 * 60 * 60 * 1000,   // 7 days (matches JWT expiry)
    path: '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie('tori_token', {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'none' : 'lax',
    path: '/',
  });
}

// Safe business projection — never expose password / secrets
function safeBusiness(row) {
  if (!row) return null;
  const { password, totp_secret, google_refresh_token, green_invoice_api_key, ...safe } = row;
  return safe;
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
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
    if (!validator.isEmail(String(email))) return res.status(400).json({ error: 'Invalid email address' });
    if (String(password).length < 8)  return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (String(password).length > 128) return res.status(400).json({ error: 'Password too long' });
    if (String(name).length > 100 || String(owner_name).length > 100) return res.status(400).json({ error: 'Name too long' });

    const cleanEmail   = validator.normalizeEmail(String(email));
    const cleanName    = sanitizeString(name, 100);
    const cleanOwner   = sanitizeString(owner_name, 100);
    const cleanType    = sanitizeString(type, 50);
    const cleanPhone   = sanitizeString(phone, 20);
    const cleanAddress = sanitizeString(address, 200);
    const cleanCity    = sanitizeString(city, 100);
    const cleanDesc    = sanitizeString(description, 500);

    const db = getDb();
    if (db.prepare('SELECT id FROM businesses WHERE email = ?').get(cleanEmail)) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const parsedBuf = parseInt(buffer_minutes);
    const bufMin = Math.min(Math.max(isNaN(parsedBuf) ? 0 : parsedBuf, 0), 120);
    const result = db.prepare(`
      INSERT INTO businesses (name, type, owner_name, email, password, phone, address, city, description, plan, trial_ends_at, buffer_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'trial', ?, ?)
    `).run(cleanName, cleanType, cleanOwner, cleanEmail, hashedPassword, cleanPhone, cleanAddress, cleanCity, cleanDesc, trialEndsAt, bufMin);
    const businessId = result.lastInsertRowid;

    // Default hours
    const defaultHours = [
      { day: 0, is_open: 1, open: '09:00', close: '20:00' },
      { day: 1, is_open: 1, open: '09:00', close: '20:00' },
      { day: 2, is_open: 1, open: '09:00', close: '20:00' },
      { day: 3, is_open: 1, open: '09:00', close: '20:00' },
      { day: 4, is_open: 1, open: '09:00', close: '20:00' },
      { day: 5, is_open: 1, open: '09:00', close: '14:00' },
      { day: 6, is_open: 0, open: '09:00', close: '20:00' },
    ];
    const insertHours = db.prepare(`INSERT OR REPLACE INTO business_hours (business_id, day_of_week, is_open, open_time, close_time) VALUES (?, ?, ?, ?, ?)`);
    if (hours && Array.isArray(hours)) {
      for (const h of hours) insertHours.run(businessId, h.day_of_week, h.is_open ? 1 : 0, h.open_time || '09:00', h.close_time || '20:00');
    } else {
      for (const h of defaultHours) insertHours.run(businessId, h.day, h.is_open, h.open, h.close);
    }

    // Default staff
    const staffCount = staff_count || 1;
    const insertStaff = db.prepare(`INSERT INTO staff (business_id, name, role, color) VALUES (?, ?, ?, ?)`);
    const staffColors = ['#7C3AED', '#F43F5E', '#06B6D4', '#10B981'];
    const firstStaffResult = insertStaff.run(businessId, owner_name, 'owner', staffColors[0]);
    const defaultStaffId = firstStaffResult.lastInsertRowid;
    if (staffCount >= 2) insertStaff.run(businessId, 'עובד 2', 'staff', staffColors[1]);

    // Default services
    const insertService = db.prepare(`INSERT INTO services (business_id, staff_id, name, duration_minutes, price, sort_order) VALUES (?, ?, ?, ?, ?, ?)`);
    const svcs = (services && Array.isArray(services) && services.length > 0) ? services.map(s => ({ name: s.name, duration: s.duration_minutes || 30, price: s.price || 0 })) : getDefaultServices(type);
    svcs.forEach((svc, i) => insertService.run(businessId, defaultStaffId, svc.name, svc.duration, svc.price, i));

    const rawBusiness = db.prepare(`SELECT * FROM businesses WHERE id = ?`).get(businessId);
    const business = safeBusiness(rawBusiness);
    console.log(`[Auth] Registered: id=${businessId}, email=${cleanEmail}`);

    const token = jwt.sign({ businessId, tv: rawBusiness.token_version || 0 }, process.env.JWT_SECRET, JWT_OPTS);
    setAuthCookie(res, token);
    sendWelcome(business).catch(err => console.error('[Email] Welcome error:', err));
    res.status(201).json({ token, business });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (String(password).length > 128) return res.status(401).json({ error: 'Invalid credentials' });

    const db = getDb();
    const identifier = String(email).trim();

    let business = null;
    const looksLikePhone = /^[\d+\-\s()]{7,15}$/.test(identifier);
    if (looksLikePhone) {
      const cleanPhone = identifier.replace(/[\s\-()]/g, '');
      business = db.prepare('SELECT * FROM businesses WHERE phone = ? OR phone = ?').get(cleanPhone, '0' + cleanPhone.replace(/^972/, ''));
    }
    if (!business && validator.isEmail(identifier)) {
      business = db.prepare('SELECT * FROM businesses WHERE email = ?').get(validator.normalizeEmail(identifier));
    }
    if (!business) {
      business = db.prepare('SELECT * FROM businesses WHERE phone = ?').get(identifier);
    }

    // Constant-time password check even if business not found (timing attack prevention)
    const dummyHash = '$2a$12$invalidhashtopreventtimingattacksonuserenum00000000000';
    const valid = business
      ? await bcrypt.compare(String(password), business.password)
      : await bcrypt.compare(String(password), dummyHash).then(() => false);

    if (!business || !valid) return res.status(401).json({ error: 'Invalid credentials' });
    if (!business.is_active)  return res.status(403).json({ error: 'Account is inactive' });

    // ── 2FA check ─────────────────────────────────────────────────────────────
    if (business.totp_enabled) {
      // Issue a short-lived "bridge" token — no session yet
      const tempToken = jwt.sign(
        { businessId: business.id, step: '2fa' },
        process.env.JWT_SECRET,
        TEMP_JWT_OPTS
      );
      return res.json({ requires2fa: true, tempToken });
    }

    // ── Normal login ──────────────────────────────────────────────────────────
    const token = jwt.sign({ businessId: business.id, tv: business.token_version || 0 }, process.env.JWT_SECRET, JWT_OPTS);
    setAuthCookie(res, token);

    // Log login event
    try {
      db.prepare('INSERT INTO login_events (business_id, ip, user_agent) VALUES (?, ?, ?)').run(business.id, req.ip || req.connection?.remoteAddress || 'unknown', req.headers['user-agent'] || '');
    } catch (_) {}

    // Send security alert email if enabled
    if (business.security_alerts) {
      const { sendSecurityAlert } = require('../services/email');
      sendSecurityAlert(safeBusiness(business), { ip: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '' }).catch(() => {});
    }

    res.json({ token, business: safeBusiness(business) });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// ─── POST /api/auth/logout-all — invalidate all tokens for this account ───────
router.post('/logout-all', authMiddleware, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE businesses SET token_version = token_version + 1 WHERE id = ?').run(req.business.id);
  clearAuthCookie(res);
  res.json({ ok: true });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authMiddleware, (req, res) => {
  const db = getDb();
  const staff    = db.prepare('SELECT * FROM staff WHERE business_id = ? AND is_active = 1').all(req.business.id);
  const services = db.prepare('SELECT * FROM services WHERE business_id = ? AND is_active = 1 ORDER BY sort_order').all(req.business.id);
  res.json({ business: req.business, staff, services });
});

// ─── 2FA endpoints (all require valid auth except verify-login) ───────────────

// GET /api/auth/2fa/status
router.get('/2fa/status', authMiddleware, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT totp_enabled FROM businesses WHERE id = ?').get(req.business.id);
  res.json({ enabled: !!(row?.totp_enabled) });
});

// POST /api/auth/2fa/setup — generate a new TOTP secret and return QR URI
router.post('/2fa/setup', authMiddleware, async (req, res) => {
  try {
    const secret = authenticator.generateSecret();
    const uri = authenticator.keyuri(req.business.email, 'Tori', secret);
    const qrDataUrl = await QRCode.toDataURL(uri);

    // Save secret (not yet enabled — confirmed via /2fa/enable)
    const db = getDb();
    db.prepare('UPDATE businesses SET totp_secret = ? WHERE id = ?').run(secret, req.business.id);

    res.json({ secret, qrDataUrl });
  } catch (err) {
    console.error('[2FA] Setup error:', err);
    res.status(500).json({ error: 'Failed to generate 2FA secret' });
  }
});

// POST /api/auth/2fa/enable — verify first TOTP code and activate 2FA
router.post('/2fa/enable', authMiddleware, (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') return res.status(400).json({ error: 'code required' });

  const db = getDb();
  const row = db.prepare('SELECT totp_secret, totp_enabled FROM businesses WHERE id = ?').get(req.business.id);
  if (!row?.totp_secret) return res.status(400).json({ error: 'Run /2fa/setup first' });
  if (row.totp_enabled)  return res.status(400).json({ error: '2FA already enabled' });

  const isValid = authenticator.verify({ token: code.replace(/\s/g, ''), secret: row.totp_secret });
  if (!isValid) return res.status(401).json({ error: 'קוד שגוי, נסה שוב' });

  db.prepare('UPDATE businesses SET totp_enabled = 1 WHERE id = ?').run(req.business.id);
  res.json({ ok: true });
});

// POST /api/auth/2fa/disable — verify current password + code, then disable
router.post('/2fa/disable', authMiddleware, async (req, res) => {
  try {
    const { password, code } = req.body;
    if (!password || !code) return res.status(400).json({ error: 'password and code required' });

    const db = getDb();
    const row = db.prepare('SELECT password, totp_secret, totp_enabled FROM businesses WHERE id = ?').get(req.business.id);
    if (!row?.totp_enabled) return res.status(400).json({ error: '2FA is not enabled' });

    const validPass = await bcrypt.compare(String(password), row.password);
    if (!validPass) return res.status(401).json({ error: 'סיסמה שגויה' });

    const validCode = authenticator.verify({ token: code.replace(/\s/g, ''), secret: row.totp_secret });
    if (!validCode) return res.status(401).json({ error: 'קוד שגוי' });

    db.prepare('UPDATE businesses SET totp_enabled = 0, totp_secret = NULL WHERE id = ?').run(req.business.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('[2FA] Disable error:', err);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

// POST /api/auth/2fa/verify-login — exchange tempToken + TOTP code for full session
router.post('/2fa/verify-login', twoFaLimiter, (req, res) => {
  const { tempToken, code } = req.body;
  if (!tempToken || !code) return res.status(400).json({ error: 'tempToken and code required' });

  let payload;
  try {
    payload = jwt.verify(tempToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ error: 'Session expired, please log in again' });
  }

  if (payload.step !== '2fa') return res.status(401).json({ error: 'Invalid token' });

  const db = getDb();
  const business = db.prepare('SELECT * FROM businesses WHERE id = ? AND is_active = 1').get(payload.businessId);
  if (!business) return res.status(401).json({ error: 'Account not found' });

  const isValid = authenticator.verify({ token: String(code).replace(/\s/g, ''), secret: business.totp_secret });
  if (!isValid) return res.status(401).json({ error: 'קוד שגוי, נסה שוב' });

  const token = jwt.sign({ businessId: business.id, tv: business.token_version || 0 }, process.env.JWT_SECRET, JWT_OPTS);
  setAuthCookie(res, token);

  // Log login event
  try {
    db.prepare('INSERT INTO login_events (business_id, ip, user_agent) VALUES (?, ?, ?)').run(business.id, req.ip || req.connection?.remoteAddress || 'unknown', req.headers['user-agent'] || '');
  } catch (_) {}

  // Send security alert email if enabled
  if (business.security_alerts) {
    const { sendSecurityAlert } = require('../services/email');
    sendSecurityAlert(safeBusiness(business), { ip: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '' }).catch(() => {});
  }

  res.json({ token, business: safeBusiness(business) });
});

// ─── POST /api/auth/admin-reset ───────────────────────────────────────────────
router.post('/admin-reset', adminResetLimiter, async (req, res) => {
  const adminSecret = req.headers['x-admin-secret'];
  const expected = process.env.ADMIN_SECRET;
  // Timing-safe comparison — prevent brute-force timing oracle
  const valid = expected && adminSecret &&
    adminSecret.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(adminSecret), Buffer.from(expected));
  if (!valid) return res.status(403).json({ error: 'Forbidden' });

  const { email, new_password } = req.body;
  if (!email || !new_password || new_password.length < 8) {
    return res.status(400).json({ error: 'email and new_password (min 8 chars) required' });
  }
  const cleanEmail = validator.normalizeEmail(String(email));
  const db = getDb();
  const business = db.prepare('SELECT id FROM businesses WHERE email = ?').get(cleanEmail);
  if (!business) return res.status(404).json({ error: 'Email not found' });
  const hashed = await bcrypt.hash(new_password, 12);
  // Also increment token_version to invalidate all existing sessions
  db.prepare('UPDATE businesses SET password = ?, is_active = 1, token_version = token_version + 1 WHERE email = ?').run(hashed, cleanEmail);
  res.json({ ok: true, message: `Password reset for ${cleanEmail}` });
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword required' });
    if (String(newPassword).length < 8) return res.status(400).json({ error: 'סיסמה חדשה חייבת להכיל לפחות 8 תווים' });
    if (String(newPassword).length > 128) return res.status(400).json({ error: 'סיסמה ארוכה מדי' });

    const db = getDb();
    const row = db.prepare('SELECT password FROM businesses WHERE id = ?').get(req.business.id);
    if (!row) return res.status(404).json({ error: 'Account not found' });

    const valid = await bcrypt.compare(String(currentPassword), row.password);
    if (!valid) return res.status(401).json({ error: 'הסיסמה הנוכחית שגויה' });

    const hashed = await bcrypt.hash(String(newPassword), 12);
    // Also increment token_version to invalidate all existing sessions
    db.prepare('UPDATE businesses SET password = ?, token_version = token_version + 1 WHERE id = ?').run(hashed, req.business.id);

    clearAuthCookie(res);
    res.json({ ok: true });
  } catch (err) {
    console.error('[Auth] Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// GET /api/auth/login-history
router.get('/login-history', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const events = db.prepare('SELECT id, ip, user_agent, created_at FROM login_events WHERE business_id = ? ORDER BY created_at DESC LIMIT 10').all(req.business.id);
    res.json(events);
  } catch (err) {
    console.error('[Auth] Login history error:', err);
    res.status(500).json({ error: 'Failed to fetch login history' });
  }
});

// ─── Default services by business type ───────────────────────────────────────
function getDefaultServices(type) {
  const map = {
    barber_men:  [{ name: 'תספורת', duration: 30, price: 60 }, { name: 'זקן', duration: 20, price: 30 }, { name: 'תספורת + זקן', duration: 45, price: 80 }, { name: 'גוונים', duration: 60, price: 120 }, { name: 'כיורה', duration: 20, price: 25 }],
    barber_women:[{ name: 'תספורת', duration: 45, price: 100 }, { name: 'פן', duration: 30, price: 80 }, { name: 'צבע', duration: 90, price: 200 }, { name: 'גוונים', duration: 120, price: 280 }, { name: 'החלקה', duration: 120, price: 350 }],
    nails:       [{ name: 'לק רגיל', duration: 30, price: 60 }, { name: "ג'ל", duration: 45, price: 100 }, { name: 'אקריל', duration: 60, price: 140 }, { name: 'פדיקור', duration: 45, price: 80 }, { name: 'הסרה', duration: 30, price: 40 }],
    lashes:      [{ name: 'ריסים קלאסי', duration: 90, price: 200 }, { name: 'ריסים וליום', duration: 120, price: 280 }, { name: 'עיצוב גבות', duration: 30, price: 80 }, { name: 'הסרת ריסים', duration: 30, price: 60 }],
    massage:     [{ name: 'עיסוי שוודי 60 דק', duration: 60, price: 250 }, { name: 'עיסוי שוודי 90 דק', duration: 90, price: 350 }, { name: 'עיסוי ספורט', duration: 60, price: 280 }, { name: 'עיסוי רקמות עמוק', duration: 60, price: 300 }],
    tattoo:      [{ name: 'קעקוע קטן', duration: 60, price: 300 }, { name: 'קעקוע בינוני', duration: 120, price: 600 }, { name: 'קעקוע גדול', duration: 180, price: 1000 }, { name: 'ייעוץ עיצוב', duration: 30, price: 0 }],
    cosmetics:   [{ name: 'טיפול פנים בסיסי', duration: 60, price: 200 }, { name: 'טיפול פנים מעמיק', duration: 90, price: 300 }, { name: 'קיסרי', duration: 60, price: 250 }, { name: 'פילינג', duration: 45, price: 180 }],
  };
  return map[type] || [{ name: 'שירות בסיסי', duration: 30, price: 100 }];
}

module.exports = router;
