// Error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Handle Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      message: 'Resource already exists',
      code: 'DUPLICATE_ERROR',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Handle custom application errors
  if (err.status) {
    return res.status(err.status).json({
      message: err.message,
      code: err.code || 'APPLICATION_ERROR'
    });
  }

  // Handle all other errors
  res.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
};

module.exports = errorHandler; 