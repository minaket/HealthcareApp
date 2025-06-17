const request = require('supertest');
const app = require('../app');
const { rateLimit } = require('express-rate-limit');
const { validationResult } = require('express-validator');

describe('Security Middleware', () => {
  describe('Rate Limiting', () => {
    it('should limit requests per IP', async () => {
      // Mock rate limiter to simulate limit exceeded
      rateLimit.mockImplementationOnce(() => (req, res) => {
        res.status(429).json({ message: 'Too many requests from this IP, please try again later' });
      });

      const response = await request(app)
        .get('/api/health')
        .set('X-Forwarded-For', '192.168.1.1');

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('message', 'Too many requests from this IP, please try again later');
    });
  });

  describe('Input Validation', () => {
    it('should validate registration input', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'short',
        firstName: '',
        lastName: '',
        role: 'invalid_role'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveLength(5); // All fields should have errors
    });

    it('should validate medical record input', async () => {
      const invalidData = {
        patientId: 'invalid-uuid',
        recordData: '',
        accessLevel: 'invalid_level'
      };

      const response = await request(app)
        .post('/api/medical-records')
        .set('Authorization', 'Bearer test-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveLength(3); // All fields should have errors
    });

    it('should validate consultation input', async () => {
      const invalidData = {
        patientId: 'invalid-uuid',
        scheduledAt: 'invalid-date',
        consultationType: 'invalid_type'
      };

      const response = await request(app)
        .post('/api/consultations')
        .set('Authorization', 'Bearer test-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveLength(3); // All fields should have errors
    });
  });

  describe('Request Sanitization', () => {
    it('should sanitize query parameters', async () => {
      const response = await request(app)
        .get('/api/medical-records/patient/test-id?search=  test  &page=1  ')
        .set('Authorization', 'Bearer test-token');

      expect(response.request.url).toContain('search=test&page=1');
    });

    it('should sanitize body parameters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: '  test@example.com  ',
          firstName: '  Test  ',
          lastName: '  User  '
        });

      expect(response.request.body).toEqual({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      });
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
      expect(response.headers).toHaveProperty('strict-transport-security');
      expect(response.headers).toHaveProperty('content-security-policy');
    });
  });

  describe('Request ID', () => {
    it('should include request ID in response', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.headers).toHaveProperty('x-request-id');
      expect(response.headers['x-request-id']).toMatch(/^[a-f0-9-]{36}$/);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      // Mock validation result to simulate validation error
      validationResult.mockReturnValueOnce({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid input', param: 'email' }]
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveLength(1);
    });

    it('should handle authentication errors', async () => {
      const response = await request(app)
        .get('/api/medical-records')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid token');
    });

    it('should handle authorization errors', async () => {
      jwt.verify.mockReturnValueOnce({ id: 'test-user-id', role: 'patient' });

      const response = await request(app)
        .post('/api/medical-records')
        .set('Authorization', 'Bearer test-token')
        .send({
          patientId: 'test-patient-id',
          recordData: 'Test data',
          accessLevel: 'private'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Access denied');
    });

    it('should handle not found errors', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Not found');
    });

    it('should handle internal server errors', async () => {
      // Mock a controller to throw an error
      const mockError = new Error('Internal server error');
      mockError.status = 500;

      const response = await request(app)
        .get('/api/health')
        .set('X-Trigger-Error', 'true');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Internal server error');
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('CORS', () => {
    it('should allow requests from allowed origin', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers).toHaveProperty('access-control-allow-origin', 'http://localhost:3000');
      expect(response.headers).toHaveProperty('access-control-allow-credentials', 'true');
    });

    it('should reject requests from disallowed origin', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://malicious-site.com');

      expect(response.headers).not.toHaveProperty('access-control-allow-origin');
    });
  });
}); 