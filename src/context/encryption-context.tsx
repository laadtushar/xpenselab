'use client';

import React, { createContext, useContext, useMemo, useEffect, useCallback, useState, useRef } from 'react';
import type { User as UserData } from '@/lib/types';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc } from 'firebase/firestore';
import { collection } from 'firebase/firestore';
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
  enableEncryption: (code: string) => Promise<void>;
  unlockEncryption: (code: string) => Promise<boolean>;
  changeEncryptionCode: (oldCode: string, newCode: string) => Promise<void>;
  disableEncryption: () => Promise<void>;
  lockEncryption: () => void;
  encryptValue: (value: string | number) => Promise<string>;
  decryptValue: (encryptedValue: string) => Promise<string>;
  
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
  const maxUnlockAttempts = 5;
  const keyRef = useRef<CryptoKey | null>(null);
  
  // Derived state
  const isEncryptionEnabled = userData?.isEncrypted === true;
  const hasExistingData = useMemo(() => {
    return (incomesData && incomesData.length > 0) || (expensesData && expensesData.length > 0);
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
  const enableEncryption = useCallback(async (code: string): Promise<void> => {
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
      
      // Update user document
      const userRef = doc(firestore, 'users', userId);
      await setDocumentNonBlocking(userRef, {
        isEncrypted: true,
        encryptionEnabledAt: new Date().toISOString(),
      }, { merge: true });
      
      toast({
        title: 'Encryption Enabled',
        description: 'Your data will now be encrypted.',
      });
    } catch (error) {
      clearEncryptionData();
      throw error;
    }
  }, [userId, firestore, toast]);
  
  /**
   * Unlock encryption with user code
   */
  const unlockEncryption = useCallback(async (code: string): Promise<boolean> => {
    if (!isEncryptionEnabled) {
      throw new EncryptionError('Encryption is not enabled');
    }
    
    if (unlockAttempts >= maxUnlockAttempts) {
      throw new EncryptionError('Too many failed unlock attempts. Please refresh the page.');
    }
    
    try {
      const key = await getEncryptionKey(code);
      
      // Test the key by encrypting/decrypting a test value
      const testValue = 'test';
      const encrypted = await encryptValue(testValue, key);
      const decrypted = await decryptValue(encrypted, key);
      
      if (decrypted !== testValue) {
        throw new EncryptionError('Invalid encryption code');
      }
      
      // Key is valid
      setEncryptionKey(key);
      keyRef.current = key;
      setUnlockAttempts(0);
      
      return true;
    } catch (error) {
      setUnlockAttempts(prev => prev + 1);
      const remaining = maxUnlockAttempts - unlockAttempts - 1;
      throw new EncryptionError(
        remaining > 0 
          ? `Invalid encryption code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`
          : 'Invalid encryption code. Too many failed attempts.',
        error as Error
      );
    }
  }, [isEncryptionEnabled, unlockAttempts]);
  
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
