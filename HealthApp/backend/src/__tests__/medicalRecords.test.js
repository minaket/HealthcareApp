const request = require('supertest');
const app = require('../app');
const { MedicalRecord, User } = require('../models');
const encryption = require('../utils/encryption');

describe('Medical Records Controller', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'doctor',
    firstName: 'Test',
    lastName: 'Doctor'
  };

  const mockPatient = {
    id: 'test-patient-id',
    email: 'patient@example.com',
    role: 'patient',
    firstName: 'Test',
    lastName: 'Patient'
  };

  const mockRecord = {
    id: 'test-record-id',
    patientId: mockPatient.id,
    doctorId: mockUser.id,
    recordData: 'encrypted-test-data',
    accessLevel: 'private',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    User.findOne.mockReset();
    MedicalRecord.findOne.mockReset();
    MedicalRecord.create.mockReset();
    MedicalRecord.update.mockReset();
    MedicalRecord.destroy.mockReset();
    MedicalRecord.findAll.mockReset();
    MedicalRecord.hasAccess.mockReset();
  });

  describe('POST /api/medical-records', () => {
    const validRecordData = {
      patientId: mockPatient.id,
      recordData: 'Test medical record data',
      accessLevel: 'private'
    };

    it('should create a new medical record successfully', async () => {
      User.findOne.mockResolvedValueOnce(mockPatient);
      MedicalRecord.create.mockResolvedValue(mockRecord);

      const response = await request(app)
        .post('/api/medical-records')
        .set('Authorization', 'Bearer test-token')
        .send(validRecordData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Medical record created successfully');
      expect(response.body).toHaveProperty('record');
      expect(MedicalRecord.create).toHaveBeenCalledWith(expect.objectContaining({
        patientId: validRecordData.patientId,
        doctorId: mockUser.id,
        accessLevel: validRecordData.accessLevel
      }));
    });

    it('should return 403 if user is not a doctor or admin', async () => {
      jwt.verify.mockReturnValueOnce({ id: 'test-user-id', role: 'patient' });

      const response = await request(app)
        .post('/api/medical-records')
        .set('Authorization', 'Bearer test-token')
        .send(validRecordData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Access denied');
      expect(MedicalRecord.create).not.toHaveBeenCalled();
    });

    it('should return 404 if patient not found', async () => {
      User.findOne.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/medical-records')
        .set('Authorization', 'Bearer test-token')
        .send(validRecordData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Patient not found');
      expect(MedicalRecord.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/medical-records/:id', () => {
    it('should get a medical record successfully', async () => {
      MedicalRecord.findOne.mockResolvedValueOnce(mockRecord);
      MedicalRecord.hasAccess.mockResolvedValueOnce(true);

      const response = await request(app)
        .get(`/api/medical-records/${mockRecord.id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('record');
      expect(response.body.record).toHaveProperty('id', mockRecord.id);
      expect(MedicalRecord.hasAccess).toHaveBeenCalledWith(mockUser.id, mockUser.role);
    });

    it('should return 404 if record not found', async () => {
      MedicalRecord.findOne.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/medical-records/non-existent-id')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Medical record not found');
    });

    it('should return 403 if access denied', async () => {
      MedicalRecord.findOne.mockResolvedValueOnce(mockRecord);
      MedicalRecord.hasAccess.mockResolvedValueOnce(false);

      const response = await request(app)
        .get(`/api/medical-records/${mockRecord.id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Access denied');
    });
  });

  describe('PUT /api/medical-records/:id', () => {
    const updateData = {
      recordData: 'Updated medical record data',
      accessLevel: 'doctor'
    };

    it('should update a medical record successfully', async () => {
      MedicalRecord.findOne.mockResolvedValueOnce(mockRecord);
      MedicalRecord.hasAccess.mockResolvedValueOnce(true);
      MedicalRecord.update.mockResolvedValueOnce([1, [mockRecord]]);

      const response = await request(app)
        .put(`/api/medical-records/${mockRecord.id}`)
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Medical record updated successfully');
      expect(response.body).toHaveProperty('record');
      expect(MedicalRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          recordData: expect.any(String),
          accessLevel: updateData.accessLevel
        }),
        expect.any(Object)
      );
    });

    it('should return 404 if record not found', async () => {
      MedicalRecord.findOne.mockResolvedValueOnce(null);

      const response = await request(app)
        .put('/api/medical-records/non-existent-id')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Medical record not found');
      expect(MedicalRecord.update).not.toHaveBeenCalled();
    });

    it('should return 403 if access denied', async () => {
      MedicalRecord.findOne.mockResolvedValueOnce(mockRecord);
      MedicalRecord.hasAccess.mockResolvedValueOnce(false);

      const response = await request(app)
        .put(`/api/medical-records/${mockRecord.id}`)
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Access denied');
      expect(MedicalRecord.update).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/medical-records/patient/:patientId', () => {
    it('should get patient records successfully', async () => {
      MedicalRecord.findAll.mockResolvedValueOnce([mockRecord]);
      MedicalRecord.hasAccess.mockResolvedValueOnce(true);

      const response = await request(app)
        .get(`/api/medical-records/patient/${mockPatient.id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('records');
      expect(Array.isArray(response.body.records)).toBe(true);
      expect(response.body.records).toHaveLength(1);
      expect(MedicalRecord.hasAccess).toHaveBeenCalledWith(mockUser.id, mockUser.role);
    });

    it('should return 403 if access denied', async () => {
      MedicalRecord.hasAccess.mockResolvedValueOnce(false);

      const response = await request(app)
        .get(`/api/medical-records/patient/${mockPatient.id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Access denied');
      expect(MedicalRecord.findAll).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/medical-records/doctor/:doctorId', () => {
    it('should get doctor records successfully', async () => {
      MedicalRecord.findAll.mockResolvedValueOnce([mockRecord]);

      const response = await request(app)
        .get(`/api/medical-records/doctor/${mockUser.id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('records');
      expect(Array.isArray(response.body.records)).toBe(true);
      expect(response.body.records).toHaveLength(1);
    });

    it('should return 403 if user is not a doctor or admin', async () => {
      jwt.verify.mockReturnValueOnce({ id: 'test-user-id', role: 'patient' });

      const response = await request(app)
        .get(`/api/medical-records/doctor/${mockUser.id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Access denied');
      expect(MedicalRecord.findAll).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/medical-records/:id', () => {
    it('should delete a medical record successfully', async () => {
      MedicalRecord.findOne.mockResolvedValueOnce(mockRecord);
      MedicalRecord.hasAccess.mockResolvedValueOnce(true);
      MedicalRecord.destroy.mockResolvedValueOnce(1);

      const response = await request(app)
        .delete(`/api/medical-records/${mockRecord.id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Medical record deleted successfully');
      expect(MedicalRecord.destroy).toHaveBeenCalled();
    });

    it('should return 404 if record not found', async () => {
      MedicalRecord.findOne.mockResolvedValueOnce(null);

      const response = await request(app)
        .delete('/api/medical-records/non-existent-id')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Medical record not found');
      expect(MedicalRecord.destroy).not.toHaveBeenCalled();
    });

    it('should return 403 if access denied', async () => {
      MedicalRecord.findOne.mockResolvedValueOnce(mockRecord);
      MedicalRecord.hasAccess.mockResolvedValueOnce(false);

      const response = await request(app)
        .delete(`/api/medical-records/${mockRecord.id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Access denied');
      expect(MedicalRecord.destroy).not.toHaveBeenCalled();
    });
  });
}); 