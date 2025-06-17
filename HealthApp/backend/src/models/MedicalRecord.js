const { DataTypes } = require('sequelize');
const encryption = require('../utils/encryption');

module.exports = (sequelize) => {
  const MedicalRecord = sequelize.define('MedicalRecord', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'patient_id',
      references: {
        model: 'patients',
        key: 'id'
      }
    },
    doctor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'doctor_id',
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    record_data: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'record_data',
      get() {
        const encrypted = this.getDataValue('record_data');
        if (!encrypted) return null;
        try {
          return encryption.decrypt(JSON.parse(encrypted));
        } catch (error) {
          console.error('Error decrypting medical record:', error);
          return null;
        }
      },
      set(value) {
        try {
          const encrypted = encryption.encrypt(JSON.stringify(value));
          this.setDataValue('record_data', JSON.stringify(encrypted));
        } catch (error) {
          console.error('Error encrypting medical record:', error);
          throw error;
        }
      }
    },
    record_type: {
      type: DataTypes.ENUM('consultation', 'diagnosis', 'prescription', 'lab_result', 'imaging', 'other'),
      allowNull: false,
      field: 'record_type'
    },
    record_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'record_date'
    },
    encryption_version: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: '1.0',
      field: 'encryption_version'
    },
    access_level: {
      type: DataTypes.ENUM('private', 'doctor', 'shared'),
      defaultValue: 'private',
      field: 'access_level'
    },
    status: {
      type: DataTypes.ENUM('active', 'archived', 'deleted'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'medical_records',
    underscored: true,
    indexes: [
      {
        name: 'idx_medical_records_patient',
        fields: ['patient_id']
      },
      {
        name: 'idx_medical_records_doctor',
        fields: ['doctor_id']
      },
      {
        name: 'idx_medical_records_type',
        fields: ['record_type']
      },
      {
        name: 'idx_medical_records_date',
        fields: ['record_date']
      }
    ]
  });

  // Instance method to check if a user has access to this record
  MedicalRecord.prototype.hasAccess = async function(userId, userRole) {
    if (userRole === 'admin') return true;
    if (this.patient_id === userId) return true;
    if (userRole === 'doctor' && this.doctor_id === userId) return true;
    if (this.access_level === 'shared' && userRole === 'doctor') return true;
    return false;
  };

  return MedicalRecord;
}; 