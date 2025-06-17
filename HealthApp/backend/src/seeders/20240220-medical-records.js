'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Find the patient and doctor
      const [patient] = await queryInterface.sequelize.query(
        `SELECT p.id as patient_id, p.user_id as patient_user_id, u.first_name, u.last_name 
         FROM patients p 
         JOIN users u ON p.user_id = u.id 
         WHERE u.email = 'minakethi5@gmail.com' 
         LIMIT 1`
      );

      const [doctor] = await queryInterface.sequelize.query(
        `SELECT d.id as doctor_id, d.user_id as doctor_user_id, u.first_name, u.last_name 
         FROM doctors d 
         JOIN users u ON d.user_id = u.id 
         LIMIT 1`
      );

      if (!patient || !doctor) {
        console.log('No patient or doctor found, skipping medical records seeding');
        return;
      }

      console.log('Found patient:', patient[0]);
      console.log('Found doctor:', doctor[0]);

      // Create medical records
      const records = [
        {
          id: uuidv4(),
          patient_id: patient[0].patient_user_id,
          doctor_id: doctor[0].doctor_user_id,
          record_type: 'lab_result',
          record_data: JSON.stringify({
            title: 'Blood Test Results',
            description: 'Complete blood count and lipid panel',
            diagnosis: 'Slightly elevated cholesterol levels',
            notes: 'Patient reported elevated cholesterol levels from recent blood test. Recommended dietary changes and follow-up in 3 months.',
            testResults: {
              totalCholesterol: 220,
              hdl: 45,
              ldl: 140,
              triglycerides: 150,
              referenceRange: {
                totalCholesterol: '125-200 mg/dL',
                hdl: '>40 mg/dL',
                ldl: '<100 mg/dL',
                triglycerides: '<150 mg/dL'
              }
            }
          }),
          record_date: new Date(),
          access_level: 'private',
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: uuidv4(),
          patient_id: patient[0].patient_user_id,
          doctor_id: doctor[0].doctor_user_id,
          record_type: 'consultation',
          record_data: JSON.stringify({
            title: 'Regular Checkup',
            description: 'Routine health check',
            diagnosis: 'Regular checkup',
            notes: 'Patient is in good health. Blood pressure and heart rate are normal. Discussed lifestyle modifications for cholesterol management.',
            vitalSigns: {
              bloodPressure: '120/80',
              heartRate: 72,
              temperature: 98.6,
              weight: 65,
              height: 165
            }
          }),
          record_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          access_level: 'private',
          status: 'active',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      ];

      await queryInterface.bulkInsert('medical_records', records);
      console.log('Created medical records:', records.length);
    } catch (error) {
      console.error('Error seeding medical records:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.bulkDelete('medical_records', null, {});
    } catch (error) {
      console.error('Error reverting medical records:', error);
      throw error;
    }
  }
}; 