import bcrypt from 'bcrypt';
import crypto from 'crypto';

const AES_KEY = process.env['AES_KEY'] ?? 'abcde12345abcde12345abcde12345ab';
const IV = AES_KEY.substring(0, 16);

export const generateHash = (data: string | Buffer) => {
  const salt = bcrypt.genSaltSync(Number(process.env['SALT_ROUNDS']));
  return bcrypt.hashSync(data, salt);
};

export const compareHash = (target: string | Buffer, hash: string) => bcrypt.compareSync(target, hash);

export const encryptAES = (text: string) => {
  const cipher = crypto.createCipheriv('AES-256-GCM', Buffer.from(AES_KEY), IV);
  const encrypted = cipher.update(text);

  return Buffer.concat([encrypted, cipher.final()]).toString('hex');
};

export const decryptAES = (text: string) => {
  const encrypted = Buffer.from(text, 'hex');
  const decipher = crypto.createDecipheriv('AES-256-GCM', Buffer.from(AES_KEY), IV);
  const decrypted = decipher.update(encrypted);

  return Buffer.concat([decrypted, decipher.final()]).toString();
};
