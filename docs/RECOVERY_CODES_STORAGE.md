# Recovery Codes Storage and Retrieval

## Overview
Recovery codes provide an alternative way to unlock encryption if the user forgets their main encryption code. This document explains how recovery codes are stored, retrieved, and validated.

## What Gets Stored in Firestore

When encryption is enabled or recovery codes are regenerated, the following data is stored in the user's Firestore document (`users/{userId}`):

### 1. `recoveryCodeHashes` (Array of Strings)
- **Type**: `string[]`
- **Format**: Base64-encoded SHA-256 hashes
- **Encrypted**: ❌ NO - Stored as plain text
- **Purpose**: Used to verify if an entered recovery code matches any stored recovery code
- **Example**: `["abc123...", "def456...", ...]` (10 hashes for 10 recovery codes)

### 2. `recoveryCodeSalt` (String)
- **Type**: `string`
- **Format**: Base64-encoded 16-byte random salt
- **Encrypted**: ❌ NO - Stored as plain text
- **Purpose**: Used to derive encryption keys from recovery codes (PBKDF2 salt)
- **Example**: `"xyz789..."`

### 3. `encryptedMainCodes` (Array of Strings)
- **Type**: `string[]`
- **Format**: Encrypted main encryption code in format `"ivBase64:encryptedBase64"`
- **Encrypted**: ✅ YES - Each recovery code encrypts the main code with its own derived key
- **Purpose**: Stores the main encryption code encrypted with each recovery code's key
- **Example**: `["iv1:enc1", "iv2:enc2", ...]` (10 encrypted main codes, one per recovery code)

## Storage Process

### When Encryption is Enabled (`enableEncryption`)

1. **Generate Recovery Codes**
   ```typescript
   const recoveryCodes = generateRecoveryCodes(10);
   // Example: ["ABCD-EFGH-IJKL", "MNOP-QRST-UVWX", ...]
   ```

2. **Hash Recovery Codes**
   ```typescript
   const recoveryCodeHashes = await Promise.all(
     recoveryCodes.map(code => hashRecoveryCode(code))
   );
   // Each hash is SHA-256 of the recovery code, base64-encoded
   ```

3. **Generate Recovery Code Salt**
   ```typescript
   const recoveryCodeSalt = crypto.getRandomValues(new Uint8Array(16));
   const recoveryCodeSaltBase64 = btoa(...);
   ```

4. **Encrypt Main Code with Each Recovery Code**
   - For each recovery code:
     - Derive a key from the recovery code using PBKDF2 with `recoveryCodeSalt`
     - Encrypt the main encryption code with this derived key
     - Store as `"ivBase64:encryptedBase64"`

5. **Store in Firestore**
   ```typescript
   await setDocumentNonBlocking(userRef, {
     isEncrypted: true,
     encryptionEnabledAt: new Date().toISOString(),
     recoveryCodeHashes: recoveryCodeHashes,        // Plain hashes
     recoveryCodeSalt: recoveryCodeSaltBase64,      // Plain salt
     encryptedMainCodes: encryptedMainCodes,         // Encrypted main codes
   }, { merge: true }, key);
   ```

**Important**: Recovery code fields (`recoveryCodeHashes`, `recoveryCodeSalt`, `encryptedMainCodes`) are **NOT** in the `ENCRYPTION_FIELD_MAPS` for User documents, so they are stored as plain text (except `encryptedMainCodes` which are already encrypted with recovery code keys).

## Retrieval Process (New Browser)

### When Unlocking with Recovery Code (`unlockEncryption`)

1. **Fetch User Document Directly from Firestore**
   ```typescript
   const userRef = doc(firestore, 'users', userId);
   const userDocSnapshot = await getDoc(userRef);
   const userDocData = userDocSnapshot.data() as UserData;
   ```
   - Uses `getDoc` directly (not the hook) to ensure fresh data
   - Works even if `userData` from `useDoc` hook isn't loaded yet

2. **Validate Recovery Code Data Exists**
   ```typescript
   if (!userDocData?.recoveryCodeHashes || 
       !userDocData?.recoveryCodeSalt || 
       !userDocData?.encryptedMainCodes) {
     throw new EncryptionError('Recovery codes not configured');
   }
   ```

3. **Normalize Entered Recovery Code**
   ```typescript
   let normalizedCode = code.trim().toUpperCase().replace(/\s+/g, '');
   // Remove dashes, validate 12 characters, then reformat with dashes
   normalizedCode = `${rawCode.slice(0, 4)}-${rawCode.slice(4, 8)}-${rawCode.slice(8, 12)}`;
   ```

