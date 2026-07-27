const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

// Webhook endpoint needs the RAW body to verify the signature, so we bypass normal express.json()
// by mounting it before other middlewares or using express.raw() locally.
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.webhook
);

// Protected routes
router.use(authMiddleware);

// Create a razorpay order for an existing SRE order
router.post('/create', requireRole('customer'), paymentController.createPaymentOrder);

// Verify signature sent from client after payment
router.post('/verify', requireRole('customer'), paymentController.verifyPayment);

module.exports = router;
