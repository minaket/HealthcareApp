const express = require('express');
const router = express.Router();
const protectedRouter = express.Router();
const authRoutes = require('./authRoutes');
const authController = require('../controllers/authController');
const patientController = require('../controllers/patientController');
const appointmentController = require('../controllers/appointmentController');
const messageController = require('../controllers/messageController');
const security = require('../middleware/security');
const userController = require('../controllers/userController');
const medicalRecordController = require('../controllers/medicalRecordController');

// Mount auth routes
router.use('/auth', authRoutes);

// Test connection route (no auth required)
router.get('/test/connection', messageController.testConnection);

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

protectedRouter.get('/doctor/appointments/today',
  security.authorize(['doctor']),
  appointmentController.getDoctorTodayAppointments
);

protectedRouter.get('/doctor/appointments',
  security.authorize(['doctor']),
  appointmentController.getDoctorAppointments
);

protectedRouter.patch('/appointments/:appointmentId',
  security.authorize(['doctor']),
  appointmentController.updateAppointmentStatus
);

protectedRouter.get('/doctor/dashboard-stats',
  security.authorize(['doctor']),
  appointmentController.getDoctorDashboardStats
);

protectedRouter.get('/doctor/patients',
  security.authorize(['doctor']),
  patientController.getDoctorPatients
);

protectedRouter.get('/doctor/medical-records',
  security.authorize(['doctor']),
  medicalRecordController.getDoctorMedicalRecords
);

protectedRouter.post('/doctor/medical-records',
  security.authorize(['doctor']),
  medicalRecordController.createMedicalRecord
);

// Doctor message routes
protectedRouter.get('/doctor/messages/recent',
  security.authorize(['doctor']),
  messageController.getRecentMessages
);

protectedRouter.get('/doctor/conversations',
  security.authorize(['doctor']),
  messageController.getDoctorConversations
);

// Test route for debugging
protectedRouter.get('/test/appointments',
  security.authorize(['patient', 'doctor', 'admin']),
  appointmentController.testAppointmentSystem
);

// Test route for debugging
protectedRouter.get('/test/models',
  security.authorize(['doctor']),
  messageController.testModels
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

protectedRouter.post('/patient/appointments',
  security.authorize(['patient']),
  appointmentController.createAppointment
);

protectedRouter.get('/patient/doctors',
  security.authorize(['patient']),
  userController.getDoctors
);

protectedRouter.get('/patient/health-summary',
  security.authorize(['patient']),
  patientController.getHealthSummary
);

protectedRouter.get('/patient/medical-records',
  security.authorize(['patient']),
  patientController.getMedicalRecords
);

protectedRouter.post('/patient/medical-records/upload',
  security.authorize(['patient']),
  patientController.uploadMedicalRecord
);

protectedRouter.get('/patient/profile', security.authorize(['patient']), patientController.getPatientProfile);
protectedRouter.put('/patient/profile', security.authorize(['patient']), patientController.updatePatientProfile);

// Message routes
protectedRouter.get('/messages/conversations', 
  security.authorize(['patient', 'doctor']), 
  messageController.getConversations
);

protectedRouter.get('/messages/doctor/:doctorId',
  security.authorize(['patient']),
  messageController.getOrCreateConversation
);

protectedRouter.get('/messages/patient/:patientId',
  security.authorize(['doctor']),
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

protectedRouter.put('/messages/conversations/:conversationId/read',
  security.authorize(['doctor', 'patient']),
  messageController.markConversationAsRead
);

// Doctor routes
protectedRouter.get('/doctor/appointments/upcoming',
  security.authorize(['doctor']),
  appointmentController.getDoctorUpcomingAppointments
);

protectedRouter.patch('/patient/appointments/:appointmentId/cancel',
  security.authorize(['patient']),
  appointmentController.cancelPatientAppointment
);

// Mount protected routes under /api
router.use('/', protectedRouter);

module.exports = router; 