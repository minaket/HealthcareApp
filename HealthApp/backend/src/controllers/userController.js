const { User, Doctor } = require('../models');

// Get list of doctors
const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.findAll({
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      attributes: ['id', 'specialization', 'licenseNumber', 'yearsOfExperience', 'availability']
    });

    const formattedDoctors = doctors.map(doctor => ({
      id: doctor.id,
      userId: doctor.User.id,
      firstName: doctor.User.firstName,
      lastName: doctor.User.lastName,
      email: doctor.User.email,
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber,
      yearsOfExperience: doctor.yearsOfExperience,
      availability: doctor.availability
    }));

    res.json({
      data: formattedDoctors,
      total: formattedDoctors.length
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      message: 'Error fetching doctors',
      code: 'FETCH_ERROR'
    });
  }
};

module.exports = {
  getDoctors
}; 