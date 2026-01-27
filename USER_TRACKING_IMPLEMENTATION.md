# Employee Creation Flow - User Tracking Implementation

## Overview
This document explains how the application tracks which user creates each employee record, enabling proper audit trails and database triggers to function correctly.

---

## The Problem
Database triggers run in isolation from the application. They have **no access** to:
- Browser sessions
- JWT tokens
- Logged-in user information

Without explicit user identification, the trigger cannot populate audit fields like `created_by_user_id`.

---

## The Solution
We implement a **3-tier tracking system** that passes user identity from the frontend through the backend to the database.

---

## Implementation Flow

### 1️⃣ Frontend (React/TypeScript)
**File:** `frontend/src/services/employeeService.ts`

```typescript
// Create employee
// Note: created_by_user_id is automatically set by the backend from the JWT token
async createEmployee(employee: Partial<Employee>): Promise<Employee> {
  const response = await api.post('/employees', employee);
  return response.data;
}
```

**What happens:**
- User clicks "Create Employee" button
- Frontend calls API with employee data (name, email, etc.)
- **JWT token** is automatically attached via axios interceptor:
  ```typescript
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  ```

### 2️⃣ Backend API (Python/FastAPI)
**File:** `backend/app/routes/employees.py`

```python
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_employee(
    employee_data: Dict[str, Any], 
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Create a new employee
    
    The created_by_user_id is automatically set from the authenticated user's JWT token.
    This allows the database trigger to populate audit fields and track who created the record.
    """
    organization_id = current_user["organization_id"]
    user_id = current_user["id"]
    
    # Set creator and organization from authenticated user
    # This is CRITICAL for the database trigger to work properly
    employee_data["organization_id"] = organization_id
    employee_data["created_by_user_id"] = user_id
    
    # Insert into database
    response = db_service.client.table("employees").insert(employee_data).execute()
    return response.data[0]
```

**What happens:**
- JWT token is decoded by `get_current_user` dependency
- User's ID and organization ID are extracted
- These values are **added to the employee data** before database insertion
- Database receives complete data including `created_by_user_id`

### 3️⃣ Database (Supabase/PostgreSQL)
**Schema:** `public.employees`

```sql
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  created_by_user_id uuid NULL,  -- THIS FIELD
  created_at timestamp NOT NULL DEFAULT now(),
  -- ... other fields
  CONSTRAINT employees_created_by_fkey 
    FOREIGN KEY (created_by_user_id) 
    REFERENCES auth.users (id) ON DELETE SET NULL
);

-- Trigger that uses created_by_user_id
CREATE TRIGGER on_employee_insert_auto_populate 
BEFORE INSERT ON employees 
FOR EACH ROW 
EXECUTE FUNCTION populate_employee_auto_fields();
```

**What happens:**
- Database receives INSERT with `created_by_user_id` populated
- Trigger `on_employee_insert_auto_populate` fires
- Trigger function can use `NEW.created_by_user_id` to:
  - Look up user details
  - Populate audit logs
  - Apply business rules based on user role
  - Track creation history

---

## Special Case: Public Form Submissions

**File:** `backend/app/routes/public_forms.py`

Public forms (employee onboarding links) have **no authenticated user**, so we handle them differently:

```python
employee_data = {
    # ... employee fields
    "created_by_user_id": None,  # Public submission - no authenticated user
    "submitted_via": "form_link",
    "submission_token": token,
}
```

**Why this works:**
- The column is **nullable** (`NULL` allowed)
- The trigger checks if `created_by_user_id IS NULL` and handles accordingly
- We track the submission via `submission_token` instead

---

## Data Flow Diagram

```
┌──────────────────┐
│   Frontend       │
│  (React App)     │
│                  │
│  User clicks     │
│  "Create"        │
└────────┬─────────┘
         │
         │ HTTP POST /api/employees
         │ Authorization: Bearer <JWT>
         │
         ▼
┌──────────────────┐
│   Backend API    │
│  (FastAPI)       │
│                  │
│  1. Decode JWT   │
│  2. Extract      │
│     user_id      │
│  3. Add to data  │
└────────┬─────────┘
         │
         │ INSERT INTO employees
         │ (organization_id, created_by_user_id, ...)
         │
         ▼
┌──────────────────┐
│   Database       │
│  (Supabase)      │
│                  │
│  1. Trigger fires│
│  2. Uses         │
│     created_by   │
│  3. Populates    │
│     audit fields │
└──────────────────┘
```

---

## Testing the Implementation

### Test 1: Authenticated Employee Creation
```bash
# 1. Login as user
POST /api/auth/login
{
  "email": "admin@company.com",
  "password": "password"
}

# 2. Create employee
POST /api/employees
Authorization: Bearer <token>
{
  "first_name": "John",
  "surname": "Doe",
  "company_id": "..."
}

# 3. Verify in database
SELECT id, first_name, created_by_user_id 
FROM employees 
WHERE first_name = 'John';

# Should show:
# created_by_user_id = <your user ID>
```

### Test 2: Public Form Submission
```bash
# Submit via public form link
POST /api/public/forms/{token}/submit
{
  "forename": "Jane",
  "surname": "Smith",
  ...
}

# Verify in database
SELECT id, first_name, created_by_user_id, submitted_via
FROM employees 
WHERE first_name = 'Jane';

# Should show:
# created_by_user_id = NULL
# submitted_via = 'form_link'
```

---

## Troubleshooting

### Issue: created_by_user_id is always NULL

**Causes:**
1. JWT token not being sent from frontend
2. Backend not extracting user_id from token
3. Backend not adding field before insert

**Check:**
```python
# In employees.py, add logging:
logger.info(f"Creating employee with user_id: {user_id}")
logger.info(f"Employee data: {employee_data}")
```

### Issue: Database trigger not working

**Causes:**
1. Trigger not created/enabled
2. Trigger function has errors

**Check:**
```sql
-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_employee_insert_auto_populate';

-- Test trigger manually
INSERT INTO employees (organization_id, created_by_user_id, first_name, surname)
VALUES ('org-uuid', 'user-uuid', 'Test', 'User');
```

---

## Security Considerations

1. **Never trust frontend data** for `created_by_user_id`
   - Always extract from JWT token server-side
   - Prevents users from impersonating others

2. **Validate organization scope**
   - Ensure user can only create employees in their organization
   - Backend checks: `employee_data["organization_id"] = current_user["organization_id"]`

3. **Audit trail integrity**
   - `created_by_user_id` should never be updated after creation
   - Use separate `updated_by_user_id` field for modifications

---

## Summary

✅ **Frontend:** Sends JWT token with every request (automatic)  
✅ **Backend:** Extracts user ID from token, adds to employee data  
✅ **Database:** Receives complete data, trigger can use creator info  
✅ **Public Forms:** Explicitly set `created_by_user_id = NULL`  
✅ **Security:** Server-side validation prevents tampering  

This architecture ensures **proper audit trails** while maintaining **security** and **data integrity**.
