const express = require('express');
const router = express.Router();
const protectedRouter = express.Router();
const authController = require('../controllers/authController');
const patientController = require('../controllers/patientController');
const appointmentController = require('../controllers/appointmentController');
const messageController = require('../controllers/messageController');
const security = require('../middleware/security');
const userController = require('../controllers/userController');

// Public routes
router.post('/auth/register', security.transaction, authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

// Protected routes - require authentication
protectedRouter.use(security.authenticate);

// User routes
protectedRouter.get('/users/doctors', 
  security.authorize(['patient', 'doctor', 'admin']), 
  userController.getDoctors
);

// Doctor routes
protectedRouter.get('/doctors/:doctorId/available-slots',
  security.authorize(['patient', 'doctor']),
  appointmentController.getAvailableSlots
);

// Patient routes
protectedRouter.get('/patient/appointments', 
  security.authorize(['patient']), 
  appointmentController.getPatientAppointments
);

protectedRouter.get('/patient/appointments/upcoming', 
  security.authorize(['patient']), 
  appointmentController.getUpcomingAppointments
);

protectedRouter.get('/patient/health-summary',
  security.authorize(['patient']),
  patientController.getHealthSummary
);

protectedRouter.get('/patient/medical-records',
  security.authorize(['patient']), 
  patientController.getMedicalRecords
);

// Message routes
protectedRouter.get('/messages/conversations', 
  security.authorize(['patient', 'doctor']), 
  messageController.getConversations
);

protectedRouter.get('/messages/doctor/:doctorId',
  security.authorize(['patient']),
  messageController.getOrCreateConversation
);

protectedRouter.get('/messages/:conversationId', 
  security.authorize(['patient', 'doctor']), 
  messageController.getMessages
);

protectedRouter.post('/messages', 
  security.authorize(['patient', 'doctor']), 
  messageController.sendMessage
);

// Mount protected routes under /api
router.use('/', protectedRouter);

module.exports = router; 