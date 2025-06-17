const request = require('supertest');
const app = require('../app');
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const encryption = require('../utils/encryption');

describe('Authentication Controller', () => {
  describe('POST /api/auth/register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User',
      role: 'patient',
      phoneNumber: '+1234567890'
    };

    beforeEach(() => {
      User.findOne.mockReset();
      User.create.mockReset();
    });

    it('should register a new user successfully', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        id: 'test-user-id',
        ...validUserData,
        password: 'hashed-password'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        email: validUserData.email,
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role
      }));
    });

    it('should return 400 if user already exists', async () => {
      User.findOne.mockResolvedValue({ id: 'existing-user-id' });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'User already exists');
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'Test123!@#'
    };

    beforeEach(() => {
      User.findOne.mockReset();
      User.update.mockReset();
    });

    it('should login user successfully', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: validLoginData.email,
        password: 'hashed-Test123!@#',
        role: 'patient',
        is2FAEnabled: false
      };

      User.findOne.mockResolvedValue(mockUser);
      encryption.comparePassword.mockReturnValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
      expect(User.update).toHaveBeenCalledWith(
        expect.objectContaining({ lastLoginAt: expect.any(Date) }),
        expect.any(Object)
      );
    });

    it('should return 401 for invalid credentials', async () => {
      User.findOne.mockResolvedValue({
        id: 'test-user-id',
        email: validLoginData.email,
        password: 'hashed-wrong-password',
        role: 'patient',
        is2FAEnabled: false
      });

      encryption.comparePassword.mockReturnValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
      expect(User.update).not.toHaveBeenCalled();
    });

    it('should require 2FA verification if enabled', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: validLoginData.email,
        password: 'hashed-Test123!@#',
        role: 'patient',
        is2FAEnabled: true
      };

      User.findOne.mockResolvedValue(mockUser);
      encryption.comparePassword.mockReturnValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', '2FA verification required');
      expect(response.body).toHaveProperty('requires2FA', true);
      expect(response.body).toHaveProperty('tempToken');
      expect(User.update).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/2fa/setup', () => {
    beforeEach(() => {
      User.findOne.mockReset();
      User.update.mockReset();
    });

    it('should setup 2FA successfully', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'patient'
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/2fa/setup')
        .set('Authorization', 'Bearer test-token')
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('secret');
      expect(response.body).toHaveProperty('qrCode');
      expect(response.body).toHaveProperty('tempToken');
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/auth/2fa/setup')
        .send();

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });
  });

  describe('POST /api/auth/2fa/verify', () => {
    beforeEach(() => {
      User.findOne.mockReset();
      User.update.mockReset();
    });

    it('should verify and enable 2FA successfully', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'patient',
        temp2FASecret: 'test-secret'
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/2fa/verify')
        .set('Authorization', 'Bearer test-token')
        .send({ token: '123456' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', '2FA enabled successfully');
      expect(User.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is2FAEnabled: true,
          twoFactorSecret: 'test-secret',
          temp2FASecret: null
        }),
        expect.any(Object)
      );
    });

    it('should return 400 for invalid token', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'patient',
        temp2FASecret: 'test-secret'
      };

      User.findOne.mockResolvedValue(mockUser);
      require('speakeasy').verifyToken.mockReturnValueOnce(false);

      const response = await request(app)
        .post('/api/auth/2fa/verify')
        .set('Authorization', 'Bearer test-token')
        .send({ token: '123456' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid 2FA token');
      expect(User.update).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    beforeEach(() => {
      User.findOne.mockReset();
    });

    it('should refresh token successfully', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'patient'
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.verify.mockReturnValueOnce({ id: 'test-user-id' });

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'test-refresh-token' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid refresh token', async () => {
      jwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid refresh token');
    });
  });

  describe('POST /api/auth/logout', () => {
    beforeEach(() => {
      User.findOne.mockReset();
      User.update.mockReset();
    });

    it('should logout user successfully', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'patient'
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer test-token')
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logout successful');
      expect(User.update).toHaveBeenCalledWith(
        expect.objectContaining({ lastLogoutAt: expect.any(Date) }),
        expect.any(Object)
      );
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send();

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });
  });
}); 