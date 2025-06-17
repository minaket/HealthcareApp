const { MedicalRecord, User, Doctor } = require('../models');
const AccessLog = require('../models/AccessLog');
const encryption = require('../utils/encryption');

// Create a new medical record
const createRecord = async (req, res) => {
  try {
    const { patientId, recordData, recordType, accessLevel } = req.body;
    const doctorId = req.user.id;

    // Verify doctor has permission to create record
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only doctors can create medical records' });
    }

    // Verify patient exists
    const patient = await User.findOne({
      where: { id: patientId, role: 'patient' }
    });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Create record
    const record = await MedicalRecord.create({
      patientId,
      doctorId,
      recordData,
      recordType,
      accessLevel: accessLevel || 'private'
    });

    // Log access
    await AccessLog.logAccess({
      userId: doctorId,
      action: 'create',
      resourceType: 'medical_record',
      resourceId: record.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.status(201).json({
      message: 'Medical record created successfully',
      record: {
        id: record.id,
        patientId: record.patientId,
        doctorId: record.doctorId,
        recordType: record.recordType,
        recordDate: record.recordDate,
        accessLevel: record.accessLevel
      }
    });
  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({ message: 'Error creating medical record' });
  }
};

// Get a medical record
const getRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await MedicalRecord.findByPk(id, {
      include: [
        { model: User, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Check access permissions
    const hasAccess = await record.hasAccess(req.user.id, req.user.role);
    if (!hasAccess) {
      await AccessLog.logAccess({
        userId: req.user.id,
        action: 'view',
        resourceType: 'medical_record',
        resourceId: record.id,
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
      resourceType: 'medical_record',
      resourceId: record.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({
      record: {
        id: record.id,
        patientId: record.patientId,
        doctorId: record.doctorId,
        recordData: record.recordData,
        recordType: record.recordType,
        recordDate: record.recordDate,
        accessLevel: record.accessLevel,
        patient: record.patient,
        doctor: record.doctor
      }
    });
  } catch (error) {
    console.error('Get record error:', error);
    res.status(500).json({ message: 'Error retrieving medical record' });
  }
};

// Update a medical record
const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { recordData, accessLevel } = req.body;

    const record = await MedicalRecord.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Check access permissions
    const hasAccess = await record.hasAccess(req.user.id, req.user.role);
    if (!hasAccess) {
      await AccessLog.logAccess({
        userId: req.user.id,
        action: 'update',
        resourceType: 'medical_record',
        resourceId: record.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'unauthorized'
      });
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update record
    await record.update({
      recordData: recordData || record.recordData,
      accessLevel: accessLevel || record.accessLevel
    });

    // Log access
    await AccessLog.logAccess({
      userId: req.user.id,
      action: 'update',
      resourceType: 'medical_record',
      resourceId: record.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({
      message: 'Medical record updated successfully',
      record: {
        id: record.id,
        patientId: record.patientId,
        doctorId: record.doctorId,
        recordType: record.recordType,
        recordDate: record.recordDate,
        accessLevel: record.accessLevel
      }
    });
  } catch (error) {
    console.error('Update record error:', error);
    res.status(500).json({ message: 'Error updating medical record' });
  }
};

// Get patient's medical records
const getPatientRecords = async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if user has access to patient's records
    if (userRole !== 'admin' && userRole !== 'doctor' && userId !== patientId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const records = await MedicalRecord.findAll({
      where: { patientId },
      include: [
        { 
          model: Doctor,
          include: [{
            model: User,
            attributes: ['id', 'firstName', 'lastName']
          }]
        }
      ],
      order: [['recordDate', 'DESC']]
    });

    // Log access
    await AccessLog.logAccess({
      userId: req.user.id,
      action: 'view',
      resourceType: 'medical_record',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: { patientId }
    });

    res.json({
      records: records.map(record => ({
        id: record.id,
        doctorId: record.doctorId,
        recordData: record.recordData,
        recordType: record.recordType,
        recordDate: record.recordDate,
        accessLevel: record.accessLevel,
        doctor: record.Doctor?.User ? {
          id: record.Doctor.User.id,
          firstName: record.Doctor.User.firstName,
          lastName: record.Doctor.User.lastName
        } : null
      }))
    });
  } catch (error) {
    console.error('Get patient records error:', error);
    res.status(500).json({ message: 'Error retrieving patient records' });
  }
};

// Get doctor's medical records
const getDoctorRecords = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if user has access to doctor's records
    if (userRole !== 'admin' && userId !== doctorId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const records = await MedicalRecord.findAll({
      where: { doctorId },
      include: [
        { model: User, as: 'patient', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['recordDate', 'DESC']]
    });

    // Log access
    await AccessLog.logAccess({
      userId: req.user.id,
      action: 'view',
      resourceType: 'medical_record',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: { doctorId }
    });

    res.json({
      records: records.map(record => ({
        id: record.id,
        patientId: record.patientId,
        recordData: record.recordData,
        recordType: record.recordType,
        recordDate: record.recordDate,
        accessLevel: record.accessLevel,
        patient: record.patient
      }))
    });
  } catch (error) {
    console.error('Get doctor records error:', error);
    res.status(500).json({ message: 'Error retrieving doctor records' });
  }
};

// Delete a medical record (soft delete)
const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await MedicalRecord.findByPk(id);

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Check access permissions
    if (req.user.role !== 'admin' && req.user.id !== record.doctorId) {
      await AccessLog.logAccess({
        userId: req.user.id,
        action: 'delete',
        resourceType: 'medical_record',
        resourceId: record.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'unauthorized'
      });
      return res.status(403).json({ message: 'Access denied' });
    }

    // Soft delete
    await record.update({ status: 'deleted' });

    // Log access
    await AccessLog.logAccess({
      userId: req.user.id,
      action: 'delete',
      resourceType: 'medical_record',
      resourceId: record.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({ message: 'Medical record deleted successfully' });
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({ message: 'Error deleting medical record' });
  }
};

module.exports = {
  createRecord,
  getRecord,
  updateRecord,
  getPatientRecords,
  getDoctorRecords,
  deleteRecord
}; 