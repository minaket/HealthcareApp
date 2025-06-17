const { Message, Conversation, User, Doctor, Patient } = require('../models');
const { sequelize } = require('../models');

// Get user conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find the user's patient or doctor record
    let userRecord;
    if (userRole === 'patient') {
      userRecord = await Patient.findOne({
        where: { userId },
        attributes: ['id', 'userId']
      });
      if (!userRecord) {
        return res.status(404).json({
          message: 'Patient record not found',
          code: 'NOT_FOUND'
        });
      }
    } else if (userRole === 'doctor') {
      userRecord = await Doctor.findOne({
        where: { userId },
        attributes: ['id', 'userId']
      });
      if (!userRecord) {
        return res.status(404).json({
          message: 'Doctor record not found',
          code: 'NOT_FOUND'
        });
      }
    } else {
      return res.status(403).json({
        message: 'Only patients and doctors can access conversations',
        code: 'UNAUTHORIZED'
      });
    }

    console.log('Current user:', { userId, userRole, recordId: userRecord.id });

    const conversations = await Conversation.findAll({
      where: userRole === 'patient' 
        ? { patientId: userRecord.id }
        : { doctorId: userRecord.id },
      include: [
        {
          model: Message,
          as: 'Messages',
          limit: 1,
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'content', 'createdAt', 'isRead', 'senderId']
        },
        {
          model: Patient,
          attributes: ['id', 'userId']
        },
        {
          model: Doctor,
          attributes: ['id', 'specialization', 'userId']
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    console.log('Found conversations:', JSON.stringify(conversations, null, 2));

    // Get all unique user IDs from conversations
    const userIds = new Set();
    conversations.forEach(conv => {
      if (conv.Patient?.userId) userIds.add(conv.Patient.userId);
      if (conv.Doctor?.userId) userIds.add(conv.Doctor.userId);
    });

    // Fetch all users in one query
    const users = await User.findAll({
      where: { id: Array.from(userIds) },
      attributes: ['id', 'firstName', 'lastName', 'role']
    });

    // Create a map of users for easy lookup
    const userMap = new Map(users.map(user => [user.id, user]));

    // Transform the response to match frontend expectations
    const formattedConversations = conversations.map(conv => {
      console.log('Processing conversation:', conv.id);
      
      const patientUser = userMap.get(conv.Patient?.userId);
      const doctorUser = userMap.get(conv.Doctor?.userId);
      
      const participant = userRole === 'patient' 
        ? {
            id: doctorUser?.id,
            firstName: doctorUser?.firstName,
            lastName: doctorUser?.lastName,
            role: doctorUser?.role,
            specialization: conv.Doctor?.specialization
          }
        : {
            id: patientUser?.id,
            firstName: patientUser?.firstName,
            lastName: patientUser?.lastName,
            role: patientUser?.role
          };

      // Count unread messages - a message is unread if:
      // 1. It's not read (isRead: false)
      // 2. It was sent by the other participant (not the current user)
      const unreadCount = conv.Messages?.filter(msg => {
        const isUnread = !msg.isRead;
        const isFromOtherParticipant = msg.senderId !== userId;
        console.log('Message:', { 
          id: msg.id, 
          isRead: msg.isRead, 
          senderId: msg.senderId, 
          currentUserId: userId,
          isUnread,
          isFromOtherParticipant
        });
        return isUnread && isFromOtherParticipant;
      }).length || 0;

      const formatted = {
        id: conv.id,
        participant,
        lastMessage: conv.Messages?.[0] ? {
          id: conv.Messages[0].id,
          content: conv.Messages[0].content,
          timestamp: conv.Messages[0].createdAt,
          isRead: conv.Messages[0].isRead,
          senderId: conv.Messages[0].senderId
        } : null,
        unreadCount,
        updatedAt: conv.Messages?.[0]?.createdAt || conv.updatedAt
      };

      console.log('Formatted conversation:', formatted);
      return formatted;
    });

    console.log('Sending response with conversations:', formattedConversations.length);
    res.json({
      conversations: formattedConversations,
      total: formattedConversations.length
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      message: 'Error fetching conversations',
      code: 'FETCH_ERROR'
    });
  }
};

// Get conversation messages
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        ...(userRole === 'patient' ? { patientId: userId } : { doctorId: userId })
      }
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found',
        code: 'NOT_FOUND'
      });
    }

    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const messages = await Message.findAndCountAll({
      where: { conversationId },
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'role']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Mark messages as read
    await Message.update(
      { isRead: true },
      {
        where: {
          conversationId,
          senderId: { [sequelize.Op.ne]: userId },
          isRead: false
        }
      }
    );

    res.json({
      messages: messages.rows,
      total: messages.count,
      page: parseInt(page),
      totalPages: Math.ceil(messages.count / limit)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      message: 'Error fetching messages',
      code: 'FETCH_ERROR'
    });
  }
};

