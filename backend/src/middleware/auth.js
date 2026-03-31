const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  const token = authHeader.slice(7);
  if (!token || token.length > 512) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const businessId = parseInt(payload.businessId, 10);
  if (!businessId || businessId <= 0) {
    return res.status(401).json({ error: 'Invalid token payload' });
  }

  const db = getDb();
  // Only select columns we need — never select password
  const business = db.prepare(`
    SELECT id, name, type, owner_name, email, phone, address, city, description,
           logo_url, plan, is_active, whatsapp_number, buffer_minutes,
           cancellation_hours, trial_ends_at, stripe_customer_id,
           stripe_subscription_id, created_at, updated_at
    FROM businesses WHERE id = ? AND is_active = 1
  `).get(businessId);

  if (!business) {
    return res.status(401).json({ error: 'Account not found or inactive' });
  }

  req.business = business;
  next();
}

module.exports = authMiddleware;
