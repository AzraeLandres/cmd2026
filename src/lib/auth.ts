import { scrypt, randomBytes, timingSafeEqual, createHmac } from 'crypto';
import { promisify } from 'util';
import { config } from './config';

const scryptAsync = promisify(scrypt);

const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const SCRYPT_KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt    = randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, SCRYPT_KEY_LENGTH) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(storedHash: string, candidate: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;

  const derived  = await scryptAsync(candidate, salt, SCRYPT_KEY_LENGTH) as Buffer;
  const hashBuffer = Buffer.from(hash, 'hex');

  return hashBuffer.length === derived.length && timingSafeEqual(derived, hashBuffer);
}

export function createToken(userId: number): string {
  const payload = `${userId}.${Date.now()}`;
  const signature = createHmac('sha256', config.tokenSecret)
    .update(payload)
    .digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${signature}`;
}

export function verifyToken(token: string): number | null {
  if (!token) return null;

  const lastDotIndex = token.lastIndexOf('.');
  if (lastDotIndex < 0) return null;

  const encodedPayload = token.slice(0, lastDotIndex);
  const receivedSignature = token.slice(lastDotIndex + 1);

  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, 'base64url').toString();
  } catch {
    return null;
  }

  const expectedSignature = createHmac('sha256', config.tokenSecret)
    .update(payload)
    .digest('hex');

  if (receivedSignature !== expectedSignature) return null;

  const [userIdStr, timestampStr] = payload.split('.');
  const isExpired = Date.now() - parseInt(timestampStr, 10) > TOKEN_EXPIRY_MS;
  if (isExpired) return null;

  return parseInt(userIdStr, 10);
}

export function extractUserIdFromHeader(authHeader: string | undefined): number | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return verifyToken(authHeader.slice(7));
}
