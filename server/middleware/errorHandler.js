/**
 * Global error handler middleware.
 * Express recognises a 4-argument function as an error handler.
 * Catches anything thrown or passed to next(err) in route handlers.
 */
const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err.message);
  console.error(err.stack);

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, errors: messages });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      error: `A record with that ${field} already exists.`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token has expired.' });
  }

  const statusCode = err.statusCode || 500;
  
  // Extract error message (Razorpay uses err.error.description or err.description)
  const message = err.message || (err.error && err.error.description) || err.description || 'Internal server error.';

  res.status(statusCode).json({
    success: false,
    error: message,
    details: err,
  });
};

module.exports = errorHandler;
