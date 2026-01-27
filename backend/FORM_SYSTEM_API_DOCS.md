# Form System API Documentation - Option 4 Implementation

## Overview
This document describes the comprehensive form management system with separate submissions architecture, templates, versioning, and analytics.

## Database Schema Changes

### Before Running Backend
Execute `backend/sql_updates/create_form_submissions_architecture.sql` in Supabase SQL Editor to:
- Add columns to `forms` table (version, is_template, tags, parent_form_id, duplicate_count)
- Create `form_submissions` table
- Create `form_versions` table  
- Create `form_sections` table
- Add columns to `form_tokens` table (analytics, settings, name, deactivated_at)
- Create triggers for auto-versioning and duplicate tracking

---

## API Endpoints

### 1. Form Submissions API (`/api/form-submissions`)

#### **POST** `/api/form-submissions`
Create a new form submission.

**Request Body:**
```json
{
  "form_id": "uuid",
  "form_version": 1,
  "submission_data": {
    "field_name": "field_value",
    ...
  },
  "status": "pending",
  "company_id": "uuid",
  "employee_id": "uuid",
  "token_id": "uuid",
  "notes": "Optional notes"
}
```

**Response:** Created submission object with ID

---

#### **GET** `/api/form-submissions`
List form submissions with filters.

**Query Parameters:**
- `form_id`: Filter by form (optional)
- `status_filter`: Filter by status (pending/reviewing/approved/rejected/completed)
- `company_id`: Filter by company
- `employee_id`: Filter by employee
- `limit`: Results per page (default 50)
- `offset`: Pagination offset (default 0)

**Response:**
```json
{
  "data": [...],
  "count": 123,
  "limit": 50,
  "offset": 0
}
```

---

#### **GET** `/api/form-submissions/{submission_id}`
Get a specific submission by ID.

**Response:** Submission object with full data

---

#### **PUT** `/api/form-submissions/{submission_id}/status`
Update submission status and review notes.

**Request Body:**
```json
{
  "status": "approved",
  "notes": "Optional review notes"
}
```

**Response:** Updated submission object

---

#### **DELETE** `/api/form-submissions/{submission_id}`
Delete a submission.

**Response:** `{ "message": "Submission deleted successfully" }`

---

#### **GET** `/api/form-submissions/export/csv?form_id={form_id}&status_filter={status}`
Export submissions as CSV file.

**Query Parameters:**
- `form_id`: Required - form to export
- `status_filter`: Optional - filter by status

**Response:** CSV file download with headers:
- Submission ID, Status, Submitted At, Employee ID, Company ID
- All form field values

---

### 2. Form Templates API (`/api/forms`)

#### **GET** `/api/forms/templates`
List all form templates.

**Query Parameters:**
- `tags`: Comma-separated tags to filter (optional)

**Response:** Array of template forms

---

#### **POST** `/api/forms/{form_id}/mark-as-template`
Mark an existing form as a template.

**Request Body:**
```json
{
  "tags": ["employee", "onboarding", "hr"]
}
```

**Response:** Updated form object

---

#### **POST** `/api/forms/{form_id}/duplicate`
Duplicate an existing form.

**Request Body:**
```json
{
  "name": "Copy of Original Form",
  "linked_company_id": "uuid",
  "is_template": false
}
```

**Response:** New duplicated form object

---

#### **GET** `/api/forms/{form_id}/duplicates`
List all forms duplicated from this form.

**Response:**
```json
{
  "original_form_id": "uuid",
  "duplicate_count": 5,
  "duplicates": [...]
}
```

---

#### **POST** `/api/forms/{form_id}/create-from-template`
Create a new form instance from a template.

**Request Body:**
```json
{
  "name": "Instance Name",
  "linked_company_id": "uuid"
}
```

**Response:** New form instance object

---

#### **GET** `/api/forms/{form_id}/versions`
List all versions of a form.

**Response:** Array of form versions with snapshots

---

#### **GET** `/api/forms/{form_id}/versions/{version_number}`
Get a specific version of a form.

**Response:** Form version object with snapshot data

---

