const { ApiError } = require('../errorHandler');

/**
 * Middleware to authorize only users with 'partner' role
 */
const authorizePartner = (req, res, next) => {
  if (req.user && req.user.role === 'Partner') {
    return next();
  }

  return next(new ApiError('Access denied. Partner role required.', 403));
};

module.exports = authorizePartner;
