const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config');

const sequelize = new Sequelize(config.database);

// User Model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash'
  },
  passwordSalt: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_salt'
  },
  role: {
    type: DataTypes.ENUM('patient', 'doctor', 'admin'),
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'last_name'
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL to user profile picture'
  },
  publicKey: {
    type: DataTypes.TEXT,
    field: 'public_key'
  },
  privateKeyEncrypted: {
    type: DataTypes.TEXT,
    field: 'private_key_encrypted'
  },
  twoFactorSecret: {
    type: DataTypes.STRING,
    field: 'two_factor_secret'
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'two_factor_enabled'
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'phone_number'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
  },
  deletedAt: {
    type: DataTypes.DATE,
    field: 'deleted_at'
  }
}, {
  tableName: 'users',
  timestamps: true,
  paranoid: true,
  underscored: true
});

// Patient Model
const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true
  },
  bloodType: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    allowNull: true
  },
  allergies: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  chronicConditions: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  emergencyContactName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'emergency_contact_name'
  },
  emergencyContactRelationship: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'emergency_contact_relationship'
  },
  emergencyContactPhone: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'emergency_contact_phone'
  },
  emergencyContactEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'emergency_contact_email'
  },
  emergencyContactAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'emergency_contact_address'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'deceased'),
    defaultValue: 'active',
    allowNull: true
  }
}, {
  tableName: 'patients',
  timestamps: true,
  underscored: true
});

// Add a hook to update firstName and lastName from User model if not set
Patient.beforeCreate(async (patient, options) => {
  if (!patient.firstName || !patient.lastName) {
    const user = await User.findByPk(patient.userId);
    if (user) {
      patient.firstName = patient.firstName || user.firstName;
      patient.lastName = patient.lastName || user.lastName;
    }
  }
});

Patient.beforeUpdate(async (patient, options) => {
  if (!patient.firstName || !patient.lastName) {
    const user = await User.findByPk(patient.userId);
    if (user) {
      patient.firstName = patient.firstName || user.firstName;
      patient.lastName = patient.lastName || user.lastName;
    }
  }
});

// Doctor Model
const Doctor = sequelize.define('Doctor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: false
  },
  licenseNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  yearsOfExperience: {
    type: DataTypes.INTEGER
  },
  availability: {
    type: DataTypes.JSONB
  },
  consultationFee: {
    type: DataTypes.DECIMAL(10, 2)
  }
}, {
  tableName: 'doctors',
  timestamps: true,
  underscored: true
});

// Appointment Model
const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Patient,
      key: 'id'
    }
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Doctor,
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'cancelled', 'no_show'),
    defaultValue: 'scheduled'
  },
  type: {
    type: DataTypes.ENUM('consultation', 'follow_up', 'emergency'),
    defaultValue: 'consultation'
  },
  reason: {
    type: DataTypes.TEXT
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'appointments',
  timestamps: true,
  underscored: true
});

// Medical Record Model
const MedicalRecord = sequelize.define('MedicalRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'patient_id',
    references: {
      model: 'patients',
      key: 'id'
    }
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'doctor_id',
    references: {
      model: 'doctors',
      key: 'id'
    }
  },
  recordType: {
    type: DataTypes.ENUM('consultation', 'diagnosis', 'prescription', 'lab_result', 'imaging', 'other'),
    allowNull: false
  },
  recordData: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  recordDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  accessLevel: {
    type: DataTypes.ENUM('private', 'doctor', 'shared'),
    defaultValue: 'private'
  },
  status: {
    type: DataTypes.ENUM('active', 'archived', 'deleted'),
    defaultValue: 'active'
  }
}, {
  tableName: 'medical_records',
  timestamps: true,
  underscored: true
});

// Message Model
const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'conversations',
      key: 'id'
    }
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'messages',
  timestamps: true,
  underscored: true
});

// Conversation Model
const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Patient,
      key: 'id'
    }
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Doctor,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'archived'),
    defaultValue: 'active'
  }
}, {
  tableName: 'conversations',
  timestamps: true,
  underscored: true
});

// Access Log Model
const AccessLog = sequelize.define('AccessLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  action: {
    type: DataTypes.ENUM('view', 'create', 'update', 'delete', 'share', 'export', 'login', 'logout', 'failed_login', 'failed_2fa', 'error'),
    allowNull: false
  },
  resourceType: {
    type: DataTypes.ENUM('medical_record', 'consultation', 'user', 'system'),
    allowNull: false
  },
  resourceId: {
    type: DataTypes.UUID
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: false
  },
  userAgent: {
    type: DataTypes.STRING(500)
  },
  status: {
    type: DataTypes.ENUM('success', 'failure', 'unauthorized'),
    allowNull: false
  },
  details: {
    type: DataTypes.JSONB
  }
}, {
  tableName: 'access_logs',
  timestamps: true,
  underscored: true
});

// Model Associations
User.hasOne(Patient, { foreignKey: 'userId' });
Patient.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Doctor, { foreignKey: 'userId' });
Doctor.belongsTo(User, { foreignKey: 'userId' });

Patient.hasMany(Appointment, { foreignKey: 'patientId' });
Appointment.belongsTo(Patient, { foreignKey: 'patientId' });

Doctor.hasMany(Appointment, { foreignKey: 'doctorId' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId' });

Patient.hasMany(MedicalRecord, { foreignKey: 'patientId' });
MedicalRecord.belongsTo(Patient, { foreignKey: 'patientId' });

Doctor.hasMany(MedicalRecord, { foreignKey: 'doctorId' });
MedicalRecord.belongsTo(Doctor, { foreignKey: 'doctorId' });

Patient.hasMany(Conversation, { foreignKey: 'patientId' });
Conversation.belongsTo(Patient, { foreignKey: 'patientId' });

Doctor.hasMany(Conversation, { foreignKey: 'doctorId' });
Conversation.belongsTo(Doctor, { foreignKey: 'doctorId' });

Conversation.hasMany(Message, { foreignKey: 'conversationId' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId' });

User.hasMany(Message, { foreignKey: 'senderId' });
Message.belongsTo(User, { foreignKey: 'senderId' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

User.hasMany(AccessLog, { foreignKey: 'userId' });
AccessLog.belongsTo(User, { foreignKey: 'userId' });

// Export models
module.exports = {
  sequelize,
  User,
  Patient,
  Doctor,
  Appointment,
  MedicalRecord,
  Message,
  Conversation,
  AccessLog
}; 