const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

// All order routes require authentication
router.use(authMiddleware);

// Get current customer's order history (must come BEFORE /:id route)
router.get('/my', orderController.getMyOrders);

// Create a new order (customer role)
router.post('/', requireRole('customer', 'admin'), orderController.createOrder);

// Get order details (customer tracking or kitchen/owner view)
router.get('/:id', orderController.getOrder);

// Phase 7/10: Kitchen & Owner routes
router.get('/kitchen/:restaurantId', requireRole('owner', 'chef', 'admin'), orderController.getKitchenOrders);
router.get('/restaurant/:restaurantId', requireRole('owner', 'admin'), orderController.getRestaurantOrders);
router.patch('/:id/kitchen', requireRole('owner', 'chef', 'admin'), orderController.updateKitchenStatus);
router.patch('/:id/table', requireRole('owner', 'admin'), orderController.assignTable);
router.patch('/:id/status', requireRole('owner', 'admin'), orderController.updateOrderStatus);

module.exports = router;
