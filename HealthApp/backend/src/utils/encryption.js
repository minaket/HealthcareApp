const crypto = require('crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config();

class Encryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    // Fallback dummy key (32 bytes) and dummy iv (16 bytes) if env vars are missing.
    const dummyKey = '0000000000000000000000000000000000000000000000000000000000000000';
    const dummyIv = '00000000000000000000000000000000';
    this.key = Buffer.from(process.env.ENCRYPTION_KEY || dummyKey, 'hex');
    this.iv = Buffer.from(process.env.ENCRYPTION_IV || dummyIv, 'hex');
  }

  encrypt(text) {
    try {
      // Convert text to Buffer
      const data = Buffer.from(text);
      
      // Generate a new IV for each encryption
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      let encrypted = cipher.update(data);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted: encrypted.toString('hex'),
        authTag: authTag.toString('hex'),
        iv: iv.toString('hex')
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Encryption failed: ' + error.message);
    }
  }

  decrypt(encryptedData) {
    try {
      // Convert hex strings back to Buffers
      const encrypted = Buffer.from(encryptedData.encrypted, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        iv
      );
      
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Decryption failed: ' + error.message);
    }
  }

  // Generate a new key pair for user
  generateKeyPair() {
    try {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });

      console.log('Generated public key:', publicKey);
      console.log('Generated private key:', privateKey);
      
      return { publicKey, privateKey };
    } catch (error) {
      console.error('Key pair generation error:', error);
      throw new Error('Failed to generate key pair: ' + error.message);
    }
  }

  // Hash password using bcrypt
  async hashPassword(password) {
    try {
      // Log the password type and value
      console.log('Hashing password:', typeof password, password);
      
      // Validate the password
      if (!password || typeof password !== 'string') {
        console.error('Invalid password:', password);
        throw new Error('Invalid password provided');
      }
      
      // Hash password with 10 rounds of salt
      const hash = await bcrypt.hash(password, 10);
      
      // Extract salt from the hash
      const salt = hash.split('$')[2];
      
      // Log the generated values
      console.log('Generated hash:', hash);
      console.log('Extracted salt:', salt);
      
      // Return the hash and salt
      return {
        password_hash: hash,
        password_salt: salt
      };
    } catch (error) {
      console.error('Password hashing error:', error);
      throw error;
    }
  }

  // Verify password using bcrypt
  async verifyPassword(password, hash, salt) {
    try {
      // Ensure password is a string
      const passwordString = String(password);
      
      // If we have the full bcrypt hash
      if (hash?.startsWith('$2')) {
        return await bcrypt.compare(passwordString, hash);
      }
      
      console.error('Invalid password hash format');
      return false;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }
}

module.exports = Encryption; 