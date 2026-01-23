/**
 * Encryption helpers for document-level encryption/decryption
 * Maps which fields to encrypt for each document type
 */

import type {
  Income,
  Expense,
  Budget,
  Loan,
  Repayment,
  Debt,
  RecurringTransaction,
  SharedExpense,
  User,
} from '@/lib/types';
import { encryptValue, decryptValue, EncryptionError } from './encryption';

type CryptoKey = globalThis.CryptoKey;

/**
 * Field mappings for what to encrypt per document type
 */
const ENCRYPTION_FIELD_MAPS: Record<string, string[]> = {
  Income: ['amount', 'description'],
  Expense: ['amount', 'description'],
  Budget: ['amount'],
  Loan: ['initialAmount', 'amountRemaining', 'interestRate', 'lender'],
  Repayment: ['amount', 'notes'],
  Debt: ['amount', 'description', 'fromUserName', 'toUserName'],
  RecurringTransaction: ['amount', 'description'],
  SharedExpense: ['amount', 'description', 'splits'],
  User: [],
};

/**
 * Check if a value is encrypted (has the format "ivBase64:encryptedBase64")
 * Both parts must be valid base64 strings
 */
export function isEncrypted(value: any): boolean {
  if (typeof value !== 'string') return false;
  
  const parts = value.split(':');
  if (parts.length !== 2) return false;
  
  const [ivPart, encryptedPart] = parts;
  
  // Both parts must be non-empty
  if (!ivPart || !encryptedPart) return false;
  
  // Base64 strings contain only A-Z, a-z, 0-9, +, /, and = (for padding)
  // They also tend to be longer than typical user input
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  
  // Check if both parts look like base64
  // IV is typically 12 bytes = 16 base64 characters (with padding)
  // Encrypted data is longer, typically 20+ base64 characters
  const isValidBase64 = base64Regex.test(ivPart) && base64Regex.test(encryptedPart);
  const hasReasonableLength = ivPart.length >= 16 && encryptedPart.length >= 20;
  
  return isValidBase64 && hasReasonableLength;
}

/**
 * Encrypt a document's sensitive fields
 */
export async function encryptDocument<T extends Record<string, any>>(
  doc: T,
  docType: string,
  encryptionKey: CryptoKey
): Promise<T> {
  const fieldsToEncrypt = ENCRYPTION_FIELD_MAPS[docType];
  if (!fieldsToEncrypt || fieldsToEncrypt.length === 0) {
    return doc; // No fields to encrypt
  }
  
  const encrypted: Record<string, any> = { ...doc };
  
  for (const field of fieldsToEncrypt) {
    if (field in encrypted && encrypted[field] !== undefined && encrypted[field] !== null) {
      const value = encrypted[field];
      
      // Skip if already encrypted (prevents double encryption)
      // CRITICAL: Check this BEFORE type checking to avoid encrypting already-encrypted strings
      if (typeof value === 'string' && isEncrypted(value)) {
        continue; // Already encrypted, skip
      }
      
      // Handle nested objects
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Encrypt the entire object as JSON string
        const jsonString = JSON.stringify(value);
        encrypted[field] = await encryptValue(jsonString, encryptionKey);
      } else if (Array.isArray(value)) {
        // Handle arrays (like splits)
        if (field === 'splits' && Array.isArray(value)) {
          // Encrypt splits array - encrypt amount in each split
          encrypted[field] = await Promise.all(
            value.map(async (split: any) => {
              if (split.amount !== undefined && split.amount !== null) {
                // Skip if already encrypted
                if (typeof split.amount === 'string' && isEncrypted(split.amount)) {
                  return split;
                }
                // Encrypt the amount (converts number to string and encrypts)
                return {
                  ...split,
                  amount: await encryptValue(split.amount, encryptionKey),
                };
              }
              return split;
            })
          );
        } else {
          // For other arrays, encrypt as JSON
          const jsonString = JSON.stringify(value);
          encrypted[field] = await encryptValue(jsonString, encryptionKey);
        }
      } else {
        // Handle primitive values (string, number)
        // CRITICAL: Always encrypt numbers - they need to become encrypted strings
        // This handles the case where amount is stored as a number (unencrypted)
        encrypted[field] = await encryptValue(value, encryptionKey);
      }
    }
    // Note: If field is missing (not in encrypted), we don't add it
    // Missing fields are handled by hasEncryptedFields returning false
  }
  
  return encrypted as unknown as T;
}

/**
 * Decrypt a document's sensitive fields
 */