### 3. Link Analytics API (`/api/analytics`)

#### **GET** `/api/analytics/tokens/{token_id}/analytics`
Get analytics for a specific form link.

**Response:**
```json
{
  "token_id": "uuid",
  "token_name": "Client Portal Link",
  "form_id": "uuid",
  "clicks": 45,
  "completions": 23,
  "completion_rate": 51.11,
  "last_clicked_at": "2024-01-01T12:00:00Z",
  "last_completed_at": "2024-01-01T13:00:00Z",
  "is_active": true,
  "expires_at": "2024-12-31T23:59:59Z"
}
```

---

#### **GET** `/api/analytics/forms/{form_id}/analytics`
Get aggregated analytics for all links of a form.

**Response:**
```json
{
  "form_id": "uuid",
  "form_name": "Employee Onboarding",
  "total_links": 5,
  "active_links": 3,
  "expired_links": 2,
  "total_clicks": 150,
  "total_completions": 89,
  "overall_completion_rate": 59.33,
  "status_breakdown": {
    "pending": 10,
    "completed": 79
  },
  "links": [
    {
      "token_id": "uuid",
      "token_name": "HR Link",
      "clicks": 45,
      "completions": 23,
      "completion_rate": 51.11,
      "is_active": true,
      "is_expired": false
    }
  ]
}
```

---

#### **POST** `/api/analytics/tokens/{token_id}/track-click`
Track a click on a form link (public endpoint, no auth).

**Response:** `{ "message": "Click tracked successfully" }`

---

#### **PUT** `/api/analytics/tokens/{token_id}`
Update token settings.

**Request Body:**
```json
{
  "name": "New Link Name",
  "expires_at": "2024-12-31T23:59:59Z",
  "settings": {
    "notification_email": "admin@example.com",
    "redirect_url": "https://example.com/thanks"
  }
}
```

**Response:** Updated token object

---

#### **PUT** `/api/analytics/tokens/{token_id}/deactivate`
Deactivate a form link (soft delete).

**Response:** Updated token with deactivated_at timestamp

---

#### **PUT** `/api/analytics/tokens/{token_id}/reactivate`
Reactivate a deactivated form link.

**Response:** Updated token with null deactivated_at

---

## Updated Existing APIs

### Forms API (`/api/forms`)

#### **POST** `/api/forms`
Create a new form - NOW SUPPORTS:

**New Optional Fields:**
```json
{
  "is_template": false,
  "tags": ["employee", "onboarding"],
  "parent_form_id": "uuid"
}
```

---

#### **PUT** `/api/forms/{form_id}`
Update a form - NOW SUPPORTS:

**New Optional Fields:**
```json
{
  "is_template": true,
  "tags": ["updated", "tags"]
}
```

**Note:** Version snapshot automatically created by database trigger when form_data changes.

---

### Public Forms API (`/api/public`)

#### **POST** `/api/public/forms/{token}/submit`
Submit a public form - NOW:
- Creates record in `form_submissions` table instead of `forms` table
- Tracks completion in token analytics
- Links submission to form version
- Sets status to "completed"

---

## Workflow Example

### Creating and Using a Form Template

1. **Create a form template:**
```bash
POST /api/forms
{
  "name": "Employee Onboarding",
  "description": "Standard onboarding form",
  "form_data": { "fields": [...] },
  "is_template": true,
  "tags": ["employee", "onboarding"]
}
```

2. **Create instance from template:**
```bash
POST /api/forms/{template_id}/create-from-template
{
  "name": "Acme Corp Onboarding",
  "linked_company_id": "company-uuid"
}
```

3. **Generate form link:**
```bash
POST /api/forms/{form_id}/generate-link
{
  "name": "HR Department Link",
  "expires_at": "2024-12-31T23:59:59Z",
  "max_submissions": 50
}
```

4. **Track analytics:**
```bash
GET /api/analytics/forms/{form_id}/analytics
```

5. **View submissions:**
```bash
GET /api/form-submissions?form_id={form_id}&status_filter=pending
```

6. **Update submission status:**
```bash
PUT /api/form-submissions/{submission_id}/status
{
  "status": "approved",
  "notes": "All information verified"
}
```

