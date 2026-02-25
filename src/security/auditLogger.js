const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * Audit Log Schema
 * Tracks all security-relevant events
 */
const auditLogSchema = new mongoose.Schema({
  // Unique event identifier
  eventId: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    index: true
  },

  // Event classification
  eventType: {
    type: String,
    required: true,
    enum: [
      // Authentication events
      'AUTH_LOGIN_SUCCESS',
      'AUTH_LOGIN_FAILED',
      'AUTH_LOGOUT',
      'AUTH_TOKEN_REFRESH',
      'AUTH_PASSWORD_CHANGE',
      'AUTH_PASSWORD_RESET_REQUEST',
      'AUTH_PASSWORD_RESET_SUCCESS',
      'AUTH_OTP_SENT',
      'AUTH_OTP_VERIFIED',
      'AUTH_OTP_FAILED',
      'AUTH_ACCOUNT_LOCKED',
      'AUTH_ACCOUNT_UNLOCKED',

      // User management
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED',
      'USER_ROLE_CHANGED',
      'USER_STATUS_CHANGED',
      'USER_VERIFIED',

      // Course management
      'COURSE_CREATED',
      'COURSE_UPDATED',
      'COURSE_DELETED',
      'COURSE_SUBMITTED',
      'COURSE_APPROVED',
      'COURSE_REJECTED',
      'COURSE_PUBLISHED',
      'COURSE_UNPUBLISHED',

      // Financial events
      'PAYMENT_INITIATED',
      'PAYMENT_SUCCESS',
      'PAYMENT_FAILED',
      'REFUND_INITIATED',
      'REFUND_SUCCESS',
      'NEUTRON_CREDITED',
      'NEUTRON_DEBITED',

      // Security events
      'SECURITY_SUSPICIOUS_ACTIVITY',
      'SECURITY_RATE_LIMIT_EXCEEDED',
      'SECURITY_INVALID_INPUT',
      'SECURITY_UNAUTHORIZED_ACCESS',
      'SECURITY_PERMISSION_DENIED',

      // Admin actions
      'ADMIN_ACTION',
      'ADMIN_USER_MODIFIED',
      'ADMIN_COURSE_MODIFIED',
      'ADMIN_SETTINGS_CHANGED',

      // System events
      'SYSTEM_ERROR',
      'SYSTEM_WARNING',
      'API_ERROR'
    ],
    index: true
  },

  // Severity level
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW',
    index: true
  },

  // Actor information
  actor: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    email: String,
    role: String,
    ip: String,
    userAgent: String
  },

  // Target of the action
  target: {
    type: {
      type: String,
      enum: ['USER', 'COURSE', 'PAYMENT', 'SYSTEM', 'OTHER']
    },
    id: mongoose.Schema.Types.ObjectId,
    identifier: String
  },

  // Event details
  details: {
    type: mongoose.Schema.Types.Mixed
  },

  // Request information
  request: {
    method: String,
    path: String,
    query: mongoose.Schema.Types.Mixed,
    body: mongoose.Schema.Types.Mixed // Sanitized, no sensitive data
  },

  // Response information
  response: {
    statusCode: Number,
    success: Boolean
  },

  // Metadata
  metadata: {
    sessionId: String,
    requestId: String,
    duration: Number, // Request duration in ms
    environment: {
      type: String,
      default: process.env.NODE_ENV || 'development'
    }
  },

  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'audit_logs'
});

