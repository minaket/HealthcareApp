const { Message, Conversation, User, Doctor, Patient } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

// Get user conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log('Getting conversations for user:', userId, 'role:', userRole);
    
    let conversations = [];
    
    if (userRole === 'patient') {
      console.log('Processing patient conversations...');
      
      // Get patient record
      const patient = await Patient.findOne({
        where: { userId }
      });

      console.log('Patient record found:', patient ? 'yes' : 'no');

      if (!patient) {
        console.log('No patient record found, returning empty array');
        return res.json([]);
      }

      console.log('Patient ID:', patient.id);

      // Get conversations where this patient is involved
      try {
        conversations = await Conversation.findAll({
          where: { patientId: patient.id },
      include: [
        {
              model: Doctor,
              include: [{
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email']
              }]
            },
            {
              model: Message,
              limit: 1,
              order: [['createdAt', 'DESC']]
            }
          ],
          order: [['updatedAt', 'DESC']]
        });
        
        console.log('Found conversations:', conversations.length);
      } catch (dbError) {
        console.error('Database error fetching conversations:', dbError);
        return res.json([]);
      }

      // Format conversations for frontend
      const formattedConversations = conversations.map(conv => ({
        id: conv.id,
        participant: {
          id: conv.Doctor?.User?.id,
          firstName: conv.Doctor?.User?.firstName,
          lastName: conv.Doctor?.User?.lastName,
          email: conv.Doctor?.User?.email,
          role: 'doctor'
        },
        lastMessage: conv.Messages?.[0] ? {
          id: conv.Messages[0].id,
          content: conv.Messages[0].content,
          timestamp: conv.Messages[0].createdAt,
          senderId: conv.Messages[0].senderId
        } : null,
        unreadCount: 0, // TODO: Implement unread count logic
        updatedAt: conv.updatedAt
      }));

      console.log('Returning formatted conversations:', formattedConversations.length);
      res.json(formattedConversations);
      
    } else if (userRole === 'doctor') {
      console.log('Processing doctor conversations...');
      
      // Get doctor record
      const doctor = await Doctor.findOne({
        where: { userId }
      });

      console.log('Doctor record found:', doctor ? 'yes' : 'no');

      if (!doctor) {
        console.log('No doctor record found, returning empty array');
        return res.json([]);
      }

      console.log('Doctor ID:', doctor.id);

      // Get conversations where this doctor is involved
      try {
        conversations = await Conversation.findAll({
          where: { doctorId: doctor.id },
          include: [
            {
              model: Patient,
              include: [{
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email']
              }]
        },
        {
          model: Message,
          limit: 1,
          order: [['createdAt', 'DESC']]
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

        console.log('Found conversations:', conversations.length);
      } catch (dbError) {
        console.error('Database error fetching conversations:', dbError);
        return res.json([]);
      }

      // Format conversations for frontend
      const formattedConversations = conversations.map(conv => ({
        id: conv.id,
        participant: {
          id: conv.Patient?.User?.id,
          firstName: conv.Patient?.User?.firstName,
          lastName: conv.Patient?.User?.lastName,
          role: 'patient'
        },
        lastMessage: conv.Messages?.[0] ? {
          id: conv.Messages[0].id,
          content: conv.Messages[0].content,
          timestamp: conv.Messages[0].createdAt,
          senderId: conv.Messages[0].senderId
        } : null,
        unreadCount: 0, // TODO: Implement unread count logic
        updatedAt: conv.updatedAt
      }));

      console.log('Returning formatted conversations:', formattedConversations.length);
      res.json(formattedConversations);
      
    } else {
      console.log('Unknown role, returning empty array');
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching conversations:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch conversations',
      error: error.message 
    });
  }
};

// Get conversations for a doctor
const getDoctorConversations = async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    console.log('Getting doctor conversations for user:', doctorId);
    
    // Get doctor record
    const doctor = await Doctor.findOne({
      where: { userId: doctorId }
    });

    console.log('Doctor record found:', doctor ? 'yes' : 'no');

    if (!doctor) {
      console.log('No doctor record found, returning empty array');
      return res.json([]);
    }

    console.log('Doctor ID:', doctor.id);

    const conversations = await Conversation.findAll({
      where: { doctorId: doctor.id },
      include: [
        {
          model: Patient,
          include: [{
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email']
          }]
        },
        {
          model: Message,
          limit: 1,
          order: [['createdAt', 'DESC']]
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    console.log('Found conversations:', conversations.length);

    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      patient: conv.Patient?.User,
      lastMessage: conv.Messages?.[0] ? {
        id: conv.Messages[0].id,
        content: conv.Messages[0].content,
        createdAt: conv.Messages[0].createdAt
      } : null,
      unreadCount: 0 // TODO: Implement unread count logic
    }));

    console.log('Returning formatted conversations:', formattedConversations.length);
    res.json(formattedConversations);
  } catch (error) {
    console.error('Error fetching doctor conversations:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
};

// Get recent messages for a doctor
const getRecentMessages = async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // Get doctor record
    const doctor = await Doctor.findOne({
      where: { userId: doctorId }
    });

    if (!doctor) {
      return res.json([]);
    }

    // First, get all conversations for this doctor
    const conversations = await Conversation.findAll({
      where: { doctorId: doctor.id },
      attributes: ['id']
    });

    // If no conversations exist, return empty array
    if (!conversations || conversations.length === 0) {
      return res.json([]);
    }

    const conversationIds = conversations.map(c => c.id);
    
    const recentMessages = await Message.findAll({
      where: {
        conversationId: {
          [Op.in]: conversationIds
        }
      },
      include: [
        {
          model: Conversation,
          include: [
            {
              model: Patient,
              include: [{
              model: User,
              attributes: ['id', 'firstName', 'lastName', 'email']
              }]
            }
          ]
        },
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Format the response to match frontend expectations
    const formattedMessages = recentMessages.map(message => ({
      id: message.id,
      patientName: message.Conversation?.Patient?.User?.firstName + ' ' + message.Conversation?.Patient?.User?.lastName,
      content: message.content,
      time: message.createdAt,
      isUnread: false // You can implement unread logic later
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching recent messages:', error);
    res.status(500).json({ message: 'Failed to fetch recent messages' });
  }
};

// Get conversation messages
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let patientId = null;
    let doctorId = null;

    if (userRole === 'patient') {
      const patient = await Patient.findOne({ where: { userId } });
      if (!patient) {
        return res.status(404).json({ message: 'Patient record not found' });
      }
      patientId = patient.id;
    } else if (userRole === 'doctor') {
      const doctor = await Doctor.findOne({ where: { userId } });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor record not found' });
      }
      doctorId = doctor.id;
    }

    // Verify user has access to this conversation
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        ...(patientId ? { patientId } : {}),
        ...(doctorId ? { doctorId } : {}),
      }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await Message.findAll({
      where: { conversationId },
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user.id;
    const userRole = req.user.role;

    let patientId = null;
    let doctorId = null;

    if (userRole === 'patient') {
      const patient = await Patient.findOne({ where: { userId: senderId } });
      if (!patient) {
        return res.status(404).json({ message: 'Patient record not found' });
      }
      patientId = patient.id;
    } else if (userRole === 'doctor') {
      const doctor = await Doctor.findOne({ where: { userId: senderId } });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor record not found' });
      }
      doctorId = doctor.id;
    }

    // Verify user has access to this conversation
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        ...(patientId ? { patientId } : {}),
        ...(doctorId ? { doctorId } : {}),
      }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content
    });

    // Update conversation's updatedAt timestamp
    await conversation.update({ updatedAt: new Date() });

    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.status(201).json(messageWithSender);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// Get or create conversation between patient and doctor
const getOrCreateConversation = async (req, res) => {
  try {
    const { doctorId, patientId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let patient, doctor;

    if (userRole === 'patient') {
      // Patient is requesting conversation with doctor
      if (!doctorId) {
        return res.status(400).json({
          message: 'Doctor ID is required',
          code: 'VALIDATION_ERROR'
        });
      }

      // Get patient record
      patient = await Patient.findOne({
        where: { userId }
      });

      if (!patient) {
        return res.status(404).json({
          message: 'Patient record not found',
          code: 'NOT_FOUND'
        });
      }

      // Get doctor record
      doctor = await Doctor.findOne({
        where: { id: doctorId }
      });

      if (!doctor) {
        return res.status(404).json({
          message: 'Doctor not found',
          code: 'NOT_FOUND'
        });
      }
    } else if (userRole === 'doctor') {
      // Doctor is requesting conversation with patient
      if (!patientId) {
        return res.status(400).json({
          message: 'Patient ID is required',
          code: 'VALIDATION_ERROR'
        });
      }

      // Get doctor record
      doctor = await Doctor.findOne({
        where: { userId }
      });

      if (!doctor) {
        return res.status(404).json({
          message: 'Doctor record not found',
          code: 'NOT_FOUND'
        });
      }

      // Get patient record
      patient = await Patient.findOne({
        where: { id: patientId }
      });

      if (!patient) {
        return res.status(404).json({
          message: 'Patient not found',
          code: 'NOT_FOUND'
        });
      }
    } else {
      return res.status(403).json({
        message: 'Unauthorized role',
        code: 'UNAUTHORIZED'
      });
    }

    let conversation = await Conversation.findOne({
      where: { 
        patientId: patient.id, 
        doctorId: doctor.id 
      }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        patientId: patient.id,
        doctorId: doctor.id
      });
    }

    res.json({
      id: conversation.id,
      patientId: conversation.patientId,
      doctorId: conversation.doctorId,
      status: conversation.status
    });
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    res.status(500).json({ message: 'Failed to get conversation' });
  }
};

// Simple test endpoint (no auth required)
const testConnection = async (req, res) => {
  try {
    console.log('Testing database connection...');
    
    // Test basic database connection
    await sequelize.authenticate();
    console.log('Database connection successful');
    
    // Test if tables exist
    const tables = await sequelize.showAllSchemas();
    console.log('Available schemas:', tables);
    
    res.json({
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    res.status(500).json({ 
      message: 'Database connection failed',
      error: error.message 
    });
  }
};

// Test function to debug models
const testModels = async (req, res) => {
  try {
    console.log('Testing models...');
    
    // Test User model
    const userCount = await User.count();
    console.log('User count:', userCount);
    
    // Test Patient model
    const patientCount = await Patient.count();
    console.log('Patient count:', patientCount);
    
    // Test Doctor model
    const doctorCount = await Doctor.count();
    console.log('Doctor count:', doctorCount);
    
    // Test Conversation model
    const conversationCount = await Conversation.count();
    console.log('Conversation count:', conversationCount);
    
    // Test Message model
    const messageCount = await Message.count();
    console.log('Message count:', messageCount);
    
    // Test associations
    const testPatient = await Patient.findOne({
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName']
      }]
    });
    
    const testDoctor = await Doctor.findOne({
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName']
      }]
    });
    
    res.json({
      message: 'Models test completed',
      counts: {
        users: userCount,
        patients: patientCount,
        doctors: doctorCount,
        conversations: conversationCount,
        messages: messageCount
      },
      testPatient: testPatient ? {
        id: testPatient.id,
        user: testPatient.User
      } : null,
      testDoctor: testDoctor ? {
        id: testDoctor.id,
        user: testDoctor.User
      } : null
    });
  } catch (error) {
    console.error('Test models error:', error);
    res.status(500).json({ 
      message: 'Error testing models',
      error: error.message,
      stack: error.stack
    });
  }
};

const markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let doctorId = null;
    let patientId = null;

    if (userRole === 'doctor') {
      const doctor = await Doctor.findOne({ where: { userId } });
      if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
      doctorId = doctor.id;
    } else if (userRole === 'patient') {
      const patient = await Patient.findOne({ where: { userId } });
      if (!patient) return res.status(404).json({ message: 'Patient not found' });
      patientId = patient.id;
    }

    // Only mark as read messages not sent by the current user
    await Message.update(
      { isRead: true },
      {
        where: {
          conversationId,
          senderId: { [Op.ne]: userId },
          isRead: false,
          ...(doctorId ? { } : {}),
          ...(patientId ? { } : {}),
        }
      }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    res.status(500).json({ message: 'Failed to mark as read' });
  }
};

module.exports = {
  getConversations,
  getDoctorConversations,
  getRecentMessages,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  testModels,
  testConnection,
  markConversationAsRead
}; 