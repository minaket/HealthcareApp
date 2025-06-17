'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add fields to users table
    await queryInterface.addColumn('users', 'phone_number', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'address', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Add emergency contact fields to patients table
    await queryInterface.addColumn('patients', 'emergency_contact_name', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('patients', 'emergency_contact_relationship', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('patients', 'emergency_contact_phone', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('patients', 'emergency_contact_email', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('patients', 'emergency_contact_address', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove fields from users table
    await queryInterface.removeColumn('users', 'phone_number');
    await queryInterface.removeColumn('users', 'address');

    // Remove emergency contact fields from patients table
    await queryInterface.removeColumn('patients', 'emergency_contact_name');
    await queryInterface.removeColumn('patients', 'emergency_contact_relationship');
    await queryInterface.removeColumn('patients', 'emergency_contact_phone');
    await queryInterface.removeColumn('patients', 'emergency_contact_email');
    await queryInterface.removeColumn('patients', 'emergency_contact_address');
  }
}; 