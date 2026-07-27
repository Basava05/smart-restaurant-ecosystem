const express = require('express');
const protect = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');
const Order = require('../models/Order');
const AnalyticsRollup = require('../models/AnalyticsRollup');

const router = express.Router();

router.get('/:restaurantId', protect, requireRole('owner', 'admin'), async (req, res, next) => {
  try {
    const { restaurantId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Live Today Metrics
    const mongoose = require('mongoose');
    const todayData = await Order.aggregate([
      {
        $match: {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          // Include all active/completed statuses except pending and cancelled
          orderStatus: { $in: ['confirmed', 'preparing', 'ready', 'delivered', 'completed'] },
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          todayRevenue: { $sum: '$totalPrice' },
          todayOrders: { $sum: 1 }
        }
      }
    ]);

    // 2. Historical Rollup Metrics (last 7 days)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const history = await AnalyticsRollup.find({
      restaurantId,
      date: { $gte: sevenDaysAgo, $lt: today }
    }).sort({ date: 1 });

    res.json({
      success: true,
      data: {
        today: todayData.length > 0 ? todayData[0] : { todayRevenue: 0, todayOrders: 0 },
        history
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
