import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// Ensure this incredibly secure master key is stored securely in VPS ENV, never in code!
// Exactly 32 bytes for AES-256
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-fallback-insecure-key-32b'; 
const IV_LENGTH = 16; 

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
    try {
       const textParts = text.split(':');
       const iv = Buffer.from(textParts.shift()!, 'hex');
       const encryptedText = Buffer.from(textParts.join(':'), 'hex');
       const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
       let decrypted = decipher.update(encryptedText);
       decrypted = Buffer.concat([decrypted, decipher.final()]);
       return decrypted.toString();
    } catch (e) {
       console.error("Decryption failed. Invalid cipher or changed ENCRYPTION_KEY.");
       return "";
    }
}
