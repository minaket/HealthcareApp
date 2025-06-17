const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get a doctor from the database
    const [doctors] = await queryInterface.sequelize.query(
      `SELECT d.id as doctor_id, d.user_id as doctor_user_id, u.first_name, u.last_name 
       FROM doctors d 
       JOIN users u ON d.user_id = u.id 
       LIMIT 1`
    );

    // Get the patient by user ID
    const [patients] = await queryInterface.sequelize.query(
      `SELECT p.id as patient_id, p.user_id as patient_user_id, u.first_name, u.last_name 
       FROM patients p 
       JOIN users u ON p.user_id = u.id 
       WHERE u.id = 'e99b722a-a247-41d0-afb7-1106a56fa426' 
       LIMIT 1`
    );

    if (!doctors.length || !patients.length) {
      console.log('No doctors or patients found in the database. Skipping conversation seeding.');
      if (!doctors.length) console.log('No doctors found');
      if (!patients.length) console.log('No patient found with ID e99b722a-a247-41d0-afb7-1106a56fa426');
      return;
    }

    const doctor = doctors[0];
    const patient = patients[0];

    console.log('Found doctor:', doctor);
    console.log('Found patient:', patient);

    // Create a conversation
    const conversation = {
      id: uuidv4(),
      patient_id: patient.patient_id,
      doctor_id: doctor.doctor_id,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };

    await queryInterface.bulkInsert('conversations', [conversation]);

    // Create some messages
    const messages = [
      {
        id: uuidv4(),
        conversation_id: conversation.id,
        sender_id: patient.patient_user_id,
        content: 'Hello doctor, I have a question about my recent test results.',
        is_read: true,
        created_at: new Date(Date.now() - 3600000), // 1 hour ago
        updated_at: new Date(Date.now() - 3600000)
      },
      {
        id: uuidv4(),
        conversation_id: conversation.id,
        sender_id: doctor.doctor_user_id,
        content: 'Hello! I\'d be happy to help. Could you please share which test results you\'re referring to?',
        is_read: true,
        created_at: new Date(Date.now() - 3500000), // 58 minutes ago
        updated_at: new Date(Date.now() - 3500000)
      },
      {
        id: uuidv4(),
        conversation_id: conversation.id,
        sender_id: patient.patient_user_id,
        content: 'It was the blood test from last week. I noticed my cholesterol levels were slightly elevated.',
        is_read: false,
        created_at: new Date(Date.now() - 3400000), // 56 minutes ago
        updated_at: new Date(Date.now() - 3400000)
      }
    ];

    await queryInterface.bulkInsert('messages', messages);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove messages first (due to foreign key constraints)
    await queryInterface.bulkDelete('messages', null, {});
    // Then remove conversations
    await queryInterface.bulkDelete('conversations', null, {});
  }
}; 