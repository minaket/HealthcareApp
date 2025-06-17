const { body, param, query } = require('express-validator');

const validationRules = {
  // Auth validations
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ max: 50 })
      .withMessage('First name must be less than 50 characters'),
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ max: 50 })
      .withMessage('Last name must be less than 50 characters'),
    body('role')
      .isIn(['patient', 'doctor', 'admin'])
      .withMessage('Invalid role specified'),
    body('phoneNumber')
      .optional()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Please provide a valid phone number')
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  verify2FA: [
    body('token')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('Please provide a valid 2FA token')
  ],

  refreshToken: [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
  ],

  // Medical records validations
  createRecord: [
    body('patientId')
      .isUUID()
      .withMessage('Invalid patient ID'),
    body('recordData')
      .notEmpty()
      .withMessage('Record data is required'),
    body('accessLevel')
      .isIn(['private', 'doctor', 'public'])
      .withMessage('Invalid access level specified')
  ],

  getRecord: [
    param('id')
      .isUUID()
      .withMessage('Invalid record ID')
  ],

  updateRecord: [
    param('id')
      .isUUID()
      .withMessage('Invalid record ID'),
    body('recordData')
      .optional()
      .notEmpty()
      .withMessage('Record data cannot be empty'),
    body('accessLevel')
      .optional()
      .isIn(['private', 'doctor', 'public'])
      .withMessage('Invalid access level specified')
  ],

  getPatientRecords: [
    param('patientId')
      .isUUID()
      .withMessage('Invalid patient ID'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page number must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  getDoctorRecords: [
    param('doctorId')
      .isUUID()
      .withMessage('Invalid doctor ID'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page number must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  deleteRecord: [
    param('id')
      .isUUID()
      .withMessage('Invalid record ID')
  ],

  // Consultations validations
  createConsultation: [
    body('patientId')
      .isUUID()
      .withMessage('Invalid patient ID'),
    body('scheduledAt')
      .isISO8601()
      .withMessage('Please provide a valid date and time')
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error('Consultation must be scheduled for a future time');
        }
        return true;
      }),
    body('consultationType')
      .isIn(['video', 'audio', 'chat', 'in_person'])
      .withMessage('Invalid consultation type specified'),
    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes must be less than 1000 characters')
  ],

  getConsultation: [
    param('id')
      .isUUID()
      .withMessage('Invalid consultation ID')
  ],

  updateConsultationStatus: [
    param('id')
      .isUUID()
      .withMessage('Invalid consultation ID'),
    body('status')
      .isIn(['scheduled', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Invalid status specified'),
    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes must be less than 1000 characters')
  ],

  getPatientConsultations: [
    param('patientId')
      .isUUID()
      .withMessage('Invalid patient ID'),
    query('status')
      .optional()
      .isIn(['scheduled', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Invalid status specified'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page number must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  getDoctorConsultations: [
    param('doctorId')
      .isUUID()
      .withMessage('Invalid doctor ID'),
    query('status')
      .optional()
      .isIn(['scheduled', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Invalid status specified'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page number must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  addConsultationNotes: [
    param('id')
      .isUUID()
      .withMessage('Invalid consultation ID'),
    body('notes')
      .notEmpty()
      .withMessage('Notes are required')
      .isLength({ max: 1000 })
      .withMessage('Notes must be less than 1000 characters')
  ]
};

module.exports = validationRules; 