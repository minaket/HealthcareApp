const { MedicalRecord, Patient, User, Doctor } = require('../models');

// Get patient's medical records
const getPatientRecords = async (req, res) => {
  try {
    const userId = req.user.id;
    const patient = await Patient.findOne({ where: { userId: userId } });
    
    if (!patient) {
      return res.status(404).json({
        message: 'Patient record not found',
        code: 'PATIENT_NOT_FOUND'
      });
    }

    const records = await MedicalRecord.findAll({
      where: { patientId: patient.id },
      include: [
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(records);
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({
      message: 'Error fetching medical records',
      code: 'FETCH_ERROR'
    });
  }
};

// Get doctor's medical records
const getDoctorRecords = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const records = await MedicalRecord.findAll({
      where: { doctorId: doctorId },
      include: [
        {
          model: Patient,
          include: [{
            model: User,
            attributes: ['id', 'firstName', 'lastName', 'email']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(records);
  } catch (error) {
    console.error('Error fetching doctor medical records:', error);
    res.status(500).json({
      message: 'Error fetching medical records',
      code: 'FETCH_ERROR'
    });
  }
};

// Get doctor's medical records (alias for getDoctorRecords)
const getDoctorMedicalRecords = async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // Get doctor record
    const doctor = await Doctor.findOne({
      where: { userId: doctorId }
    });

    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor not found',
        code: 'NOT_FOUND'
      });
    }

    const records = await MedicalRecord.findAll({
      where: { doctorId: doctor.id },
      include: [
        {
          model: Patient,
          include: [{
            model: User,
            attributes: ['id', 'firstName', 'lastName', 'email']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedRecords = records.map(record => ({
      id: record.id,
      patientId: record.patientId,
      patientName: `${record.Patient.User.firstName} ${record.Patient.User.lastName}`,
      date: record.createdAt,
      diagnosis: record.diagnosis || 'No diagnosis',
      treatment: record.treatment || 'No treatment',
      notes: record.notes || '',
      attachments: record.attachments || []
    }));

    res.json(formattedRecords);
  } catch (error) {
    console.error('Error fetching doctor medical records:', error);
    res.status(500).json({
      message: 'Error fetching medical records',
      code: 'FETCH_ERROR'
    });
  }
};

// Create medical record
const createMedicalRecord = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { patientId, diagnosis, treatment, notes, prescription } = req.body;

    // Get doctor record
    const doctor = await Doctor.findOne({
      where: { userId: doctorId }
    });

    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor not found',
        code: 'NOT_FOUND'
      });
    }

    // Validate required fields
    if (!patientId || !diagnosis) {
      return res.status(400).json({
        message: 'Patient ID and diagnosis are required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Create the medical record
    const medicalRecord = await MedicalRecord.create({
      doctorId: doctor.id,
      patientId,
      diagnosis,
      treatment: treatment || '',
      notes: notes || '',
      prescription: prescription ? JSON.stringify(prescription) : null
    });

    res.status(201).json({
      message: 'Medical record created successfully',
      record: {
        id: medicalRecord.id,
        diagnosis: medicalRecord.diagnosis,
        treatment: medicalRecord.treatment,
        notes: medicalRecord.notes,
        createdAt: medicalRecord.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating medical record:', error);
    res.status(500).json({
      message: 'Error creating medical record',
      code: 'CREATE_ERROR'
    });
  }
};

module.exports = {
  getPatientRecords,
  getDoctorRecords,
  getDoctorMedicalRecords,
  createMedicalRecord
}; 