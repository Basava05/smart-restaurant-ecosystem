const express = require('express');
const protect = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');
const adminController = require('../controllers/adminController');

const router = express.Router();

// All routes require admin
router.use(protect, requireRole('admin'));

router.get('/metrics', adminController.getSystemMetrics);
router.get('/users', adminController.getAllUsers);
router.get('/restaurants', adminController.getAllRestaurants);
router.get('/orders', adminController.getAllOrders);
router.post('/impersonate/:userId', adminController.impersonateUser);

module.exports = router;
