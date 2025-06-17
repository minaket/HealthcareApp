const { Patient, User, MedicalRecord, Appointment, Doctor, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get patient health summary
const getHealthSummary = async (req, res) => {
  try {
    const patientId = req.user.id;

    // First check if user exists
    const user = await User.findOne({
      where: { id: patientId, role: 'patient' }
    });

    if (!user) {
      return res.status(404).json({
        message: 'Patient not found',
        code: 'NOT_FOUND'
      });
    }

    // Get or create patient record
    let [patient, created] = await Patient.findOrCreate({
      where: { userId: patientId },
      defaults: {
        userId: patientId,
        status: 'active'
      }
    });

    // Update patient record with user data if needed
    if (!patient.firstName || !patient.lastName) {
      await patient.update({
        firstName: user.firstName,
        lastName: user.lastName
      });
      // Refresh patient data
      patient = await Patient.findByPk(patient.id);
    }

    // Get medical records and appointments separately to avoid association issues
    const [medicalRecords, appointments] = await Promise.all([
      MedicalRecord.findAll({
        where: { patientId: patient.id },
        include: [{
          model: Doctor,
          include: [{
            model: User,
            attributes: ['id', 'firstName', 'lastName']
          }]
        }],
        limit: 5,
        order: [['createdAt', 'DESC']]
      }),
      Appointment.findAll({
        where: {
          patientId: patient.id,
          status: 'scheduled',
          date: {
            [Op.gte]: new Date()
          }
        },
        include: [{
          model: Doctor,
          include: [{
            model: User,
            attributes: ['id', 'firstName', 'lastName']
          }]
        }],
        limit: 1,
        order: [['date', 'ASC']]
      })
    ]);

    res.json({
      patient: {
        id: patient.id,
        firstName: patient.firstName || user.firstName,
        lastName: patient.lastName || user.lastName,
        dateOfBirth: patient.dateOfBirth || null,
        gender: patient.gender || null,
        bloodType: patient.bloodType || null,
        allergies: patient.allergies || [],
        chronicConditions: patient.chronicConditions || [],
        needsProfileUpdate: !patient.dateOfBirth || !patient.gender
      },
      recentRecords: medicalRecords.map(record => ({
        id: record.id,
        recordType: record.recordType,
        recordData: record.recordData,
        recordDate: record.recordDate,
        doctor: record.Doctor?.User ? {
          id: record.Doctor.User.id,
          firstName: record.Doctor.User.firstName,
          lastName: record.Doctor.User.lastName
        } : null
      })),
      nextAppointment: appointments[0] ? {
        id: appointments[0].id,
        date: appointments[0].date,
        type: appointments[0].type,
        status: appointments[0].status,
        doctor: appointments[0].Doctor?.User ? {
          id: appointments[0].Doctor.User.id,
          firstName: appointments[0].Doctor.User.firstName,
          lastName: appointments[0].Doctor.User.lastName,
          specialization: appointments[0].Doctor.specialization
        } : null
      } : null
    });
  } catch (error) {
    console.error('Get health summary error:', error);
    res.status(500).json({
      message: 'Error fetching health summary',
      code: 'FETCH_ERROR'
    });
  }
};

// Get patient medical records
const getMedicalRecords = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get patient record first
    const patient = await Patient.findOne({
      where: { userId: userId }
    });

    if (!patient) {
      return res.status(404).json({
        message: 'Patient record not found',
        code: 'PATIENT_NOT_FOUND'
      });
    }

    const records = await MedicalRecord.findAndCountAll({
      where: { patient_id: patient.id },
      include: [{
        model: Doctor,
        include: [{
          model: User,
          attributes: ['id', 'firstName', 'lastName']
        }]
      }],
      order: [['record_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      records: records.rows.map(record => ({
        id: record.id,
        recordType: record.record_type,
        recordData: record.record_data,
        recordDate: record.record_date,
        accessLevel: record.access_level,
        doctor: record.Doctor?.User ? {
          id: record.Doctor.User.id,
          firstName: record.Doctor.User.firstName,
          lastName: record.Doctor.User.lastName,
          specialization: record.Doctor.specialization
        } : null
      })),
      total: records.count,
      page: parseInt(page),
      totalPages: Math.ceil(records.count / limit)
    });
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({
      message: 'Error fetching medical records',
      code: 'FETCH_ERROR'
    });
  }
};

// Get doctor's patients
const getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const patients = await Patient.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Appointment,
          where: { doctorId: doctorId },
          required: false
        }
      ]
    });

    res.json(patients);
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    res.status(500).json({
      message: 'Error fetching patients',
      code: 'FETCH_ERROR'
    });
  }
};

// Update patient profile
const updatePatientProfile = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { dateOfBirth, gender, bloodType, allergies, chronicConditions } = req.body;

    // Validate date of birth
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      if (dob > new Date()) {
        return res.status(400).json({
          message: 'Date of birth cannot be in the future',
          code: 'INVALID_DATE'
        });
      }
    }

    // Validate gender
    if (gender && !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({
        message: 'Invalid gender value',
        code: 'INVALID_GENDER'
      });
    }

    // Validate blood type
    if (bloodType && !['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(bloodType)) {
      return res.status(400).json({
        message: 'Invalid blood type',
        code: 'INVALID_BLOOD_TYPE'
      });
    }

    // Get patient record
    const patient = await Patient.findOne({
      where: { userId: patientId }
    });

    if (!patient) {
      return res.status(404).json({
        message: 'Patient not found',
        code: 'NOT_FOUND'
      });
    }

    // Update patient record
    await patient.update({
      dateOfBirth: dateOfBirth || patient.dateOfBirth,
      gender: gender || patient.gender,
      bloodType: bloodType || patient.bloodType,
      allergies: allergies || patient.allergies,
      chronicConditions: chronicConditions || patient.chronicConditions
    });

    res.json({
      message: 'Profile updated successfully',
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions
      }
    });
  } catch (error) {
    console.error('Update patient profile error:', error);
    res.status(500).json({
      message: 'Error updating profile',
      code: 'UPDATE_ERROR'
    });
  }
};

module.exports = {
  getHealthSummary,
  getMedicalRecords,
  getDoctorPatients,
  updatePatientProfile
}; 