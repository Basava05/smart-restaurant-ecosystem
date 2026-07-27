const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, 'Order must have at least one item'],
    },
    totalPrice: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: [
        'pending_payment',
        'confirmed',
        'preparing',
        'ready',
        'delivered',
        'completed',
        'cancelled',
      ],
      default: 'pending_payment',
    },
    cookingStatus: {
      type: String,
      enum: ['queued', 'cooking', 'ready', 'delivered'],
      default: 'queued',
    },
    chefLocked: { type: Boolean, default: false },
    table: {
      number: { type: Number },
      time: { type: Date },
    },
    eta: {
      initial: { type: Number }, // minutes
      current: { type: Number },
      lastUpdated: { type: Date },
    },
    cookingWindow: {
      estimatedStart: { type: Date },
      estimatedFinish: { type: Date },
    },
    customerLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    actualArrival: { type: Date },
    actualDelivery: { type: Date },
    estimatedReadyTime: { type: Date },
  },
  { timestamps: true }
);

// Index for kitchen queue queries
orderSchema.index({ restaurantId: 1, orderStatus: 1 });
orderSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