export async function decryptDocument<T extends Record<string, any>>(
  doc: T,
  docType: string,
  encryptionKey: CryptoKey
): Promise<T> {
  const fieldsToEncrypt = ENCRYPTION_FIELD_MAPS[docType];
  if (!fieldsToEncrypt || fieldsToEncrypt.length === 0) {
    return doc; // No fields to decrypt
  }
  
  const decrypted: Record<string, any> = { ...doc };
  
  for (const field of fieldsToEncrypt) {
    if (field in decrypted && decrypted[field] !== undefined && decrypted[field] !== null) {
      const value = decrypted[field];
      
      // Skip if not encrypted (allows mixed encrypted/unencrypted data during migration)
      if (!isEncrypted(value)) {
        continue;
      }
      
      try {
        const decryptedValue = await decryptValue(value, encryptionKey);
        
        // Try to parse as JSON for objects/arrays
        if (field === 'splits' && typeof value === 'string') {
          try {
            decrypted[field] = JSON.parse(decryptedValue);
          } catch {
            // If JSON parse fails, use as string
            decrypted[field] = decryptedValue;
          }
        } else if (field === 'splits' && Array.isArray(value)) {
          // Decrypt splits array
          decrypted[field] = await Promise.all(
            value.map(async (split: any) => {
              if (split.amount && isEncrypted(split.amount)) {
                const decryptedAmount = await decryptValue(split.amount, encryptionKey);
                return {
                  ...split,
                  amount: parseFloat(decryptedAmount) || 0,
                };
              }
              return split;
            })
          );
        } else {
          // For numbers, try to parse
          if (field === 'amount' || field === 'initialAmount' || field === 'amountRemaining' || 
              field === 'interestRate') {
            const numValue = parseFloat(decryptedValue);
            decrypted[field] = isNaN(numValue) ? decryptedValue : numValue;
          } else {
            decrypted[field] = decryptedValue;
          }
        }
      } catch (error) {
        // If decryption fails, log error with more context but don't throw (allows graceful degradation)
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to decrypt field ${field} in ${docType}:`, {
          error: errorMessage,
          field,
          docType,
          docId: doc.id || 'unknown',
          hint: 'This may indicate the encryption code is incorrect or the salt doesn\'t match. Please verify your encryption code.',
        });
        // Keep encrypted value to allow retry when correct key is provided
        // Don't modify the field - leave it encrypted
      }
    }
  }
  
  return decrypted as unknown as T;
}

/**
 * Detect document type from document data
 */
export function detectDocumentType(doc: Record<string, any>, collectionPath: string): string {
  // Check collection path first - this is the primary method since type field is deprecated
  // Collection paths are like: "users/{userId}/incomes" or "users/{userId}/expenses"
  // Document paths are like: "users/{userId}/incomes/{docId}" or "users/{userId}/expenses/{docId}"
  
  // Normalize path for easier matching (remove leading/trailing slashes if any)
  const normalizedPath = collectionPath.trim().replace(/^\/+|\/+$/g, '');
  
  // Check for each collection type (order matters - check more specific paths first)
  // Handle top-level collections and subcollections
  if (normalizedPath.includes('/incomes') || normalizedPath === 'incomes') return 'Income';
  if (normalizedPath.includes('/expenses') || normalizedPath === 'expenses') return 'Expense';
  if (normalizedPath.includes('/repayments') || normalizedPath === 'repayments') return 'Repayment';
  if (normalizedPath.includes('/loans') || normalizedPath === 'loans') return 'Loan';
  if (normalizedPath.includes('/budgets') || normalizedPath === 'budgets') return 'Budget';
  if (normalizedPath.includes('/recurringTransactions') || normalizedPath === 'recurringTransactions') return 'RecurringTransaction';
  if (normalizedPath.includes('/sharedExpenses') || normalizedPath === 'sharedExpenses') return 'SharedExpense';
  if (normalizedPath.includes('/debts') || normalizedPath === 'debts') return 'Debt';
  
  // User document: path is exactly "users/{userId}" (no subcollections)
  // Check if path matches pattern: users/{userId} (exactly 2 segments)
  const pathSegments = normalizedPath.split('/').filter(s => s.length > 0);
  if (pathSegments.length === 2 && pathSegments[0] === 'users') return 'User';
  
  // Fallback: check document structure (for backwards compatibility with old data that has type field)
  // This should rarely be needed since we rely on collection path
  if ('type' in doc && ('amount' in doc || 'description' in doc)) {
    if (doc.type === 'income') return 'Income';
    if (doc.type === 'expense') return 'Expense';
  }
  if ('month' in doc && 'amount' in doc) return 'Budget';
  if ('lender' in doc && 'initialAmount' in doc) return 'Loan';
  if ('loanId' in doc && 'amount' in doc) return 'Repayment';
  if ('fromUserId' in doc && 'toUserId' in doc) return 'Debt';
  if ('frequency' in doc && 'nextDueDate' in doc) return 'RecurringTransaction';
  if ('groupId' in doc && 'splits' in doc) return 'SharedExpense';
  if ('email' in doc && 'isEncrypted' in doc) return 'User';
  
  return 'Unknown';
}

/**
 * Check if document has encrypted fields
 * Returns true only if ALL fields that should be encrypted are actually encrypted
 * This prevents partial encryption issues where some fields are encrypted but others aren't
 */
export function hasEncryptedFields(doc: Record<string, any>, docType: string): boolean {
  const fieldsToEncrypt = ENCRYPTION_FIELD_MAPS[docType];
  if (!fieldsToEncrypt || fieldsToEncrypt.length === 0) return false;
  
  // Check that ALL fields that should be encrypted are actually encrypted
  // We use every() instead of some() to ensure complete encryption
  const fieldChecks: Record<string, boolean> = {};
  
  // CRITICAL FIX: We need to check if fields exist AND are encrypted
  // A field that doesn't exist is NOT encrypted - it just doesn't exist
  // Only return true if ALL required fields exist AND are encrypted
  
  const allFieldsEncrypted = fieldsToEncrypt.every(field => {
    const value = doc[field];
    
    // CRITICAL: If field is missing/null/undefined, it's NOT encrypted
    // We can't encrypt something that doesn't exist
    // Return false to indicate this field needs encryption (if it existed)
    if (value === undefined || value === null) {
      fieldChecks[field] = false; // Field doesn't exist = NOT encrypted
      return false; // This will make every() return false
    }
    
    // CRITICAL: Numbers are NEVER encrypted (they're stored as numbers, not strings)
    // If amount is a number, it's definitely not encrypted
    if (typeof value === 'number') {
      fieldChecks[field] = false; // Number field exists but is not encrypted
      return false;
    }
    
    // Handle arrays (like splits)
    if (Array.isArray(value)) {
      // For splits array, check if ALL amounts are encrypted
      if (field === 'splits') {
        if (value.length === 0) {
          // Empty splits array - nothing to encrypt, so consider it "encrypted"
          fieldChecks[field] = true;
          return true;
        }
        // All splits must have encrypted amounts
        const allSplitsEncrypted = value.every((split: any) => {
          if (split.amount === undefined || split.amount === null) return true; // No amount to encrypt
          if (typeof split.amount === 'number') return false; // Number is not encrypted
          return typeof split.amount === 'string' && isEncrypted(split.amount);
        });
        fieldChecks[field] = allSplitsEncrypted;
        return allSplitsEncrypted;
      }
      // For other arrays, check if the array itself is encrypted (as JSON string)
      // Arrays are never encrypted directly - they're encrypted as JSON strings
      fieldChecks[field] = false; // Arrays themselves are not encrypted strings
      return false;
    }
    
    // Handle objects
    if (typeof value === 'object' && value !== null) {
      // Objects are encrypted as JSON strings, so the value itself would be a string
      // If it's still an object, it's not encrypted
      fieldChecks[field] = false;
      return false;
    }
    
    // Handle primitives - only strings can be encrypted
    if (typeof value !== 'string') {
      fieldChecks[field] = false; // Non-string primitive cannot be encrypted
      return false;
    }
    
    const encrypted = isEncrypted(value);
    fieldChecks[field] = encrypted;
    return encrypted;
  });
  
  // Diagnostic logging for debugging (only log first few times to avoid spam)
  if (typeof window !== 'undefined' && (window as any).__ENCRYPTION_DEBUG__) {
    console.log(`[hasEncryptedFields] docType=${docType}, result=${allFieldsEncrypted}`, {
      fieldsToEncrypt,
      fieldChecks,
      sampleValues: fieldsToEncrypt.reduce((acc, f) => {
        acc[f] = doc[f] !== undefined ? (typeof doc[f] === 'string' ? doc[f].substring(0, 30) : doc[f]) : 'undefined';
        return acc;
      }, {} as Record<string, any>),
    });
  }
  
  return allFieldsEncrypted;
}
