/**
 * Re-encryption script to migrate data from one encryption key to another
 * This properly decrypts with the old key and encrypts with the new key
 */

import type { CryptoKey } from '@/lib/encryption';
import { encryptDocument, decryptDocument, detectDocumentType, hasEncryptedFields } from '@/lib/encryption-helpers';
import type { 
  Income, 
  Expense, 
  Budget, 
  Loan, 
  Repayment, 
  Debt, 
  RecurringTransaction 
} from '@/lib/types';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  writeBatch, 
  query,
  limit,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

export interface ReEncryptionProgress {
  totalProcessed: number;
  totalReEncrypted: number;
  totalFailed: number;
  totalSkipped: number;
  lastProcessedId: string | null;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  errors: Array<{ docId: string; error: string }>;
}

export interface ReEncryptionResult {
  success: boolean;
  progress: ReEncryptionProgress;
}

const BATCH_SIZE = 50;

/**
 * Re-encrypt a collection of documents (decrypt with old key, encrypt with new key)
 */
async function reEncryptCollection<T extends Record<string, any>>(
  firestore: Firestore,
  collectionPath: string,
  oldKey: CryptoKey,
  newKey: CryptoKey,
  userId: string,
  lastProcessedId: string | null = null,
  batchSize: number = BATCH_SIZE
): Promise<{ reEncrypted: number; failed: number; lastId: string | null; processed: number; skipped: number; errors: Array<{ docId: string; error: string }> }> {
  const colRef = collection(firestore, collectionPath);
  let q = query(colRef, limit(batchSize));
  
  if (lastProcessedId) {
    const lastDocRef = doc(firestore, collectionPath, lastProcessedId);
    const lastDocSnap = await getDoc(lastDocRef);
    if (lastDocSnap.exists()) {
      q = query(colRef, startAfter(lastDocSnap), limit(batchSize));
    }
  }
  
  const snapshot = await getDocs(q);
  const batch = writeBatch(firestore);
  let reEncrypted = 0;
  let failed = 0;
  const errors: Array<{ docId: string; error: string }> = [];
  let lastId: string | null = null;
  let skipped = 0;
  
  if (snapshot.docs.length === 0) {
    return { reEncrypted: 0, failed: 0, lastId: null, processed: 0, skipped: 0, errors: [] };
  }
  
  for (const docSnap of snapshot.docs) {
    const docData = docSnap.data() as T;
    lastId = docSnap.id;
    
    try {
      const docType = detectDocumentType(docData, collectionPath);
      
      // Check if document has encrypted fields
      if (!hasEncryptedFields(docData, docType)) {
        skipped++;
        continue; // Skip unencrypted documents
      }
      
      // CRITICAL: Decrypt with OLD key first
      let decryptedData: T;
      try {
        decryptedData = await decryptDocument(docData, docType, oldKey);
      } catch (decryptError: any) {
        // If decryption fails, the data might be:
        // 1. Already encrypted with new key (skip)
        // 2. Double encrypted (needs special handling)
        // 3. Corrupted (log error)
        
        // Try decrypting with new key to see if it's already re-encrypted
        try {
          const testDecrypt = await decryptDocument(docData, docType, newKey);
          // If this works, data is already encrypted with new key - skip
          skipped++;
          continue;
        } catch {
          // Neither key works - might be double encrypted or corrupted
          failed++;
          errors.push({
            docId: docSnap.id,
            error: `Failed to decrypt with old key: ${decryptError.message}. Data may be double-encrypted or corrupted.`,
          });
          continue;
        }
      }
      
      // Now encrypt with NEW key
      const reEncryptedData = await encryptDocument(decryptedData, docType, newKey);
      
      // Verify encryption worked
      const encryptionVerified = hasEncryptedFields(reEncryptedData, docType);
      if (!encryptionVerified) {
        console.error(`Re-encryption verification failed for document ${docSnap.id} in ${collectionPath}`);
        failed++;
        errors.push({
          docId: docSnap.id,
          error: 'Re-encryption verification failed',
        });
        continue;
      }
      
      const docRef = doc(firestore, collectionPath, docSnap.id);
      batch.update(docRef, reEncryptedData);
      reEncrypted++;
      
    } catch (error: any) {
      failed++;
      errors.push({
        docId: docSnap.id,
        error: error.message || 'Unknown error',
      });
    }
  }
  
  if (reEncrypted > 0) {
    await batch.commit();
  }
  
  return { reEncrypted, failed, lastId, processed: snapshot.docs.length, skipped, errors };
}

/**
 * Re-encrypt all user data from old key to new key
 */
