const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Auth middleware — verifies the JWT access token on every protected route.
 * Attaches the decoded user (with role) to req.user.
 *
 * Why this runs on every request: a role check that only hides UI buttons
 * client-side is trivially bypassed by any HTTP client or browser devtools.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied — no token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists and is active
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User no longer exists.',
      });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Account has been suspended.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired — please refresh.',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid token.',
    });
  }
};

module.exports = authMiddleware;
