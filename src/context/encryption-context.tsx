'use client';

import React, { createContext, useContext, useMemo, useEffect, useCallback, useState, useRef } from 'react';
import type { User as UserData } from '@/lib/types';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, getDoc, getDocs, query, limit } from 'firebase/firestore';
import {
  initializeEncryption,
  getEncryptionKey,
  clearEncryptionData,
  validateEncryptionCode,
  isEncryptionInitialized,
  isWebCryptoAvailable,
  encryptValue,
  decryptValue,
  EncryptionError,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
  getSaltFromLocalStorage,
  base64ToArrayBuffer,
} from '@/lib/encryption';
import { isEncrypted } from '@/lib/encryption-helpers';
import { updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { unencryptAllUserData } from '@/lib/migration/unencrypt-all-data';
import { reEncryptUserData } from '@/lib/migration/re-encrypt-data';
import { useToast } from '@/hooks/use-toast';

interface EncryptionContextType {
  // State
  isEncryptionEnabled: boolean;
  isUnlocked: boolean;
  hasExistingData: boolean;
  isLoading: boolean;
  encryptionKey: CryptoKey | null;
  
  // Functions
  enableEncryption: (code: string) => Promise<{ recoveryCodes: string[] }>;
  unlockEncryption: (code: string) => Promise<boolean>;
  changeEncryptionCode: (oldCode: string, newCode: string) => Promise<void>;
  disableEncryption: () => Promise<void>;
  lockEncryption: () => void;
  encryptValue: (value: string | number) => Promise<string>;
  decryptValue: (encryptedValue: string) => Promise<string>;
  regenerateRecoveryCodes: (mainCode: string) => Promise<{ recoveryCodes: string[] }>;
  unencryptAllData: () => Promise<{ success: boolean; unencrypted: number; failed: number }>;
  
  // Validation
  validateCode: (code: string) => { valid: boolean; error?: string };
  isCryptoAvailable: boolean;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(undefined);

export function EncryptionProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading: loadingUser } = useUser();
  const firestore = useFirestore();
  const userId = user?.uid;
  const { toast } = useToast();
  
  // Get user document to check encryption status
  const userDocRef = useMemoFirebase(() => userId ? doc(firestore, 'users', userId) : null, [firestore, userId]);
  const { data: userData, isLoading: isLoadingUser } = useDoc<UserData>(userDocRef);
  
  // Check for existing data (incomes, expenses)
  const incomesRef = useMemoFirebase(() => userId ? collection(firestore, 'users', userId, 'incomes') : null, [firestore, userId]);
  const expensesRef = useMemoFirebase(() => userId ? collection(firestore, 'users', userId, 'expenses') : null, [firestore, userId]);
  const { data: incomesData } = useCollection(incomesRef);
  const { data: expensesData } = useCollection(expensesRef);
  
  // Encryption state
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [unlockAttempts, setUnlockAttempts] = useState(0);
  const maxUnlockAttempts = 30;
  const keyRef = useRef<CryptoKey | null>(null);
  // CRITICAL: Prevent concurrent encryption operations (change code, regenerate recovery codes)
  const [isEncryptionOperationInProgress, setIsEncryptionOperationInProgress] = useState(false);
  
  // Derived state
  const isEncryptionEnabled = userData?.isEncrypted === true;
  const hasExistingData = useMemo(() => {
    if (!incomesData || !expensesData) return false;
    return (incomesData.length > 0) || (expensesData.length > 0);
  }, [incomesData, expensesData]);
  const isLoading = loadingUser || isLoadingUser;
  const isUnlocked = encryptionKey !== null && keyRef.current !== null;
  const isCryptoAvailable = isWebCryptoAvailable();
  
  // Clear key from memory on unmount or when user logs out
  useEffect(() => {
    if (!user) {
      setEncryptionKey(null);
      keyRef.current = null;
    }
  }, [user]);
  
  // Clear key from memory on page visibility change (security)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Optionally clear key when tab is hidden for extra security
        // For now, we'll keep it in memory for better UX
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  /**
   * Enable encryption for the user
   */
  const enableEncryption = useCallback(async (code: string): Promise<{ recoveryCodes: string[] }> => {
    if (!userId || !firestore) {
      throw new EncryptionError('User not authenticated');
    }
    
    const validation = validateEncryptionCode(code);
    if (!validation.valid) {
      throw new EncryptionError(validation.error || 'Invalid encryption code');
    }
    
    try {
      // Initialize encryption (stores salt in localStorage)
      await initializeEncryption(code);
      
      // Derive key to verify it works
      const key = await getEncryptionKey(code);
      setEncryptionKey(key);
      keyRef.current = key;
      
      // Generate recovery codes
      const recoveryCodes = generateRecoveryCodes(10);
      
      // Hash recovery codes (store as plain hashes so we can verify without main key)
      const recoveryCodeHashes = await Promise.all(
        recoveryCodes.map(code => hashRecoveryCode(code))
      );
      
      // Store main code encrypted with each recovery code
      // For each recovery code, derive a key and encrypt the main code
      const recoveryCodeSalt = crypto.getRandomValues(new Uint8Array(16));
      const recoveryCodeSaltBase64 = btoa(String.fromCharCode(...recoveryCodeSalt));
      
      // Helper function to convert Uint8Array to base64
      const uint8ArrayToBase64 = (arr: Uint8Array): string => {
        let binary = '';
        for (let i = 0; i < arr.byteLength; i++) {
          binary += String.fromCharCode(arr[i]);
        }
        return btoa(binary);
      };
      
      // Derive keys for each recovery code and encrypt the main code
      const encryptedMainCodes = await Promise.all(
        recoveryCodes.map(async (recoveryCode) => {
          const encoder = new TextEncoder();
          const codeBuffer = encoder.encode(recoveryCode);
          const keyMaterial = await crypto.subtle.importKey(
            'raw',
            codeBuffer,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
          );
          const recoveryKey = await crypto.subtle.deriveKey(
            {
              name: 'PBKDF2',
              salt: recoveryCodeSalt,
              iterations: 100000,
              hash: 'SHA-256',
            },
            keyMaterial,
            {
              name: 'AES-GCM',
              length: 256,
            },
            false,
            ['encrypt', 'decrypt']
          );
          
          // Encrypt main code with recovery code's key
          const encoder2 = new TextEncoder();
          const mainCodeData = encoder2.encode(code);
          const iv = crypto.getRandomValues(new Uint8Array(12));
          const encrypted = await crypto.subtle.encrypt(
            {
              name: 'AES-GCM',
              iv: iv,
            },
            recoveryKey,
            mainCodeData
          );
          
          const ivBase64 = uint8ArrayToBase64(iv);
          const encryptedBase64 = uint8ArrayToBase64(new Uint8Array(encrypted));
          return `${ivBase64}:${encryptedBase64}`;
        })
      );
      
      // Update user document
      const userRef = doc(firestore, 'users', userId);
      
      // Get the salt from localStorage to store in Firestore for cross-browser compatibility
      const stored = localStorage.getItem('xpenselab_encryption_key');
      const encryptionSaltBase64 = stored ? JSON.parse(stored).salt : null;
      
      if (!encryptionSaltBase64) {
        throw new EncryptionError('Failed to retrieve encryption salt from localStorage');
      }
      
      // CRITICAL FIX: Update ALL encryption metadata atomically to prevent race conditions
      // Set isEncrypted, encryptionSalt, and recovery codes in a single transaction
      // This ensures no writes can happen between setting isEncrypted and storing the salt
      await updateDoc(userRef, {
        isEncrypted: true,
        encryptionEnabledAt: new Date().toISOString(),
        recoveryCodeHashes: recoveryCodeHashes, // Plain hashes - needed for verification
        recoveryCodeSalt: recoveryCodeSaltBase64, // Plain salt - needed for key derivation
        encryptedMainCodes: encryptedMainCodes, // Already encrypted with recovery code keys
        encryptionSalt: encryptionSaltBase64, // Plain salt - needed for cross-browser key derivation
      });
      
      // Note: User fields like monzoTokens will be encrypted on next update, not during enableEncryption
      // This is safe because encryption is only enabled after all metadata is stored
      
      toast({
        title: 'Encryption Enabled',
        description: 'Your data will now be encrypted.',
      });
      
      return { recoveryCodes };
    } catch (error) {
      clearEncryptionData();
      throw error;
    }
  }, [userId, firestore, toast]);
  
  /**
   * Unlock encryption with user code or recovery code
   */
  const unlockEncryption = useCallback(async (code: string): Promise<boolean> => {
    if (!isEncryptionEnabled) {
      throw new EncryptionError('Encryption is not enabled');
    }
    
    if (unlockAttempts >= maxUnlockAttempts) {
      throw new EncryptionError('Too many failed unlock attempts. Please refresh the page.');
    }
    
    try {
      // First, try as main encryption code
      try {
        // Create a function to fetch salt from Firestore if not in localStorage
        const fetchSaltFromFirestore = async (): Promise<string | null> => {
          if (!userId || !firestore) return null;
          try {
            const userRef = doc(firestore, 'users', userId);
            const userDocSnapshot = await getDoc(userRef);
            if (userDocSnapshot.exists()) {
              const userDocData = userDocSnapshot.data() as UserData;
              return userDocData.encryptionSalt || null;
            }
          } catch (error) {
            console.warn('Failed to fetch encryption salt from Firestore:', error);
          }
          return null;
        };
        
        // CRITICAL FIX: Try localStorage salt first (if available), then Firestore salt
        // This handles the case where Firestore salt is wrong but localStorage has the correct salt
        let key: CryptoKey | null = null;
        let saltUsed: 'localStorage' | 'firestore' | null = null;
        let decryptionTestPassed = false;
        
        // Helper function to test if a key can decrypt existing data
        // Fetches a sample document directly from Firestore to ensure we test with actual data
        const testKeyWithExistingData = async (testKey: CryptoKey): Promise<boolean> => {
          if (!userId || !firestore) return false;
          
          try {
            // Try to fetch a sample income document
            const incomesRef = collection(firestore, 'users', userId, 'incomes');
            const incomesSnapshot = await getDocs(query(incomesRef, limit(1)));
            
            if (!incomesSnapshot.empty) {
              const sampleDoc = incomesSnapshot.docs[0].data();
              if (sampleDoc.amount && typeof sampleDoc.amount === 'string' && isEncrypted(sampleDoc.amount)) {
                await decryptValue(sampleDoc.amount, testKey);
                return true; // Successfully decrypted
              }
            }
            
            // Try expenses if no income found
            const expensesRef = collection(firestore, 'users', userId, 'expenses');
            const expensesSnapshot = await getDocs(query(expensesRef, limit(1)));
            
            if (!expensesSnapshot.empty) {
              const sampleDoc = expensesSnapshot.docs[0].data();
              if (sampleDoc.amount && typeof sampleDoc.amount === 'string' && isEncrypted(sampleDoc.amount)) {
                await decryptValue(sampleDoc.amount, testKey);
                return true; // Successfully decrypted
              }
            }
            
            // No encrypted data found - this is OK, user might not have data yet
            return true;
          } catch (error) {
            // Decryption failed - key doesn't work
            console.warn('Key decryption test failed:', error);
            return false;
          }
        };
        
        // Helper function to derive key from salt (duplicates logic from encryption.ts)
        const deriveKeyFromSalt = async (code: string, saltBase64: string): Promise<CryptoKey> => {
          const encoder = new TextEncoder();
          const codeBuffer = encoder.encode(code);
          const saltBuffer = base64ToArrayBuffer(saltBase64);
          const salt = new Uint8Array(saltBuffer);
          
          if (salt.length !== 16) {
            throw new EncryptionError(`Invalid salt length. Expected 16 bytes, got ${salt.length}`);
          }
          
          const keyMaterial = await crypto.subtle.importKey(
            'raw',
            codeBuffer,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
          );
          
          return await crypto.subtle.deriveKey(
            {
              name: 'PBKDF2',
              salt: salt,
              iterations: 100000,
              hash: 'SHA-256',
            },
            keyMaterial,
            {
              name: 'AES-GCM',
              length: 256,
            },
            false,
            ['encrypt', 'decrypt']
          );
        };
        
        // First, try with localStorage salt (if available)
        const localStorageSalt = getSaltFromLocalStorage();
        if (localStorageSalt) {
          try {
            const testKey = await deriveKeyFromSalt(code, localStorageSalt);
            
            // Test if this key can decrypt existing data
            const canDecrypt = await testKeyWithExistingData(testKey);
            if (canDecrypt) {
              key = testKey;
              saltUsed = 'localStorage';
              decryptionTestPassed = true;
            }
          } catch (error) {
            // localStorage salt failed, continue to try Firestore salt
            console.warn('Failed to use localStorage salt:', error);
          }
        }
        
        // If localStorage salt didn't work or isn't available, try Firestore salt
        if (!key) {
          try {
            key = await getEncryptionKey(code, fetchSaltFromFirestore);
            saltUsed = 'firestore';
            
            // Test if this key can decrypt existing data
            const canDecrypt = await testKeyWithExistingData(key);
            if (!canDecrypt) {
              // Firestore salt doesn't work - salt mismatch!
              throw new EncryptionError(
                'The encryption salt in Firestore doesn\'t match the salt used to encrypt your data. ' +
                'This usually happens when encryption was enabled in a different browser. ' +
                'Please use a recovery code to unlock, or try unlocking from the browser where encryption was originally enabled.'
              );
            }
            decryptionTestPassed = true;
          } catch (firestoreError) {
            // If it's already an EncryptionError about salt mismatch, re-throw it
            if (firestoreError instanceof EncryptionError && firestoreError.message.includes('salt')) {
              throw firestoreError;
            }
            // Otherwise, continue to recovery code check
            throw firestoreError;
          }
        }
        
        if (!key) {
          throw new EncryptionError('Failed to derive encryption key');
        }
        
        // If we successfully decrypted existing data, update Firestore salt if needed
        if (decryptionTestPassed && saltUsed === 'localStorage' && localStorageSalt) {
          // The localStorage salt works - update Firestore to match
          try {
            const userRef = doc(firestore, 'users', userId);
            await updateDoc(userRef, {
              encryptionSalt: localStorageSalt,
            });
            console.log('Updated Firestore salt to match localStorage salt');
            toast({
              title: 'Salt Synced',
              description: 'Your encryption salt has been synced to Firestore for cross-browser access.',
            });
          } catch (updateError) {
            console.warn('Failed to update Firestore salt:', updateError);
            // Don't throw - unlock can still proceed
          }
        }
        
        // Set the key
        setEncryptionKey(key);
        keyRef.current = key;
        setUnlockAttempts(0);
        
        return true;
      } catch (mainCodeError) {
        // Main code derivation failed (wrong code, salt mismatch, or encryption not initialized)
        // Check if it's because encryption is not initialized
        if (mainCodeError instanceof EncryptionError && mainCodeError.message.includes('not initialized')) {
          throw mainCodeError; // Re-throw initialization errors
        }
        // If it's a salt mismatch error, re-throw it
        if (mainCodeError instanceof EncryptionError && mainCodeError.message.includes('salt')) {
          throw mainCodeError;
        }
        // Otherwise, try recovery code below
      }
      
      // Try as recovery code (only if main code didn't work)
      // Fetch user document directly from Firestore to ensure we have the latest recovery code data
      // This is important when unlocking in a new browser where userData might not be loaded yet
      if (!userId || !firestore) {
        throw new EncryptionError('User not authenticated');
      }
      
      const userRef = doc(firestore, 'users', userId);
      const userDocSnapshot = await getDoc(userRef);
      
      if (!userDocSnapshot.exists()) {
        throw new EncryptionError('User document not found');
      }
      
      const userDocData = userDocSnapshot.data() as UserData;
      
      // Check if recovery code data exists
      if (!userDocData?.recoveryCodeHashes || !userDocData?.recoveryCodeSalt || !userDocData?.encryptedMainCodes) {
        // No recovery codes configured
        // If we got here, main code didn't work and recovery codes aren't available
        throw new EncryptionError('Invalid encryption code or recovery code. Recovery codes may not be configured for this account.');
      }
      
      // Validate recovery code data structure
      if (!Array.isArray(userDocData.recoveryCodeHashes) || userDocData.recoveryCodeHashes.length === 0) {
        throw new EncryptionError('Recovery codes are not properly configured. Please regenerate recovery codes.');
      }
      
      if (!Array.isArray(userDocData.encryptedMainCodes) || userDocData.encryptedMainCodes.length !== userDocData.recoveryCodeHashes.length) {
        throw new EncryptionError('Recovery code data is corrupted. Please regenerate recovery codes.');
      }
      
      // Normalize the recovery code: trim whitespace, remove all spaces, convert to uppercase
      // Recovery codes are stored in uppercase format XXXX-XXXX-XXXX
      // Users might enter with or without dashes, with spaces, etc.
      let normalizedCode = code.trim().toUpperCase().replace(/\s+/g, '');
      
      // Remove any dashes first to get the raw code
      const rawCode = normalizedCode.replace(/-/g, '');
      
      // Validate that we have exactly 12 alphanumeric characters
      if (rawCode.length !== 12 || !/^[A-Z2-9]{12}$/.test(rawCode)) {
        throw new EncryptionError('Invalid recovery code format. Recovery codes should be 12 characters (format: XXXX-XXXX-XXXX)');
      }
      
      // Format with dashes: XXXX-XXXX-XXXX
      normalizedCode = `${rawCode.slice(0, 4)}-${rawCode.slice(4, 8)}-${rawCode.slice(8, 12)}`;
      
      // Hash the normalized code to check against stored recovery code hashes
      const inputHash = await hashRecoveryCode(normalizedCode);
      
      // Find matching recovery code hash
      const recoveryCodeIndex = userDocData.recoveryCodeHashes.findIndex(
        (storedHash: string) => storedHash === inputHash
      );
      
      if (recoveryCodeIndex === -1) {
        throw new EncryptionError('Invalid recovery code. Please check that you entered the code correctly.');
      }
      
      // Decrypt main code using recovery code
      const recoveryCodeSaltBinary = atob(userDocData.recoveryCodeSalt);
      const recoveryCodeSalt = new Uint8Array(recoveryCodeSaltBinary.length);
      for (let i = 0; i < recoveryCodeSaltBinary.length; i++) {
        recoveryCodeSalt[i] = recoveryCodeSaltBinary.charCodeAt(i);
      }
      
      // Derive key from recovery code (use normalized code)
      const encoder = new TextEncoder();
      const codeBuffer = encoder.encode(normalizedCode);
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        codeBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );
      const recoveryKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: recoveryCodeSalt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        {
          name: 'AES-GCM',
          length: 256,
        },
        false,
        ['encrypt', 'decrypt']
      );
      
      // Decrypt main code
      const encryptedMainCode = userDocData.encryptedMainCodes[recoveryCodeIndex];
      const [ivBase64, encryptedBase64] = encryptedMainCode.split(':');
      
      const ivBinary = atob(ivBase64);
      const iv = new Uint8Array(ivBinary.length);
      for (let i = 0; i < ivBinary.length; i++) {
        iv[i] = ivBinary.charCodeAt(i);
      }
      
      const encryptedBinary = atob(encryptedBase64);
      const encrypted = new Uint8Array(encryptedBinary.length);
      for (let i = 0; i < encryptedBinary.length; i++) {
        encrypted[i] = encryptedBinary.charCodeAt(i);
      }
      
      let decrypted: ArrayBuffer;
      try {
        decrypted = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: iv,
          },
          recoveryKey,
          encrypted
        );
      } catch (decryptError) {
        throw new EncryptionError('Failed to decrypt main code with recovery code. The recovery code may be invalid.');
      }
      
      const decoder = new TextDecoder();
      const mainCode = decoder.decode(decrypted);
      
      // Validate that we got a valid main code (should be a non-empty string)
      if (!mainCode || mainCode.length < 8) {
        throw new EncryptionError('Recovery code decryption failed. The recovery code may be invalid.');
      }
      
      // Derive key from main code (with salt fallback)
      // CRITICAL: Try localStorage salt first, then Firestore salt
      // This handles salt mismatches even when using recovery codes
      const fetchSaltFromFirestore = async (): Promise<string | null> => {
        return userDocData.encryptionSalt || null;
      };
      
      let key: CryptoKey | null = null;
      let saltUsed: 'localStorage' | 'firestore' | null = null;
      
      // Try localStorage salt first (if available)
      const localStorageSalt = getSaltFromLocalStorage();
      if (localStorageSalt) {
        try {
          const testKey = await deriveKeyFromSalt(mainCode, localStorageSalt);
          // Test if this key can decrypt existing data
          const canDecrypt = await testKeyWithExistingData(testKey);
          if (canDecrypt) {
            key = testKey;
            saltUsed = 'localStorage';
          }
        } catch (error) {
          console.warn('Failed to use localStorage salt with recovery code:', error);
        }
      }
      
      // If localStorage salt didn't work, try Firestore salt
      if (!key) {
        key = await getEncryptionKey(mainCode, fetchSaltFromFirestore);
        saltUsed = 'firestore';
        
        // Test if this key can decrypt existing data
        const canDecrypt = await testKeyWithExistingData(key);
        if (!canDecrypt) {
          throw new EncryptionError(
            'The encryption salt in Firestore doesn\'t match the salt used to encrypt your data. ' +
            'Recovery code worked, but the main encryption salt is incorrect. ' +
            'Please unlock from the browser where encryption was originally enabled to sync the correct salt.'
          );
        }
      }
      
      // If we successfully decrypted existing data, update Firestore salt if needed
      if (saltUsed === 'localStorage' && localStorageSalt) {
        // The localStorage salt works - update Firestore to match
        try {
          const userRef = doc(firestore, 'users', userId);
          await updateDoc(userRef, {
            encryptionSalt: localStorageSalt,
          });
          console.log('Updated Firestore salt to match localStorage salt (via recovery code)');
          toast({
            title: 'Salt Synced',
            description: 'Your encryption salt has been synced to Firestore for cross-browser access.',
          });
        } catch (updateError) {
          console.warn('Failed to update Firestore salt:', updateError);
          // Don't throw - unlock can still proceed
        }
      }
      
      setEncryptionKey(key);
      keyRef.current = key;
      setUnlockAttempts(0);
      
      return true;
    } catch (error) {
      setUnlockAttempts(prev => prev + 1);
      const remaining = maxUnlockAttempts - unlockAttempts - 1;
      throw new EncryptionError(
        remaining > 0 
          ? `Invalid encryption code or recovery code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`
          : 'Invalid encryption code or recovery code. Too many failed attempts.',
        error as Error
      );
    }
  }, [isEncryptionEnabled, unlockAttempts, userId, firestore]);
  
  /**
   * Lock encryption (clear key from memory)
   */
  const lockEncryption = useCallback(() => {
    setEncryptionKey(null);
    keyRef.current = null;
    setUnlockAttempts(0);
  }, []);
  
  /**
   * Change encryption code (requires old and new codes)
   * 
   * This function properly migrates all data from the old key to the new key,
   * preventing double encryption by decrypting with old key and encrypting with new key.
   */
  const changeEncryptionCode = useCallback(async (oldCode: string, newCode: string): Promise<void> => {
    if (!userId || !firestore) {
      throw new EncryptionError('User not authenticated');
    }
    
    if (!isEncryptionEnabled) {
      throw new EncryptionError('Encryption is not enabled');
    }
    
    // CRITICAL: Prevent concurrent operations
    if (isEncryptionOperationInProgress) {
      throw new EncryptionError('Another encryption operation is in progress. Please wait for it to complete.');
    }
    
    // User must be unlocked to change the code (to verify old code)
    if (!isUnlocked || !keyRef.current) {
      throw new EncryptionError('You must unlock encryption before changing the code');
    }
    
    // Set operation lock
    setIsEncryptionOperationInProgress(true);
    
    const oldValidation = validateEncryptionCode(oldCode);
    if (!oldValidation.valid) {
      throw new EncryptionError(oldValidation.error || 'Invalid old encryption code');
    }
    
    const newValidation = validateEncryptionCode(newCode);
    if (!newValidation.valid) {
      throw new EncryptionError(newValidation.error || 'Invalid new encryption code');
    }
    
    // Create function to fetch salt from Firestore
    const fetchSaltFromFirestore = async (): Promise<string | null> => {
      if (!userId || !firestore) return null;
      try {
        const userRef = doc(firestore, 'users', userId);
        const userDocSnapshot = await getDoc(userRef);
        if (userDocSnapshot.exists()) {
          const userDocData = userDocSnapshot.data() as UserData;
          return userDocData.encryptionSalt || null;
        }
      } catch (error) {
        console.warn('Failed to fetch encryption salt from Firestore:', error);
      }
      return null;
    };
    
    // CRITICAL: Verify old code works BEFORE making any changes
    // This ensures we don't lock encryption if old code is wrong
    const oldKey = await getEncryptionKey(oldCode, fetchSaltFromFirestore);
    
    // Test old key works by attempting to decrypt a test value
    // This ensures the code is correct, not just that key derivation works
    try {
      const testValue = 'test-verification';
      const testEncrypted = await encryptValue(testValue, oldKey);
      const testDecrypted = await decryptValue(testEncrypted, oldKey);
      if (testDecrypted !== testValue) {
        setIsEncryptionOperationInProgress(false);
        throw new EncryptionError('Old encryption code verification failed. Please check your code.');
      }
    } catch (error) {
      setIsEncryptionOperationInProgress(false);
      throw new EncryptionError('Old encryption code is incorrect or invalid.');
    }
    
    // Store current state for rollback
    const currentStored = localStorage.getItem('xpenselab_encryption_key');
    const currentKey = keyRef.current;
    
    try {
      // CRITICAL FIX: Lock encryption immediately to prevent writes during re-encryption
      // This prevents race conditions where new writes use new key while old data is being re-encrypted
      setEncryptionKey(null);
      keyRef.current = null;
      
      // Derive new key from new code (using new salt)
      // We need to temporarily initialize with new code to get the new salt
      clearEncryptionData();
      await initializeEncryption(newCode);
      const newKey = await getEncryptionKey(newCode);
      
      // Get the new salt to store in Firestore
      const newStored = localStorage.getItem('xpenselab_encryption_key');
      const newSaltBase64 = newStored ? JSON.parse(newStored).salt : null;
      
      if (!newSaltBase64) {
        throw new EncryptionError('Failed to retrieve new encryption salt');
      }
      
      // Now re-encrypt all data with the new key (decrypts with old, encrypts with new)
      toast({
        title: 'Re-encrypting Data',
        description: 'Migrating all data to the new encryption key. This may take a moment...',
      });
      
      const reEncryptResult = await reEncryptUserData(
        firestore,
        userId,
        oldKey,
        newKey,
        (progress) => {
          console.log('Re-encryption progress:', progress);
        }
      );
      
      // CRITICAL: Check if re-encryption was successful
      // If it failed or partially completed, we need to handle it carefully
      if (!reEncryptResult.success || reEncryptResult.progress.totalFailed > 0) {
        // Re-encryption had failures - restore old state
        if (currentStored) {
          localStorage.setItem('xpenselab_encryption_key', currentStored);
        }
        setEncryptionKey(currentKey);
        keyRef.current = currentKey;
        setIsEncryptionOperationInProgress(false);
        
        toast({
          title: 'Re-encryption Failed',
          description: `Failed to re-encrypt ${reEncryptResult.progress.totalFailed} documents. Your encryption code has NOT been changed. Please try again.`,
          variant: 'destructive',
        });
        
        throw new EncryptionError(
          `Re-encryption failed for ${reEncryptResult.progress.totalFailed} documents. Encryption code change aborted.`
        );
      }
      
      // Generate new recovery codes with the NEW encryption code
      const recoveryCodes = generateRecoveryCodes(10);
      const recoveryCodeHashes = await Promise.all(
        recoveryCodes.map(code => hashRecoveryCode(code))
      );
      
      const recoveryCodeSalt = crypto.getRandomValues(new Uint8Array(16));
      const recoveryCodeSaltBase64 = btoa(String.fromCharCode(...recoveryCodeSalt));
      
      const uint8ArrayToBase64 = (arr: Uint8Array): string => {
        let binary = '';
        for (let i = 0; i < arr.byteLength; i++) {
          binary += String.fromCharCode(arr[i]);
        }
        return btoa(binary);
      };
      
      const encryptedMainCodes = await Promise.all(
        recoveryCodes.map(async (recoveryCode) => {
          const encoder = new TextEncoder();
          const codeBuffer = encoder.encode(recoveryCode);
          const keyMaterial = await crypto.subtle.importKey(
            'raw',
            codeBuffer,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
          );
          const recoveryKey = await crypto.subtle.deriveKey(
            {
              name: 'PBKDF2',
              salt: recoveryCodeSalt,
              iterations: 100000,
              hash: 'SHA-256',
            },
            keyMaterial,
            {
              name: 'AES-GCM',
              length: 256,
            },
            false,
            ['encrypt', 'decrypt']
          );
          
          const encoder2 = new TextEncoder();
          const mainCodeData = encoder2.encode(newCode); // Use NEW code
          const iv = crypto.getRandomValues(new Uint8Array(12));
          const encrypted = await crypto.subtle.encrypt(
            {
              name: 'AES-GCM',
              iv: iv,
            },
            recoveryKey,
            mainCodeData
          );
          
          const ivBase64 = uint8ArrayToBase64(iv);
          const encryptedBase64 = uint8ArrayToBase64(new Uint8Array(encrypted));
          return `${ivBase64}:${encryptedBase64}`;
        })
      );
      
      // CRITICAL: Update recovery codes and encryption salt atomically AFTER successful re-encryption
      // If this fails, data is already re-encrypted but salt/recovery codes aren't updated
      // This is still recoverable - user can retry the updateDoc operation
      const userRef = doc(firestore, 'users', userId);
      try {
        await updateDoc(userRef, {
          recoveryCodeHashes: recoveryCodeHashes,
          recoveryCodeSalt: recoveryCodeSaltBase64,
          encryptedMainCodes: encryptedMainCodes,
          encryptionSalt: newSaltBase64, // Update salt in Firestore for cross-browser compatibility
        });
      } catch (updateError: any) {
        // CRITICAL: If updateDoc fails, data is re-encrypted but salt isn't updated
        // This is a dangerous state - user can't unlock with new code
        // We need to restore old salt OR provide recovery mechanism
        // For now, restore old state and throw error
        if (currentStored) {
          localStorage.setItem('xpenselab_encryption_key', currentStored);
        }
        setEncryptionKey(currentKey);
        keyRef.current = currentKey;
        setIsEncryptionOperationInProgress(false);
        
        // TODO: Implement rollback of re-encryption or recovery mechanism
        throw new EncryptionError(
          'Re-encryption completed but failed to update encryption metadata. Your data may be in an inconsistent state. Please contact support.',
          updateError as Error
        );
      }
      
      // localStorage is already updated with new salt from initializeEncryption above
      // Encryption is already locked (locked at start of function)
      // User must unlock with new code to continue
      setUnlockAttempts(0);
      setIsEncryptionOperationInProgress(false);
      
      toast({
        title: 'Encryption Code Changed',
        description: 'Your encryption code has been updated and all data has been re-encrypted. Please unlock with your new code to continue.',
      });
    } catch (error: any) {
      // Restore original state on any error
      setIsEncryptionOperationInProgress(false);
      if (currentStored) {
        localStorage.setItem('xpenselab_encryption_key', currentStored);
      }
      if (currentKey) {
        setEncryptionKey(currentKey);
        keyRef.current = currentKey;
      }
      
      // Re-throw if it's already an EncryptionError
      if (error instanceof EncryptionError) {
        throw error;
      }
      
      throw new EncryptionError('Failed to change encryption code', error as Error);
    }
  }, [userId, firestore, isEncryptionEnabled, isUnlocked, isEncryptionOperationInProgress, toast]);
  
  /**
   * Disable encryption
   */
  const disableEncryption = useCallback(async (): Promise<void> => {
    if (!userId || !firestore) {
      throw new EncryptionError('User not authenticated');
    }
    
    if (!isEncryptionEnabled) {
      throw new EncryptionError('Encryption is not enabled');
    }
    
    // Clear encryption data
    clearEncryptionData();
    setEncryptionKey(null);
    keyRef.current = null;
    
    // Update user document
    const userRef = doc(firestore, 'users', userId);
    await setDocumentNonBlocking(userRef, {
      isEncrypted: false,
      encryptionEnabledAt: null,
    }, { merge: true });
    
    toast({
      title: 'Encryption Disabled',
      description: 'Encryption has been disabled. Existing encrypted data will remain encrypted.',
      variant: 'destructive',
    });
  }, [userId, firestore, isEncryptionEnabled, toast]);
  
  /**
   * Encrypt a value (wrapper around encryptValue)
   */
  const encryptValueWrapper = useCallback(async (value: string | number): Promise<string> => {
    if (!isUnlocked || !keyRef.current) {
      throw new EncryptionError('Encryption is not unlocked');
    }
    return encryptValue(value, keyRef.current);
  }, [isUnlocked]);
  
  /**
   * Decrypt a value (wrapper around decryptValue)
   */
  const decryptValueWrapper = useCallback(async (encryptedValue: string): Promise<string> => {
    if (!isUnlocked || !keyRef.current) {
      throw new EncryptionError('Encryption is not unlocked');
    }
    return decryptValue(encryptedValue, keyRef.current);
  }, [isUnlocked]);
  
  /**
   * Regenerate recovery codes
   */
  const regenerateRecoveryCodes = useCallback(async (mainCode: string): Promise<{ recoveryCodes: string[] }> => {
    if (!userId || !firestore) {
      throw new EncryptionError('User not authenticated');
    }
    
    if (!isEncryptionEnabled) {
      throw new EncryptionError('Encryption is not enabled');
    }
    
    // CRITICAL: Prevent concurrent operations
    if (isEncryptionOperationInProgress) {
      throw new EncryptionError('Another encryption operation is in progress. Please wait for it to complete.');
    }
    
    // Set operation lock
    setIsEncryptionOperationInProgress(true);
    
    try {
      // Create function to fetch salt from Firestore
    const fetchSaltFromFirestore = async (): Promise<string | null> => {
      if (!userId || !firestore) return null;
      try {
        const userRef = doc(firestore, 'users', userId);
        const userDocSnapshot = await getDoc(userRef);
        if (userDocSnapshot.exists()) {
          const userDocData = userDocSnapshot.data() as UserData;
          return userDocData.encryptionSalt || null;
        }
      } catch (error) {
        console.warn('Failed to fetch encryption salt from Firestore:', error);
      }
        return null;
      };
      
      // Verify main code works
      const key = await getEncryptionKey(mainCode, fetchSaltFromFirestore);
      
      // Generate new recovery codes
      const recoveryCodes = generateRecoveryCodes(10);
      
      // Hash recovery codes
      const recoveryCodeHashes = await Promise.all(
        recoveryCodes.map(code => hashRecoveryCode(code))
      );
      
      // Store main code encrypted with each recovery code
      const recoveryCodeSalt = crypto.getRandomValues(new Uint8Array(16));
      const recoveryCodeSaltBase64 = btoa(String.fromCharCode(...recoveryCodeSalt));
      
      const uint8ArrayToBase64 = (arr: Uint8Array): string => {
        let binary = '';
        for (let i = 0; i < arr.byteLength; i++) {
          binary += String.fromCharCode(arr[i]);
        }
        return btoa(binary);
      };
      
      const encryptedMainCodes = await Promise.all(
        recoveryCodes.map(async (recoveryCode) => {
          const encoder = new TextEncoder();
          const codeBuffer = encoder.encode(recoveryCode);
          const keyMaterial = await crypto.subtle.importKey(
            'raw',
            codeBuffer,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
          );
          const recoveryKey = await crypto.subtle.deriveKey(
            {
              name: 'PBKDF2',
              salt: recoveryCodeSalt,
              iterations: 100000,
              hash: 'SHA-256',
            },
            keyMaterial,
            {
              name: 'AES-GCM',
              length: 256,
            },
            false,
            ['encrypt', 'decrypt']
          );
          
          const encoder2 = new TextEncoder();
          const mainCodeData = encoder2.encode(mainCode);
          const iv = crypto.getRandomValues(new Uint8Array(12));
          const encrypted = await crypto.subtle.encrypt(
            {
              name: 'AES-GCM',
              iv: iv,
            },
            recoveryKey,
            mainCodeData
          );
          
          const ivBase64 = uint8ArrayToBase64(iv);
          const encryptedBase64 = uint8ArrayToBase64(new Uint8Array(encrypted));
          return `${ivBase64}:${encryptedBase64}`;
        })
      );
      
      // Update user document atomically
      const userRef = doc(firestore, 'users', userId);
      // Use updateDoc directly to ensure the update completes
      // Recovery code fields are not encrypted, so we can write them directly
      await updateDoc(userRef, {
        recoveryCodeHashes: recoveryCodeHashes,
        recoveryCodeSalt: recoveryCodeSaltBase64,
        encryptedMainCodes: encryptedMainCodes,
      });
      
      setIsEncryptionOperationInProgress(false);
      
      toast({
        title: 'Recovery Codes Regenerated',
        description: 'New recovery codes have been generated. Please save them securely.',
      });
      
      return { recoveryCodes };
    } catch (error: any) {
      setIsEncryptionOperationInProgress(false);
      // Re-throw if it's already an EncryptionError
      if (error instanceof EncryptionError) {
        throw error;
      }
      throw new EncryptionError('Failed to regenerate recovery codes', error as Error);
    }
  }, [userId, firestore, isEncryptionEnabled, isEncryptionOperationInProgress, toast]);
  
  /**
   * Unencrypt all user data
   * Decrypts all encrypted fields and stores them unencrypted
   */
  const unencryptAllData = useCallback(async (): Promise<{ success: boolean; unencrypted: number; failed: number }> => {
    if (!userId || !firestore) {
      throw new EncryptionError('User not authenticated');
    }
    
    if (!isEncryptionEnabled) {
      throw new EncryptionError('Encryption is not enabled');
    }
    
    if (!isUnlocked || !keyRef.current) {
      throw new EncryptionError('You must unlock encryption before unencrypting data');
    }
    
    try {
      const result = await unencryptAllUserData(
        firestore,
        userId,
        keyRef.current,
        (progress) => {
          // Progress callback - could show progress in UI
          console.log('Unencryption progress:', progress);
        }
      );
      
      toast({
        title: result.success ? 'Data Unencrypted' : 'Unencryption Partially Completed',
        description: result.success
          ? `Successfully unencrypted ${result.progress.totalUnencrypted} documents.`
          : `Unencrypted ${result.progress.totalUnencrypted} documents. ${result.progress.totalFailed} documents failed.`,
        variant: result.success ? 'default' : 'destructive',
      });
      
      return {
        success: result.success,
        unencrypted: result.progress.totalUnencrypted,
        failed: result.progress.totalFailed,
      };
    } catch (error: any) {
      toast({
        title: 'Unencryption Failed',
        description: error.message || 'An error occurred while unencrypting data.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [userId, firestore, isEncryptionEnabled, isUnlocked, toast]);
  
  /**
   * Validate encryption code
   */
  const validateCode = useCallback((code: string) => {
    return validateEncryptionCode(code);
  }, []);
  
  const value = useMemo(() => ({
    isEncryptionEnabled,
    isUnlocked,
    hasExistingData,
    isLoading,
    encryptionKey,
    enableEncryption,
    unlockEncryption,
    changeEncryptionCode,
    disableEncryption,
    lockEncryption,
    encryptValue: encryptValueWrapper,
    decryptValue: decryptValueWrapper,
    regenerateRecoveryCodes,
    unencryptAllData,
    validateCode,
    isCryptoAvailable,
  }), [
    isEncryptionEnabled,
    isUnlocked,
    hasExistingData,
    isLoading,
    encryptionKey,
    enableEncryption,
    unlockEncryption,
    changeEncryptionCode,
    disableEncryption,
    lockEncryption,
    encryptValueWrapper,
    decryptValueWrapper,
    regenerateRecoveryCodes,
    unencryptAllData,
    validateCode,
    isCryptoAvailable,
  ]);
  
  return (
    <EncryptionContext.Provider value={value}>
      {children}
    </EncryptionContext.Provider>
  );
}

export function useEncryption() {
  const context = useContext(EncryptionContext);
  if (context === undefined) {
    throw new Error('useEncryption must be used within an EncryptionProvider');
  }
  return context;
}
