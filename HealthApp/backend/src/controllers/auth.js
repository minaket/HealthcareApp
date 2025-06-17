const { User, AccessLog } = require('../models');
const { generateTokens, JWT_SECRET, JWT_REFRESH_SECRET } = require('../middleware/auth');
const encryption = require('../utils/encryption');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { sequelize } = require('../models');

// Register a new user
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ 
        message: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash password using hashData method
    const { hash, salt } = await encryption.hashData(password);

    // Use a transaction to ensure both user creation and access log are atomic
    const result = await sequelize.transaction(async (t) => {
      // Create user with hashed password
      const user = await User.create({
        email,
        password_hash: hash,
        password_salt: salt,
        first_name: firstName,
        last_name: lastName,
        role: role || 'patient' // Default to patient if role not specified
      }, { transaction: t });

      // Generate tokens
      const tokens = generateTokens(user);

      // Log the registration within the same transaction
      await AccessLog.create({
        userId: user.id,
        action: 'create',
        resourceType: 'user',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success'
      }, { transaction: t });

      return { user, tokens };
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        role: result.user.role
      },
      ...result.tokens
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific error types
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        message: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }
    
    res.status(500).json({ 
      message: 'Error registering user',
      code: 'REGISTRATION_ERROR'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      await AccessLog.create({
        userId: null,
        action: 'failed_login',
        resourceType: 'system',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure',
        details: { email }
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      await AccessLog.create({
        userId: user.id,
        action: 'failed_login',
        resourceType: 'system',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure'
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if 2FA is enabled
    if (user.two_factor_enabled) {
      return res.status(200).json({
        requires2FA: true,
        tempToken: generateTokens(user).accessToken
      });
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Update last login
    await user.update({ last_login: new Date() });

    // Log successful login
    await AccessLog.create({
      userId: user.id,
      action: 'login',
      resourceType: 'system',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      ...tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
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

// Verify 2FA setup
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
      await AccessLog.create({
        userId: user.id,
        action: 'failed_2fa',
        resourceType: 'system',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure'
      });
      return res.status(400).json({ message: 'Invalid 2FA token' });
    }

    // Save 2FA secret
    await user.update({
      two_factor_secret: req.session.temp2FASecret,
      two_factor_enabled: true
    });

    // Clear temporary secret
    delete req.session.temp2FASecret;

    // Log successful 2FA setup
    await AccessLog.create({
      userId: user.id,
      action: 'create',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: { action: 'setup_2fa' }
    });

    res.json({ message: '2FA setup successful' });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ message: 'Error verifying 2FA setup' });
  }
};

// Verify 2FA token for login
const verify2FALogin = async (req, res) => {
  try {
    const { token, tempToken } = req.body;

    // Verify temp token
    const decoded = jwt.verify(tempToken, JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.two_factor_enabled) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const encryptedSecret = JSON.parse(user.two_factor_secret);
    const secret = encryption.decrypt(encryptedSecret);

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      await AccessLog.create({
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
    await user.update({ last_login: new Date() });

    // Log successful login
    await AccessLog.create({
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
        firstName: user.first_name,
        lastName: user.last_name,
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

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user);

    // Log token refresh
    await AccessLog.create({
      userId: user.id,
      action: 'login',
      resourceType: 'system',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: { action: 'refresh_token' }
    });

    res.json(tokens);
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const user = req.user;

    await AccessLog.create({
      userId: user.id,
      action: 'logout',
      resourceType: 'system',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error logging out' });
  }
};

module.exports = {
  register,
  login,
  setup2FA,
  verify2FA,
  verify2FALogin,
  refreshToken,
  logout
}; 