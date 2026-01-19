'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';
import { encryptDocument, detectDocumentType } from '@/lib/encryption-helpers';
import type { CryptoKey } from '@/lib/encryption';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 * If encryptionKey is provided, encrypts sensitive fields before writing.
 */
export async function setDocumentNonBlocking(
  docRef: DocumentReference, 
  data: any, 
  options?: SetOptions,
  encryptionKey?: CryptoKey | null
) {
  let dataToWrite = data;
  
  // Encrypt if encryption key is provided
  if (encryptionKey) {
    try {
      const docType = detectDocumentType(data, docRef.path);
      dataToWrite = await encryptDocument(data, docType, encryptionKey);
    } catch (error) {
      console.error('Failed to encrypt document before write:', error);
      // SECURITY: Fail-safe - prevent unencrypted writes when encryption is required
      // Re-throw error to prevent data leakage
      throw new Error(`Encryption failed for document at ${docRef.path}. Data will not be written unencrypted. Original error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  const operation = options && 'merge' in options ? 'update' : 'create';
  setDoc(docRef, dataToWrite, options || {}).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: operation,
        requestResourceData: dataToWrite,
      })
    )
  })
  // Execution continues immediately
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 * If encryptionKey is provided, encrypts sensitive fields before writing.
 */
export async function addDocumentNonBlocking(
  colRef: CollectionReference, 
  data: any,
  encryptionKey?: CryptoKey | null
) {
  let dataToWrite = data;
  
  // Encrypt if encryption key is provided
  if (encryptionKey) {
    try {
      const docType = detectDocumentType(data, colRef.path);
      dataToWrite = await encryptDocument(data, docType, encryptionKey);
    } catch (error) {
      console.error('Failed to encrypt document before write:', error);
      console.error('Document data:', data);
      console.error('Collection path:', colRef.path);
      // SECURITY: Fail-safe - prevent unencrypted writes when encryption is required
      // Re-throw error to prevent data leakage
      throw new Error(`Encryption failed for document in collection ${colRef.path}. Data will not be written unencrypted. Original error: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    // Log when encryption key is not provided but encryption might be expected
    // This helps debug why imported data might not be encrypted
    if (typeof window !== 'undefined' && (window as any).__ENCRYPTION_DEBUG__) {
      console.log('[ENCRYPTION DEBUG] addDocumentNonBlocking called without encryption key', {
        path: colRef.path,
        dataKeys: Object.keys(data),
      });
    }
  }
  
  const promise = addDoc(colRef, dataToWrite)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: dataToWrite,
        })
      )
      // Re-throw the original error so that Promise.all etc. can catch it if needed.
      throw error;
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 * If encryptionKey is provided, encrypts sensitive fields before writing.
 */
export async function updateDocumentNonBlocking(
  docRef: DocumentReference, 
  data: any,
  encryptionKey?: CryptoKey | null
) {
  let dataToWrite = data;
  
  // Encrypt if encryption key is provided
  if (encryptionKey) {
    try {
      const docType = detectDocumentType(data, docRef.path);
      dataToWrite = await encryptDocument(data, docType, encryptionKey);
    } catch (error) {
      console.error('Failed to encrypt document before update:', error);
      // SECURITY: Fail-safe - prevent unencrypted writes when encryption is required
      // Re-throw error to prevent data leakage
      throw new Error(`Encryption failed for document at ${docRef.path}. Data will not be written unencrypted. Original error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  updateDoc(docRef, dataToWrite)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: dataToWrite,
        })
      )
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
}
