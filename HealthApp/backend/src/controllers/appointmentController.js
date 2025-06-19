const { Appointment, Doctor, Patient, User, sequelize, Conversation, Message } = require('../models');
const { Op } = require('sequelize');

// Get patient appointments
const getPatientAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // First check if user exists and get patient record
    const user = await User.findOne({
      where: { id: userId, role: 'patient' }
    });

    if (!user) {
      return res.status(404).json({
        message: 'Patient not found',
        code: 'NOT_FOUND'
      });
    }

    // Get or create patient record
    let [patient, created] = await Patient.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        status: 'active'
      }
    });

    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { patientId: patient.id };
    if (status) where.status = status;

    const appointments = await Appointment.findAndCountAll({
      where,
      include: [{
        model: Doctor,
        include: [{
          model: User,
          attributes: ['firstName', 'lastName']
        }],
        attributes: ['id', 'specialization']
      }],
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const formattedAppointments = appointments.rows.map(appointment => ({
      id: appointment.id,
      scheduledAt: appointment.date,
      status: appointment.status,
      consultationType: appointment.type,
      doctor: appointment.Doctor ? {
        id: appointment.Doctor.id,
        firstName: appointment.Doctor.User.firstName,
        lastName: appointment.Doctor.User.lastName,
        specialization: appointment.Doctor.specialization
      } : null
    }));

    res.json({
      appointments: formattedAppointments,
      total: appointments.count,
      page: parseInt(page),
      totalPages: Math.ceil(appointments.count / limit)
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({
      message: 'Error fetching appointments',
      code: 'FETCH_ERROR'
    });
  }
};

// Get upcoming appointments
const getUpcomingAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;

    // First check if user exists
    const user = await User.findOne({
      where: { id: patientId, role: 'patient' }
    });

    if (!user) {
      return res.status(404).json({
        message: 'Patient not found',
        code: 'NOT_FOUND'
      });
    }

    // Get or create patient record
    let [patient, created] = await Patient.findOrCreate({
      where: { userId: patientId },
      defaults: {
        userId: patientId,
        status: 'active'
      }
    });

    // Update patient record with user data if needed
    if (!patient.firstName || !patient.lastName) {
      await patient.update({
        firstName: user.firstName,
        lastName: user.lastName
      });
      // Refresh patient data
      patient = await Patient.findByPk(patient.id);
    }

    const appointments = await Appointment.findAll({
      where: {
        patientId: patient.id,
        status: 'scheduled',
        date: {
          [Op.gte]: new Date()
        }
      },
      include: [{
        model: Doctor,
        include: [{
          model: User,
          attributes: ['id', 'firstName', 'lastName']
        }]
      }],
      order: [['date', 'ASC']]
    });

    res.json(appointments.map(appointment => ({
      id: appointment.id,
      scheduledAt: appointment.date,
      consultationType: appointment.type,
      status: appointment.status,
      notes: appointment.notes,
      doctor: appointment.Doctor?.User ? {
        id: appointment.Doctor.User.id,
        firstName: appointment.Doctor.User.firstName,
        lastName: appointment.Doctor.User.lastName,
        specialization: appointment.Doctor.specialization
      } : null
    })));
  } catch (error) {
    console.error('Get upcoming appointments error:', error);
    res.status(500).json({
      message: 'Error fetching upcoming appointments',
      code: 'FETCH_ERROR'
    });
  }
};

// Schedule new appointment
const scheduleAppointment = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { doctorId, date, reason } = req.body;

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date,
      reason,
      status: 'scheduled'
    });

    // Fetch the full appointment with patient and doctor info
    const appointmentWithDetails = await Appointment.findOne({
      where: { id: appointment.id },
      include: [
        {
          model: Patient,
          include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email'] }]
        },
        {
          model: Doctor,
          include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email'] }]
        }
      ]
    });
    res.status(201).json({ appointment: appointmentWithDetails });
  } catch (error) {
    console.error('Schedule appointment error:', error);
    res.status(500).json({
      message: 'Error scheduling appointment',
      code: 'CREATE_ERROR'
    });
  }
};

// Cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const patientId = req.user.id;

    const appointment = await Appointment.findOne({
      where: { id: appointmentId, patientId }
    });

    if (!appointment) {
      return res.status(404).json({
        message: 'Appointment not found',
        code: 'NOT_FOUND'
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        message: 'Appointment is already cancelled',
        code: 'INVALID_STATUS'
      });
    }

    await appointment.update({ status: 'cancelled' });

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      message: 'Error cancelling appointment',
      code: 'UPDATE_ERROR'
    });
  }
};

// Get available slots for a doctor on a specific date
const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        message: 'Date parameter is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get doctor record
    const doctor = await Doctor.findOne({
      where: { id: doctorId },
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor not found',
        code: 'NOT_FOUND'
      });
    }

    // Generate time slots (9 AM to 5 PM, 30-minute intervals)
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        isAvailable: true
      });
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:30`,
        isAvailable: true
      });
    }

    // Get existing appointments for this doctor on this date
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');
    const existingAppointments = await Appointment.findAll({
      where: {
        doctorId: doctor.id,
        date: {
          [Op.between]: [startOfDay, endOfDay]
        },
        status: 'scheduled'
      },
      attributes: ['date']
    });

    // Mark booked slots as unavailable
    const bookedTimes = existingAppointments.map(apt => 
      apt.date.toTimeString().slice(0, 5)
    );

    const availableSlots = slots.map(slot => ({
      ...slot,
      isAvailable: !bookedTimes.includes(slot.time)
    }));

    res.json(availableSlots);
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      message: 'Error fetching available slots',
      code: 'FETCH_ERROR'
    });
  }
};

// Create appointment
const createAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { doctorId, date, time, reason, status } = req.body;

    // Validate required fields
    if (!doctorId || !date || !time || !reason) {
      return res.status(400).json({
        message: 'Doctor ID, date, time, and reason are required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Find the patient record
    const patient = await Patient.findOne({
      where: { userId },
      attributes: ['id', 'userId']
    });

    if (!patient) {
      return res.status(404).json({
        message: 'Patient record not found',
        code: 'NOT_FOUND'
      });
    }

    // Check if doctor exists
    const doctor = await Doctor.findOne({
      where: { id: doctorId },
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor not found',
        code: 'NOT_FOUND'
      });
    }

    // Combine date and time
    const appointmentDateTime = new Date(`${date}T${time}:00`);

    // Check if the appointment time is in the future
    if (appointmentDateTime <= new Date()) {
      return res.status(400).json({
        message: 'Appointment time must be in the future',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check for conflicting appointments (only 'scheduled' allowed)
    const conflictingAppointment = await Appointment.findOne({
      where: {
        doctorId,
        date: appointmentDateTime,
        status: 'scheduled'
      }
    });

    if (conflictingAppointment) {
      return res.status(409).json({
        message: 'This time slot is already booked',
        code: 'CONFLICT'
      });
    }

    // Create the appointment with status 'scheduled'
    const appointment = await Appointment.create({
      patientId: patient.id,
      doctorId,
      date: appointmentDateTime,
      reason,
      status: 'scheduled'
    });

    // Fetch the full appointment with patient and doctor info
    const appointmentWithDetails = await Appointment.findOne({
      where: { id: appointment.id },
      include: [
        {
          model: Patient,
          include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email'] }]
        },
        {
          model: Doctor,
          include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email'] }]
        }
      ]
    });
    res.status(201).json({ appointment: appointmentWithDetails });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      message: 'Error creating appointment',
      code: 'CREATE_ERROR'
    });
  }
};

// Get doctor's today appointments
const getDoctorTodayAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // Get doctor record
    const doctor = await Doctor.findOne({
      where: { userId: doctorId }
    });

    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor not found',
        code: 'NOT_FOUND'
      });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const appointments = await Appointment.findAll({
      where: {
        doctorId: doctor.id,
        date: {
          [Op.between]: [startOfDay, endOfDay]
        },
        status: ['scheduled', 'completed']
      },
      include: [{
        model: Patient,
        include: [{
          model: User,
          attributes: ['firstName', 'lastName']
        }]
      }],
      order: [['date', 'ASC']]
    });

    const formattedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      patientName: `${appointment.Patient.User.firstName} ${appointment.Patient.User.lastName}`,
      time: appointment.date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      type: appointment.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      status: appointment.status,
      notes: appointment.notes
    }));

    res.json(formattedAppointments);
  } catch (error) {
    console.error('Get doctor today appointments error:', error);
    res.status(500).json({
      message: 'Error fetching today\'s appointments',
      code: 'FETCH_ERROR'
    });
  }
};

// Get doctor dashboard stats
const getDoctorDashboardStats = async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // Get doctor record
    const doctor = await Doctor.findOne({
      where: { userId: doctorId }
    });

    if (!doctor) {
      // Return fallback stats instead of 404
      return res.json({
        totalPatients: 0,
        appointmentsToday: 0,
        pendingReports: 0,
        unreadMessages: 0
      });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Get today's appointments count
    const appointmentsToday = await Appointment.count({
      where: {
        doctorId: doctor.id,
        date: {
          [Op.between]: [startOfDay, endOfDay]
        },
        status: ['scheduled', 'completed']
      }
    });

    // Get total unique patients
    const totalPatients = await Appointment.count({
      where: {
        doctorId: doctor.id
      },
      distinct: true,
      col: 'patientId'
    });

    // TODO: Implement real pendingReports and unreadMessages queries
    // For now, set to 0 if not implemented
    const pendingReports = 0; // Still not implemented

    // Count unread messages for this doctor
    const doctorConversations = await Conversation.findAll({
      where: { doctorId: doctor.id },
      attributes: ['id']
    });
    let unreadMessages = 0;
    if (doctorConversations.length > 0) {
      const conversationIds = doctorConversations.map(c => c.id);
      unreadMessages = await Message.count({
        where: {
          conversationId: { [Op.in]: conversationIds },
          isRead: false,
          // Only count messages not sent by the doctor
          senderId: { [Op.ne]: doctor.userId }
        }
      });
    }

    res.json({
      totalPatients,
      appointmentsToday,
      pendingReports,
      unreadMessages
    });
  } catch (error) {
    console.error('Get doctor dashboard stats error:', error);
    // Return fallback stats instead of 500 error
    res.json({
      totalPatients: 0,
      appointmentsToday: 0,
      pendingReports: 0,
      unreadMessages: 0
    });
  }
};

// Get doctor appointments by date
const getDoctorAppointments = async (req, res) => {
  try {
    const doctorUserId = req.user.id;
    const { date } = req.query;
    // Get doctor record
    const doctor = await Doctor.findOne({
      where: { userId: doctorUserId }
    });
    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor not found',
        code: 'NOT_FOUND'
      });
    }
    let whereClause = { doctorId: doctor.id };
    if (date) {
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');
      whereClause.date = {
        [Op.between]: [startOfDay, endOfDay]
      };
    }
    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [{
        model: Patient,
        include: [{
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email']
        }]
      }],
      order: [['date', 'ASC']]
    });
    const formattedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      startTime: appointment.date.toISOString(),
      endTime: new Date(appointment.date.getTime() + 30 * 60000).toISOString(), // 30 min duration
      type: appointment.type,
      status: appointment.status,
      reason: appointment.reason,
      notes: appointment.notes,
      patient: {
        id: appointment.Patient.User.id,
        firstName: appointment.Patient.User.firstName,
        lastName: appointment.Patient.User.lastName,
        email: appointment.Patient.User.email
      }
    }));
    res.json(formattedAppointments);
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      message: 'Error fetching appointments',
      code: 'FETCH_ERROR'
    });
  }
};

// Update appointment status
const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;
    const doctorId = req.user.id;

    // Get doctor record
    const doctor = await Doctor.findOne({
      where: { userId: doctorId }
    });

    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor not found',
        code: 'NOT_FOUND'
      });
    }

    // Find the appointment and verify it belongs to this doctor
    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        doctorId: doctor.id
      }
    });

    if (!appointment) {
      return res.status(404).json({
        message: 'Appointment not found',
        code: 'NOT_FOUND'
      });
    }

    // Update the appointment status
    await appointment.update({ status });

    res.json({
      message: 'Appointment status updated successfully',
      appointment: {
        id: appointment.id,
        status: appointment.status,
        date: appointment.date
      }
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      message: 'Error updating appointment status',
      code: 'UPDATE_ERROR'
    });
  }
};

// Test endpoint to verify appointment system
const testAppointmentSystem = async (req, res) => {
  try {
    // Get a sample doctor
    const doctor = await Doctor.findOne({
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    if (!doctor) {
      return res.status(404).json({
        message: 'No doctors found in system',
        code: 'NOT_FOUND'
      });
    }

    // Get a sample patient
    const patient = await Patient.findOne({
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    if (!patient) {
      return res.status(404).json({
        message: 'No patients found in system',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      message: 'Appointment system is working',
      sampleDoctor: {
        id: doctor.id,
        name: `${doctor.User.firstName} ${doctor.User.lastName}`,
        specialization: doctor.specialization
      },
      samplePatient: {
        id: patient.id,
        name: `${patient.User.firstName} ${patient.User.lastName}`
      }
    });
  } catch (error) {
    console.error('Test appointment system error:', error);
    res.status(500).json({
      message: 'Error testing appointment system',
      code: 'TEST_ERROR'
    });
  }
};

// Get doctor's upcoming appointments
const getDoctorUpcomingAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    // Get doctor record
    const doctor = await Doctor.findOne({ where: { userId: doctorId } });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found', code: 'NOT_FOUND' });
    }
    const now = new Date();
    const appointments = await Appointment.findAll({
      where: {
        doctorId: doctor.id,
        date: { [Op.gt]: now },
        status: 'scheduled'
      },
      include: [{
        model: Patient,
        include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email'] }]
      }],
      order: [['date', 'ASC']]
    });
    const formattedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      startTime: appointment.date.toISOString(),
      endTime: new Date(appointment.date.getTime() + 30 * 60000).toISOString(),
      type: appointment.type,
      status: appointment.status,
      reason: appointment.reason,
      notes: appointment.notes,
      patient: {
        id: appointment.Patient.User.id,
        firstName: appointment.Patient.User.firstName,
        lastName: appointment.Patient.User.lastName,
        email: appointment.Patient.User.email
      }
    }));
    res.json(formattedAppointments);
  } catch (error) {
    console.error('Get doctor upcoming appointments error:', error);
    res.status(500).json({ message: 'Error fetching upcoming appointments', code: 'FETCH_ERROR' });
  }
};

// Patient cancels their own appointment
const cancelPatientAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { appointmentId } = req.params;
    // Find patient record
    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found', code: 'NOT_FOUND' });
    }
    // Find appointment
    const appointment = await Appointment.findOne({ where: { id: appointmentId, patientId: patient.id } });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found', code: 'NOT_FOUND' });
    }
    // Only allow cancelling future scheduled appointments
    if (appointment.status !== 'scheduled' || appointment.date <= new Date()) {
      return res.status(400).json({ message: 'Only future scheduled appointments can be cancelled', code: 'CANNOT_CANCEL' });
    }
    await appointment.update({ status: 'cancelled' });
    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    console.error('Cancel patient appointment error:', error);
    res.status(500).json({ message: 'Error cancelling appointment', code: 'CANCEL_ERROR' });
  }
};

module.exports = {
  getPatientAppointments,
  getUpcomingAppointments,
  scheduleAppointment,
  cancelAppointment,
  getAvailableSlots,
  createAppointment,
  getDoctorTodayAppointments,
  getDoctorDashboardStats,
  getDoctorAppointments,
  updateAppointmentStatus,
  testAppointmentSystem,
  getDoctorUpcomingAppointments,
  cancelPatientAppointment,
}; 