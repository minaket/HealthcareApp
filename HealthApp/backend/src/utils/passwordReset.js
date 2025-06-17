const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateResetToken = (userId) => {
  const payload = {
    userId,
    type: 'password_reset'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h' // Token expires in 1 hour
  });
};

const verifyResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'password_reset') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  generateResetToken,
  verifyResetToken
};
