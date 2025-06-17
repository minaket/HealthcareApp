const { DataTypes } = require('sequelize');
const encryption = require('../utils/encryption');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: 'users_email_unique',
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    password_salt: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_salt'
    },
    role: {
      type: DataTypes.ENUM('patient', 'doctor', 'admin'),
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name'
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name'
    },
    public_key: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'public_key'
    },
    private_key_encrypted: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'private_key_encrypted'
    },
    two_factor_secret: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'two_factor_secret'
    },
    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'two_factor_enabled'
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    }
  }, {
    tableName: 'users',
    underscored: true, // This tells Sequelize to use snake_case for column names
    paranoid: true, // Enable soft deletes
    hooks: {
      beforeCreate: async (user) => {
        try {
          // Generate encryption keys for new users
          if (!user.public_key || !user.private_key_encrypted) {
            const { publicKey, privateKey } = encryption.generateKeyPair();
            const encryptedPrivateKey = encryption.encrypt(privateKey);
            
            user.public_key = publicKey;
            user.private_key_encrypted = JSON.stringify(encryptedPrivateKey);
          }
        } catch (error) {
          console.error('Error in beforeCreate hook:', error);
          throw error;
        }
      }
    },
    indexes: [
      {
        name: 'users_email_unique',
        unique: true,
        fields: ['email'],
        where: {
          deleted_at: null
        }
      }
    ]
  });

  // Instance method to verify password
  User.prototype.verifyPassword = async function(password) {
    try {
      return await encryption.verifyHash(password, this.password_hash, this.password_salt);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  };

  // Instance method to get decrypted private key
  User.prototype.getDecryptedPrivateKey = function() {
    if (!this.private_key_encrypted) return null;
    const encryptedData = JSON.parse(this.private_key_encrypted);
    return encryption.decrypt(encryptedData);
  };

  return User;
};