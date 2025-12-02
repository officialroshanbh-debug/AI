/**
 * Two-Factor Authentication (2FA) Implementation
 * TOTP-based 2FA using authenticator apps
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// TOTP implementation (using crypto instead of otplib for compatibility)
function generateTOTP(secret: string): string {
  const time = Math.floor(Date.now() / 1000 / 30);
  const timeBuffer = Buffer.allocUnsafe(8);
  timeBuffer.writeUInt32BE(0, 0);
  timeBuffer.writeUInt32BE(time, 4);

  const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'));
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1]! & 0xf;
  const code = ((hash[offset]! & 0x7f) << 24) |
               ((hash[offset + 1]! & 0xff) << 16) |
               ((hash[offset + 2]! & 0xff) << 8) |
               (hash[offset + 3]! & 0xff);

  return (code % 1000000).toString().padStart(6, '0');
}

function verifyTOTP(secret: string, token: string): boolean {
  const generated = generateTOTP(secret);
  return generated === token;
}

/**
 * Generate a secret for 2FA setup
 */
export async function generate2FASecret(userId: string): Promise<{
  secret: string;
  qrCodeUrl: string;
}> {
  const secret = crypto.randomBytes(20).toString('base32');
  const serviceName = 'Roshan AI';
  const accountName = userId;

  // Store secret in database (encrypted in production)
  await prisma.twoFactorAuth.upsert({
    where: { userId },
    create: {
      userId,
      secret: encryptSecret(secret),
      enabled: false,
    },
    update: {
      secret: encryptSecret(secret),
    },
  });

  // Generate OTP Auth URL for QR code
  const otpAuthUrl = `otpauth://totp/${encodeURIComponent(serviceName)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(serviceName)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`;

  return {
    secret,
    qrCodeUrl,
  };
}

/**
 * Verify TOTP token
 */
export async function verify2FA(userId: string, token: string): Promise<boolean> {
  const twoFactor = await prisma.twoFactorAuth.findUnique({
    where: { userId },
  });

  if (!twoFactor || !twoFactor.enabled || !twoFactor.secret) {
    return false;
  }

  const decryptedSecret = decryptSecret(twoFactor.secret);
  return verifyTOTP(decryptedSecret, token);
}

/**
 * Enable 2FA for a user
 */
export async function enable2FA(userId: string, token: string): Promise<boolean> {
  const verified = await verify2FA(userId, token);
  if (!verified) {
    return false;
  }

  await prisma.twoFactorAuth.update({
    where: { userId },
    data: { enabled: true },
  });

  return true;
}

/**
 * Disable 2FA for a user
 */
export async function disable2FA(userId: string): Promise<void> {
  // In production, require password verification
  await prisma.twoFactorAuth.updateMany({
    where: { userId: userId },
    data: { enabled: false },
  });
}

/**
 * Generate backup codes
 */
export async function generateBackupCodes(userId: string): Promise<string[]> {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }

  await prisma.twoFactorAuth.update({
    where: { userId },
    data: {
      backupCodes: JSON.stringify(codes),
    },
  });

  return codes;
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  const twoFactor = await prisma.twoFactorAuth.findUnique({
    where: { userId },
  });

  if (!twoFactor || !twoFactor.backupCodes) {
    return false;
  }

  const codes = JSON.parse(twoFactor.backupCodes) as string[];
  const index = codes.indexOf(code.toUpperCase());

  if (index === -1) {
    return false;
  }

  // Remove used code
  codes.splice(index, 1);
  await prisma.twoFactorAuth.update({
    where: { userId },
    data: {
      backupCodes: JSON.stringify(codes),
    },
  });

  return true;
}

/**
 * Encrypt secret (simple encryption - use proper encryption in production)
 */
function encryptSecret(secret: string): string {
  // In production, use proper encryption (AES-256-GCM)
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!!', 'utf8');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt secret
 */
function decryptSecret(encrypted: string): string {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!!', 'utf8');
  const [ivHex, encryptedData] = encrypted.split(':');
  const iv = Buffer.from(ivHex!, 'hex');
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedData!, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

