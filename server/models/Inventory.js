const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    item: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'units' },
    lowStockThreshold: { type: Number, default: 10 },
  },
  { timestamps: true }
);

inventorySchema.index({ restaurantId: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
