const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');

exports.getAllRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find({ status: 'approved' });
    res.json({ success: true, data: restaurants });
  } catch (err) {
    next(err);
  }
};

exports.getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found.' });
    }
    res.json({ success: true, data: restaurant });
  } catch (err) {
    next(err);
  }
};

exports.getOwnerRestaurant = async (req, res, next) => {
  try {
    let restaurant;
    if (req.user.role === 'owner') {
      restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    } else if (req.user.role === 'chef') {
      restaurant = await Restaurant.findById(req.user.restaurantId);
    } else if (req.user.role === 'admin') {
      // Just return the first approved restaurant for testing Admin KDS fallback if needed, or null
      restaurant = await Restaurant.findOne();
    }

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found for this user.' });
    }
    res.json({ success: true, data: restaurant });
  } catch (err) {
    next(err);
  }
};

exports.updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found.' });
    }

    if (restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to manage this restaurant.' });
    }

    // Only allow updating certain fields (address, times, cuisine, etc.)
    const { address, openingTime, closingTime, cuisine } = req.body;
    
    if (address) restaurant.address = address;
    if (openingTime) restaurant.openingTime = openingTime;
    if (closingTime) restaurant.closingTime = closingTime;
    if (cuisine) restaurant.cuisine = Array.isArray(cuisine) ? cuisine : cuisine.split(',').map(c => c.trim());

    if (req.file) {
      restaurant.logo = req.file.path;
    }

    await restaurant.save();

    res.json({ success: true, data: restaurant });
  } catch (err) {
    next(err);
  }
};

exports.getAvailableTables = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found.' });
    }

    if (req.user.role === 'owner' && restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized.' });
    }

    const activeOrders = await Order.find({
      restaurantId: restaurant._id,
      orderStatus: { $in: ['preparing', 'ready', 'delivered'] },
      'table.number': { $exists: true, $ne: null }
    });

    const occupiedTables = new Set(activeOrders.map(order => order.table.number));
    
    const total = restaurant.totalTables || 20;
    const availableTables = [];
    for (let i = 1; i <= total; i++) {
      if (!occupiedTables.has(i)) {
        availableTables.push(i);
      }
    }

    res.json({ success: true, data: availableTables });
  } catch (err) {
    next(err);
  }
};
