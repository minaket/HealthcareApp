const { Appointment, Doctor, Patient, User, sequelize } = require('../models');
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

    const appointmentWithDetails = await Appointment.findOne({
      where: { id: appointment.id },
      include: [{
        model: Doctor,
        attributes: ['id', 'firstName', 'lastName', 'specialization']
      }]
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

// Get available slots for a doctor
const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        message: 'Date is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get doctor's availability
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

    // Get doctor's availability
    const availability = typeof doctor.availability === 'string' 
      ? JSON.parse(doctor.availability)
      : doctor.availability;

    if (!availability || !availability.days || !availability.startTime || !availability.endTime) {
      console.log('Doctor availability:', doctor.availability); // Debug log
      return res.status(400).json({
        message: 'Doctor has not set their availability',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get the day of week for the requested date (0-6, Sunday-Saturday)
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];

    console.log('Requested date:', date); // Debug log
    console.log('Day name:', dayName); // Debug log
    console.log('Available days:', availability.days); // Debug log

    // Check if doctor is available on this day
    if (!availability.days.includes(dayName)) {
      return res.json([]); // Return empty array if doctor is not available on this day
    }

    // Get existing appointments for this date
    const existingAppointments = await Appointment.findAll({
      where: {
        doctorId,
        date: {
          [Op.between]: [
            new Date(date + 'T00:00:00.000Z'),
            new Date(date + 'T23:59:59.999Z')
          ]
        },
        status: 'scheduled'
      }
    });

    // Generate time slots based on doctor's availability
    const startTime = new Date(`${date}T${availability.startTime}`);
    const endTime = new Date(`${date}T${availability.endTime}`);
    const slotDuration = 30; // 30 minutes per slot
    const slots = [];

    for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + slotDuration)) {
      const slotTime = time.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });

      // Check if this slot is already booked
      const isBooked = existingAppointments.some(appointment => {
        const appointmentTime = new Date(appointment.date).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        return appointmentTime === slotTime;
      });

      if (!isBooked) {
        slots.push({
          time: slotTime,
          isAvailable: true
        });
      }
    }

    res.json(slots);
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
    const { doctorId, date, time, reason, status = 'pending' } = req.body;

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

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      where: {
        doctorId,
        date: appointmentDateTime,
        status: ['scheduled', 'pending']
      }
    });

    if (conflictingAppointment) {
      return res.status(409).json({
        message: 'This time slot is already booked',
        code: 'CONFLICT'
      });
    }

    // Create the appointment
    const appointment = await Appointment.create({
      patientId: patient.id,
      doctorId,
      date: appointmentDateTime,
      reason,
      status
    });

    // Fetch the created appointment with details
    const appointmentWithDetails = await Appointment.findOne({
      where: { id: appointment.id },
      include: [
        {
          model: Doctor,
          attributes: ['id', 'specialization'],
          include: [{
            model: User,
            attributes: ['id', 'firstName', 'lastName']
          }]
        },
        {
          model: Patient,
          attributes: ['id'],
          include: [{
            model: User,
            attributes: ['id', 'firstName', 'lastName']
          }]
        }
      ]
    });

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: {
        id: appointmentWithDetails.id,
        date: appointmentWithDetails.date,
        reason: appointmentWithDetails.reason,
        status: appointmentWithDetails.status,
        doctor: appointmentWithDetails.Doctor ? {
          id: appointmentWithDetails.Doctor.id,
          name: `${appointmentWithDetails.Doctor.User.firstName} ${appointmentWithDetails.Doctor.User.lastName}`,
          specialization: appointmentWithDetails.Doctor.specialization
        } : null,
        patient: appointmentWithDetails.Patient ? {
          id: appointmentWithDetails.Patient.id,
          name: `${appointmentWithDetails.Patient.User.firstName} ${appointmentWithDetails.Patient.User.lastName}`
        } : null
      }
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      message: 'Error creating appointment',
      code: 'CREATE_ERROR'
    });
  }
};

module.exports = {
  getPatientAppointments,
  getUpcomingAppointments,
  scheduleAppointment,
  cancelAppointment,
  getAvailableSlots,
  createAppointment
}; 