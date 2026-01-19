# Edge Cases Analysis: Change Encryption Code & Regenerate Recovery Codes

## 🔴 CRITICAL EDGE CASES IDENTIFIED

### 1. **changeEncryptionCode: Re-encryption Fails Partway Through**

**Problem**: If `reEncryptUserData` fails partway through:
- Some documents are encrypted with NEW key
- Some documents are still encrypted with OLD key
- User cannot unlock with either key (partial data encrypted with each)

**Current Behavior**: 
- Error is thrown
- localStorage is restored
- Encryption key is restored (old key)
- BUT: Data in Firestore is in inconsistent state

**Impact**: **DATA LOSS RISK** - User may not be able to decrypt all their data

**Fix Needed**: 
- Track which documents were successfully re-encrypted
- On failure, rollback re-encrypted documents back to old key
- OR: Use transactions/batches to ensure atomicity

---

### 2. **changeEncryptionCode: Re-encryption Succeeds But updateDoc Fails**

**Problem**: If re-encryption completes but `updateDoc` fails:
- All data is encrypted with NEW key
- But `encryptionSalt` in Firestore still points to OLD salt
- User cannot unlock with new code (salt mismatch)

**Current Behavior**: 
- Error is thrown
- localStorage has new salt
- Firestore has old salt
- User is locked out

**Impact**: **LOCKOUT RISK** - User cannot unlock encryption

**Fix Needed**:
- Update Firestore salt BEFORE starting re-encryption (risky but ensures consistency)
- OR: Use Firestore transaction to atomically update salt + recovery codes
- OR: Store re-encryption status and allow retry

---

### 3. **changeEncryptionCode: Old Code Verification After Lock**

**Problem**: We lock encryption BEFORE fully verifying old code works:
```typescript
// Line 500: Verify old code
const oldKey = await getEncryptionKey(oldCode, fetchSaltFromFirestore);

// Line 504: Lock encryption IMMEDIATELY
setEncryptionKey(null);
keyRef.current = null;

// Line 511: Initialize new code
await initializeEncryption(newCode);
```

If `initializeEncryption` fails after lock, user is locked out.

**Current Behavior**: 
- Error is thrown
- localStorage might be corrupted
- Encryption is locked
- User cannot unlock

**Impact**: **LOCKOUT RISK**

**Fix Needed**: 
- Don't lock until we're sure new code initialization succeeds
- OR: Better error recovery

---

### 4. **regenerateRecoveryCodes: Partial Encryption Failure**

**Problem**: If encryption of main code with recovery codes fails partway:
- Some `encryptedMainCodes` might be generated
- Others might fail
- `updateDoc` is atomic, so either all or none update

**Current Behavior**: 
- If any encryption fails, entire Promise.all fails
- updateDoc doesn't execute
- Old recovery codes remain
- This is actually SAFE ✅

**Status**: ✅ **HANDLED CORRECTLY** - Atomic update prevents partial state

---

### 5. **regenerateRecoveryCodes: Network Failure During updateDoc**

**Problem**: If `updateDoc` fails due to network:
- Old recovery codes remain
- User can retry

**Current Behavior**: 
- Error is thrown
- Old recovery codes remain
- User can retry

**Status**: ✅ **SAFE** - No data loss, user can retry

---

### 6. **Concurrent Operations**

**Problem**: What if user:
- Starts `changeEncryptionCode`
- Before it completes, starts `regenerateRecoveryCodes`
- Or starts another `changeEncryptionCode`

**Current Behavior**: 
- No locking mechanism
- Could cause race conditions
- Data corruption possible

**Impact**: **DATA CORRUPTION RISK**

**Fix Needed**: 
- Add operation lock flag
- Prevent concurrent encryption operations
- Show "Operation in progress" UI

---

### 7. **changeEncryptionCode: localStorage Corruption**

**Problem**: If localStorage is corrupted during process:
- We restore `currentStored`
- But what if `currentStored` itself is corrupted?

**Current Behavior**: 
- We restore what was stored
- If corrupted, user might be locked out

**Impact**: **LOCKOUT RISK**

**Fix Needed**: 
- Validate localStorage before using
- Fetch salt from Firestore as fallback

---

### 8. **changeEncryptionCode: Re-encryption Progress Tracking**

**Problem**: If re-encryption fails partway:
- We don't know which documents were re-encrypted
- Cannot rollback
- Cannot resume

**Current Behavior**: 
- Error is thrown
- No rollback mechanism
- User must retry entire operation

**Impact**: **DATA INCONSISTENCY RISK**

**Fix Needed**: 
- Track re-encryption progress
- Store checkpoint
- Allow resume/rollback

---

## 🟠 HIGH PRIORITY EDGE CASES

### 9. **regenerateRecoveryCodes: Wrong Main Code**

**Problem**: If user enters wrong main code:
- `getEncryptionKey` fails
- Error is thrown
- Old recovery codes remain

**Status**: ✅ **HANDLED CORRECTLY** - Error prevents invalid update

---

### 10. **changeEncryptionCode: Old Code Doesn't Match**

**Problem**: If old code doesn't match:
- `getEncryptionKey` fails
- Error is thrown
- No changes made

**Status**: ✅ **HANDLED CORRECTLY** - Error prevents invalid change

---

### 11. **Both Functions: Missing encryptionSalt in Firestore**

**Problem**: If `encryptionSalt` is missing:
- `fetchSaltFromFirestore` returns null
- `getEncryptionKey` fails
- Error is thrown

**Status**: ✅ **HANDLED CORRECTLY** - Error prevents invalid operation

---

## 📋 RECOMMENDED FIXES

### Priority 1 (CRITICAL):

1. **Fix re-encryption atomicity**:
   - Use Firestore transactions where possible
   - Track re-encryption progress
   - Implement rollback on failure

2. **Fix salt update timing**:
   - Update salt AFTER re-encryption completes successfully
   - Use transaction to ensure atomicity
   - OR: Store re-encryption status flag

3. **Add operation locking**:
   - Prevent concurrent encryption operations
   - Show "Operation in progress" UI
   - Disable buttons during operations

### Priority 2 (HIGH):

4. **Improve error recovery**:
   - Better localStorage validation
   - Fallback to Firestore salt
   - Clear error messages

5. **Add progress tracking**:
   - Store re-encryption checkpoint
   - Allow resume on failure
   - Show detailed progress

### Priority 3 (MEDIUM):

6. **Add validation**:
   - Validate localStorage before using
   - Verify old code before locking
   - Check Firestore state before operations
