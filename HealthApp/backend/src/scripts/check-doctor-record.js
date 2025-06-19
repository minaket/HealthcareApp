const { User, Doctor } = require('../models');

async function checkDoctorRecord() {
  try {
    console.log('Checking doctor records...');
    
    // Find the user
    const user = await User.findOne({
      where: { email: 'neemahealthhospital@gmail.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    });
    
    // Check if doctor record exists
    const doctor = await Doctor.findOne({
      where: { userId: user.id }
    });
    
    if (!doctor) {
      console.log('No doctor record found for this user');
      console.log('Creating doctor record...');
      
      // Create doctor record
      const newDoctor = await Doctor.create({
        userId: user.id,
        specialization: 'General Medicine',
        licenseNumber: `MD${Math.floor(Math.random() * 1000000)}`,
        yearsOfExperience: 10,
        availability: {
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          startTime: '09:00 AM',
          endTime: '05:00 PM'
        },
        consultationFee: 150.00
      });
      
      console.log('Doctor record created:', newDoctor.id);
    } else {
      console.log('Doctor record found:', {
        id: doctor.id,
        specialization: doctor.specialization,
        licenseNumber: doctor.licenseNumber
      });
    }
    
    // List all doctors
    const allDoctors = await Doctor.findAll({
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });
    
    console.log('\nAll doctors in database:');
    allDoctors.forEach(doc => {
      console.log(`- ${doc.User.firstName} ${doc.User.lastName} (${doc.User.email}) - ${doc.specialization}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkDoctorRecord(); 