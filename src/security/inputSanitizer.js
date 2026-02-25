const validator = require('validator');

/**
 * Input Sanitization & Validation Middleware
 * Prevents XSS, SQL Injection, NoSQL Injection
 */

// Dangerous patterns to detect
const DANGEROUS_PATTERNS = [
  /\$where/i,
  /\$gt/i,
  /\$lt/i,
  /\$ne/i,
  /\$regex/i,
  /\$or/i,
  /\$and/i,
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i, // onclick=, onerror=, etc.
  /data:/i,
  /vbscript:/i
];

/**
 * Recursively sanitize object values
 */
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    // Escape HTML entities
    let sanitized = validator.escape(value);
    // Trim whitespace
    sanitized = validator.trim(sanitized);
    return sanitized;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (typeof value === 'object' && value !== null) {
    return sanitizeObject(value);
  }
  return value;
};

/**
 * Sanitize all string values in an object
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Check for MongoDB operator injection in keys
    if (key.startsWith('$')) {
      console.warn(`Blocked suspicious key: ${key}`);
      continue; // Skip dangerous keys
    }
    sanitized[key] = sanitizeValue(value);
  }
  return sanitized;
};

/**
 * Check for dangerous patterns in input
 */
const containsDangerousPattern = (value) => {
  if (typeof value !== 'string') return false;
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(value));
};

/**
 * Deep check object for dangerous patterns
 */
const checkForDangerousPatterns = (obj, path = '') => {
  if (!obj || typeof obj !== 'object') {
    if (containsDangerousPattern(obj)) {
      return path || 'value';
    }
    return null;
  }

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (key.startsWith('$')) {
      return currentPath;
    }

    if (typeof value === 'string' && containsDangerousPattern(value)) {
      return currentPath;
    }

    if (typeof value === 'object' && value !== null) {
      const result = checkForDangerousPatterns(value, currentPath);
      if (result) return result;
    }
  }

  return null;
};

/**
 * Middleware to sanitize request body
 */
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    // Check for dangerous patterns first
    const dangerousPath = checkForDangerousPatterns(req.body);
    if (dangerousPath) {
      console.warn(`Blocked dangerous input at: ${dangerousPath}`, {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      return res.status(400).json({
        status: false,
        message: 'Invalid input detected'
      });
    }

    // Sanitize the body
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Middleware to sanitize query parameters
 */
const sanitizeQuery = (req, res, next) => {
  if (req.query && typeof req.query === 'object') {
    const dangerousPath = checkForDangerousPatterns(req.query);
    if (dangerousPath) {
      console.warn(`Blocked dangerous query at: ${dangerousPath}`, {
        ip: req.ip,
        path: req.path
      });
      return res.status(400).json({
        status: false,
        message: 'Invalid query parameters'
      });
    }
    // Note: req.query is read-only in Express 5, so we cannot reassign it.
    // The dangerous pattern check above already blocks NoSQL injection keys.
  }
  next();
};

/**
 * Middleware to sanitize URL parameters
 */
const sanitizeParams = (req, res, next) => {
  if (req.params && typeof req.params === 'object') {
    for (const [key, value] of Object.entries(req.params)) {
      if (typeof value === 'string') {
        // Only allow alphanumeric, hyphens, and underscores in URL params
        if (!/^[a-zA-Z0-9\-_]+$/.test(value)) {
          // Allow MongoDB ObjectIds
          if (!/^[a-fA-F0-9]{24}$/.test(value)) {
            // Allow slugs with dots
            if (!/^[a-zA-Z0-9\-_.]+$/.test(value)) {
              console.warn(`Invalid URL parameter: ${key}=${value}`);
              return res.status(400).json({
                status: false,
                message: 'Invalid URL parameter'
              });
            }
          }
        }
      }
    }
  }
  next();
};

/**
 * Validation helpers
 */
const validationHelpers = {
  isValidEmail: (email) => validator.isEmail(email || ''),

  isValidMobile: (mobile) => /^[6-9][0-9]{9}$/.test(mobile || ''),

  isStrongPassword: (password) => {
    if (!password || password.length < 8) return false;
    // At least one uppercase, one lowercase, one number
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  },

  isValidObjectId: (id) => /^[a-fA-F0-9]{24}$/.test(id || ''),

  isValidSlug: (slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || ''),

  isValidURL: (url) => validator.isURL(url || '', {
    protocols: ['http', 'https'],
    require_protocol: true
  }),

  sanitizeString: (str, maxLength = 1000) => {
    if (typeof str !== 'string') return '';
    return validator.escape(validator.trim(str)).slice(0, maxLength);
  },

  sanitizeHTML: (html) => {
    if (typeof html !== 'string') return '';
    // Remove all HTML tags except allowed ones
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '');
  }
};

module.exports = {
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeObject,
  sanitizeValue,
  validationHelpers,
  checkForDangerousPatterns
};
