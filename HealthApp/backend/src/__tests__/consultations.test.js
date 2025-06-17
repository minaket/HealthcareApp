const request = require('supertest');
const app = require('../app');
const { Consultation, User } = require('../models');

describe('Consultations Controller', () => {
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

  const mockConsultation = {
    id: 'test-consultation-id',
    patientId: mockPatient.id,
    doctorId: mockUser.id,
    scheduledAt: new Date(),
    consultationType: 'video',
    status: 'scheduled',
    notes: 'Initial consultation notes',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    User.findOne.mockReset();
    Consultation.findOne.mockReset();
    Consultation.create.mockReset();
    Consultation.update.mockReset();
    Consultation.destroy.mockReset();
    Consultation.findAll.mockReset();
    Consultation.hasAccess.mockReset();
  });

  describe('POST /api/consultations', () => {
    const validConsultationData = {
      patientId: mockPatient.id,
      scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      consultationType: 'video',
      notes: 'Initial consultation notes'
    };

    it('should create a new consultation successfully', async () => {
      User.findOne.mockResolvedValueOnce(mockPatient);
      Consultation.create.mockResolvedValue(mockConsultation);

      const response = await request(app)
        .post('/api/consultations')
        .set('Authorization', 'Bearer test-token')
        .send(validConsultationData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Consultation created successfully');
      expect(response.body).toHaveProperty('consultation');
      expect(Consultation.create).toHaveBeenCalledWith(expect.objectContaining({
        patientId: validConsultationData.patientId,
        doctorId: mockUser.id,
        consultationType: validConsultationData.consultationType,
        status: 'scheduled'
      }));
    });

    it('should return 403 if user is not a doctor or admin', async () => {
      jwt.verify.mockReturnValueOnce({ id: 'test-user-id', role: 'patient' });

      const response = await request(app)
        .post('/api/consultations')
        .set('Authorization', 'Bearer test-token')
        .send(validConsultationData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Only doctors can create consultations');
      expect(Consultation.create).not.toHaveBeenCalled();
    });

    it('should return 404 if patient not found', async () => {
      User.findOne.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/consultations')
        .set('Authorization', 'Bearer test-token')
        .send(validConsultationData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Patient not found');
      expect(Consultation.create).not.toHaveBeenCalled();
    });

    it('should validate consultation type', async () => {
      const invalidData = {
        ...validConsultationData,
        consultationType: 'invalid_type'
      };

      const response = await request(app)
        .post('/api/consultations')
        .set('Authorization', 'Bearer test-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(Consultation.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/consultations/:id', () => {
    it('should get a consultation successfully', async () => {
      Consultation.findOne.mockResolvedValueOnce({
        ...mockConsultation,
        patient: mockPatient,
        doctor: mockUser
      });
      Consultation.hasAccess.mockResolvedValueOnce(true);

      const response = await request(app)
        .get(`/api/consultations/${mockConsultation.id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('consultation');
      expect(response.body.consultation).toHaveProperty('id', mockConsultation.id);
      expect(response.body.consultation).toHaveProperty('patient');
      expect(response.body.consultation).toHaveProperty('doctor');
      expect(Consultation.hasAccess).toHaveBeenCalledWith(mockUser.id, mockUser.role);
    });

    it('should return 404 if consultation not found', async () => {
      Consultation.findOne.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/consultations/non-existent-id')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Consultation not found');
    });

    it('should return 403 if access denied', async () => {
      Consultation.findOne.mockResolvedValueOnce(mockConsultation);
      Consultation.hasAccess.mockResolvedValueOnce(false);

      const response = await request(app)
        .get(`/api/consultations/${mockConsultation.id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Access denied');
    });
  });

  describe('PUT /api/consultations/:id/status', () => {
    const updateData = {
      status: 'in_progress',
      notes: 'Updated consultation notes'
    };

    it('should update consultation status successfully', async () => {
      Consultation.findOne.mockResolvedValueOnce(mockConsultation);
      Consultation.hasAccess.mockResolvedValueOnce(true);
      Consultation.update.mockResolvedValueOnce([1, [mockConsultation]]);

      const response = await request(app)
        .put(`/api/consultations/${mockConsultation.id}/status`)
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Consultation status updated successfully');
      expect(response.body).toHaveProperty('consultation');
      expect(Consultation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: updateData.status,
          notes: updateData.notes,
          startedAt: expect.any(Date)
        }),
        expect.any(Object)
      );
    });

    it('should update completion time when status is completed', async () => {
      Consultation.findOne.mockResolvedValueOnce({
        ...mockConsultation,
        startedAt: new Date(Date.now() - 3600000) // 1 hour ago
      });
      Consultation.hasAccess.mockResolvedValueOnce(true);
      Consultation.update.mockResolvedValueOnce([1, [mockConsultation]]);

      const response = await request(app)
        .put(`/api/consultations/${mockConsultation.id}/status`)
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'completed' });

      expect(response.status).toBe(200);
      expect(Consultation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          completedAt: expect.any(Date),
          duration: expect.any(Number)
        }),
        expect.any(Object)
      );
    });

    it('should return 404 if consultation not found', async () => {
      Consultation.findOne.mockResolvedValueOnce(null);

      const response = await request(app)
        .put('/api/consultations/non-existent-id/status')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Consultation not found');
      expect(Consultation.update).not.toHaveBeenCalled();
    });

    it('should return 403 if access denied', async () => {
      Consultation.findOne.mockResolvedValueOnce(mockConsultation);
      Consultation.hasAccess.mockResolvedValueOnce(false);

      const response = await request(app)
        .put(`/api/consultations/${mockConsultation.id}/status`)
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Access denied');
      expect(Consultation.update).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/consultations/patient/:patientId', () => {
    it('should get patient consultations successfully', async () => {
      Consultation.findAll.mockResolvedValueOnce([{
        ...mockConsultation,
        doctor: mockUser
      }]);

      const response = await request(app)
        .get(`/api/consultations/patient/${mockPatient.id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('consultations');
      expect(Array.isArray(response.body.consultations)).toBe(true);
      expect(response.body.consultations).toHaveLength(1);
      expect(response.body.consultations[0]).toHaveProperty('doctor');
    });

    it('should filter consultations by status', async () => {
      Consultation.findAll.mockResolvedValueOnce([mockConsultation]);

      const response = await request(app)
        .get(`/api/consultations/patient/${mockPatient.id}?status=scheduled`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(Consultation.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'scheduled'
          })
        })
      );
    });
  });

  describe('GET /api/consultations/doctor/:doctorId', () => {
    it('should get doctor consultations successfully', async () => {
      Consultation.findAll.mockResolvedValueOnce([{
        ...mockConsultation,
        patient: mockPatient
      }]);

      const response = await request(app)
        .get(`/api/consultations/doctor/${mockUser.id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('consultations');
      expect(Array.isArray(response.body.consultations)).toBe(true);
      expect(response.body.consultations).toHaveLength(1);
      expect(response.body.consultations[0]).toHaveProperty('patient');
    });

    it('should return 403 if user is not a doctor or admin', async () => {
      jwt.verify.mockReturnValueOnce({ id: 'test-user-id', role: 'patient' });

      const response = await request(app)
        .get(`/api/consultations/doctor/${mockUser.id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Access denied');
      expect(Consultation.findAll).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/consultations/:id/notes', () => {
    const updateData = {
      notes: 'Updated consultation notes'
    };

    it('should update consultation notes successfully', async () => {
      Consultation.findOne.mockResolvedValueOnce(mockConsultation);
      Consultation.hasAccess.mockResolvedValueOnce(true);
      Consultation.update.mockResolvedValueOnce([1, [mockConsultation]]);

      const response = await request(app)
        .put(`/api/consultations/${mockConsultation.id}/notes`)
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Consultation notes updated successfully');
      expect(response.body).toHaveProperty('consultation');
      expect(Consultation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: updateData.notes
        }),
        expect.any(Object)
      );
    });

    it('should return 404 if consultation not found', async () => {
      Consultation.findOne.mockResolvedValueOnce(null);

      const response = await request(app)
        .put('/api/consultations/non-existent-id/notes')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Consultation not found');
      expect(Consultation.update).not.toHaveBeenCalled();
    });

    it('should return 403 if access denied', async () => {
      Consultation.findOne.mockResolvedValueOnce(mockConsultation);
      Consultation.hasAccess.mockResolvedValueOnce(false);

      const response = await request(app)
        .put(`/api/consultations/${mockConsultation.id}/notes`)
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Access denied');
      expect(Consultation.update).not.toHaveBeenCalled();
    });
  });
}); 