/**
 * Migration script to encrypt existing unencrypted data
 * This should be run after a user enables encryption
 */

import type { CryptoKey } from '@/lib/encryption';
import { encryptDocument, detectDocumentType, hasEncryptedFields, isEncrypted } from '@/lib/encryption-helpers';
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
  setDoc,
  SetOptions,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

export interface MigrationProgress {
  totalProcessed: number;
  totalEncrypted: number;
  totalFailed: number;
  totalSkippedEncrypted: number;
  lastProcessedId: string | null;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  errors: Array<{ docId: string; error: string }>;
}

export interface MigrationResult {
  success: boolean;
  progress: MigrationProgress;
  message: string;
}

const BATCH_SIZE = 50;

/**
 * Encrypt a collection of documents
 */
async function encryptCollection<T extends Record<string, any>>(
  firestore: Firestore,
  collectionPath: string,
  encryptionKey: CryptoKey,
  userId: string,
  lastProcessedId: string | null = null,
  batchSize: number = BATCH_SIZE
): Promise<{ encrypted: number; failed: number; lastId: string | null; processed: number; skippedEncrypted: number; errors: Array<{ docId: string; error: string }> }> {
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
  let encrypted = 0;
  let failed = 0;
  const errors: Array<{ docId: string; error: string }> = [];
  let lastId: string | null = null;
  
  // If no documents, return early
  if (snapshot.docs.length === 0) {
    return { encrypted: 0, failed: 0, lastId: null, processed: 0, skippedEncrypted: 0, errors: [] };
  }
  
  // CRITICAL: Filter to ONLY unencrypted documents before processing
  // This ensures we only encrypt documents that actually need encryption
  const unencryptedDocs: typeof snapshot.docs = [];
  let skippedEncrypted = 0;
  let processed = 0; // Only count documents we actually evaluate (not filtered out)
  
  for (const docSnap of snapshot.docs) {
    const docData = docSnap.data() as T;
    const docType = detectDocumentType(docData, collectionPath);
    
    // Skip if document type is unknown (don't count in processed)
    if (docType === 'Unknown') {
      lastId = docSnap.id;
      continue; // Don't count unknown types
    }
    
    // Count this document as processed (we evaluated it)
    processed++;
    
    // CRITICAL: Check if already encrypted BEFORE adding to processing queue
    // Only process documents that need encryption
    const alreadyEncrypted = hasEncryptedFields(docData, docType);
    
    if (alreadyEncrypted) {
      skippedEncrypted++;
      lastId = docSnap.id;
      continue; // Skip already-encrypted documents entirely
    }
    
    // This document needs encryption - add it to the queue
    unencryptedDocs.push(docSnap);
  }
  
  // Log filtering results
  if (unencryptedDocs.length > 0 || skippedEncrypted > 0) {
    console.log(`[MIGRATION] Collection ${collectionPath}: Found ${unencryptedDocs.length} unencrypted, ${skippedEncrypted} already encrypted`);
  }
  
  // Now process ONLY unencrypted documents
  for (const docSnap of unencryptedDocs) {
    try {
      const docData = docSnap.data() as T;
      const docType = detectDocumentType(docData, collectionPath);
      
      // Log first few unencrypted documents for debugging
      if (collectionPath.includes('/expenses') && unencryptedDocs.indexOf(docSnap) < 5) {
        const amountStr = typeof docData.amount === 'string' 
          ? `${docData.amount.substring(0, 30)}${docData.amount.length > 30 ? '...' : ''} (full length: ${docData.amount.length})`
          : String(docData.amount);
        const descStr = typeof docData.description === 'string'
          ? `${docData.description.substring(0, 30)}${docData.description.length > 30 ? '...' : ''} (full length: ${docData.description.length})`
          : String(docData.description || 'null/undefined');
        
        console.log(`[MIGRATION] Encrypting document ${docSnap.id}:`, {
          docType,
          'amount (raw)': docData.amount,
          'amount (type)': typeof docData.amount,
          'amount (display)': amountStr,
          'description (raw)': docData.description,
          'description (type)': typeof docData.description,
          'description (display)': descStr,
        });
      }
      
      // Encrypt the document (this will encrypt all fields that need encryption)
      const encryptedData = await encryptDocument(docData, docType, encryptionKey);
      
      // Verify encryption actually happened before adding to batch
      // After encryption, ALL fields should be encrypted
      const encryptionVerified = hasEncryptedFields(encryptedData, docType);
      if (!encryptionVerified) {
        console.error(`Encryption verification failed for document ${docSnap.id} in ${collectionPath}. Document type: ${docType}. Some fields may not have been encrypted.`);
        failed++;
        errors.push({
          docId: docSnap.id,
          error: `Encryption verification failed - document was not fully encrypted after encryptDocument call`,
        });
        lastId = docSnap.id;
        continue;
      }
      
      const docRef = doc(firestore, collectionPath, docSnap.id);
      // Use update - it will update all fields provided in encryptedData
      // encryptedData contains all fields from the original document with encrypted sensitive fields
      batch.update(docRef, encryptedData);
      encrypted++;
      lastId = docSnap.id;
    } catch (error: any) {
      failed++;
      errors.push({
        docId: docSnap.id,
        error: error.message || 'Unknown error',
      });
      // Still update lastId even on error to continue pagination
      lastId = docSnap.id;
    }
  }
  
  if (encrypted > 0) {
    try {
      await batch.commit();
      
      // Verify encryption actually happened by re-reading documents we encrypted
      // Check up to 5 documents that we attempted to encrypt (increased from 3)
      let verifiedCount = 0;
      const docsToVerify: Array<{ id: string; originalData: T; docType: string }> = [];
      
      // Collect documents that should have been encrypted (from unencryptedDocs)
      for (const docSnap of unencryptedDocs.slice(0, 5)) {
        const originalData = docSnap.data() as T;
        const docType = detectDocumentType(originalData, collectionPath);
        docsToVerify.push({ id: docSnap.id, originalData, docType });
      }
      
      // Verify up to 5 documents
      for (const { id, docType } of docsToVerify.slice(0, 5)) {
        const docRef = doc(firestore, collectionPath, id);
        const verifySnap = await getDoc(docRef);
        if (verifySnap.exists()) {
          const verifyData = verifySnap.data();
          const verifyType = detectDocumentType(verifyData, collectionPath);
          const wasEncrypted = hasEncryptedFields(verifyData, verifyType);
          if (!wasEncrypted) {
            console.error(`Encryption verification failed for document ${id} in ${collectionPath}. Document type: ${verifyType}`);
            errors.push({
              docId: id,
              error: 'Encryption verification failed - document was not encrypted after batch commit',
            });
            // Don't increment failed count here as it's already counted in encrypted
          }
        }
        verifiedCount++;
      }
    } catch (error: any) {
      // If batch commit fails, mark all as failed
      failed += encrypted;
      encrypted = 0;
      errors.push({
        docId: 'batch_commit',
        error: error.message || 'Batch commit failed',
      });
      console.error(`Batch commit failed for ${collectionPath}:`, error);
    }
  }
  
  return { encrypted, failed, lastId, processed, skippedEncrypted, errors };
}

