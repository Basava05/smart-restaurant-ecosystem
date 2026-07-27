const rateLimit = require('express-rate-limit');

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs for auth routes
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
