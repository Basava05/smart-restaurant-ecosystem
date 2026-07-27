const mongoose = require('mongoose');

const weatherCacheSchema = new mongoose.Schema({
  locationKey: { type: String, required: true, unique: true }, // e.g., "17.39,78.49"
  temperature: { type: Number },
  condition: { type: String }, // e.g., "Rain", "Clear", "Clouds"
  humidity: { type: Number },
  rain: { type: Boolean, default: false },
  description: { type: String },
  icon: { type: String },
  fetchedAt: { type: Date, default: Date.now },
});

// TTL index — documents auto-delete ~15 minutes after fetchedAt
weatherCacheSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 900 });

module.exports = mongoose.model('WeatherCache', weatherCacheSchema);