// TTL Index - Auto-delete logs older than 90 days
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Compound indexes for common queries
auditLogSchema.index({ 'actor.userId': 1, timestamp: -1 });
auditLogSchema.index({ eventType: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

/**
 * Audit Logger Class
 */
class AuditLogger {
  /**
   * Log an event
   */
  static async log(eventData) {
    try {
      const log = new AuditLog(eventData);
      await log.save();
      return log;
    } catch (error) {
      console.error('Audit logging failed:', error.message);
      // Don't throw - logging failure shouldn't break the application
    }
  }

  /**
   * Log authentication event
   */
  static async logAuth(type, req, user = null, success = true, details = {}) {
    const severity = success ? 'LOW' : 'MEDIUM';

    return this.log({
      eventType: type,
      severity,
      actor: {
        userId: user?._id,
        email: user?.email,
        role: user?.selectedRole,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent')
      },
      target: {
        type: 'USER',
        id: user?._id,
        identifier: user?.email || user?.phone
      },
      details,
      request: {
        method: req.method,
        path: req.path
      },
      response: {
        success
      },
      metadata: {
        requestId: req.requestId
      }
    });
  }

  /**
   * Log security event
   */
  static async logSecurity(type, req, details = {}, severity = 'HIGH') {
    return this.log({
      eventType: type,
      severity,
      actor: {
        userId: req.user?._id,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent')
      },
      details,
      request: {
        method: req.method,
        path: req.path,
        query: req.query
      },
      metadata: {
        requestId: req.requestId
      }
    });
  }

  /**
   * Log course event
   */
  static async logCourse(type, req, course, details = {}) {
    return this.log({
      eventType: type,
      severity: 'LOW',
      actor: {
        userId: req.user?._id,
        role: req.user?.selectedRole,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      target: {
        type: 'COURSE',
        id: course._id,
        identifier: course.courseSlug
      },
      details: {
        courseTitle: course.courseTitle,
        courseStatus: course.courseStatus,
        ...details
      },
      request: {
        method: req.method,
        path: req.path
      },
      metadata: {
        requestId: req.requestId
      }
    });
  }

  /**
   * Log admin action
   */
  static async logAdminAction(req, action, target, details = {}) {
    return this.log({
      eventType: 'ADMIN_ACTION',
      severity: 'MEDIUM',
      actor: {
        userId: req.admin?._id,
        email: req.admin?.email,
        role: 'Admin',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      target,
      details: {
        action,
        ...details
      },
      request: {
        method: req.method,
        path: req.path
      },
      metadata: {
        requestId: req.requestId
      }
    });
  }

  /**
   * Log payment event
   */
  static async logPayment(type, req, paymentDetails, success = true) {
    return this.log({
      eventType: type,
      severity: success ? 'LOW' : 'HIGH',
      actor: {
        userId: req.user?._id,
        ip: req.ip
      },
      target: {
        type: 'PAYMENT',
        id: paymentDetails.paymentId,
        identifier: paymentDetails.transactionId
      },
      details: {
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        method: paymentDetails.method,
        status: paymentDetails.status
      },
      response: {
        success
      },
      metadata: {
        requestId: req.requestId
      }
    });
  }

  /**
   * Query audit logs
   */
  static async query(filters = {}, options = {}) {
    const {
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = options;

    const query = {};

    if (filters.userId) query['actor.userId'] = filters.userId;
    if (filters.eventType) query.eventType = filters.eventType;
    if (filters.severity) query.severity = filters.severity;
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await AuditLog.countDocuments(query);

    return {
      logs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    };
  }
}

/**
 * Express middleware to add request tracking
 */
const requestTracker = (req, res, next) => {
  req.requestId = uuidv4();
  req.requestStart = Date.now();

  // Log response after completion
  res.on('finish', () => {
    const duration = Date.now() - req.requestStart;

    // Only log slow requests or errors
    if (duration > 5000 || res.statusCode >= 500) {
      AuditLogger.log({
        eventType: res.statusCode >= 500 ? 'SYSTEM_ERROR' : 'SYSTEM_WARNING',
        severity: res.statusCode >= 500 ? 'HIGH' : 'MEDIUM',
        actor: {
          userId: req.user?._id,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        request: {
          method: req.method,
          path: req.path
        },
        response: {
          statusCode: res.statusCode,
          success: res.statusCode < 400
        },
        metadata: {
          requestId: req.requestId,
          duration
        }
      });
    }
  });

  next();
};

module.exports = {
  AuditLog,
  AuditLogger,
  requestTracker
};
