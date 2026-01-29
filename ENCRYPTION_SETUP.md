# 🔐 ENCRYPTION SETUP GUIDE

## Phase 2: Field-Level Encryption Implementation Complete ✅

You now have **GDPR-compliant field-level encryption** for all high-risk PII data.

---

## 🎯 WHAT'S ENCRYPTED

### Automatically Encrypted Fields:

**Employee Table**:
- `ni_number` (National Insurance Number) - **CRITICAL**
- `pensionable_salary` (Financial data)
- `date_of_birth` (Identity verification)

**Form Submissions**:
- `submission_data` (Entire JSONB containing all PII)

All encryption happens automatically in the service layer before database storage.

---

## 🔑 STEP 1: GENERATE ENCRYPTION KEY

**⚠️ CRITICAL: Do this ONCE and NEVER LOSE THIS KEY**

### Generate Key:

```bash
# Run this command to generate your encryption key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

**Output example**:
```
8fHg9xK2mP4vQ7sN1zW3bYcD6eR0tUoI5lKjHgFdSaQ=
```

---

## 📝 STEP 2: ADD KEY TO ENVIRONMENT

### Local Development (.env):

```bash
# Add to backend/.env file
ENCRYPTION_KEY=8fHg9xK2mP4vQ7sN1zW3bYcD6eR0tUoI5lKjHgFdSaQ=
```

### Production (Render.com):

1. Go to your backend service on Render.com
2. Navigate to **Environment** tab
3. Add environment variable:
   - **Key**: `ENCRYPTION_KEY`
   - **Value**: `your-generated-key-here`
4. Click **Save Changes**

---

## 🔒 STEP 3: BACKUP YOUR KEY (CRITICAL!)

### Option A: AWS Secrets Manager

```bash
aws secretsmanager create-secret \
    --name prod/zomi/encryption-key \
    --secret-string "your-encryption-key-here" \
    --description "Zomi field-level encryption key (DO NOT DELETE)"
```

### Option B: Azure Key Vault

```bash
az keyvault secret set \
    --vault-name your-vault-name \
    --name zomi-encryption-key \
    --value "your-encryption-key-here"
```

### Option C: Manual Backup (Minimum)

1. Store key in password manager (1Password, LastPass, Bitwarden)
2. Store encrypted copy in secure cloud storage
3. Store physical copy in safe deposit box
4. **DO NOT commit to Git**
5. **DO NOT share via Slack/Email**

---

## ✅ STEP 4: VERIFY ENCRYPTION WORKS

### Test Encryption:

```bash
cd backend
python -c "
from app.services.encryption_service import get_encryption_service
enc = get_encryption_service()

# Test encryption
plaintext = 'AB123456C'  # Sample NI Number
encrypted = enc.encrypt(plaintext)
decrypted = enc.decrypt(encrypted)

print(f'Plaintext: {plaintext}')
print(f'Encrypted: {encrypted}')
print(f'Decrypted: {decrypted}')
print(f'Match: {plaintext == decrypted}')
"
```

**Expected output**:
```
Plaintext: AB123456C
Encrypted: gAAAABl...base64string...==
Decrypted: AB123456C
Match: True
```

---

## 🚀 STEP 5: DATABASE SCHEMA CHANGES (IMPORTANT!)

### Required Changes:

The `submission_data` column in `form_submissions` table is currently `JSONB`. 

**For encrypted data, it should be `TEXT`**:

```sql
-- Connect to Supabase SQL Editor
-- Run this migration:

BEGIN;

-- Change submission_data from JSONB to TEXT (for encrypted data)
ALTER TABLE form_submissions 
ALTER COLUMN submission_data TYPE TEXT 
USING submission_data::TEXT;

-- Add comment
COMMENT ON COLUMN form_submissions.submission_data IS 
'Encrypted JSONB data containing PII (ni_number, salary, DOB, addresses)';

COMMIT;
```

**Alternative**: Keep as JSONB if you want to query unencrypted data later. But for GDPR compliance, TEXT is recommended.

---

## 📊 HOW IT WORKS

### Encryption Flow (Create Employee):

```
1. User submits form with PII
   ↓
2. Frontend → Backend API
   ↓
3. EncryptionService.encrypt_employee_pii()
   - ni_number → encrypted
   - pensionable_salary → encrypted
   - date_of_birth → encrypted
   ↓
4. Store encrypted data in Supabase
   ↓