7. **Export submissions:**
```bash
GET /api/form-submissions/export/csv?form_id={form_id}
```

---

## Status Workflow

Form submissions follow this status workflow:
- **pending**: Initial submission, awaiting review
- **reviewing**: Currently under review
- **approved**: Approved by reviewer
- **rejected**: Rejected by reviewer
- **completed**: Fully processed

---

## Database Triggers

### Auto-Versioning
When a form's `form_data` is updated:
1. Trigger `create_form_version_on_update()` fires
2. Old version saved to `form_versions` table
3. Form's `version` number incremented

### Duplicate Tracking
When a form is created with `parent_form_id`:
1. Trigger `increment_duplicate_count()` fires
2. Parent form's `duplicate_count` incremented

---

## Next Steps - Frontend Integration

1. **Update FormManagementPage** to show template badge and duplicate button
2. **Create SubmissionsListPage** to view all submissions for a form
3. **Create TemplateLibrary** component to browse/select templates
4. **Create LinkAnalyticsDashboard** to display click/completion metrics
5. **Add CSV Export Button** to submissions list
6. **Add Status Workflow UI** for reviewing submissions
7. **Update public form submission** to call track-click endpoint

---

## Migration Checklist

- [ ] Execute SQL migration in Supabase SQL Editor
- [ ] Verify new tables created (form_versions, form_submissions, form_sections)
- [ ] Verify new columns added (forms.version, forms.is_template, etc.)
- [ ] Verify triggers are active
- [ ] Deploy backend with new routes
- [ ] Test API endpoints with Postman/curl
- [ ] Update frontend to use new APIs
- [ ] Test end-to-end: create template → create instance → submit → view submissions → export CSV

---

## Testing Endpoints

### Test Form Submission Creation
```bash
curl -X POST http://localhost:8000/api/form-submissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "form_id": "form-uuid",
    "submission_data": {"name": "Test User"},
    "status": "pending"
  }'
```

### Test CSV Export
```bash
curl -X GET "http://localhost:8000/api/form-submissions/export/csv?form_id=form-uuid" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o submissions.csv
```

### Test Link Analytics
```bash
curl -X GET http://localhost:8000/api/analytics/tokens/token-uuid/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Benefits Summary

✅ **Separate Submissions**: Each form submission stored independently  
✅ **Templates**: Reusable form templates with tags  
✅ **Versioning**: Automatic version history with snapshots  
✅ **Analytics**: Track clicks, completions, conversion rates  
✅ **Workflow**: Status progression for submissions  
✅ **Export**: CSV download for data analysis  
✅ **Duplication**: Track form copies and relationships  
✅ **Soft Delete**: Deactivate links without losing data  

---

## API URL Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/form-submissions` | POST | Create submission |
| `/api/form-submissions` | GET | List submissions |
| `/api/form-submissions/{id}` | GET | Get submission |
| `/api/form-submissions/{id}/status` | PUT | Update status |
| `/api/form-submissions/{id}` | DELETE | Delete submission |
| `/api/form-submissions/export/csv` | GET | Export CSV |
| `/api/forms/templates` | GET | List templates |
| `/api/forms/{id}/mark-as-template` | POST | Mark as template |
| `/api/forms/{id}/duplicate` | POST | Duplicate form |
| `/api/forms/{id}/duplicates` | GET | List duplicates |
| `/api/forms/{id}/create-from-template` | POST | Create from template |
| `/api/forms/{id}/versions` | GET | List versions |
| `/api/forms/{id}/versions/{version}` | GET | Get version |
| `/api/analytics/tokens/{id}/analytics` | GET | Token analytics |
| `/api/analytics/forms/{id}/analytics` | GET | Form analytics |
| `/api/analytics/tokens/{id}/track-click` | POST | Track click |
| `/api/analytics/tokens/{id}` | PUT | Update token |
| `/api/analytics/tokens/{id}/deactivate` | PUT | Deactivate token |
| `/api/analytics/tokens/{id}/reactivate` | PUT | Reactivate token |
