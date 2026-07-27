const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Restaurant name is required'], trim: true },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    address: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    openingTime: { type: String, default: '09:00' }, // HH:mm
    closingTime: { type: String, default: '22:00' },
    cuisine: [{ type: String, trim: true }],
    avgPrepTime: { type: Number, default: 20 }, // minutes
    rating: { type: Number, default: 0, min: 0, max: 5 },
    logo: { type: String },
    qrCode: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended'],
      default: 'pending',
    },
    totalTables: { type: Number, default: 20 },
  },
  { timestamps: true }
);

// 2dsphere index for proximity queries
restaurantSchema.index({ 'location.lat': 1, 'location.lng': 1 });

module.exports = mongoose.model('Restaurant', restaurantSchema);
