const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Enhanced Token Management with Refresh Tokens
 * Implements secure JWT handling with short-lived access tokens
 * and longer-lived refresh tokens
 */

const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
const TOKEN_ISSUER = 'hsacademy-api';

// In-memory blacklist (use Redis in production)
const tokenBlacklist = new Set();

/**
 * Generate a secure random token ID
 */
const generateTokenId = () => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Generate access token (short-lived)
 */
const generateAccessToken = (payload) => {
  const tokenId = generateTokenId();

  return jwt.sign(
    {
      ...payload,
      jti: tokenId,
      type: 'access'
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: TOKEN_ISSUER,
      algorithm: 'HS256'
    }
  );
};

/**
 * Generate refresh token (long-lived)
 */
const generateRefreshToken = (payload) => {
  const tokenId = generateTokenId();
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET + '_refresh';

  return jwt.sign(
    {
      id: payload.id,
      jti: tokenId,
      type: 'refresh'
    },
    refreshSecret,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: TOKEN_ISSUER,
      algorithm: 'HS256'
    }
  );
};

/**
 * Generate both tokens
 */
const generateTokenPair = (payload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    expiresIn: 15 * 60, // 15 minutes in seconds
    tokenType: 'Bearer'
  };
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
  try {
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      throw new Error('Token has been revoked');
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
      issuer: TOKEN_ISSUER,
      algorithms: ['HS256']
    });

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    }
    throw error;
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    if (tokenBlacklist.has(token)) {
      throw new Error('Token has been revoked');
    }

    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET + '_refresh';

    const decoded = jwt.verify(token, refreshSecret, {
      issuer: TOKEN_ISSUER,
      algorithms: ['HS256']
    });

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Revoke a token (add to blacklist)
 */
const revokeToken = (token) => {
  tokenBlacklist.add(token);

  // Clean up expired tokens from blacklist periodically
  // In production, use Redis with TTL
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, 7 * 24 * 60 * 60 * 1000); // 7 days
};

/**
 * Revoke all tokens for a user
 * In production, store token IDs in database and invalidate by user ID
 */
const revokeAllUserTokens = (userId) => {
  // This is a placeholder - in production, you'd:
  // 1. Store token IDs in database associated with user
  // 2. Mark all tokens as revoked
  // 3. Use Redis to maintain a user's revoked token list
  console.log(`All tokens revoked for user: ${userId}`);
};

/**
 * Extract token from authorization header
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Middleware to authenticate with access token
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        status: false,
        message: 'Access token required'
      });
    }

    const decoded = verifyAccessToken(token);
    req.tokenPayload = decoded;
    req.token = token;

    next();
  } catch (error) {
    if (error.message === 'Access token expired') {
      return res.status(401).json({
        status: false,
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({
      status: false,
      message: 'Invalid access token'
    });
  }
};

/**
 * Refresh token endpoint handler
 */
const refreshTokenHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: false,
        message: 'Refresh token required'
      });
    }

    const decoded = verifyRefreshToken(refreshToken);

    // Get user from database to ensure they still exist and are active
    const { User } = require('../models/authModels');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: false,
        message: 'User not found'
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        status: false,
        message: 'Account is not active'
      });
    }

    // Revoke old refresh token
    revokeToken(refreshToken);

    // Generate new token pair
    const tokens = generateTokenPair({
      id: user._id,
      selectedRole: user.selectedRole,
      authProvider: user.authProvider
    });

    return res.status(200).json({
      status: true,
      message: 'Tokens refreshed successfully',
      ...tokens
    });

  } catch (error) {
    console.error('Token refresh error:', error.message);
    return res.status(401).json({
      status: false,
      message: 'Invalid or expired refresh token'
    });
  }
};

/**
 * Logout handler - revoke tokens
 */
const logoutHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const accessToken = extractTokenFromHeader(req.headers['authorization']);

    if (accessToken) {
      revokeToken(accessToken);
    }

    if (refreshToken) {
      revokeToken(refreshToken);
    }

    return res.status(200).json({
      status: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error.message);
    return res.status(200).json({
      status: true,
      message: 'Logged out successfully'
    });
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  revokeToken,
  revokeAllUserTokens,
  extractTokenFromHeader,
  authenticateToken,
  refreshTokenHandler,
  logoutHandler,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY
};
