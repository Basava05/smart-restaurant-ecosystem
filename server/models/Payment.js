const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ['razorpay', 'cash'],
      default: 'razorpay',
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    signatureVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

paymentSchema.index({ orderId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
