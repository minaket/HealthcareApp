const { User, AccessLog } = require('../models');
const { sequelize } = require('../models');
const Encryption = require('../utils/encryption');
const encryption = new Encryption();
const { generateTokens } = require('../utils/auth');
const { generateResetToken, verifyResetToken } = require('../utils/passwordReset');
const { sendPasswordResetEmail } = require('../utils/mailer');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Password reset constants
const RESET_TOKEN_EXPIRY = 1 * 60 * 60 * 1000; // 1 hour in milliseconds
const RESET_LINK_BASE = process.env.RESET_LINK_BASE || 'http://localhost:3000/reset-password';

// Register a new user
const register = async (req, res) => {
  try {
    // Log the full request details
    console.log('Registration request details:', {
      body: req.body,
      headers: req.headers,
      ip: req.ip,
      method: req.method,
      path: req.path
    });
    
    const { email, password, firstName, lastName, role } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      console.log('Missing required fields:', { email: !!email, password: !!password, firstName: !!firstName, lastName: !!lastName, role: !!role });
      return res.status(400).json({ 
        message: 'Missing required fields',
        code: 'INVALID_INPUT',
        details: {
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null,
          firstName: !firstName ? 'First name is required' : null,
          lastName: !lastName ? 'Last name is required' : null,
          role: !role ? 'Role is required' : null
        }
      });
    }

    // Check if user already exists
    console.log('Checking for existing user with email:', email.toLowerCase());
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      console.log('User already exists:', existingUser.id);
      return res.status(409).json({ 
        message: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash password
    console.log('Hashing password for user:', email);
    const { password_hash, password_salt } = await encryption.hashPassword(password);
    console.log('Password hashed successfully');

    // Create user
    console.log('Creating new user:', { email, firstName, lastName, role });
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash: password_hash,
      passwordSalt: password_salt,
      firstName: firstName,
      lastName: lastName,
      role,
      status: 'active'
    });
    console.log('User created successfully:', user.id);

    // Generate tokens
    console.log('Generating tokens for user:', user.id);
    const tokens = generateTokens(user);
    console.log('Tokens generated successfully');

    // Log access
    console.log('Creating access log for registration');
    await AccessLog.create({
      userId: user.id,
      action: 'create',
      resourceType: 'user',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: { role }
    });
    console.log('Access log created successfully');

    // Send response
    console.log('Sending successful registration response');
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      ...tokens
    });
  } catch (error) {
    console.error('Registration error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      errors: error.errors
    });
    
    // Handle specific error types
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        message: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    return res.status(500).json({
      message: 'Error registering user',
      code: 'REGISTRATION_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // Find user
    const user = await User.findOne({ 
      where: { email: email.toLowerCase() }, // Normalize email to lowercase
    });

    if (!user) {
      await AccessLog.create({
        userId: null,
        action: 'failed_login',
        resourceType: 'user',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure',
        details: { email }
      });
      return res.status(401).json({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password using our encryption utility
    const isPasswordValid = await encryption.verifyPassword(password, user.passwordHash, user.passwordSalt);

    if (!isPasswordValid) {
      await AccessLog.create({
        userId: user.id,
        action: 'failed_login',
        resourceType: 'user',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure',
        details: { email }
      });
      return res.status(401).json({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return res.status(200).json({
        message: '2FA required',
        needs2FA: true,
        userId: user.id
      });
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Log successful login
    await AccessLog.create({
      userId: user.id,
      action: 'login',
      resourceType: 'user',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      ...tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Error logging in',
      code: 'LOGIN_ERROR'
    });
  }
};

// Setup 2FA
const setup2FA = async (req, res) => {
  try {
    const user = req.user;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `HealthApp:${user.email}`
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Save secret temporarily (encrypted)
    const encryptedSecret = encryption.encrypt(secret.base32);
    req.session.temp2FASecret = JSON.stringify(encryptedSecret);

    res.json({
      secret: secret.base32,
      qrCode
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ message: 'Error setting up 2FA' });
  }
};

// Verify and enable 2FA
const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = req.user;

    if (!req.session.temp2FASecret) {
      return res.status(400).json({ message: '2FA setup not initiated' });
    }

    const encryptedSecret = JSON.parse(req.session.temp2FASecret);
    const secret = encryption.decrypt(encryptedSecret);

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid 2FA token' });
    }

    // Enable 2FA for user
    const encryptedSecretFinal = encryption.encrypt(secret);
    await user.update({
      twoFactorSecret: JSON.stringify(encryptedSecretFinal),
      twoFactorEnabled: true
    });

    // Clear temporary secret
    delete req.session.temp2FASecret;

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ message: 'Error verifying 2FA' });
  }
};

// Verify 2FA token for login
const verify2FALogin = async (req, res) => {
  try {
    const { token, tempToken } = req.body;

    // Verify temp token
    const decoded = jwt.verify(tempToken, JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const encryptedSecret = JSON.parse(user.twoFactorSecret);
    const secret = encryption.decrypt(encryptedSecret);

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      await AccessLog.logAccess({
        userId: user.id,
        action: 'failed_2fa',
        resourceType: 'system',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure'
      });
      return res.status(400).json({ message: 'Invalid 2FA token' });
    }

    // Generate final tokens
    const tokens = generateTokens(user);

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Log successful login
    await AccessLog.logAccess({
      userId: user.id,
      action: 'login',
      resourceType: 'system',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: { with2FA: true }
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      ...tokens
    });
  } catch (error) {
    console.error('2FA login verification error:', error);
    res.status(500).json({ message: 'Error verifying 2FA login' });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        message: 'Refresh token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: 'Invalid refresh token',
        code: 'INVALID_TOKEN'
      });
    }

    const tokens = generateTokens(user);

    res.json(tokens);
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      message: 'Invalid refresh token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    await AccessLog.create({
      userId: req.user.id,
      action: 'logout',
      resourceType: 'system',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: 'Error logging out',
      code: 'LOGOUT_ERROR'
    });
  }
};

