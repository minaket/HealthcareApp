require('dotenv').config({ path: '.env.test' });

const { sequelize } = require('../models');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long!!';
process.env.ENCRYPTION_IV = 'test-iv-16chars';

// Global test setup
beforeAll(async () => {
  // Connect to test database
  await sequelize.authenticate();
});

// Global test teardown
afterAll(async () => {
  // Close database connection
  await sequelize.close();
});

// Reset database between tests
beforeEach(async () => {
  // Clear all tables
  await sequelize.truncate({ cascade: true });
});

// Clean up after each test
afterEach(async () => {
  // Clear all mocks
  jest.clearAllMocks();
});

// Mock console methods to keep test output clean
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Mock JWT verification
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('test-token'),
  verify: jest.fn().mockReturnValue({ id: 'test-user-id', role: 'patient' })
}));

// Mock encryption
jest.mock('../utils/encryption', () => ({
  encrypt: jest.fn().mockImplementation(data => `encrypted-${data}`),
  decrypt: jest.fn().mockImplementation(data => data.replace('encrypted-', '')),
  generateKey: jest.fn().mockReturnValue('test-key'),
  hashPassword: jest.fn().mockImplementation(password => `hashed-${password}`),
  comparePassword: jest.fn().mockImplementation((password, hash) => hash === `hashed-${password}`)
}));

// Mock 2FA
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn().mockReturnValue({
    ascii: 'test-secret',
    hex: 'test-hex',
    base32: 'test-base32',
    otpauth_url: 'test-url'
  }),
  verifyToken: jest.fn().mockReturnValue(true)
}));

// Mock rate limiter
jest.mock('express-rate-limit', () => ({
  rateLimit: jest.fn().mockReturnValue((req, res, next) => next())
}));

// Mock helmet
jest.mock('helmet', () => jest.fn().mockReturnValue((req, res, next) => next()));

// Mock morgan
jest.mock('morgan', () => jest.fn().mockReturnValue((req, res, next) => next()));

// Mock winston logger
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock request ID
jest.mock('../middleware/security', () => ({
  ...jest.requireActual('../middleware/security'),
  generateRequestId: jest.fn().mockReturnValue('test-request-id'),
  errorHandler: jest.fn().mockImplementation((err, req, res, next) => {
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error'
    });
  })
}));

// Mock access log
jest.mock('../models/AccessLog', () => ({
  logAccess: jest.fn().mockResolvedValue(true)
}));

// Mock database models
jest.mock('../models', () => {
  const mockSequelize = {
    authenticate: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true),
    truncate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true)
  };

  const mockUser = {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  };

  const mockMedicalRecord = {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    findAll: jest.fn(),
    hasAccess: jest.fn().mockResolvedValue(true)
  };

  const mockConsultation = {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    findAll: jest.fn(),
    hasAccess: jest.fn().mockResolvedValue(true)
  };

  return {
    sequelize: mockSequelize,
    User: mockUser,
    MedicalRecord: mockMedicalRecord,
    Consultation: mockConsultation,
    AccessLog: {
      logAccess: jest.fn().mockResolvedValue(true)
    }
  };
}); 