const { sequelize } = require('../models');
const seeder = require('../seeders/20240218-doctors');

async function reseedDoctors() {
  try {
    console.log('Starting doctor reseeding...');
    
    // Run the down migration first to clean up
    await seeder.down(sequelize.getQueryInterface(), sequelize);
    console.log('Cleaned up existing doctor records');
    
    // Run the up migration to create new records
    await seeder.up(sequelize.getQueryInterface(), sequelize);
    console.log('Successfully reseeded doctors with updated availability');
    
    process.exit(0);
  } catch (error) {
    console.error('Error reseeding doctors:', error);
    process.exit(1);
  }
}

reseedDoctors(); 