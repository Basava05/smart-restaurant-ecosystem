const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

exports.getSystemMetrics = async (req, res, next) => {
  try {
    const [usersCount, restaurantsCount, ordersCount] = await Promise.all([
      User.countDocuments(),
      Restaurant.countDocuments(),
      Order.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        users: usersCount,
        restaurants: restaurantsCount,
        orders: ordersCount
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

exports.getAllRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find().populate('ownerId', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, data: restaurants });
  } catch (err) {
    next(err);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('restaurantId', 'name')
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

exports.impersonateUser = async (req, res, next) => {
  try {
    const userToImpersonate = await User.findById(req.params.userId);
    
    if (!userToImpersonate) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Generate new token for the target user
    const token = jwt.sign(
      { id: userToImpersonate._id, role: userToImpersonate.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      user: {
        _id: userToImpersonate._id,
        name: userToImpersonate.name,
        email: userToImpersonate.email,
        role: userToImpersonate.role,
      }
    });
  } catch (err) {
    next(err);
  }
};
