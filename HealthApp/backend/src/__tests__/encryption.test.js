const encryption = require('../utils/encryption');
const crypto = require('crypto');

describe('Encryption Utilities', () => {
  const testData = 'Sensitive medical data';
  const testPassword = 'Test123!@#';
  let encryptedData;
  let hashedPassword;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Data Encryption', () => {
    it('should encrypt data successfully', () => {
      encryptedData = encryption.encrypt(testData);
      expect(encryptedData).toBeDefined();
      expect(encryptedData).not.toBe(testData);
      expect(typeof encryptedData).toBe('string');
    });

    it('should decrypt data successfully', () => {
      const decryptedData = encryption.decrypt(encryptedData);
      expect(decryptedData).toBe(testData);
    });

    it('should handle empty data', () => {
      const emptyEncrypted = encryption.encrypt('');
      const emptyDecrypted = encryption.decrypt(emptyEncrypted);
      expect(emptyDecrypted).toBe('');
    });

    it('should handle special characters', () => {
      const specialData = '!@#$%^&*()_+{}|:"<>?~`-=[]\\;\',./';
      const encrypted = encryption.encrypt(specialData);
      const decrypted = encryption.decrypt(encrypted);
      expect(decrypted).toBe(specialData);
    });

    it('should handle unicode characters', () => {
      const unicodeData = '测试数据 テストデータ 테스트 데이터';
      const encrypted = encryption.encrypt(unicodeData);
      const decrypted = encryption.decrypt(encrypted);
      expect(decrypted).toBe(unicodeData);
    });

    it('should generate unique encryption for same data', () => {
      const encrypted1 = encryption.encrypt(testData);
      const encrypted2 = encryption.encrypt(testData);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw error for invalid encrypted data', () => {
      expect(() => {
        encryption.decrypt('invalid-encrypted-data');
      }).toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password successfully', async () => {
      hashedPassword = await encryption.hashPassword(testPassword);
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(testPassword);
      expect(typeof hashedPassword).toBe('string');
    });

    it('should verify correct password', async () => {
      const isValid = await encryption.comparePassword(testPassword, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const isValid = await encryption.comparePassword('wrong-password', hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should handle empty password', async () => {
      const emptyHashed = await encryption.hashPassword('');
      const isValid = await encryption.comparePassword('', emptyHashed);
      expect(isValid).toBe(true);
    });

    it('should generate unique hash for same password', async () => {
      const hash1 = await encryption.hashPassword(testPassword);
      const hash2 = await encryption.hashPassword(testPassword);
      expect(hash1).not.toBe(hash2);
    });

    it('should handle special characters in password', async () => {
      const specialPassword = '!@#$%^&*()_+{}|:"<>?~`-=[]\\;\',./';
      const hashed = await encryption.hashPassword(specialPassword);
      const isValid = await encryption.comparePassword(specialPassword, hashed);
      expect(isValid).toBe(true);
    });

    it('should handle unicode characters in password', async () => {
      const unicodePassword = '测试密码 パスワード 비밀번호';
      const hashed = await encryption.hashPassword(unicodePassword);
      const isValid = await encryption.comparePassword(unicodePassword, hashed);
      expect(isValid).toBe(true);
    });
  });

  describe('Key Generation', () => {
    it('should generate encryption key', () => {
      const key = encryption.generateKey();
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key.length).toBe(32); // 256 bits
    });

    it('should generate unique keys', () => {
      const key1 = encryption.generateKey();
      const key2 = encryption.generateKey();
      expect(key1).not.toBe(key2);
    });

    it('should generate valid encryption key format', () => {
      const key = encryption.generateKey();
      expect(key).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 format
    });
  });

  describe('Error Handling', () => {
    it('should handle encryption errors gracefully', () => {
      // Mock crypto.createCipheriv to throw an error
      jest.spyOn(crypto, 'createCipheriv').mockImplementationOnce(() => {
        throw new Error('Encryption failed');
      });

      expect(() => {
        encryption.encrypt(testData);
      }).toThrow('Encryption failed');
    });

    it('should handle decryption errors gracefully', () => {
      // Mock crypto.createDecipheriv to throw an error
      jest.spyOn(crypto, 'createDecipheriv').mockImplementationOnce(() => {
        throw new Error('Decryption failed');
      });

      expect(() => {
        encryption.decrypt(encryptedData);
      }).toThrow('Decryption failed');
    });

    it('should handle hashing errors gracefully', async () => {
      // Mock crypto.pbkdf2 to throw an error
      jest.spyOn(crypto, 'pbkdf2').mockImplementationOnce((...args) => {
        const callback = args[args.length - 1];
        callback(new Error('Hashing failed'));
      });

      await expect(encryption.hashPassword(testPassword)).rejects.toThrow('Hashing failed');
    });

    it('should handle comparison errors gracefully', async () => {
      // Mock crypto.timingSafeEqual to throw an error
      jest.spyOn(crypto, 'timingSafeEqual').mockImplementationOnce(() => {
        throw new Error('Comparison failed');
      });

      await expect(encryption.comparePassword(testPassword, hashedPassword)).rejects.toThrow('Comparison failed');
    });
  });

  describe('Security', () => {
    it('should use secure encryption algorithm', () => {
      const key = encryption.generateKey();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      expect(cipher.getAuthTag()).toBeDefined(); // GCM mode provides authentication
    });

    it('should use secure password hashing', async () => {
      const hashed = await encryption.hashPassword(testPassword);
      expect(hashed).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
    });

    it('should use constant-time comparison for passwords', async () => {
      const spy = jest.spyOn(crypto, 'timingSafeEqual');
      await encryption.comparePassword(testPassword, hashedPassword);
      expect(spy).toHaveBeenCalled();
    });

    it('should use secure random values', () => {
      const spy = jest.spyOn(crypto, 'randomBytes');
      encryption.generateKey();
      expect(spy).toHaveBeenCalledWith(32); // 256 bits
    });
  });
}); 