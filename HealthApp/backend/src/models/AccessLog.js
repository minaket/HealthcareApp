const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
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
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    action: {
      type: DataTypes.ENUM(
        'view',
        'create',
        'update',
        'delete',
        'share',
        'export',
        'login',
        'logout',
        'failed_login',
        'failed_2fa',
        'error'
      ),
      allowNull: false
    },
    resourceType: {
      type: DataTypes.ENUM(
        'medical_record',
        'consultation',
        'user',
        'system'
      ),
      allowNull: false,
      field: 'resource_type'
    },
    resourceId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'resource_id'
    },
    ipAddress: {
      type: DataTypes.STRING(45), // IPv6 addresses can be up to 45 characters
      allowNull: false,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'user_agent'
    },
    status: {
      type: DataTypes.ENUM('success', 'failure', 'unauthorized'),
      allowNull: false
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'access_logs',
    underscored: true,
    indexes: [
      {
        name: 'idx_access_logs_user',
        fields: ['user_id']
      },
      {
        name: 'idx_access_logs_action',
        fields: ['action']
      },
      {
        name: 'idx_access_logs_resource_type',
        fields: ['resource_type']
      },
      {
        name: 'idx_access_logs_resource_id',
        fields: ['resource_id']
      },
      {
        name: 'idx_access_logs_timestamp',
        fields: ['timestamp']
      },
      {
        name: 'idx_access_logs_status',
        fields: ['status']
      }
    ]
  });

  // Class method to log access
  AccessLog.logAccess = async function({
    userId,
    action,
    resourceType,
    resourceId,
    ipAddress,
    userAgent,
    status,
    details = {}
  }) {
    try {
      return await this.create({
        userId,
        action,
        resourceType,
        resourceId,
        ipAddress,
        userAgent,
        status,
        details,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging access:', error);
      // Don't throw the error as logging should not break the main application flow
      return null;
    }
  };

  return AccessLog;
}; 