const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult, param } = require('express-validator');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../models');

// Initialize AccessLog model only after database connection
let AccessLog = null;

const initializeAccessLog = (sequelize) => {
  AccessLog = sequelize.models.AccessLog;
};

// Rate limiting middleware
const createRateLimiter = (windowMs, max) => {
  return rateLimit({
    windowMs,
    max,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Global rate limiter
const globalLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes

// Auth rate limiter (more strict)
const authLimiter = createRateLimiter(60 * 60 * 1000, 5); // 5 requests per hour

// Common validation rules
const commonValidations = {
  email: body('email')
    .isEmail()
    .withMessage('Invalid email address'),
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  firstName: body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  lastName: body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  role: body('role')
    .isIn(['patient', 'doctor', 'admin'])
    .withMessage('Invalid role')
};

// Route-specific validation rules
const validationRules = {
  register: [
    commonValidations.email,
    commonValidations.password,
    commonValidations.firstName,
    commonValidations.lastName,
    commonValidations.role
  ],
  login: [
    commonValidations.email,
    commonValidations.password
  ],
  verify2FA: [
    body('token')
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage('2FA token must be 6 digits')
  ],
  refreshToken: [
    body('refreshToken')
      .trim()
      .notEmpty()
      .withMessage('Refresh token is required')
  ],
  createRecord: [
    body('patientId')
      .isInt()
      .withMessage('Patient ID must be an integer'),
    body('recordData')
      .trim()
      .notEmpty()
      .withMessage('Record data is required'),
    body('recordType')
      .trim()
      .notEmpty()
      .withMessage('Record type is required'),
    body('accessLevel')
      .isIn(['public', 'private', 'confidential'])
      .withMessage('Invalid access level')
  ],
  getRecord: [
    body('id')
      .isInt()
      .withMessage('Record ID must be an integer')
  ],
  updateRecord: [
    body('id')
      .isInt()
      .withMessage('Record ID must be an integer'),
    body('recordData')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Record data is required'),
    body('accessLevel')
      .optional()
      .isIn(['public', 'private', 'confidential'])
      .withMessage('Invalid access level')
  ],
  deleteRecord: [
    body('id')
      .isInt()
      .withMessage('Record ID must be an integer')
  ],
  createConsultation: [
    body('patientId')
      .isInt()
      .withMessage('Patient ID must be an integer'),
    body('scheduledAt')
      .isISO8601()
      .withMessage('Scheduled time must be a valid ISO date'),
    body('consultationType')
      .trim()
      .notEmpty()
      .withMessage('Consultation type is required'),
    body('notes')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Notes cannot be empty')
  ],
  updateConsultationStatus: [
    body('id')
      .isInt()
      .withMessage('Consultation ID must be an integer'),
    body('status')
      .isIn(['scheduled', 'completed', 'cancelled'])
      .withMessage('Invalid consultation status')
  ],
  getPatientConsultations: [
    body('patientId')
      .isInt()
      .withMessage('Patient ID must be an integer')
  ],
  getDoctorConsultations: [
    body('doctorId')
      .isInt()
      .withMessage('Doctor ID must be an integer')
  ],
  addConsultationNotes: [
    body('id')
      .isInt()
      .withMessage('Consultation ID must be an integer'),
    body('notes')
      .trim()
      .notEmpty()
      .withMessage('Notes cannot be empty')
  ]
};

// Input validation middleware
const validate = (validations) => {
  if (!validations || !validationRules[validations]) {
    return (req, res, next) => next();
  }
  return [
    ...validationRules[validations],
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ];
};

// Request sanitization middleware
const sanitizeRequest = (req, res, next) => {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    });
  }

  // Sanitize body parameters
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  next();
};

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: true,
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
});

// Request ID middleware
const requestId = (req, res, next) => {
  req.id = crypto.randomUUID();
  next();
};

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Authorization middleware
const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    next();
  };
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Log the error if database is available
  try {
    const userId = req.user?.id || null;
    if (userId) {
      AccessLog.logAccess({
        userId,
        action: 'error',
        resourceType: 'system',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure',
        details: { error: err.message }
      });
    }
  } catch (dbError) {
    console.error('Error logging to database:', dbError);
  }

  // Don't expose internal errors to clients
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    error: {
      message,
      requestId: req.id
    }
  });
};

// Transaction middleware
const transaction = async (req, res, next) => {
  const t = await sequelize.transaction();
  req.transaction = t;
  
  // Add transaction to response object for cleanup
  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      await t.commit();
    } else {
      await t.rollback();
    }
  });

  next();
};

module.exports = {
  headers: securityHeaders,
  globalLimiter,
  authLimiter,
  validate,
  sanitizeRequest,
  requestId,
  errorHandler,
  authenticate,
  authorize,
  transaction,
  initializeAccessLog,
  commonValidations,
  validationRules
};

// Initialize AccessLog model after module exports
if (typeof sequelize !== 'undefined' && sequelize.models && sequelize.models.AccessLog) {
  AccessLog = sequelize.models.AccessLog;
}