// Send message
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        ...(userRole === 'patient' ? { patientId: userId } : { doctorId: userId })
      }
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found',
        code: 'NOT_FOUND'
      });
    }

    const message = await Message.create({
      conversationId,
      senderId: userId,
      content,
      isRead: false
    });

    const messageWithSender = await Message.findOne({
      where: { id: message.id },
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'role']
      }]
    });

    res.status(201).json({ message: messageWithSender });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      message: 'Error sending message',
      code: 'CREATE_ERROR'
    });
  }
};

// Get or create conversation between patient and doctor
const getOrCreateConversation = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'patient') {
      return res.status(403).json({
        message: 'Only patients can initiate conversations with doctors',
        code: 'UNAUTHORIZED'
      });
    }

    // Find the patient and doctor records
    const patient = await Patient.findOne({
      where: { userId },
      include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'role', 'avatar'] }]
    });

    const doctor = await Doctor.findOne({
      where: { userId: doctorId },
      include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'role', 'avatar'] }]
    });

    if (!patient || !doctor) {
      return res.status(404).json({
        message: 'Patient or doctor not found',
        code: 'NOT_FOUND'
      });
    }

    // Find existing conversation or create new one
    let conversation = await Conversation.findOne({
      where: {
        patientId: patient.id,
        doctorId: doctor.id,
        status: 'active'
      },
      include: [
        {
          model: Message,
          limit: 1,
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'content', 'createdAt', 'isRead']
        }
      ]
    });

    if (!conversation) {
      conversation = await Conversation.create({
        patientId: patient.id,
        doctorId: doctor.id,
        status: 'active'
      });

      // Fetch the conversation with its associations
      conversation = await Conversation.findOne({
        where: { id: conversation.id },
        include: [
          {
            model: Message,
            limit: 1,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'content', 'createdAt', 'isRead']
          },
          {
            model: Patient,
            attributes: ['id', 'firstName', 'lastName', 'userId'],
            include: [{
              model: User,
              attributes: ['id', 'firstName', 'lastName', 'role', 'avatar']
            }]
          },
          {
            model: Doctor,
            attributes: ['id', 'specialization', 'userId'],
            include: [{
              model: User,
              attributes: ['id', 'firstName', 'lastName', 'role', 'avatar']
            }]
          }
        ]
      });
    }

    // Format the response
    const formattedConversation = {
      id: conversation.id,
      participant: {
        id: doctor.User.id,
        firstName: doctor.User.firstName,
        lastName: doctor.User.lastName,
        role: doctor.User.role,
        avatar: doctor.User.avatar,
        specialization: doctor.specialization
      },
      lastMessage: conversation.Messages?.[0] ? {
        id: conversation.Messages[0].id,
        content: conversation.Messages[0].content,
        timestamp: conversation.Messages[0].createdAt,
        isRead: conversation.Messages[0].isRead
      } : null,
      unreadCount: 0,
      updatedAt: conversation.Messages?.[0]?.createdAt || conversation.updatedAt
    };

    res.json(formattedConversation);
  } catch (error) {
    console.error('Get or create conversation error:', error);
    res.status(500).json({
      message: 'Error getting or creating conversation',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  getOrCreateConversation
}; 