5. Database stores ciphertext (unreadable)
```

### Decryption Flow (Get Employee):

```
1. Frontend requests employee data
   ↓
2. Backend fetches encrypted data from Supabase
   ↓
3. EncryptionService.decrypt_employee_pii()
   - Decrypt ni_number
   - Decrypt pensionable_salary
   - Decrypt date_of_birth
   ↓
4. Return decrypted data to frontend
```

---

## 🛡️ SECURITY FEATURES

✅ **AES-256 Encryption** (via Fernet)  
✅ **HMAC Authentication** (prevents tampering)  
✅ **Automatic key validation** (fails fast if wrong key)  
✅ **Per-field encryption** (selective protection)  
✅ **JSONB encryption** (entire submission_data)  
✅ **GDPR Compliant** (right to be forgotten ready)  

---

## ⚠️ IMPORTANT WARNINGS

### ❌ DON'T:
- **DON'T lose the encryption key** - data is UNRECOVERABLE
- **DON'T commit .env to Git** - key will be exposed
- **DON'T share key via email/Slack** - use secure vault
- **DON'T change key without re-encrypting data** - breaks everything

### ✅ DO:
- **DO backup key in multiple secure locations**
- **DO use environment variables only**
- **DO test encryption before production**
- **DO rotate key annually** (requires data migration)

---

## 🔄 KEY ROTATION (Future Phase 4)

When you need to rotate the encryption key:

1. Generate new key
2. Set `NEW_ENCRYPTION_KEY` environment variable
3. Run migration script:
   ```python
   # Decrypt with old key, re-encrypt with new key
   old_enc = EncryptionService(old_key)
   new_enc = EncryptionService(new_key)
   
   for employee in all_employees:
       decrypted = old_enc.decrypt_employee_pii(employee)
       re_encrypted = new_enc.encrypt_employee_pii(decrypted)
       update_database(re_encrypted)
   ```
4. Replace `ENCRYPTION_KEY` with new key
5. Delete old key securely

---

## 🧪 TESTING IN DEVELOPMENT

### Create Test Employee:

```bash
curl -X POST http://localhost:8000/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "surname": "Doe",
    "ni_number": "AB123456C",
    "pensionable_salary": "50000",
    "date_of_birth": "1990-01-15"
  }'
```

### Check Database:

```sql
-- Connect to Supabase SQL Editor
SELECT 
    first_name,
    surname,
    ni_number,  -- Should be encrypted (base64 string)
    pensionable_salary,  -- Should be encrypted
    date_of_birth  -- Should be encrypted
FROM employees 
LIMIT 1;
```

**Expected**: You should see base64-encoded strings like `gAAAABl...` instead of plaintext.

---

## 📞 TROUBLESHOOTING

### Error: "ENCRYPTION_KEY not found"
**Solution**: Add `ENCRYPTION_KEY` to your `.env` file or Render environment variables.

### Error: "Invalid ENCRYPTION_KEY format"
**Solution**: Key must be a valid Fernet key (44 characters, base64-encoded). Regenerate using the command above.

### Error: "Decryption failed: Invalid token"
**Solution**: The encryption key changed, or data is corrupted. If key was lost, data is unrecoverable.

### Data looks like gibberish in database
**✅ This is CORRECT!** Encrypted data should look like: `gAAAABl7K3...base64...==`

### Data not decrypting in API
**Check**: Ensure `get_encryption_service()` is called in the route handler and applied correctly.

---

## 🎓 NEXT STEPS (Phase 3)

After confirming encryption works:

1. **Add email/phone hashing** for searchability
2. **Database schema updates** (hash columns)
3. **Migrate existing data** to encrypted format
4. **Audit logging** for decrypt operations
5. **Key rotation mechanism**

---

## 📋 COMPLIANCE CHECKLIST

- [x] Encryption at rest (Supabase provides)
- [x] Encryption in transit (HTTPS/TLS)
- [x] Field-level encryption (Phase 2 ✅)
- [x] ni_number encrypted
- [x] Financial data encrypted
- [x] Date of birth encrypted
- [x] submission_data (JSONB) encrypted
- [ ] Email/phone hashing (Phase 3)
- [ ] Audit trail for PII access (Phase 3)
- [ ] Key rotation mechanism (Phase 4)
- [ ] Data retention policy (Phase 4)

---

**Status**: ✅ **READY FOR PRODUCTION** (after key setup)

**Last Updated**: January 29, 2026  
**Classification**: CONFIDENTIAL
