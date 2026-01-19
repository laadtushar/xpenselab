/**
 * Unencrypt all user data - decrypts all encrypted fields and stores them unencrypted
 * This is used when disabling encryption or when user wants to remove encryption
 */

import type { CryptoKey } from '@/lib/encryption';
import { decryptDocument, detectDocumentType, hasEncryptedFields } from '@/lib/encryption-helpers';
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

export interface UnencryptionProgress {
  totalProcessed: number;
  totalUnencrypted: number;
  totalFailed: number;
  totalSkipped: number;
  lastProcessedId: string | null;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  errors: Array<{ docId: string; error: string }>;
}

export interface UnencryptionResult {
  success: boolean;
  progress: UnencryptionProgress;
}

const BATCH_SIZE = 50;

/**
 * Unencrypt a collection of documents (decrypt and store unencrypted)
 */
async function unencryptCollection<T extends Record<string, any>>(
  firestore: Firestore,
  collectionPath: string,
  encryptionKey: CryptoKey,
  userId: string,
  lastProcessedId: string | null = null,
  batchSize: number = BATCH_SIZE
): Promise<{ unencrypted: number; failed: number; lastId: string | null; processed: number; skipped: number; errors: Array<{ docId: string; error: string }> }> {
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
  let unencrypted = 0;
  let failed = 0;
  const errors: Array<{ docId: string; error: string }> = [];
  let lastId: string | null = null;
  let skipped = 0;
  
  if (snapshot.docs.length === 0) {
    return { unencrypted: 0, failed: 0, lastId: null, processed: 0, skipped: 0, errors: [] };
  }
  
  for (const docSnap of snapshot.docs) {
    const docData = docSnap.data() as T;
    lastId = docSnap.id;
    
    try {
      const docType = detectDocumentType(docData, collectionPath);
      
      // Check if document has encrypted fields
      if (!hasEncryptedFields(docData, docType)) {
        skipped++;
        continue; // Skip already unencrypted documents
      }
      
      // Decrypt the document
      const decryptedData = await decryptDocument(docData, docType, encryptionKey);
      
      // Update document with decrypted data
      const docRef = doc(firestore, collectionPath, docSnap.id);
      batch.update(docRef, decryptedData);
      unencrypted++;
    } catch (error: any) {
      failed++;
      errors.push({
        docId: docSnap.id,
        error: error.message || 'Unknown error during unencryption',
      });
    }
  }
  
  // Commit batch if there are updates
  if (unencrypted > 0) {
    await batch.commit();
  }
  
  return { unencrypted, failed, lastId, processed: snapshot.docs.length, skipped, errors };
}

/**
 * Unencrypt all user data across all collections
 * 
 * @param firestore - Firestore instance
 * @param userId - User ID
 * @param encryptionKey - Current encryption key to decrypt with
 * @param progressCallback - Optional progress callback
 */
export async function unencryptAllUserData(
  firestore: Firestore,
  userId: string,
  encryptionKey: CryptoKey,
  progressCallback?: (progress: UnencryptionProgress) => void
): Promise<UnencryptionResult> {
  const progress: UnencryptionProgress = {
    totalProcessed: 0,
    totalUnencrypted: 0,
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
    
    // Process each collection with pagination
    for (const collectionPath of collections) {
      let hasMore = true;
      let lastProcessedId: string | null = null;
      
      while (hasMore) {
        const result = await unencryptCollection(
          firestore,
          collectionPath,
          encryptionKey,
          userId,
          lastProcessedId
        );
        
        progress.totalProcessed += result.processed;
        progress.totalUnencrypted += result.unencrypted;
        progress.totalFailed += result.failed;
        progress.totalSkipped += result.skipped;
        progress.lastProcessedId = result.lastId;
        progress.errors.push(...result.errors);
        
        if (progressCallback) {
          progressCallback(progress);
        }
        
        hasMore = result.unencrypted > 0 || result.failed > 0;
        lastProcessedId = result.lastId;
      }
    }
    
    // Process loan repayments (subcollection)
    const loansSnapshot = await getDocs(collection(firestore, `users/${userId}/loans`));
    for (const loanDoc of loansSnapshot.docs) {
      const loanId = loanDoc.id;
      const repaymentsPath = `users/${userId}/loans/${loanId}/repayments`;
      let hasMore = true;
      let lastProcessedId: string | null = null;
      
      while (hasMore) {
        const result = await unencryptCollection(
          firestore,
          repaymentsPath,
          encryptionKey,
          userId,
          lastProcessedId
        );
        
        progress.totalProcessed += result.processed;
        progress.totalUnencrypted += result.unencrypted;
        progress.totalFailed += result.failed;
        progress.totalSkipped += result.skipped;
        progress.errors.push(...result.errors);
        
        if (progressCallback) {
          progressCallback(progress);
        }
        
        hasMore = result.unencrypted > 0 || result.failed > 0;
        lastProcessedId = result.lastId;
      }
    }
    
    // Process shared expenses (groups/{groupId}/sharedExpenses)
    const groupsSnapshot = await getDocs(collection(firestore, 'groups'));
    for (const groupDoc of groupsSnapshot.docs) {
      const groupId = groupDoc.id;
      const sharedExpensesPath = `groups/${groupId}/sharedExpenses`;
      let hasMore = true;
      let lastProcessedId: string | null = null;
      
      while (hasMore) {
        const result = await unencryptCollection(
          firestore,
          sharedExpensesPath,
          encryptionKey,
          userId,
          lastProcessedId
        );
        
        progress.totalProcessed += result.processed;
        progress.totalUnencrypted += result.unencrypted;
        progress.totalFailed += result.failed;
        progress.totalSkipped += result.skipped;
        progress.errors.push(...result.errors);
        
        if (progressCallback) {
          progressCallback(progress);
        }
        
        hasMore = result.unencrypted > 0 || result.failed > 0;
        lastProcessedId = result.lastId;
      }
    }
    
    // Process debts (top-level collection, but only for this user)
    const debtsPath = 'debts';
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
      let unencrypted = 0;
      let failed = 0;
      
      if (snapshot.docs.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const docSnap of snapshot.docs) {
        const docData = docSnap.data() as Debt;
        lastProcessedId = docSnap.id;
        
        // Only unencrypt debts created by this user
        if (docData.createdBy !== userId) {
          continue;
        }
        
        const docType = detectDocumentType(docData, debtsPath);
        
        if (!hasEncryptedFields(docData, docType)) {
          continue;
        }
        
        try {
          const decryptedData = await decryptDocument(docData, docType, encryptionKey);
          const docRef = doc(firestore, debtsPath, docSnap.id);
          batch.update(docRef, decryptedData);
          unencrypted++;
        } catch (error: any) {
          failed++;
          progress.errors.push({
            docId: docSnap.id,
            error: error.message || 'Unknown error during unencryption',
          });
        }
      }
      
      if (unencrypted > 0) {
        await batch.commit();
      }
      
      progress.totalProcessed += snapshot.docs.length;
      progress.totalUnencrypted += unencrypted;
      progress.totalFailed += failed;
      progress.lastProcessedId = lastProcessedId;
      
      if (progressCallback) {
        progressCallback(progress);
      }
      
      hasMore = unencrypted > 0 || failed > 0;
    }
    
    progress.status = 'completed';
    
    return {
      success: progress.totalFailed === 0,
      progress,
    };
  } catch (error: any) {
    progress.status = 'failed';
    progress.errors.push({
      docId: 'unknown',
      error: error.message || 'Unknown error during unencryption',
    });
    
    return {
      success: false,
      progress,
    };
  }
}
