const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    name: { type: String, required: [true, 'Item name is required'], trim: true },
    description: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    prepTime: { type: Number, default: 15 }, // minutes
    image: { type: String },
    available: { type: Boolean, default: true },
    weatherTags: [{ type: String, trim: true }], // e.g., ['hot', 'rainy', 'cold']
    popularityScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index for weather-based menu queries
menuItemSchema.index({ restaurantId: 1, weatherTags: 1 });
menuItemSchema.index({ restaurantId: 1, category: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
