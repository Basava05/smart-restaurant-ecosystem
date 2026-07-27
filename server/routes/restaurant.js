const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

// Public route to get all approved restaurants
router.get('/', restaurantController.getAllRestaurants);

// Public route to get restaurant details by ID
router.get('/:id', restaurantController.getRestaurant);

// Protected routes
router.use(authMiddleware);

// Get the logged-in user's associated restaurant
router.get('/owner/me', requireRole('owner', 'chef', 'admin'), restaurantController.getOwnerRestaurant);

// Update restaurant details (with optional logo upload)
router.patch('/:id', requireRole('owner'), upload.single('logo'), restaurantController.updateRestaurant);

// Get available tables for a restaurant
router.get('/:id/available-tables', requireRole('owner', 'chef', 'admin'), restaurantController.getAvailableTables);

module.exports = router;
