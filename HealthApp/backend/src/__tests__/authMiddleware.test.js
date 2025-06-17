const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

describe('Authentication Middleware', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'doctor',
    firstName: 'Test',
    lastName: 'Doctor',
    is2FAEnabled: false
  };

  beforeEach(() => {
    User.findOne.mockReset();
    jwt.verify.mockReset();
  });

  describe('Authentication', () => {
    it('should authenticate valid token', async () => {
      jwt.verify.mockReturnValueOnce({ id: mockUser.id });
      User.findOne.mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .get('/api/medical-records')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).not.toBe(401);
      expect(response.request.user).toEqual(mockUser);
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/medical-records');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should reject invalid token', async () => {
      jwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/medical-records')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid token');
    });

    it('should reject expired token', async () => {
      jwt.verify.mockImplementationOnce(() => {
        throw new Error('Token expired');
      });

      const response = await request(app)
        .get('/api/medical-records')
        .set('Authorization', 'Bearer expired-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Token expired');
    });

    it('should reject non-existent user', async () => {
      jwt.verify.mockReturnValueOnce({ id: 'non-existent-id' });
      User.findOne.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/medical-records')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('Authorization', () => {
    it('should authorize doctor role', async () => {
      jwt.verify.mockReturnValueOnce({ id: mockUser.id, role: 'doctor' });
      User.findOne.mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .post('/api/medical-records')
        .set('Authorization', 'Bearer valid-token')
        .send({
          patientId: 'test-patient-id',
          recordData: 'Test data',
          accessLevel: 'private'
        });

      expect(response.status).not.toBe(403);
    });

    it('should authorize admin role', async () => {
      jwt.verify.mockReturnValueOnce({ id: 'admin-id', role: 'admin' });
      User.findOne.mockResolvedValueOnce({
        ...mockUser,
        id: 'admin-id',
        role: 'admin'
      });

      const response = await request(app)
        .post('/api/medical-records')
        .set('Authorization', 'Bearer valid-token')
        .send({
          patientId: 'test-patient-id',
          recordData: 'Test data',
          accessLevel: 'private'
        });

      expect(response.status).not.toBe(403);
    });

    it('should reject unauthorized role', async () => {
      jwt.verify.mockReturnValueOnce({ id: 'patient-id', role: 'patient' });
      User.findOne.mockResolvedValueOnce({
        ...mockUser,
        id: 'patient-id',
        role: 'patient'
      });

      const response = await request(app)
        .post('/api/medical-records')
        .set('Authorization', 'Bearer valid-token')
        .send({
          patientId: 'test-patient-id',
          recordData: 'Test data',
          accessLevel: 'private'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Access denied');
    });

    it('should allow patient to access their own records', async () => {
      const patientId = 'patient-id';
      jwt.verify.mockReturnValueOnce({ id: patientId, role: 'patient' });
      User.findOne.mockResolvedValueOnce({
        ...mockUser,
        id: patientId,
        role: 'patient'
      });

      const response = await request(app)
        .get(`/api/medical-records/patient/${patientId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).not.toBe(403);
    });

    it('should allow doctor to access their patients records', async () => {
      jwt.verify.mockReturnValueOnce({ id: mockUser.id, role: 'doctor' });
      User.findOne.mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .get('/api/medical-records/doctor/test-doctor-id')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).not.toBe(403);
    });
  });

  describe('2FA Verification', () => {
    it('should require 2FA for enabled users', async () => {
      jwt.verify.mockReturnValueOnce({ id: mockUser.id });
      User.findOne.mockResolvedValueOnce({
        ...mockUser,
        is2FAEnabled: true
      });

      const response = await request(app)
        .get('/api/medical-records')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', '2FA verification required');
    });

    it('should verify valid 2FA token', async () => {
      jwt.verify.mockReturnValueOnce({ id: mockUser.id });
      User.findOne.mockResolvedValueOnce({
        ...mockUser,
        is2FAEnabled: true,
        twoFactorSecret: 'test-secret'
      });

      const response = await request(app)
        .post('/api/auth/2fa/verify-login')
        .set('Authorization', 'Bearer temp-token')
        .send({ token: '123456' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
    });

    it('should reject invalid 2FA token', async () => {
      jwt.verify.mockReturnValueOnce({ id: mockUser.id });
      User.findOne.mockResolvedValueOnce({
        ...mockUser,
        is2FAEnabled: true,
        twoFactorSecret: 'test-secret'
      });
      require('speakeasy').verifyToken.mockReturnValueOnce(false);

      const response = await request(app)
        .post('/api/auth/2fa/verify-login')
        .set('Authorization', 'Bearer temp-token')
        .send({ token: '123456' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid 2FA token');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh valid refresh token', async () => {
      jwt.verify.mockReturnValueOnce({ id: mockUser.id });
      User.findOne.mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'valid-refresh-token' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      jwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-refresh-token' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid refresh token');
    });

    it('should reject expired refresh token', async () => {
      jwt.verify.mockImplementationOnce(() => {
        throw new Error('Token expired');
      });

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'expired-refresh-token' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Refresh token expired');
    });
  });
}); 