const { Consultation, User } = require('../models');
const AccessLog = require('../models/AccessLog');
const encryption = require('../utils/encryption');

// Create a new consultation
const createConsultation = async (req, res) => {
  try {
    const { patientId, scheduledAt, consultationType, notes } = req.body;
    const doctorId = req.user.id;

    // Verify doctor has permission to create consultation
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only doctors can create consultations' });
    }

    // Verify patient exists
    const patient = await User.findOne({
      where: { id: patientId, role: 'patient' }
    });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Create consultation
    const consultation = await Consultation.create({
      patientId,
      doctorId,
      scheduledAt,
      consultationType,
      notes,
      status: 'scheduled'
    });

    // Log access
    await AccessLog.logAccess({
      userId: doctorId,
      action: 'create',
      resourceType: 'consultation',
      resourceId: consultation.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.status(201).json({
      message: 'Consultation created successfully',
      consultation: {
        id: consultation.id,
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
        scheduledAt: consultation.scheduledAt,
        consultationType: consultation.consultationType,
        status: consultation.status
      }
    });
  } catch (error) {
    console.error('Create consultation error:', error);
    res.status(500).json({ message: 'Error creating consultation' });
  }
};

// Get a consultation
const getConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const consultation = await Consultation.findByPk(id, {
      include: [
        { model: User, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Check access permissions
    const hasAccess = await consultation.hasAccess(req.user.id, req.user.role);
    if (!hasAccess) {
      await AccessLog.logAccess({
        userId: req.user.id,
        action: 'view',
        resourceType: 'consultation',
        resourceId: consultation.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'unauthorized'
      });
      return res.status(403).json({ message: 'Access denied' });
    }

    // Log access
    await AccessLog.logAccess({
      userId: req.user.id,
      action: 'view',
      resourceType: 'consultation',
      resourceId: consultation.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({
      consultation: {
        id: consultation.id,
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
        consultationData: consultation.consultationData,
        status: consultation.status,
        scheduledAt: consultation.scheduledAt,
        startedAt: consultation.startedAt,
        completedAt: consultation.completedAt,
        duration: consultation.duration,
        consultationType: consultation.consultationType,
        notes: consultation.notes,
        attachments: consultation.attachments,
        patient: consultation.patient,
        doctor: consultation.doctor
      }
    });
  } catch (error) {
    console.error('Get consultation error:', error);
    res.status(500).json({ message: 'Error retrieving consultation' });
  }
};

// Update consultation status
const updateConsultationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const consultation = await Consultation.findByPk(id);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Check access permissions
    const hasAccess = await consultation.hasAccess(req.user.id, req.user.role);
    if (!hasAccess) {
      await AccessLog.logAccess({
        userId: req.user.id,
        action: 'update',
        resourceType: 'consultation',
        resourceId: consultation.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'unauthorized'
      });
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update status and timestamps
    const updates = { status };
    if (status === 'in_progress' && !consultation.startedAt) {
      updates.startedAt = new Date();
    } else if (status === 'completed' && !consultation.completedAt) {
      updates.completedAt = new Date();
      if (consultation.startedAt) {
        updates.duration = Math.round(
          (new Date() - consultation.startedAt) / (1000 * 60)
        );
      }
    }

    if (notes) {
      updates.notes = notes;
    }

    await consultation.update(updates);

    // Log access
    await AccessLog.logAccess({
      userId: req.user.id,
      action: 'update',
      resourceType: 'consultation',
      resourceId: consultation.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: { status }
    });

    res.json({
      message: 'Consultation status updated successfully',
      consultation: {
        id: consultation.id,
        status: consultation.status,
        startedAt: consultation.startedAt,
        completedAt: consultation.completedAt,
        duration: consultation.duration
      }
    });
  } catch (error) {
    console.error('Update consultation status error:', error);
    res.status(500).json({ message: 'Error updating consultation status' });
  }
};

// Get patient's consultations
const getPatientConsultations = async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if user has access to patient's consultations
    if (userRole !== 'admin' && userRole !== 'doctor' && userId !== patientId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const consultations = await Consultation.findAll({
      where: { patientId },
      include: [
        { model: User, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['scheduledAt', 'DESC']]
    });

    // Log access
    await AccessLog.logAccess({
      userId: req.user.id,
      action: 'view',
      resourceType: 'consultation',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: { patientId }
    });

    res.json({
      consultations: consultations.map(consultation => ({
        id: consultation.id,
        doctorId: consultation.doctorId,
        status: consultation.status,
        scheduledAt: consultation.scheduledAt,
        startedAt: consultation.startedAt,
        completedAt: consultation.completedAt,
        duration: consultation.duration,
        consultationType: consultation.consultationType,
        doctor: consultation.doctor
      }))
    });
  } catch (error) {
    console.error('Get patient consultations error:', error);
    res.status(500).json({ message: 'Error retrieving patient consultations' });
  }
};

// Get doctor's consultations
const getDoctorConsultations = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if user has access to doctor's consultations
    if (userRole !== 'admin' && userId !== doctorId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const consultations = await Consultation.findAll({
      where: { doctorId },
      include: [
        { model: User, as: 'patient', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['scheduledAt', 'DESC']]
    });

    // Log access
    await AccessLog.logAccess({
      userId: req.user.id,
      action: 'view',
      resourceType: 'consultation',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: { doctorId }
    });

    res.json({
      consultations: consultations.map(consultation => ({
        id: consultation.id,
        patientId: consultation.patientId,
        status: consultation.status,
        scheduledAt: consultation.scheduledAt,
        startedAt: consultation.startedAt,
        completedAt: consultation.completedAt,
        duration: consultation.duration,
        consultationType: consultation.consultationType,
        patient: consultation.patient
      }))
    });
  } catch (error) {
    console.error('Get doctor consultations error:', error);
    res.status(500).json({ message: 'Error retrieving doctor consultations' });
  }
};

// Add consultation notes
const addConsultationNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const consultation = await Consultation.findByPk(id);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Check access permissions
    const hasAccess = await consultation.hasAccess(req.user.id, req.user.role);
    if (!hasAccess) {
      await AccessLog.logAccess({
        userId: req.user.id,
        action: 'update',
        resourceType: 'consultation',
        resourceId: consultation.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'unauthorized'
      });
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update notes
    await consultation.update({ notes });

    // Log access
    await AccessLog.logAccess({
      userId: req.user.id,
      action: 'update',
      resourceType: 'consultation',
      resourceId: consultation.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: { action: 'add_notes' }
    });

    res.json({
      message: 'Consultation notes updated successfully',
      consultation: {
        id: consultation.id,
        notes: consultation.notes
      }
    });
  } catch (error) {
    console.error('Add consultation notes error:', error);
    res.status(500).json({ message: 'Error updating consultation notes' });
  }
};

module.exports = {
  createConsultation,
  getConsultation,
  updateConsultationStatus,
  getPatientConsultations,
  getDoctorConsultations,
  addConsultationNotes
}; 