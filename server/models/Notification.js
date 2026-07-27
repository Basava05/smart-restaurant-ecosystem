const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'order_confirmed',
        'order_cooking',
        'order_ready',
        'order_delivered',
        'order_cancelled',
        'eta_updated',
        'payment_received',
        'restaurant_approved',
        'low_stock',
      ],
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true }
);

notificationSchema.index({ receiverId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
