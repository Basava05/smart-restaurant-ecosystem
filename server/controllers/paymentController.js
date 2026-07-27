const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const decisionEngine = require('../services/decisionEngine');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

exports.createPaymentOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    if (order.customerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    // Razorpay works in paise, so multiply INR by 100
    const options = {
      amount: order.totalPrice * 100,
      currency: 'INR',
      receipt: `receipt_order_${order._id}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);
    const razorpayOrderId = razorpayOrder.id;
    const razorpayAmount = razorpayOrder.amount;
    const razorpayCurrency = razorpayOrder.currency;

    // Create a pending payment record
    await Payment.create({
      orderId: order._id,
      customerId: req.user.id,
      amount: order.totalPrice,
      razorpayOrderId,
      status: 'pending',
    });

    res.json({
      success: true,
      data: {
        id: razorpayOrderId,
        amount: razorpayAmount,
        currency: razorpayCurrency,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Invalid payment signature.' });
    }

    // Update payment record
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        signatureVerified: true,
        status: 'completed',
      }
    );

    // Atomically update order status (non-negotiable rule)
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId, orderStatus: 'pending_payment' },
      { $set: { paymentStatus: 'paid', orderStatus: 'confirmed' } },
      { new: true }
    );

    // Immediately notify the kitchen so they see the order on KDS right away
    if (updatedOrder && req.io) {
      req.io.to(`kitchen_${updatedOrder.restaurantId.toString()}`).emit('new_order', updatedOrder);
    }

    // Fire off the Decision Engine asynchronously to calculate OSRM ETA and cooking window
    if (updatedOrder) {
      decisionEngine.computeInitialDecision(updatedOrder._id).then((fullyUpdatedOrder) => {
        // Re-emit with ETA data once decision engine is done
        if (fullyUpdatedOrder && req.io) {
          req.io.to(`kitchen_${fullyUpdatedOrder.restaurantId.toString()}`).emit('order_updated', fullyUpdatedOrder);
        }
      });
    }

    res.json({ success: true, message: 'Payment verified successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.webhook = async (req, res) => {
  // A real webhook must verify the signature headers sent by Razorpay.
  // We use express.raw({ type: 'application/json' }) in the route for this.
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';
  
  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(req.body); // req.body here is the raw buffer
  const digest = shasum.digest('hex');

  if (digest !== req.headers['x-razorpay-signature']) {
    return res.status(400).send('Invalid signature');
  }

  // Parse body now that signature is validated
  const payload = JSON.parse(req.body);

  if (payload.event === 'payment.captured') {
    const paymentEntity = payload.payload.payment.entity;
    const razorpayOrderId = paymentEntity.order_id;

    // We can also fetch the payment record here and ensure the order is marked paid
    const payment = await Payment.findOne({ razorpayOrderId });
    if (payment && payment.status !== 'completed') {
      payment.status = 'completed';
      payment.razorpayPaymentId = paymentEntity.id;
      await payment.save();

      await Order.findOneAndUpdate(
        { _id: payment.orderId, orderStatus: 'pending_payment' },
        { $set: { paymentStatus: 'completed', orderStatus: 'accepted' } }
      );
    }
  }

  res.json({ status: 'ok' });
};
