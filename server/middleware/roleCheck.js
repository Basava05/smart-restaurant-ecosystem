/**
 * Role-check middleware — restricts access to specific roles.
 * Must be used AFTER authMiddleware (which attaches req.user).
 *
 * Usage: router.get('/admin', authMiddleware, requireRole('admin'), handler)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied — requires one of: ${roles.join(', ')}.`,
      });
    }
    next();
  };
};

module.exports = requireRole;
