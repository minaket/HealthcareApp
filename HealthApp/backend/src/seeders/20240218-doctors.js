const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if doctors already exist
    const [existingDoctors] = await queryInterface.sequelize.query(
      `SELECT u.email FROM users u WHERE u.role = 'doctor'`
    );

    if (existingDoctors.length > 0) {
      console.log('Doctors already exist in the database. Skipping doctor seeding.');
      return;
    }

    // Create doctor users
    const doctors = [
      {
        id: uuidv4(),
        email: 'dr.smith@healthcare.com',
        password_hash: await bcrypt.hash('Doctor123@', 10),
        password_salt: await bcrypt.genSalt(10),
        role: 'doctor',
        first_name: 'John',
        last_name: 'Smith',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'dr.johnson@healthcare.com',
        password_hash: await bcrypt.hash('Doctor123@', 10),
        password_salt: await bcrypt.genSalt(10),
        role: 'doctor',
        first_name: 'Sarah',
        last_name: 'Johnson',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Insert users
    await queryInterface.bulkInsert('users', doctors);

    // Create doctor profiles
    const doctorProfiles = doctors.map(user => ({
      id: uuidv4(),
      user_id: user.id,
      specialization: user.email.includes('smith') ? 'Cardiology' : 'Pediatrics',
      license_number: `MD${Math.floor(Math.random() * 1000000)}`,
      years_of_experience: Math.floor(Math.random() * 20) + 5,
      availability: JSON.stringify({
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: '09:00 AM',
        endTime: '05:00 PM'
      }),
      consultation_fee: 150.00,
      created_at: new Date(),
      updated_at: new Date()
    }));

    // Insert doctor profiles
    await queryInterface.bulkInsert('doctors', doctorProfiles);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove doctor profiles
    await queryInterface.bulkDelete('doctors', null, {});
    // Remove doctor users
    await queryInterface.bulkDelete('users', { role: 'doctor' }, {});
  }
}; 