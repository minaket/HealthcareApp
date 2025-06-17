const { sequelize } = require('../models');
const seeder = require('../seeders/20240218-doctors');

async function seedDoctors() {
  try {
    console.log('Starting doctor seeding...');
    await seeder.up(sequelize.getQueryInterface(), sequelize);
    console.log('Doctor seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding doctors:', error);
    process.exit(1);
  }
}

seedDoctors(); 