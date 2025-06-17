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

// Get patient profile
const getPatientProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const patient = await Patient.findOne({
      where: { userId },
      include: [{
        model: User,
        attributes: ['email', 'phoneNumber', 'address']
      }]
    });

    if (!patient) {
      return res.status(404).json({
        message: 'Patient not found',
        code: 'NOT_FOUND'
      });
    }

    // Combine patient and user data
    const profileData = {
      ...patient.toJSON(),
      email: patient.User?.email,
      phoneNumber: patient.User?.phoneNumber,
      address: patient.User?.address,
      emergencyContact: patient.emergencyContactName ? {
        name: patient.emergencyContactName,
        relationship: patient.emergencyContactRelationship,
        phoneNumber: patient.emergencyContactPhone,
        email: patient.emergencyContactEmail,
        address: patient.emergencyContactAddress
      } : null
    };

    res.json(profileData);
  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({
      message: 'Error fetching profile',
      code: 'FETCH_ERROR'
    });
  }
};

// Update patient profile
const updatePatientProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // First check if user exists
    const user = await User.findOne({
      where: { id: userId, role: 'patient' }
    });

    if (!user) {
      return res.status(404).json({
        message: 'Patient not found',
        code: 'NOT_FOUND'
      });
    }

    // Get or create patient record
    let [patient, created] = await Patient.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        status: 'active'
      }
    });

    // Update user fields
    const userUpdateData = {};
    if (req.body.phoneNumber !== undefined) userUpdateData.phoneNumber = req.body.phoneNumber;
    if (req.body.address !== undefined) userUpdateData.address = req.body.address;
    
    if (Object.keys(userUpdateData).length > 0) {
      await user.update(userUpdateData);
    }

    // Update patient fields
    const patientUpdateData = {};
    
    if (req.body.firstName !== undefined) patientUpdateData.firstName = req.body.firstName;
    if (req.body.lastName !== undefined) patientUpdateData.lastName = req.body.lastName;
    if (req.body.dateOfBirth !== undefined) patientUpdateData.dateOfBirth = req.body.dateOfBirth;
    
    // Normalize gender to lowercase to match enum
    if (req.body.gender !== undefined) {
      const normalizedGender = req.body.gender.toLowerCase();
      if (['male', 'female', 'other'].includes(normalizedGender)) {
        patientUpdateData.gender = normalizedGender;
      } else {
        return res.status(400).json({
          message: 'Invalid gender value. Must be male, female, or other',
          code: 'VALIDATION_ERROR'
        });
      }
    }
    
    // Normalize blood type to match enum
    if (req.body.bloodType !== undefined) {
      const normalizedBloodType = req.body.bloodType.toUpperCase();
      if (['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(normalizedBloodType)) {
        patientUpdateData.bloodType = normalizedBloodType;
      } else {
        return res.status(400).json({
          message: 'Invalid blood type value. Must be A+, A-, B+, B-, AB+, AB-, O+, or O-',
          code: 'VALIDATION_ERROR'
        });
      }
    }
    
    if (req.body.allergies !== undefined) patientUpdateData.allergies = req.body.allergies;
    if (req.body.chronicConditions !== undefined) patientUpdateData.chronicConditions = req.body.chronicConditions;

    // Update emergency contact fields
    if (req.body.emergencyContact !== undefined) {
      if (req.body.emergencyContact.name !== undefined) {
        patientUpdateData.emergencyContactName = req.body.emergencyContact.name;
      }
      if (req.body.emergencyContact.relationship !== undefined) {
        patientUpdateData.emergencyContactRelationship = req.body.emergencyContact.relationship;
      }
      if (req.body.emergencyContact.phoneNumber !== undefined) {
        patientUpdateData.emergencyContactPhone = req.body.emergencyContact.phoneNumber;
      }
      if (req.body.emergencyContact.email !== undefined) {
        patientUpdateData.emergencyContactEmail = req.body.emergencyContact.email;
      }
      if (req.body.emergencyContact.address !== undefined) {
        patientUpdateData.emergencyContactAddress = req.body.emergencyContact.address;
      }
    }

    await patient.update(patientUpdateData);
    
    // Refresh patient data with user data
    const updatedPatient = await Patient.findOne({
      where: { id: patient.id },
      include: [{
        model: User,
        attributes: ['email', 'phoneNumber', 'address']
      }]
    });
    
    // Combine patient and user data
    const profileData = {
      ...updatedPatient.toJSON(),
      email: updatedPatient.User?.email,
      phoneNumber: updatedPatient.User?.phoneNumber,
      address: updatedPatient.User?.address,
      emergencyContact: updatedPatient.emergencyContactName ? {
        name: updatedPatient.emergencyContactName,
        relationship: updatedPatient.emergencyContactRelationship,
        phoneNumber: updatedPatient.emergencyContactPhone,
        email: updatedPatient.emergencyContactEmail,
        address: updatedPatient.emergencyContactAddress
      } : null
    };
    
    res.json({
      message: 'Profile updated successfully',
      patient: profileData
    });
  } catch (error) {
    console.error('Update patient profile error:', error);
    res.status(500).json({
      message: 'Error updating profile',
      code: 'UPDATE_ERROR',
      details: error.message
    });
  }
};

module.exports = {
  getHealthSummary,
  getMedicalRecords,
  getDoctorPatients,
  updatePatientProfile,
  getPatientProfile,
}; 