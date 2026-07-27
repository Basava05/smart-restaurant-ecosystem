const cron = require('node-cron');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const AnalyticsRollup = require('../models/AnalyticsRollup');

const startNightlyRollup = () => {
  // Run at 00:01 AM every day
  cron.schedule('1 0 * * *', async () => {
    console.log('Running Nightly Analytics Rollup...');
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Aggregate completed orders from yesterday
      const aggregatedData = await Order.aggregate([
        {
          $match: {
            orderStatus: 'completed',
            createdAt: { $gte: yesterday, $lt: today }
          }
        },
        {
          $group: {
            _id: '$restaurantId',
            totalRevenue: { $sum: '$totalPrice' },
            totalOrders: { $sum: 1 },
            items: { $push: '$items' }
          }
        }
      ]);

      for (const data of aggregatedData) {
        // Save to AnalyticsRollup
        await AnalyticsRollup.create({
          restaurantId: data._id,
          date: yesterday,
          totalRevenue: data.totalRevenue,
          totalOrders: data.totalOrders,
        });

        // Calculate item popularity (+1 score for each quantity ordered)
        const itemCounts = {};
        data.items.flat().forEach(item => {
          itemCounts[item.menuItemId] = (itemCounts[item.menuItemId] || 0) + item.qty;
        });

        for (const [menuItemId, count] of Object.entries(itemCounts)) {
          await MenuItem.findByIdAndUpdate(menuItemId, {
            $inc: { popularityScore: count }
          });
        }
      }
      console.log('Nightly Rollup Complete');
    } catch (err) {
      console.error('Nightly Rollup failed:', err);
    }
  });
};

module.exports = { startNightlyRollup };
