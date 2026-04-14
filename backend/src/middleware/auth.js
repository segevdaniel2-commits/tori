const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');

function authMiddleware(req, res, next) {
  // ── Accept token from httpOnly cookie OR Authorization: Bearer header ────────
  let token = req.cookies?.tori_token;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  if (token.length > 512) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const businessId = parseInt(payload.businessId, 10);
  if (!businessId || businessId <= 0) {
    return res.status(401).json({ error: 'Invalid token payload' });
  }

  const db = getDb();
  const business = db.prepare(`
    SELECT id, name, type, owner_name, email, phone, address, city, description,
           logo_url, plan, is_active, whatsapp_number, buffer_minutes,
           cancellation_hours, trial_ends_at, stripe_customer_id,
           stripe_subscription_id, created_at, updated_at, token_version,
           totp_enabled
    FROM businesses WHERE id = ? AND is_active = 1
  `).get(businessId);

  if (!business) {
    return res.status(401).json({ error: 'Account not found or inactive' });
  }

  // ── JWT Revocation: token_version must match DB ────────────────────────────
  // tv defaults to 0 for tokens issued before this feature was added
  const tokenVersion = payload.tv ?? 0;
  if (tokenVersion !== (business.token_version ?? 0)) {
    return res.status(401).json({ error: 'Session revoked, please log in again' });
  }

  // Strip token_version from the exposed business object (internal field)
  const { token_version, ...safeBusiness } = business;
  req.business = safeBusiness;
  next();
}

module.exports = authMiddleware;
