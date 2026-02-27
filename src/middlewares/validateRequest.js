const { ZodError } = require('zod');

const validateRequest = (schema) => {
  return (req, res, next) => {
    // Guard: if body is missing entirely (e.g. wrong Content-Type header or
    // empty request), return a clear error rather than letting Zod emit the
    // opaque "expected object, received undefined" root error.
    if (req.body === undefined || req.body === null) {
      return res.status(400).json({
        status: false,
        message: 'Request body is required. Make sure you set Content-Type: application/json.',
        errors: []
      });
    }

    try {
      const parsed = schema.parse(req.body);
      req.validatedBody = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          status: false,
          message: 'Validation failed',
          errors,
        });
      }
      next(error);
    }
  };
};

module.exports = validateRequest;