export async function reEncryptUserData(
  firestore: Firestore,
  userId: string,
  oldKey: CryptoKey,
  newKey: CryptoKey,
  progressCallback?: (progress: ReEncryptionProgress) => void
): Promise<ReEncryptionResult> {
  const progress: ReEncryptionProgress = {
    totalProcessed: 0,
    totalReEncrypted: 0,
    totalFailed: 0,
    totalSkipped: 0,
    lastProcessedId: null,
    status: 'in-progress',
    errors: [],
  };
  
  try {
    const collections = [
      `users/${userId}/incomes`,
      `users/${userId}/expenses`,
      `users/${userId}/budgets`,
      `users/${userId}/loans`,
      `users/${userId}/recurringTransactions`,
    ];
    
    // Process each collection
    for (const collectionPath of collections) {
      let hasMore = true;
      let lastProcessedId: string | null = null;
      
      while (hasMore) {
        const result = await reEncryptCollection(
          firestore,
          collectionPath,
          oldKey,
          newKey,
          userId,
          lastProcessedId,
          BATCH_SIZE
        );
        
        progress.totalProcessed += result.processed;
        progress.totalReEncrypted += result.reEncrypted;
        progress.totalFailed += result.failed;
        progress.totalSkipped += result.skipped;
        progress.lastProcessedId = result.lastId;
        progress.errors.push(...result.errors);
        
        if (progressCallback) {
          progressCallback(progress);
        }
        
        lastProcessedId = result.lastId;
        hasMore = result.reEncrypted > 0 || result.failed > 0 || result.skipped > 0;
      }
    }
    
    // Handle loan repayments (subcollections)
    const loansSnapshot = await getDocs(collection(firestore, `users/${userId}/loans`));
    const loanIds = loansSnapshot.docs.map(d => d.id);
    
    for (const loanId of loanIds) {
      const repaymentsPath = `users/${userId}/loans/${loanId}/repayments`;
      let hasMore = true;
      let lastProcessedId: string | null = null;
      
      while (hasMore) {
        const result = await reEncryptCollection(
          firestore,
          repaymentsPath,
          oldKey,
          newKey,
          userId,
          lastProcessedId,
          BATCH_SIZE
        );
        
        progress.totalProcessed += result.processed;
        progress.totalReEncrypted += result.reEncrypted;
        progress.totalFailed += result.failed;
        progress.totalSkipped += result.skipped;
        progress.lastProcessedId = result.lastId;
        progress.errors.push(...result.errors);
        
        if (progressCallback) {
          progressCallback(progress);
        }
        
        lastProcessedId = result.lastId;
        hasMore = result.reEncrypted > 0 || result.failed > 0 || result.skipped > 0;
      }
    }
    
    // Handle debts (shared collection)
    const debtsPath = `users/${userId}/debts`;
    let hasMore = true;
    let lastProcessedId: string | null = null;
    
    while (hasMore) {
      const colRef = collection(firestore, debtsPath);
      let q = query(colRef, limit(BATCH_SIZE));
      
      if (lastProcessedId) {
        const lastDocRef = doc(firestore, debtsPath, lastProcessedId);
        const lastDocSnap = await getDoc(lastDocRef);
        if (lastDocSnap.exists()) {
          q = query(colRef, startAfter(lastDocSnap), limit(BATCH_SIZE));
        }
      }
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(firestore);
      let reEncrypted = 0;
      let failed = 0;
      let skipped = 0;
      
      for (const docSnap of snapshot.docs) {
        const docData = docSnap.data() as Debt;
        lastProcessedId = docSnap.id;
        
        // Only re-encrypt debts created by this user
        if (docData.createdBy !== userId) {
          continue;
        }
        
        try {
          const docType = detectDocumentType(docData, debtsPath);
          
          if (!hasEncryptedFields(docData, docType)) {
            skipped++;
            continue;
          }
          
          // Decrypt with old key
          let decryptedData: Debt;
          try {
            decryptedData = await decryptDocument(docData, docType, oldKey);
          } catch (decryptError: any) {
            // Try new key to see if already re-encrypted
            try {
              await decryptDocument(docData, docType, newKey);
              skipped++;
              continue;
            } catch {
              failed++;
              progress.errors.push({
                docId: docSnap.id,
                error: `Failed to decrypt: ${decryptError.message}`,
              });
              continue;
            }
          }
          
          // Encrypt with new key
          const reEncryptedData = await encryptDocument(decryptedData, docType, newKey);
          const docRef = doc(firestore, debtsPath, docSnap.id);
          batch.update(docRef, reEncryptedData);
          reEncrypted++;
          
        } catch (error: any) {
          failed++;
          progress.errors.push({
            docId: docSnap.id,
            error: error.message || 'Unknown error',
          });
        }
      }
      
      if (reEncrypted > 0) {
        await batch.commit();
      }
      
      progress.totalProcessed += snapshot.docs.length;
      progress.totalReEncrypted += reEncrypted;
      progress.totalFailed += failed;
      progress.totalSkipped += skipped;
      progress.lastProcessedId = lastProcessedId;
      
      if (progressCallback) {
        progressCallback(progress);
      }
      
      hasMore = reEncrypted > 0 || failed > 0 || skipped > 0;
    }
    
    progress.status = 'completed';
    
    return {
      success: true,
      progress,
    };
  } catch (error: any) {
    progress.status = 'failed';
    progress.errors.push({
      docId: 'unknown',
      error: error.message || 'Unknown error during re-encryption',
    });
    
    return {
      success: false,
      progress,
    };
  }
}
