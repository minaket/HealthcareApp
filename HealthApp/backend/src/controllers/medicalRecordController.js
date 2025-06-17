const { MedicalRecord, Patient, User } = require('../models');

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

module.exports = {
  getPatientRecords,
  getDoctorRecords
}; 