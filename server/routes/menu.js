const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

// Public route to get a restaurant's menu
router.get('/restaurant/:restaurantId', menuController.getMenuItems);

// Protected routes (Owner only)
router.use(authMiddleware);
router.use(requireRole('owner'));

// Create a new menu item (with optional image)
router.post('/restaurant/:restaurantId', upload.single('image'), menuController.createMenuItem);

// Update a menu item
router.patch('/:itemId', upload.single('image'), menuController.updateMenuItem);

// Delete a menu item
router.delete('/:itemId', menuController.deleteMenuItem);

module.exports = router;
