import { scrypt, randomBytes, timingSafeEqual, createHmac } from 'crypto';
import { promisify } from 'util';
import { config } from './config';

const scryptAsync = promisify(scrypt);

const TOKEN_EXPIRY_MS  = 7 * 24 * 60 * 60 * 1000;
const SCRYPT_KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt    = randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, SCRYPT_KEY_LENGTH) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(storedHash: string, candidate: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const derived    = await scryptAsync(candidate, salt, SCRYPT_KEY_LENGTH) as Buffer;
  const hashBuffer = Buffer.from(hash, 'hex');
  return hashBuffer.length === derived.length && timingSafeEqual(derived, hashBuffer);
}

export function createToken(userId: number): string {
  const expiry    = Date.now() + TOKEN_EXPIRY_MS;
  const payload   = `${userId}:${expiry}`;
  const signature = createHmac('sha256', config.tokenSecret)
    .update(payload)
    .digest('hex');
  return `${payload}:${signature}`;
}

export function verifyToken(token: string | null): number | null {
  if (!token) return null;
  const parts = token.split(':');
  if (parts.length !== 3) return null;
  const [userIdStr, expiryStr, signature] = parts;
  const payload  = `${userIdStr}:${expiryStr}`;
  const expected = createHmac('sha256', config.tokenSecret)
    .update(payload)
    .digest('hex');
  if (signature !== expected) return null;
  if (Date.now() > parseInt(expiryStr, 10)) return null;
  return parseInt(userIdStr, 10);
}

export function extractUserIdFromHeader(authHeader: string | undefined): number | null {
  if (typeof authHeader !== 'string') return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  return verifyToken(authHeader.slice(7));
}
