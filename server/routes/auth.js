const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerSchema, loginSchema, refreshSchema } = require('../validators/authValidator');

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), authController.login);

// POST /api/auth/refresh
router.post('/refresh', validate(refreshSchema), authController.refresh);

module.exports = router;
