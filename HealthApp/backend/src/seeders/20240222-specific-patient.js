const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create a patient user with specific ID
    const patient = {
      id: 'e99b722a-a247-41d0-afb7-1106a56fa426', // Using the specific ID
      email: 'specific.patient@healthcare.com',
      password_hash: await bcrypt.hash('Patient123@', 10),
      password_salt: await bcrypt.genSalt(10),
      role: 'patient',
      first_name: 'Specific',
      last_name: 'Patient',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Insert user
    await queryInterface.bulkInsert('users', [patient]);

    // Create patient profile
    const patientProfile = {
      id: uuidv4(), // Generate new UUID for patient profile
      user_id: patient.id,
      date_of_birth: '1990-01-01',
      gender: 'male',
      blood_type: 'O+',
      allergies: ['Penicillin'],
      chronic_conditions: [],
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Insert patient profile
    await queryInterface.bulkInsert('patients', [patientProfile]);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove patient profile
    await queryInterface.bulkDelete('patients', { user_id: 'e99b722a-a247-41d0-afb7-1106a56fa426' }, {});
    // Remove patient user
    await queryInterface.bulkDelete('users', { id: 'e99b722a-a247-41d0-afb7-1106a56fa426' }, {});
  }
}; 