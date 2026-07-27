const mongoose = require('mongoose');

const analyticsRollupSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    date: { type: String, required: true }, // YYYY-MM-DD
    revenue: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    topItems: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
        name: { type: String },
        qty: { type: Number },
      },
    ],
    avgEtaAccuracyMinutes: { type: Number },
    weatherBreakdown: [
      {
        condition: { type: String },
        orderCount: { type: Number },
      },
    ],
    peakHours: [
      {
        hour: { type: Number },
        orderCount: { type: Number },
      },
    ],
    categoryBreakdown: [
      {
        category: { type: String },
        revenue: { type: Number },
        qty: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

// One document per restaurant per day
analyticsRollupSchema.index({ restaurantId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AnalyticsRollup', analyticsRollupSchema);