4. **Hash the Entered Code**
   ```typescript
   const inputHash = await hashRecoveryCode(normalizedCode);
   ```

5. **Find Matching Hash**
   ```typescript
   const recoveryCodeIndex = userDocData.recoveryCodeHashes.findIndex(
     (storedHash: string) => storedHash === inputHash
   );
   ```

6. **Decrypt Main Code**
   - Derive key from recovery code using `recoveryCodeSalt`
   - Decrypt the main code from `encryptedMainCodes[recoveryCodeIndex]`
   - Extract the main encryption code

7. **Derive Encryption Key from Main Code**
   ```typescript
   const key = await getEncryptionKey(mainCode);
   // Uses salt from localStorage (stored during initialization)
   ```

## Why This Works Across Browsers

### Key Points:

1. **Recovery Code Fields Are Not Encrypted**
   - `recoveryCodeHashes` and `recoveryCodeSalt` are stored as plain text
   - This allows verification without needing the main encryption key
   - Can be read from Firestore in any browser/session

2. **Direct Firestore Fetch**
   - Uses `getDoc` directly instead of relying on `useDoc` hook
   - Ensures fresh data even if hooks haven't loaded yet
   - Works immediately in new browser sessions

3. **Hash-Based Verification**
   - Recovery codes are never stored in plain text
   - Only SHA-256 hashes are stored
   - Even if Firestore is compromised, recovery codes can't be extracted

4. **Main Code Encryption**
   - Main code is encrypted with each recovery code's derived key
   - Each recovery code has its own encrypted copy
   - Decryption only works with the correct recovery code

## Security Considerations

### ✅ What's Protected:
- Recovery codes themselves (only hashes stored)
- Main encryption code (encrypted with recovery code keys)
- User's financial data (encrypted with main code)

### ⚠️ What's Not Encrypted (by design):
- `recoveryCodeHashes` - Needed for verification without main key
- `recoveryCodeSalt` - Needed to derive recovery code keys
- `isEncrypted` flag - Needed to know encryption is enabled

### 🔒 Security Properties:
1. **Recovery codes cannot be extracted** from Firestore (only hashes stored)
2. **Main code cannot be extracted** without a valid recovery code
3. **Recovery codes work independently** - don't need main code to verify
4. **Each recovery code is unique** - regenerating invalidates old ones

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Enable Encryption                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Generate 10 Recovery Codes        │
        │  Format: XXXX-XXXX-XXXX            │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Hash Each Recovery Code            │
        │  SHA-256 → Base64                   │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Generate Recovery Code Salt      │
        │  16 random bytes                   │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  For Each Recovery Code:           │
        │  1. Derive key (PBKDF2 + salt)     │
        │  2. Encrypt main code              │
        │  3. Store as "iv:encrypted"        │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Store in Firestore:              │
        │  - recoveryCodeHashes (plain)     │
        │  - recoveryCodeSalt (plain)       │
        │  - encryptedMainCodes (encrypted) │
        └───────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Unlock with Recovery Code                      │
│              (New Browser/Session)                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Fetch User Doc from Firestore    │
        │  (getDoc - direct fetch)          │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Normalize Entered Code           │
        │  Trim, uppercase, format         │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Hash Entered Code                │
        │  SHA-256 → Base64                 │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Find Matching Hash               │
        │  Compare with recoveryCodeHashes  │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Derive Key from Recovery Code    │
        │  PBKDF2 + recoveryCodeSalt        │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Decrypt Main Code                │
        │  Using recovery key               │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Derive Encryption Key            │
        │  From main code + localStorage    │
        │  salt                             │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Unlock Encryption                │
        │  Set encryptionKey in memory     │
        └───────────────────────────────────┘
```

## Troubleshooting

### Issue: "Invalid recovery code" in new browser

**Possible Causes:**
1. Recovery code fields not stored correctly
2. Recovery code format mismatch (spaces, dashes, casing)
3. Hash comparison failing

**Debug Steps:**
1. Check Firestore: Verify `recoveryCodeHashes`, `recoveryCodeSalt`, `encryptedMainCodes` exist
2. Verify format: Recovery codes should be `XXXX-XXXX-XXXX` (uppercase, with dashes)
3. Check normalization: Code should be normalized before hashing

### Issue: Recovery codes work in one browser but not another

**Possible Causes:**
1. `userData` hook not loaded yet (should use `getDoc` directly - already fixed)
2. Recovery code fields encrypted (should NOT be encrypted - check encryption map)
3. Stale data in hook vs fresh Firestore data

**Solution:** The code now uses `getDoc` directly to fetch fresh data, bypassing hook loading issues.
