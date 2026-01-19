/**
 * Encryption utility library for client-side encryption
 * Uses Web Crypto API with PBKDF2 key derivation and AES-GCM encryption
 */

const STORAGE_KEY = 'xpenselab_encryption_key';
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256; // bits
const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits for GCM

export class EncryptionError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'EncryptionError';
  }
}

// Export CryptoKey type for use in other modules
export type CryptoKey = globalThis.CryptoKey;

/**
 * Derive encryption key from user-provided code using PBKDF2
 */
async function deriveKey(
  code: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  try {
    const encoder = new TextEncoder();
    const codeBuffer = encoder.encode(code);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      codeBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      {
        name: ALGORITHM,
        length: KEY_LENGTH,
      },
      false,
      ['encrypt', 'decrypt']
    );

    return derivedKey;
  } catch (error) {
    throw new EncryptionError('Failed to derive encryption key', error as Error);
  }
}

/**
 * Generate a random salt for key derivation
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Generate a random IV for encryption
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Convert array buffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to array buffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt a value (string or number)
 */
export async function encryptValue(
  value: string | number,
  encryptionKey: CryptoKey
): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(String(value));
    const iv = generateIV();

    const encrypted = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      encryptionKey,
      data
    );

    // Combine IV and encrypted data: [IV (12 bytes)][encrypted data]
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Return as base64: "iv:encrypted"
    const ivBase64 = arrayBufferToBase64(iv.buffer);
    const encryptedBase64 = arrayBufferToBase64(encrypted);
    return `${ivBase64}:${encryptedBase64}`;
  } catch (error) {
    throw new EncryptionError('Failed to encrypt value', error as Error);
  }
}

/**
 * Decrypt a value
 */
export async function decryptValue(
  encryptedValue: string,
  encryptionKey: CryptoKey
): Promise<string> {
  try {
    // Split IV and encrypted data
    const parts = encryptedValue.split(':');
    if (parts.length !== 2) {
      throw new EncryptionError('Invalid encrypted value format');
    }

    const [ivBase64, encryptedBase64] = parts;
    const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
    const encrypted = base64ToArrayBuffer(encryptedBase64);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      encryptionKey,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new EncryptionError('Failed to decrypt value', error as Error);
  }
}

/**
 * Initialize encryption with user code
 * Derives key and stores it securely
 */
export async function initializeEncryption(code: string): Promise<{
  salt: string;
  keyDerived: boolean;
}> {
  try {
    if (!code || code.length < 8) {
      throw new EncryptionError('Encryption code must be at least 8 characters');
    }

    const salt = generateSalt();
    const encryptionKey = await deriveKey(code, salt);

    // Store salt and encrypted key indicator in localStorage
    // We don't store the actual key, but we'll derive it each time from the code
    const saltBase64 = arrayBufferToBase64(salt.buffer);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      salt: saltBase64,
      initialized: true,
    }));

    return {
      salt: saltBase64,
      keyDerived: true,
    };
  } catch (error) {
    throw new EncryptionError('Failed to initialize encryption', error as Error);
  }
}

/**
 * Get encryption key from code (derives on-demand)
 * This should be called each time encryption/decryption is needed
 */
export async function getEncryptionKey(code: string): Promise<CryptoKey> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      throw new EncryptionError('Encryption not initialized');
    }

    const { salt: saltBase64 } = JSON.parse(stored);
    const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));

    return await deriveKey(code, salt);
  } catch (error) {
    if (error instanceof EncryptionError) {
      throw error;
    }
    throw new EncryptionError('Failed to get encryption key', error as Error);
  }
}

/**
 * Check if encryption is initialized
 */
export function isEncryptionInitialized(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const data = JSON.parse(stored);
    return data.initialized === true;
  } catch {
    return false;
  }
}

/**
 * Clear encryption data from localStorage
 */
export function clearEncryptionData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Validate encryption code strength
 */
export function validateEncryptionCode(code: string): {
  valid: boolean;
  error?: string;
} {
  if (!code || code.length < 8) {
    return {
      valid: false,
      error: 'Encryption code must be at least 8 characters',
    };
  }

  if (code.length > 128) {
    return {
      valid: false,
      error: 'Encryption code must be less than 128 characters',
    };
  }

  return { valid: true };
}

/**
 * Check if Web Crypto API is available
 */
export function isWebCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.getRandomValues !== 'undefined';
}

/**
 * Generate a random recovery code
 * Format: XXXX-XXXX-XXXX (12 characters, grouped)
 */
export function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars (0, O, I, 1)
  const groups = [4, 4, 4];
  const code = groups.map(groupSize => {
    return Array.from({ length: groupSize }, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  }).join('-');
  return code;
}

/**
 * Generate multiple recovery codes
 */
export function generateRecoveryCodes(count: number = 10): string[] {
  return Array.from({ length: count }, () => generateRecoveryCode());
}

/**
 * Hash a recovery code using SHA-256
 * Returns base64-encoded hash
 */
export async function hashRecoveryCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Verify a recovery code against a stored hash
 */
export async function verifyRecoveryCode(
  code: string,
  storedHash: string
): Promise<boolean> {
  const computedHash = await hashRecoveryCode(code);
  return computedHash === storedHash;
}
