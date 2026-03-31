const Stripe = require('stripe');
const { getDb } = require('../config/database');
const { sendPaymentFailed } = require('./email');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const PLAN_PRICE_MAP = {
  basic: process.env.STRIPE_BASIC_PRICE_ID,
  business: process.env.STRIPE_BUSINESS_PRICE_ID,
};

async function createCustomer(business) {
  const db = getDb();

  if (business.stripe_customer_id) {
    return business.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: business.email,
    name: business.owner_name,
    phone: business.phone || undefined,
    metadata: { business_id: String(business.id), business_name: business.name },
  });

  db.prepare('UPDATE businesses SET stripe_customer_id = ? WHERE id = ?').run(customer.id, business.id);
  return customer.id;
}

async function createSubscription(businessId, plan) {
  const db = getDb();
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId);
  if (!business) throw new Error('Business not found');

  const priceId = PLAN_PRICE_MAP[plan];
  if (!priceId) throw new Error('Invalid plan or price not configured');

  const customerId = await createCustomer(business);

  // Cancel existing subscription if any
  if (business.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(business.stripe_subscription_id);
    } catch (e) { /* ignore */ }
  }

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata: { business_id: String(businessId), plan },
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });

  db.prepare(`
    UPDATE businesses SET
      plan = ?,
      stripe_subscription_id = ?,
      subscription_status = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(plan, subscription.id, subscription.status, businessId);

  return {
    subscriptionId: subscription.id,
    status: subscription.status,
    clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
  };
}

async function cancelSubscription(businessId) {
  const db = getDb();
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId);
  if (!business || !business.stripe_subscription_id) throw new Error('No active subscription');

  await stripe.subscriptions.cancel(business.stripe_subscription_id);

  db.prepare(`
    UPDATE businesses SET
      plan = 'cancelled',
      subscription_status = 'cancelled',
      is_active = 0,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(businessId);
}

async function getBillingPortalUrl(businessId) {
  const db = getDb();
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId);
  if (!business) throw new Error('Business not found');

  const customerId = await createCustomer(business);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.CLIENT_URL}/dashboard/settings`,
  });

  return session.url;
}

async function handleWebhook(rawBody, sig) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('[Stripe] No webhook secret configured, skipping verification');
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  const db = getDb();
  console.log(`[Stripe] Event: ${event.type}`);

  switch (event.type) {
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const subId = invoice.subscription;
      if (!subId) break;

      const business = db.prepare('SELECT * FROM businesses WHERE stripe_subscription_id = ?').get(subId);
      if (!business) break;

      db.prepare(`
        UPDATE businesses SET
          subscription_status = 'active',
          plan = COALESCE(plan, 'basic'),
          updated_at = datetime('now')
        WHERE id = ?
      `).run(business.id);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const subId = invoice.subscription;
      if (!subId) break;

      const business = db.prepare('SELECT * FROM businesses WHERE stripe_subscription_id = ?').get(subId);
      if (!business) break;

      db.prepare(`
        UPDATE businesses SET subscription_status = 'past_due', updated_at = datetime('now') WHERE id = ?
      `).run(business.id);

      sendPaymentFailed(business).catch(console.error);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const business = db.prepare('SELECT * FROM businesses WHERE stripe_subscription_id = ?').get(sub.id);
      if (!business) break;

      db.prepare(`
        UPDATE businesses SET
          plan = 'cancelled',
          subscription_status = 'cancelled',
          updated_at = datetime('now')
        WHERE id = ?
      `).run(business.id);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const business = db.prepare('SELECT * FROM businesses WHERE stripe_subscription_id = ?').get(sub.id);
      if (!business) break;

      db.prepare(`
        UPDATE businesses SET subscription_status = ?, updated_at = datetime('now') WHERE id = ?
      `).run(sub.status, business.id);
      break;
    }
  }
}

module.exports = {
  createCustomer,
  createSubscription,
  cancelSubscription,
  getBillingPortalUrl,
  handleWebhook,
};
