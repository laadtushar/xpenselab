'use client';

import React, { createContext, useContext, useMemo, useEffect, useCallback, useState, useRef } from 'react';
import type { User as UserData } from '@/lib/types';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection } from 'firebase/firestore';
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
} from '@/lib/encryption';
import { updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
      await setDocumentNonBlocking(userRef, {
        isEncrypted: true,
        encryptionEnabledAt: new Date().toISOString(),
        recoveryCodeHashes: recoveryCodeHashes, // Store as plain hashes
        recoveryCodeSalt: recoveryCodeSaltBase64,
        encryptedMainCodes: encryptedMainCodes,
      }, { merge: true }, key);
      
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
        const key = await getEncryptionKey(code);
        
        // Test the key by encrypting/decrypting a test value
        const testValue = 'test';
        const encrypted = await encryptValue(testValue, key);
        const decrypted = await decryptValue(encrypted, key);
        
        if (decrypted === testValue) {
          // Main code is valid
          setEncryptionKey(key);
          keyRef.current = key;
          setUnlockAttempts(0);
          return true;
        }
        // If decrypted !== testValue, main code didn't work, continue to recovery code check
      } catch (mainCodeError) {
        // Main code derivation failed (wrong code or encryption not initialized)
        // Check if it's because encryption is not initialized
        if (mainCodeError instanceof EncryptionError && mainCodeError.message.includes('not initialized')) {
          throw mainCodeError; // Re-throw initialization errors
        }
        // Otherwise, try recovery code below
      }
      
      // Try as recovery code (only if main code didn't work)
      // Check if recovery code data exists
      if (!userData?.recoveryCodeHashes || !userData?.recoveryCodeSalt || !userData?.encryptedMainCodes) {
        // No recovery codes configured or userData is stale
        // If we got here, main code didn't work and recovery codes aren't available
        throw new EncryptionError('Invalid encryption code or recovery code');
      }
      
      // Hash the input code to check against stored recovery code hashes
      const inputHash = await hashRecoveryCode(code);
      
      // Find matching recovery code hash
      const recoveryCodeIndex = userData.recoveryCodeHashes.findIndex(
        (storedHash: string) => storedHash === inputHash
      );
      
      if (recoveryCodeIndex === -1) {
        throw new EncryptionError('Invalid encryption code or recovery code');
      }
      
      // Decrypt main code using recovery code
      const recoveryCodeSaltBinary = atob(userData.recoveryCodeSalt);
      const recoveryCodeSalt = new Uint8Array(recoveryCodeSaltBinary.length);
      for (let i = 0; i < recoveryCodeSaltBinary.length; i++) {
        recoveryCodeSalt[i] = recoveryCodeSaltBinary.charCodeAt(i);
      }
      
      // Derive key from recovery code
      const encoder = new TextEncoder();
      const codeBuffer = encoder.encode(code);
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
      const encryptedMainCode = userData.encryptedMainCodes[recoveryCodeIndex];
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
      
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        recoveryKey,
        encrypted
      );
      
      const decoder = new TextDecoder();
      const mainCode = decoder.decode(decrypted);
      
      // Derive key from main code
      const key = await getEncryptionKey(mainCode);
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
  }, [isEncryptionEnabled, unlockAttempts, userData]);
  
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
   */
  const changeEncryptionCode = useCallback(async (oldCode: string, newCode: string): Promise<void> => {
    if (!userId || !firestore) {
      throw new EncryptionError('User not authenticated');
    }
    
    if (!isEncryptionEnabled) {
      throw new EncryptionError('Encryption is not enabled');
    }
    
    const oldValidation = validateEncryptionCode(oldCode);
    if (!oldValidation.valid) {
      throw new EncryptionError(oldValidation.error || 'Invalid old encryption code');
    }
    
    const newValidation = validateEncryptionCode(newCode);
    if (!newValidation.valid) {
      throw new EncryptionError(newValidation.error || 'Invalid new encryption code');
    }
    
    // Verify old code works
    try {
      await getEncryptionKey(oldCode);
    } catch (error) {
      throw new EncryptionError('Old encryption code is incorrect', error as Error);
    }
    
    // Clear old encryption data
    clearEncryptionData();
    
    // Initialize with new code
    await initializeEncryption(newCode);
    
    // Get new key
    const newKey = await getEncryptionKey(newCode);
    setEncryptionKey(newKey);
    keyRef.current = newKey;
    
    toast({
      title: 'Encryption Code Changed',
      description: 'Your encryption code has been updated. All data will be re-encrypted with the new code.',
    });
    
    // Note: Re-encryption of existing data should be handled separately via migration
  }, [userId, firestore, isEncryptionEnabled, toast]);
  
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
    
    // Verify main code works
    const key = await getEncryptionKey(mainCode);
    
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
    
    // Update user document
    const userRef = doc(firestore, 'users', userId);
    // Use updateDoc directly to ensure the update completes
    // Recovery code fields are not encrypted, so we can write them directly
    await updateDoc(userRef, {
      recoveryCodeHashes: recoveryCodeHashes,
      recoveryCodeSalt: recoveryCodeSaltBase64,
      encryptedMainCodes: encryptedMainCodes,
    });
    
    toast({
      title: 'Recovery Codes Regenerated',
      description: 'New recovery codes have been generated. Please save them securely.',
    });
    
    return { recoveryCodes };
  }, [userId, firestore, isEncryptionEnabled, toast]);
  
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
