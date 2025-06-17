const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Find the patient and doctor
      const [patients] = await queryInterface.sequelize.query(
        `SELECT p.id as patient_id, p.user_id as patient_user_id, u.first_name, u.last_name 
         FROM patients p 
         JOIN users u ON p.user_id = u.id 
         WHERE u.role = 'patient' 
         LIMIT 1`
      );

      const [doctors] = await queryInterface.sequelize.query(
        `SELECT d.id as doctor_id, d.user_id as doctor_user_id, u.first_name, u.last_name 
         FROM doctors d 
         JOIN users u ON d.user_id = u.id 
         LIMIT 1`
      );

      if (!patients.length || !doctors.length) {
        console.log('No patients or doctors found in the database. Skipping medical records seeding.');
        if (!patients.length) console.log('No patients found');
        if (!doctors.length) console.log('No doctors found');
        return;
      }

      const patient = patients[0];
      const doctor = doctors[0];

      console.log('Found patient:', patient);
      console.log('Found doctor:', doctor);

      // Create medical records
      const records = [
        {
          id: uuidv4(),
          patient_id: patient.patient_id,
          doctor_id: doctor.doctor_id,
          record_type: 'lab_result',
          record_data: JSON.stringify({
            title: 'Blood Test Results',
            description: 'Complete blood count and lipid panel',
            diagnosis: 'Normal results',
            notes: 'All blood test results are within normal ranges. Patient is in good health.',
            testResults: {
              totalCholesterol: 180,
              hdl: 55,
              ldl: 90,
              triglycerides: 120,
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
          patient_id: patient.patient_id,
          doctor_id: doctor.doctor_id,
          record_type: 'consultation',
          record_data: JSON.stringify({
            title: 'Annual Checkup',
            description: 'Routine health check',
            diagnosis: 'Healthy',
            notes: 'Patient is in good health. Blood pressure and heart rate are normal. Recommended maintaining current lifestyle and diet.',
            vitalSigns: {
              bloodPressure: '118/75',
              heartRate: 68,
              temperature: 98.4,
              weight: 70,
              height: 175
            }
          }),
          record_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          access_level: 'private',
          status: 'active',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          id: uuidv4(),
          patient_id: patient.patient_id,
          doctor_id: doctor.doctor_id,
          record_type: 'prescription',
          record_data: JSON.stringify({
            title: 'Vitamin D Supplement',
            description: 'Prescription for vitamin D deficiency',
            diagnosis: 'Vitamin D deficiency',
            notes: 'Patient reported fatigue and low energy levels. Blood test showed vitamin D deficiency.',
            prescription: {
              medication: 'Vitamin D3',
              dosage: '1000 IU',
              frequency: 'Once daily',
              duration: '3 months',
              instructions: 'Take with food',
              refills: 2
            }
          }),
          record_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
          access_level: 'private',
          status: 'active',
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
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