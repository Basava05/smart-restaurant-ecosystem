const { z } = require('zod');

/**
 * Validation middleware factory — takes a Zod schema and validates req.body.
 * Section 10: never trust client input, especially price/quantity.
 */
const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.body = parsed; // Replace body with parsed/cleaned values
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        errors: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    next(err);
  }
};

module.exports = validate;