// Get all users (admin only)
const getUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Access denied. Admin privileges required.',
        code: 'UNAUTHORIZED_ROLE'
      });
    }

    const users = await User.findAll({
      attributes: [
        'id', 'email', 'firstName', 'lastName', 'role',
        'status', 'createdAt', 'updatedAt', 'lastLogin'
      ],
      order: [['createdAt', 'DESC']]
    });

    // Log access
    await AccessLog.create({
      userId: req.user.id,
      action: 'view',
      resourceType: 'user',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Error fetching users',
      code: 'FETCH_ERROR'
    });
  }
};

// Get audit logs (admin only)
const getAuditLogs = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Access denied. Admin privileges required.',
        code: 'UNAUTHORIZED_ROLE'
      });
    }

    const { page = 1, limit = 50, startDate, endDate, action, status } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (startDate && endDate) {
      where.timestamp = {
        [sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    if (action) where.action = action;
    if (status) where.status = status;

    const logs = await AccessLog.findAndCountAll({
      where,
      include: [{
        model: User,
        attributes: ['id', 'email', 'firstName', 'lastName', 'role']
      }],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Log access
    await AccessLog.create({
      userId: req.user.id,
      action: 'view',
      resourceType: 'system',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({
      logs: logs.rows,
      total: logs.count,
      page: parseInt(page),
      totalPages: Math.ceil(logs.count / limit)
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      message: 'Error fetching audit logs',
      code: 'FETCH_ERROR'
    });
  }
};

// TEMPORARY: Debug endpoint to check and fix user password
const debugUser = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Debugging user:', email);

    const user = await User.findOne({ 
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Reset password to a known value
    const newPassword = 'Password123@';
    const salt = await encryption.generateSalt();
    const hash = await encryption.hashPassword(newPassword, salt);

    await user.update({
      passwordHash: hash,
      passwordSalt: salt
    });

    console.log('Password reset for user:', {
      id: user.id,
      email: user.email,
      newHashLength: hash.length,
      newSaltLength: salt.length
    });

    res.json({
      message: 'Password reset successful',
      user: {
        id: user.id,
        email: user.email,
        passwordHashLength: hash.length,
        passwordSaltLength: salt.length
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      message: 'Error debugging user',
      code: 'DEBUG_ERROR'
    });
  }
};

const forgotPassword = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ 
      where: { email },
      transaction 
    });

    if (!user) {
      // Don't reveal if email exists or not
      await transaction.rollback();
      return res.status(200).json({
        message: 'If the email exists, you will receive a password reset link'
      });
    }

    // Generate reset token
    const resetToken = generateResetToken(user.id);
    const resetLink = `${RESET_LINK_BASE}?token=${resetToken}`;

    // Send reset email
    await sendPasswordResetEmail(user.email, resetLink);

    // Log the password reset request
    await AccessLog.create({
      userId: user.id,
      action: 'password_reset_request',
      resourceType: 'user',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      message: 'If the email exists, you will receive a password reset link'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Password reset error:', error);
    res.status(500).json({
      message: 'Error sending password reset instructions'
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { token, password } = req.body;

    // Verify token
    const decoded = verifyResetToken(token);
    const userId = decoded.userId;

    // Find user
    const user = await User.findOne({ 
      where: { id: userId },
      transaction 
    });

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Hash new password
    const salt = await encryption.generateSalt();
    const hash = await encryption.hashPassword(password, salt);

    // Update user password
    await user.update({
      passwordHash: hash,
      passwordSalt: salt
    }, { transaction });

    // Log the password reset
    await AccessLog.create({
      userId: user.id,
      action: 'password_reset',
      resourceType: 'user',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Password reset error:', error);
    res.status(400).json({
      message: error.message
    });
  }
};

// Verify token
const verifyToken = async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = verifyResetToken(token);
    res.status(200).json({
      valid: true,
      userId: decoded.userId
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Add missing stub handlers for authRoutes.js
const getProfile = async (req, res) => {
  res.status(200).json({ message: 'getProfile not implemented' });
};

const updateProfile = async (req, res) => {
  res.status(200).json({ message: 'updateProfile not implemented' });
};

const changePassword = async (req, res) => {
  res.status(200).json({ message: 'changePassword not implemented' });
};

// Export all controller functions
module.exports = {
  register,
  login,
  setup2FA,
  verify2FA,
  verify2FALogin,
  refreshToken,
  logout,
  getUsers,
  getAuditLogs,
  debugUser,
  forgotPassword,
  resetPassword,
  verifyToken,
  getProfile,
  updateProfile,
  changePassword
};
 