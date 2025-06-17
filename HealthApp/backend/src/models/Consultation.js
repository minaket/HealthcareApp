const { DataTypes } = require('sequelize');
const encryption = require('../utils/encryption');

module.exports = (sequelize) => {
  const Consultation = sequelize.define('Consultation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    doctorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    consultationData: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const encrypted = this.getDataValue('consultationData');
        if (!encrypted) return null;
        try {
          return encryption.decrypt(JSON.parse(encrypted));
        } catch (error) {
          console.error('Error decrypting consultation data:', error);
          return null;
        }
      },
      set(value) {
        try {
          const encrypted = encryption.encrypt(JSON.stringify(value));
          this.setDataValue('consultationData', JSON.stringify(encrypted));
        } catch (error) {
          console.error('Error encrypting consultation data:', error);
          throw error;
        }
      }
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'scheduled'
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER, // Duration in minutes
      allowNull: true
    },
    consultationType: {
      type: DataTypes.ENUM('video', 'audio', 'chat', 'in_person'),
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const encrypted = this.getDataValue('notes');
        if (!encrypted) return null;
        try {
          return encryption.decrypt(JSON.parse(encrypted));
        } catch (error) {
          console.error('Error decrypting consultation notes:', error);
          return null;
        }
      },
      set(value) {
        if (!value) {
          this.setDataValue('notes', null);
          return;
        }
        try {
          const encrypted = encryption.encrypt(JSON.stringify(value));
          this.setDataValue('notes', JSON.stringify(encrypted));
        } catch (error) {
          console.error('Error encrypting consultation notes:', error);
          throw error;
        }
      }
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      get() {
        const encrypted = this.getDataValue('attachments');
        if (!encrypted) return [];
        try {
          return JSON.parse(encrypted).map(attachment => ({
            ...attachment,
            url: encryption.decrypt(JSON.parse(attachment.encryptedUrl))
          }));
        } catch (error) {
          console.error('Error decrypting attachments:', error);
          return [];
        }
      },
      set(value) {
        if (!value) {
          this.setDataValue('attachments', '[]');
          return;
        }
        try {
          const encryptedAttachments = value.map(attachment => ({
            ...attachment,
            encryptedUrl: JSON.stringify(encryption.encrypt(attachment.url))
          }));
          this.setDataValue('attachments', JSON.stringify(encryptedAttachments));
        } catch (error) {
          console.error('Error encrypting attachments:', error);
          throw error;
        }
      }
    }
  }, {
    indexes: [
      {
        fields: ['patientId']
      },
      {
        fields: ['doctorId']
      },
      {
        fields: ['scheduledAt']
      },
      {
        fields: ['status']
      }
    ]
  });

  // Instance method to check if a user has access to this consultation
  Consultation.prototype.hasAccess = async function(userId, userRole) {
    if (userRole === 'admin') return true;
    if (this.patientId === userId) return true;
    if (userRole === 'doctor' && this.doctorId === userId) return true;
    return false;
  };

  return Consultation;
}; 