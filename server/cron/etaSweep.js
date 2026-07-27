const cron = require('node-cron');
const Order = require('../models/Order');
const decisionEngine = require('../services/decisionEngine');

// Runs every 5 minutes
const startEtaSweep = (io) => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running ETA Safety Sweep...');
    try {
      // Find orders that are confirmed and not yet ready
      const activeOrders = await Order.find({
        orderStatus: 'confirmed',
        cookingStatus: { $in: ['queued', 'cooking'] }
      });

      for (const order of activeOrders) {
        // Recompute decision based on current customerLocation
        if (order.customerLocation && order.customerLocation.lat) {
          const updatedOrder = await decisionEngine.computeInitialDecision(order._id);
          
          if (updatedOrder) {
            // Check if estimatedStart drastically changed (e.g., > 10 mins drift)
            // For simplicity, we just push the updated order to the kitchen room if needed
            io.to(`kitchen_${updatedOrder.restaurantId}`).emit('order_updated', updatedOrder);
            io.to(`order_${updatedOrder._id}`).emit('order_updated', updatedOrder);
          }
        }
      }
    } catch (err) {
      console.error('ETA Sweep failed:', err);
    }
  });
};

module.exports = { startEtaSweep };
