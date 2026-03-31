const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const stripeService = require('../services/stripe');

// Stripe webhook: must be raw body
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    await stripeService.handleWebhook(req.body, sig);
    res.json({ received: true });
  } catch (err) {
    console.error('[Stripe] Webhook error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Protected routes
router.use(authMiddleware);

// POST /api/stripe/subscribe
router.post('/subscribe', async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['basic', 'business'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    const result = await stripeService.createSubscription(req.business.id, plan);
    res.json(result);
  } catch (err) {
    console.error('[Stripe] Subscribe error:', err);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// POST /api/stripe/cancel
router.post('/cancel', async (req, res) => {
  try {
    await stripeService.cancelSubscription(req.business.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Stripe] Cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// GET /api/stripe/portal
router.get('/portal', async (req, res) => {
  try {
    const url = await stripeService.getBillingPortalUrl(req.business.id);
    res.json({ url });
  } catch (err) {
    console.error('[Stripe] Portal error:', err);
    res.status(500).json({ error: 'Failed to get billing portal' });
  }
});

module.exports = router;
