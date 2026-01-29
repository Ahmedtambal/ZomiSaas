# PII Encryption Data Flow

## 📝 Form Submission → Database Storage

### When a user submits a form (e.g., New Employee Form):

**Input Data (Plaintext):**
```json
{
  "ni_number": "AB123456C",
  "date_of_birth": "1990-05-15",
  "pensionable_salary": 45000,
  "email_address": "john.doe@example.com",
  "mobile_number": "07700900123",
  "home_number": "01234567890"
}
```

**What Gets Stored in Database:**

| Field | Original Column | Encrypted Column | What's Stored |
|-------|----------------|------------------|---------------|
| **NI Number** | `ni_number` | ❌ Not used | ✅ **Encrypted base64** (e.g., `Z0FBQUFB...`) |
| **Email** | `email_address` | ❌ Not used | ✅ **Encrypted base64** |
| **Mobile** | `mobile_number` | ❌ Not used | ✅ **Encrypted base64** |
| **Home Phone** | `home_number` | ❌ Not used | ✅ **Encrypted base64** |
| **Date of Birth** | `date_of_birth` | `date_of_birth_encrypted` | `date_of_birth`: **Plaintext** `1990-05-15` (DATE)<br>`date_of_birth_encrypted`: ✅ **Encrypted base64** (TEXT) |
| **Salary** | `pensionable_salary` | `pensionable_salary_encrypted` | `pensionable_salary`: **Plaintext** `45000` (NUMERIC)<br>`pensionable_salary_encrypted`: ✅ **Encrypted base64** (TEXT) |

### Why This Strategy?

**TEXT Columns (ni_number, email, mobile, home):**
- ✅ CAN store encrypted base64 strings
- ✅ Encrypted **IN-PLACE** (overwrites original value)
- ✅ No extra column needed

**Non-TEXT Columns (date_of_birth, pensionable_salary):**
- ❌ CANNOT store encrypted base64 strings (wrong data type)
- ✅ Encrypted to **SEPARATE *_encrypted column**
- ✅ Original column keeps plaintext for DB compatibility
- ✅ Application uses encrypted version

---

## 👀 Frontend Display → What User Sees

### When frontend fetches employee data:

**Backend Process:**
1. Fetch from database (encrypted values)
2. **Automatically decrypt** using `decrypt_employee_pii()`
3. Return decrypted plaintext to frontend

**What Frontend Receives (API Response):**
```json
{
  "ni_number": "AB123456C",              // ✅ Decrypted from encrypted ni_number
  "date_of_birth": "1990-05-15",         // ✅ Decrypted from date_of_birth_encrypted
  "pensionable_salary": 45000,           // ✅ Decrypted from pensionable_salary_encrypted
  "email_address": "john.doe@example.com", // ✅ Decrypted from encrypted email_address
  "mobile_number": "07700900123",        // ✅ Decrypted from encrypted mobile_number
  "home_number": "01234567890"           // ✅ Decrypted from encrypted home_number
}
```

**What User Sees on Screen:**
```
National Insurance Number: AB123456C
Date of Birth: 15/05/1990
Salary: £45,000
Email: john.doe@example.com
Mobile: 07700 900123
Home: 01234 567890
```

---

## 🔒 Security Summary

### At Rest (in Database):
- ✅ **6 PII fields FULLY ENCRYPTED**
- ✅ Even if database is breached, data is unreadable
- ✅ Encryption key stored separately (environment variable)

### In Transit (API responses):
- ✅ HTTPS encryption (TLS)
- ✅ JWT authentication required
- ✅ Decrypted only for authorized users

### On Frontend (displayed to user):
- ✅ **Plaintext** (decrypted)
- ✅ User needs to see readable data
- ✅ Only accessible to authenticated users

---

## 📊 Example Database Row

```sql
-- What's actually stored in the database:

ni_number: 'Z0FBQUFBQm5nV3RoMW9UT...'  -- ENCRYPTED (TEXT)
ni_number_encrypted: NULL              -- Not used for TEXT columns

date_of_birth: '1990-05-15'            -- PLAINTEXT (DATE - for compatibility)
date_of_birth_encrypted: 'Z0FBQUFB...' -- ENCRYPTED (TEXT) ← App uses this

pensionable_salary: 45000              -- PLAINTEXT (NUMERIC - for compatibility)
pensionable_salary_encrypted: 'Z0F...' -- ENCRYPTED (TEXT) ← App uses this

email_address: 'Z0FBQUFCbm5nV3Ro...'   -- ENCRYPTED (TEXT)
email_address_encrypted: NULL          -- Not used for TEXT columns

mobile_number: 'Z0FBQUFCbm5nV3Ro...'   -- ENCRYPTED (TEXT)
home_number: 'Z0FBQUFCbm5nV3Ro...'     -- ENCRYPTED (TEXT)
```

---

## 🎯 Key Points

1. **Form submissions automatically encrypt** before storing
2. **Database stores encrypted values** (secure at rest)
3. **Frontend automatically receives decrypted data** (readable)
4. **Users see normal, readable information** (no base64 strings)
5. **Zero changes needed to frontend code** (backend handles everything)

The encryption/decryption is **completely transparent** to the frontend! 🎉
