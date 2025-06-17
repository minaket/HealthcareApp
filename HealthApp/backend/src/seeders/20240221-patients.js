const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create a patient user
    const patient = {
      id: uuidv4(),
      email: 'patient@healthcare.com',
      password_hash: await bcrypt.hash('Patient123@', 10),
      password_salt: await bcrypt.genSalt(10),
      role: 'patient',
      first_name: 'John',
      last_name: 'Doe',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Insert user
    await queryInterface.bulkInsert('users', [patient]);

    // Create patient profile
    const patientProfile = {
      id: uuidv4(),
      user_id: patient.id,
      date_of_birth: '1990-01-01',
      gender: 'male',
      blood_type: 'O+',
      allergies: 'Penicillin',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Insert patient profile
    await queryInterface.bulkInsert('patients', [patientProfile]);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove patient profile
    await queryInterface.bulkDelete('patients', null, {});
    // Remove patient user
    await queryInterface.bulkDelete('users', { role: 'patient' }, {});
  }
}; 