/**
 * Migrate all user data to encrypted format
 */
export async function migrateUserDataToEncrypted(
  firestore: Firestore,
  userId: string,
  encryptionKey: CryptoKey,
  progressCallback?: (progress: MigrationProgress) => void
): Promise<MigrationResult> {
  const progress: MigrationProgress = {
    totalProcessed: 0,
    totalEncrypted: 0,
    totalFailed: 0,
    totalSkippedEncrypted: 0,
    lastProcessedId: null,
    status: 'in-progress',
    errors: [],
  };
  
  try {
    // Collections to migrate
    const collections = [
      `users/${userId}/incomes`,
      `users/${userId}/expenses`,
      `users/${userId}/budgets`,
      `users/${userId}/loans`,
      `users/${userId}/recurringTransactions`,
    ];
    
    // Also handle loan repayments (subcollections)
    const loansSnapshot = await getDocs(collection(firestore, `users/${userId}/loans`));
    const loanIds = loansSnapshot.docs.map(d => d.id);
    
    for (const collectionPath of collections) {
      let lastProcessedId: string | null = null;
      let hasMore = true;
      let batchNumber = 0;
      
      while (hasMore) {
        batchNumber++;
        
        type EncryptResult = { encrypted: number; failed: number; lastId: string | null; processed: number; skippedEncrypted: number; errors: Array<{ docId: string; error: string }> };
        const result: EncryptResult = await encryptCollection(
          firestore,
          collectionPath,
          encryptionKey,
          userId,
          lastProcessedId,
          BATCH_SIZE
        );
        
        progress.totalProcessed += result.processed;
        progress.totalEncrypted += result.encrypted;
        progress.totalFailed += result.failed;
        progress.totalSkippedEncrypted = (progress.totalSkippedEncrypted || 0) + result.skippedEncrypted;
        progress.errors.push(...result.errors);
        progress.lastProcessedId = result.lastId;
        
        if (progressCallback) {
          progressCallback(progress);
        }
        
        lastProcessedId = result.lastId;
        // Continue if we got a full batch (might be more documents) and have a lastId
        hasMore = result.processed > 0 && result.lastId !== null && result.processed >= BATCH_SIZE;
        
        // Safety check: if we've been processing for a while with no progress, break
        if (batchNumber > 1000) {
          console.error(`Breaking after ${batchNumber} batches to prevent infinite loop`);
          break;
        }
      }
    }
    
    // Migrate loan repayments
    for (const loanId of loanIds) {
      const repaymentsPath = `users/${userId}/loans/${loanId}/repayments`;
      let lastProcessedId: string | null = null;
      let hasMore = true;
      let batchNumber = 0;
      
      while (hasMore) {
        batchNumber++;
        type EncryptResult = { encrypted: number; failed: number; lastId: string | null; processed: number; skippedEncrypted: number; errors: Array<{ docId: string; error: string }> };
        const result: EncryptResult = await encryptCollection(
          firestore,
          repaymentsPath,
          encryptionKey,
          userId,
          lastProcessedId,
          BATCH_SIZE
        );
        
        progress.totalProcessed += result.processed;
        progress.totalEncrypted += result.encrypted;
        progress.totalFailed += result.failed;
        progress.totalSkippedEncrypted += result.skippedEncrypted;
        progress.errors.push(...result.errors);
        
        if (progressCallback) {
          progressCallback(progress);
        }
        
        lastProcessedId = result.lastId;
        // Continue if we got a full batch (might be more documents) and have a lastId
        hasMore = result.processed > 0 && result.lastId !== null && result.processed >= BATCH_SIZE;
      }
    }
    
    // Migrate debts (top-level collection)
    const debtsPath = 'debts';
    let lastProcessedId: string | null = null;
    let hasMore = true;
    
    // Only migrate debts created by this user
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
      let encrypted = 0;
      let failed = 0;
      let skippedEncrypted = 0;
      let processed = 0; // Only count documents we actually evaluate (not filtered out)
      
      for (const docSnap of snapshot.docs) {
        const docData = docSnap.data() as Debt;
        
        // Always update lastProcessedId for pagination, even if skipping
        lastProcessedId = docSnap.id;
        
        // Only migrate debts created by this user (don't count others in processed)
        if (docData.createdBy !== userId) {
          continue; // Don't count debts not created by this user
        }
        
        // Count this document as processed (we evaluated it)
        processed++;
        
        try {
          const docType = detectDocumentType(docData, debtsPath);
          
          // Use the proper helper function that checks only fields that should be encrypted
          if (hasEncryptedFields(docData, docType)) {
            skippedEncrypted++;
            continue;
          }
          
          const encryptedData = await encryptDocument(docData, docType, encryptionKey);
          const docRef = doc(firestore, debtsPath, docSnap.id);
          batch.update(docRef, encryptedData);
          encrypted++;
        } catch (error: any) {
          failed++;
          progress.errors.push({
            docId: docSnap.id,
            error: error.message || 'Unknown error',
          });
        }
      }
      
      if (encrypted > 0) {
        try {
          await batch.commit();
        } catch (error: any) {
          failed += encrypted;
          encrypted = 0;
          progress.errors.push({
            docId: 'debts_batch_commit',
            error: error.message || 'Batch commit failed',
          });
        }
      }
      
      progress.totalProcessed += processed;
      progress.totalEncrypted += encrypted;
      progress.totalFailed += failed;
      progress.totalSkippedEncrypted += skippedEncrypted;
      
      if (progressCallback) {
        progressCallback(progress);
      }
      
      // Continue if we got a full batch (might be more documents) and have a lastId
      hasMore = processed >= BATCH_SIZE && lastProcessedId !== null;
    }
    
    // Migrate shared expenses (groups/{groupId}/sharedExpenses)
    // Only migrate expenses where the user is the payer (paidBy === userId)
    const groupsSnapshot = await getDocs(collection(firestore, 'groups'));
    const userGroups = groupsSnapshot.docs.filter(doc => {
      const groupData = doc.data();
      return groupData.members && groupData.members.includes(userId);
    });
    
    for (const groupDoc of userGroups) {
      const groupId = groupDoc.id;
      const sharedExpensesPath = `groups/${groupId}/sharedExpenses`;
      let lastProcessedId: string | null = null;
      let hasMore = true;
      
      while (hasMore) {
        const colRef = collection(firestore, sharedExpensesPath);
        let q = query(colRef, limit(BATCH_SIZE));
        
        if (lastProcessedId) {
          const lastDocRef = doc(firestore, sharedExpensesPath, lastProcessedId);
          const lastDocSnap = await getDoc(lastDocRef);
          if (lastDocSnap.exists()) {
            q = query(colRef, startAfter(lastDocSnap), limit(BATCH_SIZE));
          }
        }
        
        const snapshot = await getDocs(q);
        const batch = writeBatch(firestore);
        let encrypted = 0;
        let failed = 0;
        let skippedEncrypted = 0;
        let processed = 0; // Only count documents we actually evaluate (not filtered out)
        
        for (const docSnap of snapshot.docs) {
          const docData = docSnap.data() as any;
          
          // Always update lastProcessedId for pagination, even if skipping
          lastProcessedId = docSnap.id;
          
          // Only migrate expenses where the user is the payer (don't count others in processed)
          if (docData.paidBy !== userId) {
            continue; // Don't count expenses not paid by this user
          }
          
          // Count this document as processed (we evaluated it)
          processed++;
          
          try {
            const docType = detectDocumentType(docData, sharedExpensesPath);
            
            // Use the proper helper function that checks only fields that should be encrypted
            if (hasEncryptedFields(docData, docType)) {
              skippedEncrypted++;
              continue;
            }
            
            const encryptedData = await encryptDocument(docData, docType, encryptionKey);
            const docRef = doc(firestore, sharedExpensesPath, docSnap.id);
            // Use update - it will update all fields provided in encryptedData
            batch.update(docRef, encryptedData);
            encrypted++;
          } catch (error: any) {
            failed++;
            progress.errors.push({
              docId: docSnap.id,
              error: error.message || 'Unknown error',
            });
          }
        }
        
        if (encrypted > 0) {
          try {
            await batch.commit();
          } catch (error: any) {
            failed += encrypted;
            encrypted = 0;
            progress.errors.push({
              docId: `sharedExpenses_batch_commit_${groupId}`,
              error: error.message || 'Batch commit failed',
            });
          }
        }
        
        progress.totalProcessed += processed;
        progress.totalEncrypted += encrypted;
        progress.totalFailed += failed;
        progress.totalSkippedEncrypted += skippedEncrypted;
        
        if (progressCallback) {
          progressCallback(progress);
        }
        
        // Continue if we got a full batch (might be more documents) and have a lastId
        hasMore = processed >= BATCH_SIZE && lastProcessedId !== null;
      }
    }
    
    // Migrate User document itself (no encrypted fields - bank integrations removed)
    const userDocRef = doc(firestore, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      try {
        const userData = userDocSnap.data() as any;
        const docType = detectDocumentType(userData, `users/${userId}`);
        
        if (!hasEncryptedFields(userData, docType)) {
          const encryptedData = await encryptDocument(userData, docType, encryptionKey);
          await setDoc(userDocRef, encryptedData, { merge: true });
          progress.totalEncrypted += 1;
          progress.totalProcessed += 1;
        }
      } catch (error: any) {
        progress.totalFailed += 1;
        progress.errors.push({
          docId: userId,
          error: error.message || 'Failed to encrypt user document',
        });
      }
    }
    
    progress.status = 'completed';
    
    // Calculate summary statistics
    // Verify: totalProcessed should equal totalEncrypted + totalFailed + totalSkippedEncrypted
    const calculatedTotal = progress.totalEncrypted + progress.totalFailed + progress.totalSkippedEncrypted;
    const successRate = progress.totalProcessed > 0 
      ? ((progress.totalEncrypted / progress.totalProcessed) * 100).toFixed(1)
      : '0';
    
    // Log errors if any
    if (progress.errors.length > 0) {
      console.error(`Migration completed with ${progress.errors.length} errors:`, progress.errors);
    }
    
    // Log summary
    console.log(`Migration Summary:
      - Total Processed: ${progress.totalProcessed}
      - Encrypted: ${progress.totalEncrypted}
      - Already Encrypted: ${progress.totalSkippedEncrypted}
      - Failed: ${progress.totalFailed}
      - Success Rate: ${successRate}%
      - Verification: ${calculatedTotal === progress.totalProcessed ? '✅ Numbers match' : `⚠️ Mismatch: ${calculatedTotal} vs ${progress.totalProcessed}`}`);
    
    return {
      success: true,
      progress,
      message: `Migration completed. Encrypted ${progress.totalEncrypted} documents. ${progress.totalFailed} failed. ${progress.totalSkippedEncrypted} documents were already encrypted.`,
    };
  } catch (error: any) {
    progress.status = 'failed';
    return {
      success: false,
      progress,
      message: `Migration failed: ${error.message}`,
    };
  }
}
