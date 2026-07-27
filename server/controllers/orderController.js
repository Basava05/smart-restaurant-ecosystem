const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const Notification = require('../models/Notification');

exports.createOrder = async (req, res, next) => {
  try {
    const { restaurantId, items, tableNumber, customerLocation } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Order must contain at least one item.' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found.' });
    }

    // Server-side price recomputation (Section 10 non-negotiable rule)
    // We completely ignore any price sent from the client.
    let computedTotal = 0;
    const validatedItems = [];
    let totalPrepTime = 0;

    for (const clientItem of items) {
      const dbItem = await MenuItem.findById(clientItem.menuItemId);
      if (!dbItem || !dbItem.available || dbItem.restaurantId.toString() !== restaurantId) {
        return res.status(400).json({ 
          success: false, 
          error: `Item ${clientItem.name || clientItem.menuItemId} is not available.` 
        });
      }

      // Use DB price, not client price
      computedTotal += dbItem.price * clientItem.qty;
      totalPrepTime += (dbItem.prepTime || 15) * clientItem.qty; // simple sum for now

      validatedItems.push({
        menuItemId: dbItem._id,
        name: dbItem.name,
        qty: clientItem.qty,
        price: dbItem.price,
      });
    }

    const order = await Order.create({
      customerId: req.user.id,
      restaurantId,
      items: validatedItems,
      totalPrice: computedTotal,
      table: tableNumber ? { number: tableNumber, time: new Date() } : null,
      customerLocation: customerLocation || null, // from Phase 6
      paymentStatus: 'pending',
      orderStatus: 'pending_payment',
    });

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created, pending payment.',
    });
  } catch (err) {
    next(err);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurantId', 'name address location')
      .populate('customerId', 'name phone');

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    // Access check: only the customer who placed it or the restaurant owner/chef
    if (
      order.customerId._id.toString() !== req.user.id &&
      !['owner', 'chef', 'admin'].includes(req.user.role)
    ) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};


exports.getKitchenOrders = async (req, res, next) => {
  try {
    // Security check: ensure user is authorized for this restaurant
    if (req.user.role === 'owner') {
      const restaurant = await require('../models/Restaurant').findById(req.params.restaurantId);
      if (!restaurant || restaurant.ownerId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Unauthorized.' });
      }
    } else if (req.user.role === 'chef') {
      if (req.user.restaurantId.toString() !== req.params.restaurantId) {
        return res.status(403).json({ success: false, error: 'Unauthorized.' });
      }
    }

    const orders = await Order.find({
      restaurantId: req.params.restaurantId,
      orderStatus: { $in: ['confirmed', 'preparing', 'ready', 'delivered'] },
    }).sort({ createdAt: 1 }); // oldest first = FIFO queue
    
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

exports.getRestaurantOrders = async (req, res, next) => {
  try {
    if (req.user.role === 'owner') {
      const restaurant = await require('../models/Restaurant').findById(req.params.restaurantId);
      if (!restaurant || restaurant.ownerId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Unauthorized.' });
      }
    } else if (!['admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Unauthorized.' });
    }

    const orders = await Order.find({
      restaurantId: req.params.restaurantId,
    })
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

exports.updateKitchenStatus = async (req, res, next) => {
  try {
    const { id: orderId } = req.params;  // route is /:id/kitchen
    const { cookingStatus, cookingWindow } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Security check - Only Chefs can update kitchen status
    if (req.user.role === 'owner') {
      return res.status(403).json({ success: false, error: 'Only chefs can update kitchen status.' });
    } else if (req.user.role === 'chef') {
      if (req.user.restaurantId.toString() !== order.restaurantId.toString()) {
        return res.status(403).json({ success: false, error: 'Unauthorized.' });
      }
    }

    if (cookingStatus) order.cookingStatus = cookingStatus;
    if (cookingWindow) order.cookingWindow = cookingWindow;
    if (req.body.estimatedReadyTime) order.estimatedReadyTime = req.body.estimatedReadyTime;

    // When chef starts cooking, set the estimated ready time if not already set by override
    if (cookingStatus === 'cooking' && !req.body.estimatedReadyTime) {
      const additionalMins = order.items.reduce((sum, i) => sum + ((i.qty || 1) * 5), 0);
      const prepMins = 15 + additionalMins; // Base 15 mins + 5 mins per item
      order.estimatedReadyTime = new Date(Date.now() + prepMins * 60 * 1000);
      order.orderStatus = 'preparing';
    }
    // When chef marks ready, update order status
    if (cookingStatus === 'ready') {
      order.orderStatus = 'ready';
    }

    await order.save();

    // Phase 10: Notification Trigger
    if (cookingStatus === 'cooking') {
      const notification = await Notification.create({
        receiverId: order.customerId,
        title: 'Order is being prepared!',
        message: `Your order #${order._id.toString().slice(-4).toUpperCase()} is now being cooked.`,
        type: 'order_cooking',
        orderId: order._id
      });
      if (req.io) {
        req.io.to(`order_${order._id}`).emit('notification', notification);
      }
    }

    if (cookingStatus === 'ready') {
      const notification = await Notification.create({
        receiverId: order.customerId,
        title: 'Order Ready!',
        message: `Your order #${order._id.toString().slice(-4).toUpperCase()} is hot and ready for pickup.`,
        type: 'order_ready',
        orderId: order._id
      });
      if (req.io) {
        req.io.to(`order_${order._id}`).emit('notification', notification);
      }
    }

    // Emit update so clients and KDS sync
    if (req.io) {
      req.io.to(`kitchen_${order.restaurantId.toString()}`).emit('order_updated', order);
      req.io.to(`order_${order._id.toString()}`).emit('order_updated', order);
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/my — customer's own paid order history
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customerId: req.user.id, paymentStatus: 'paid' })
      .populate('restaurantId', 'name logo address')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

exports.assignTable = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (req.user.role === 'owner') {
      const restaurant = await Restaurant.findById(order.restaurantId);
      if (restaurant.ownerId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Unauthorized.' });
      }
    }

    order.table = {
      number: req.body.tableNumber,
      time: new Date()
    };
    await order.save();

    if (req.io) {
      req.io.to(`kitchen_${order.restaurantId.toString()}`).emit('order_updated', order);
      req.io.to(`order_${order._id.toString()}`).emit('order_updated', order);
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (req.user.role === 'owner') {
      const restaurant = await Restaurant.findById(order.restaurantId);
      if (restaurant.ownerId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Unauthorized.' });
      }
    }

    if (req.body.orderStatus) {
      order.orderStatus = req.body.orderStatus;
    }
    
    await order.save();

    if (req.io) {
      req.io.to(`kitchen_${order.restaurantId.toString()}`).emit('order_updated', order);
      req.io.to(`order_${order._id.toString()}`).emit('order_updated', order);
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};
