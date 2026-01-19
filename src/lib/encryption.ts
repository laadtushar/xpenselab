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

    // Ensure salt is a proper Uint8Array
    // Type assertion needed because Web Crypto API accepts ArrayBufferLike but TypeScript is strict
    const saltArray = salt instanceof Uint8Array ? salt : new Uint8Array(salt);
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltArray as BufferSource,
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
  // Type assertion: crypto.getRandomValues returns Uint8Array<ArrayBufferLike> 
  // but Web Crypto API accepts it as BufferSource
  return crypto.getRandomValues(new Uint8Array(16)) as Uint8Array;
}

/**
 * Generate a random IV for encryption
 */
function generateIV(): Uint8Array {
  // Type assertion: crypto.getRandomValues returns Uint8Array<ArrayBufferLike> 
  // but Web Crypto API accepts it as BufferSource
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH)) as Uint8Array;
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
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
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
        iv: iv as BufferSource,
      },
      encryptionKey,
      data
    ) as ArrayBuffer;

    // Combine IV and encrypted data: [IV (12 bytes)][encrypted data]
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Return as base64: "iv:encrypted"
    // Type assertions needed for ArrayBufferLike compatibility
    let ivBuffer: ArrayBuffer;
    if (iv.buffer instanceof ArrayBuffer) {
      ivBuffer = iv.buffer;
    } else {
      ivBuffer = new ArrayBuffer(iv.byteLength);
      new Uint8Array(ivBuffer).set(iv);
    }
    const ivBase64 = arrayBufferToBase64(ivBuffer);
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
      throw new EncryptionError('Invalid encrypted value format. Expected format: "ivBase64:encryptedBase64"');
    }

    const [ivBase64, encryptedBase64] = parts;
    
    // Validate base64 format
    if (!ivBase64 || !encryptedBase64) {
      throw new EncryptionError('Invalid encrypted value format. Missing IV or encrypted data.');
    }
    
    let iv: Uint8Array;
    let encrypted: ArrayBuffer;
    
    try {
      // Type assertions: base64ToArrayBuffer returns ArrayBuffer but TypeScript sees ArrayBufferLike
      const ivBufferRaw = base64ToArrayBuffer(ivBase64);
      const encryptedBufferRaw = base64ToArrayBuffer(encryptedBase64);
      // Ensure proper ArrayBuffer types
      let ivArrayBuffer: ArrayBuffer;
      if (ivBufferRaw instanceof ArrayBuffer) {
        ivArrayBuffer = ivBufferRaw;
      } else {
        const rawLength = (ivBufferRaw as unknown as { byteLength: number }).byteLength || 12;
        ivArrayBuffer = new ArrayBuffer(rawLength);
        new Uint8Array(ivArrayBuffer).set(new Uint8Array(ivBufferRaw as any));
      }
      let encryptedArrayBuffer: ArrayBuffer;
      if (encryptedBufferRaw instanceof ArrayBuffer) {
        encryptedArrayBuffer = encryptedBufferRaw;
      } else {
        const rawLength = (encryptedBufferRaw as unknown as { byteLength: number }).byteLength || 0;
        encryptedArrayBuffer = new ArrayBuffer(rawLength);
        new Uint8Array(encryptedArrayBuffer).set(new Uint8Array(encryptedBufferRaw as any));
      }
      iv = new Uint8Array(ivArrayBuffer);
      encrypted = encryptedArrayBuffer;
    } catch (base64Error) {
      throw new EncryptionError('Invalid base64 encoding in encrypted value', base64Error as Error);
    }

    // Validate IV length (should be 12 bytes for AES-GCM)
    if (iv.length !== IV_LENGTH) {
      throw new EncryptionError(`Invalid IV length. Expected ${IV_LENGTH} bytes, got ${iv.length}`);
    }

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv as BufferSource,
      },
      encryptionKey,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    // Provide more specific error messages
    if (error instanceof EncryptionError) {
      throw error;
    }
    
    // Check if it's a DOMException from Web Crypto API
    if (error instanceof DOMException) {
      if (error.name === 'OperationError') {
        throw new EncryptionError(
          'Decryption failed. This usually means the encryption code is incorrect or the data was encrypted with a different key. ' +
          'Please verify your encryption code matches the one used to encrypt this data.',
          error
        );
      }
      throw new EncryptionError(`Crypto operation failed: ${error.message}`, error);
    }
    
    throw new EncryptionError('Failed to decrypt value. The encryption key may be incorrect or the data may be corrupted.', error as Error);
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
    // Type assertion needed for ArrayBufferLike compatibility
    const saltBase64 = arrayBufferToBase64(salt.buffer as ArrayBuffer);
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
 * 
 * If salt is not in localStorage, it will try to fetch from Firestore via the provided callback
 */
