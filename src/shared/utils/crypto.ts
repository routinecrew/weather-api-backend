import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const AES_KEY = process.env['AES_KEY'] ?? 'abcde12345abcde12345abcde12345ab';
const IV = randomBytes(16); // Using random IV instead of substring for better security

// Simple hash generation using crypto
export const generateHash = (data: string | Buffer) => {
  const dataString = Buffer.isBuffer(data) ? data.toString() : data;
  return createHash('sha256')
    .update(dataString + (process.env['SALT'] || 'default-salt'))
    .digest('hex');
};

// Simple hash comparison
export const compareHash = (target: string | Buffer, hash: string) => {
  const targetString = Buffer.isBuffer(target) ? target.toString() : target;
  const newHash = createHash('sha256')
    .update(targetString + (process.env['SALT'] || 'default-salt'))
    .digest('hex');
  return newHash === hash;
};

export const encryptAES = (text: string) => {
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(AES_KEY), IV);
  const encrypted = cipher.update(text, 'utf8');
  const finalBuffer = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // Return IV, encrypted data, and auth tag together
  return Buffer.concat([IV, finalBuffer, authTag]).toString('hex');
};

export const decryptAES = (text: string) => {
  const buffer = Buffer.from(text, 'hex');
  // Extract IV (first 16 bytes), auth tag (last 16 bytes), and encrypted data (middle)
  const iv = buffer.subarray(0, 16);
  const authTag = buffer.subarray(-16);
  const encrypted = buffer.subarray(16, -16);
  
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(AES_KEY), iv);
  decipher.setAuthTag(authTag);
  const decrypted = decipher.update(encrypted);
  
  return Buffer.concat([decrypted, decipher.final()]).toString('utf8');
};