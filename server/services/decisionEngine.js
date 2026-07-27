const axios = require('axios');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

/**
 * Computes travel ETA and determines the optimal cooking start time
 * so the food is fresh exactly when the customer arrives.
 */
exports.computeInitialDecision = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order || !order.customerLocation || !order.customerLocation.lat) return;

    const restaurant = await Restaurant.findById(order.restaurantId);
    if (!restaurant || !restaurant.location || !restaurant.location.lat) return;

    // 1. Calculate travel time using OSRM (Phase 6 requirement)
    // OSRM expects coordinates in lng,lat format
    const start = `${order.customerLocation.lng},${order.customerLocation.lat}`;
    const end = `${restaurant.location.lng},${restaurant.location.lat}`;
    
    // Fallback ETA if API fails (e.g., 15 mins)
    let travelTimeMinutes = 15;
    
    try {
      const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${start};${end}?overview=false`;
      const response = await axios.get(osrmUrl);
      
      if (response.data.code === 'Ok' && response.data.routes.length > 0) {
        const durationSeconds = response.data.routes[0].duration;
        travelTimeMinutes = Math.ceil(durationSeconds / 60);
      }
    } catch (osrmErr) {
      console.warn('OSRM routing failed, using fallback ETA:', osrmErr.message);
    }

    // 2. Compute total prep time for the order
    let totalPrepTime = 0;
    for (const item of order.items) {
      const dbItem = await MenuItem.findById(item.menuItemId);
      // For simplicity, we just take the max prep time of any item, or sum them. 
      // Real kitchens parallelize, so max is a better approximation for single chef.
      if (dbItem && dbItem.prepTime > totalPrepTime) {
        totalPrepTime = dbItem.prepTime;
      }
    }
    // Fallback if no prep time found
    if (totalPrepTime === 0) totalPrepTime = 15;

    // 3. Decision Logic: ETA + prepTime -> cookStartDelay
    // If travel time is 30 mins, and prep time is 10 mins:
    // We should start cooking in 20 mins (30 - 10).
    const now = new Date();
    let delayMinutes = travelTimeMinutes - totalPrepTime;
    
    // If they are closer than the prep time, start immediately (delay = 0)
    if (delayMinutes < 0) {
      delayMinutes = 0;
    }

    const estimatedStart = new Date(now.getTime() + delayMinutes * 60000);
    const estimatedFinish = new Date(estimatedStart.getTime() + totalPrepTime * 60000);

    order.eta = {
      initial: travelTimeMinutes,
      current: travelTimeMinutes,
      lastUpdated: now,
    };
    
    order.cookingWindow = {
      estimatedStart,
      estimatedFinish,
    };

    // If starting immediately, put it directly in the cooking queue
    if (delayMinutes === 0) {
      order.cookingStatus = 'queued'; // Kitchen will pick it up
    } else {
      order.cookingStatus = 'queued'; // We leave it queued, but the KDS sorts by estimatedStart
    }

    await order.save();
    
    return order;
  } catch (err) {
    console.error('Decision Engine Error:', err);
  }
};