export async function getEncryptionKey(
  code: string,
  fetchSaltFromFirestore?: () => Promise<string | null>
): Promise<CryptoKey> {
  try {
    if (!code || code.length < 8) {
      throw new EncryptionError('Encryption code must be at least 8 characters');
    }
    
    let stored = localStorage.getItem(STORAGE_KEY);
    let saltBase64: string | null = null;
    let saltSource: 'localStorage' | 'firestore' | null = null;
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        saltBase64 = parsed.salt;
        saltSource = 'localStorage';
      } catch (parseError) {
        console.warn('Failed to parse encryption data from localStorage:', parseError);
        // Continue to try Firestore
      }
    }
    
    // If salt not in localStorage, try fetching from Firestore (for cross-browser compatibility)
    if (!saltBase64 && fetchSaltFromFirestore) {
      try {
        saltBase64 = await fetchSaltFromFirestore();
        if (saltBase64) {
          saltSource = 'firestore';
          // Store in localStorage for future use
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
              salt: saltBase64,
              initialized: true,
            }));
          } catch (storageError) {
            console.warn('Failed to store salt in localStorage:', storageError);
            // Continue anyway - we have the salt from Firestore
          }
        }
      } catch (firestoreError) {
        console.warn('Failed to fetch salt from Firestore:', firestoreError);
        // Continue to throw error below
      }
    }
    
    if (!saltBase64) {
      throw new EncryptionError(
        'Encryption not initialized. Salt not found in localStorage or Firestore. ' +
        'Please enable encryption in settings or ensure you\'re using the correct encryption code.'
      );
    }

    // Validate salt format
    let saltBuffer: ArrayBuffer;
    let salt: Uint8Array;
    try {
      saltBuffer = base64ToArrayBuffer(saltBase64);
      salt = new Uint8Array(saltBuffer);
      if (salt.length !== 16) {
        throw new EncryptionError(`Invalid salt length. Expected 16 bytes, got ${salt.length}. Salt source: ${saltSource}`);
      }
    } catch (saltError) {
      throw new EncryptionError(
        `Invalid salt format. Salt source: ${saltSource}. ` +
        'This may indicate the encryption salt in Firestore is corrupted or doesn\'t match the original salt.',
        saltError as Error
      );
    }
    
    return await deriveKey(code, salt);
  } catch (error) {
    if (error instanceof EncryptionError) {
      throw error;
    }
    throw new EncryptionError('Failed to get encryption key. Please verify your encryption code is correct.', error as Error);
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
 * Get salt from localStorage (for diagnostics/repair)
 */
export function getSaltFromLocalStorage(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored);
    return data.salt || null;
  } catch {
    return null;
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
  // Ensure uppercase format for consistency
  return code.toUpperCase();
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
 * 
 * SECURITY NOTE: Currently uses unsalted SHA-256. This is acceptable because:
 * - Recovery codes are randomly generated (not user-chosen)
 * - Large search space (28^12 ≈ 1.3 × 10^17 combinations)
 * - Rate limiting (30 attempts max)
 * - However, salted PBKDF2 would be more secure against offline brute force
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
