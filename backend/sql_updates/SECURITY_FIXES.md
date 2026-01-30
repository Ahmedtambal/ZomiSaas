# Supabase Security Fixes

## 1. Database Function Search Path Security

**Issue**: Four database functions have mutable search_path, which is a security risk.

**Fix**: Run the SQL migration `backend/sql_updates/fix_function_search_path_security.sql` in your Supabase SQL Editor.

This adds `SET search_path = ''` to all functions to prevent SQL injection via search path manipulation.

**Functions Fixed**:
- `create_form_version_on_update`
- `populate_employee_auto_fields`
- `increment_duplicate_count`
- `get_user_email_by_id`

## 2. RLS Enabled but No Policies

**Issue**: Three tables have RLS enabled but no policies exist, making them inaccessible.

**Fix**: Run the SQL migration `backend/sql_updates/fix_rls_no_policies.sql` in your Supabase SQL Editor.

This disables RLS on backend-only tables since authorization is handled by the FastAPI backend.

**Tables Fixed**:
- `form_sections`
- `form_submissions`
- `form_versions`

**Note**: These tables are accessed exclusively through the backend API using service role key. The backend implements authorization by checking `organization_id` on every query.

## 3. Auth Leaked Password Protection

**Issue**: Leaked password protection is currently disabled.

**Fix**: Enable this in Supabase Dashboard:
1. Go to **Authentication** → **Providers** → **Email**
2. Scroll to **Password Settings**
3. Enable **"Check passwords against HaveIBeenPwned"**

This will prevent users from using passwords that have been leaked in data breaches.

## After Applying Fixes

Run the Supabase database linter again to verify all warnings are resolved:
```bash
# In Supabase Dashboard: Database → Database Linter
```
