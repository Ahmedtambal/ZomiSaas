# Zomi Wealth SaaS - Quick Reference Guide
## Phase One - Administrator Guide

---

## Daily Administrator Checklist

### Morning Checks (5 minutes)
- [ ] Log into system and verify dashboard loads
- [ ] Check for any failed login alerts
- [ ] Review overnight audit log summary
- [ ] Verify backup completed successfully

### User Management
- [ ] Process any pending user access requests
- [ ] Generate invite codes for approved new users
- [ ] Deactivate accounts for leavers

### Data Quality
- [ ] Check for incomplete employee records
- [ ] Verify recent data entries for accuracy
- [ ] Update employee statuses as needed

---

## Common Administrative Tasks

### 1. Creating a New User Account

**Time Required:** 2 minutes

**Steps:**
1. Settings → Team Management
2. Click "Generate Invite Code"
3. Select role: User, Admin, or Owner
4. Copy the generated code
5. Send to new user via email
6. Code expires in 2 hours

**Remember:** Only generate code when person is ready to register immediately.

---

### 2. Deactivating a User Account

**Time Required:** 1 minute

**When to Use:**
- Employee leaves the organisation
- User no longer requires access
- Security concern with account

**Steps:**
1. Settings → Team Management
2. Find user in list
3. Click "Deactivate"
4. Confirm action
5. User is logged out immediately

**Note:** This preserves their audit trail.

---

### 3. Reviewing Audit Logs

**Time Required:** 10 minutes (monthly review)

**What to Look For:**
- Unusual access patterns
- After-hours activity
- Failed login attempts
- Mass data exports
- Changes to sensitive records

**Steps:**
1. Settings → Audit Logs
2. Filter by date range (last 30 days)
3. Sort by action type
4. Export to Excel for analysis
5. Document any concerns

**Red Flags:**
- Multiple failed logins from same user
- Access from unusual locations
- Bulk exports of employee data
- Changes to audit logs (should be impossible)

---

### 4. Adding New Employees

**Time Required:** 3 minutes per employee

**Required Information:**
- Full name
- National Insurance number
- Date of birth
- Employment start date
- Department/company
- Job title
- Pensionable salary
- Pension start date
- Service status (usually "Active")
- Gender

**Steps:**
1. Members → Add New Employee
2. Complete all required fields (marked with *)
3. System validates data automatically
4. Click "Save"
5. Confirm employee appears in list

**Validation Errors:**
- NI number: Must be format AA123456A
- Date of birth: Person must be at least 16
- Pension start date: Must be in future
- Salary: Must be positive number

---

### 5. Bulk Import from Excel

**Time Required:** 10 minutes for 100 employees

**Before You Start:**
1. Download the Excel template
2. Ensure data is clean and complete
3. Check for duplicate NI numbers
4. Verify all dates are in correct format

**Import Steps:**
1. Members → Import
2. Click "Download Template"
3. Fill in your data following column headers exactly
4. Save as .xlsx file
5. Click "Upload File"
6. Review validation errors if any
7. Fix errors in Excel
8. Re-upload
9. Click "Confirm Import"

**Common Errors:**
- Date format wrong (use DD/MM/YYYY)
- Missing required fields
- Duplicate NI numbers
- Text in number fields
- Future dates of birth

---

### 6. Generating Reports

**Time Required:** 5 minutes

**Available Reports:**
- Current employee list
- Pension liability summary
- Age distribution
- Gender diversity
- Department breakdown
- New starters this month
- Leavers this quarter

**Steps:**
1. Navigate to relevant section:
   - Dashboard for KPI reports
   - Members for employee lists
2. Set filters (status, date range, department)
3. Click "Export"
4. Choose format (Excel or PDF)
5. Download file

**Security Reminder:** Exported files contain personal data - handle securely.

---

### 7. Monthly Compliance Review

**Time Required:** 30 minutes

**Task List:**

**User Access Review:**
- [ ] Review all active user accounts
- [ ] Verify each user still needs access
- [ ] Check roles are appropriate
- [ ] Deactivate orphaned accounts
- [ ] Document review in compliance log

**Audit Log Review:**
- [ ] Export previous month's logs
- [ ] Review for unusual patterns
- [ ] Investigate suspicious activity
- [ ] Document findings
- [ ] Report concerns to DPO

**Data Quality:**
- [ ] Check for incomplete records
- [ ] Update leaver statuses
- [ ] Verify pension start dates
- [ ] Correct any errors
- [ ] Run validation report

**Backup Verification:**
- [ ] Confirm daily backups running
- [ ] Check backup file sizes
- [ ] Test one restore if possible
- [ ] Document backup status

---

## Security Best Practices

### Password Management

**Your Password Should:**
- Be at least 12 characters (8 is minimum)
- Include mix of uppercase, lowercase, numbers, symbols
- Be unique to this system
- Be changed every 90 days
- Never be shared with anyone

**Your Password Should NOT:**
- Be written down
- Be saved in browser
- Contain your name or company name
- Be reused from other systems
- Be shared via email or messaging

### Session Security

**Always:**
- Lock your screen when leaving desk
- Log out at end of day
- Use private/incognito mode on shared computers
- Close browser completely when finished

**Never:**
- Leave system open unattended
- Access on public Wi-Fi without VPN
- Share your login with colleagues
- Let others use your account

### Data Protection

**When Working with Employee Data:**
- Only access what you need for your job
- Don't take screenshots containing personal data
- Lock your device before stepping away
- Don't discuss employee data in public areas
- Shred printed reports when finished

**When Exporting Data:**
- Only export what's necessary
- Password-protect Excel files
- Delete exports when no longer needed
- Don't email to personal accounts
- Store securely on company network

---

## Troubleshooting Common Issues

### Issue: User Can't Log In

**Possible Causes:**
1. Wrong password (check caps lock)
2. Account locked after 5 failed attempts
3. Account deactivated
4. Invite code expired

**Solutions:**
1. Check if account is active in Team Management
2. Wait 15 minutes if locked out
3. Generate new invite code if expired
4. Verify email address is correct

---

### Issue: Data Import Fails

**Common Causes:**
1. Wrong file format (must be .xlsx)
2. Validation errors in data
3. Duplicate NI numbers
4. Missing required fields

**Solutions:**
1. Download fresh template
2. Review error messages carefully
3. Fix data in Excel
4. Check date formats (DD/MM/YYYY)
5. Verify all required fields filled

---

### Issue: Dashboard Shows Wrong Numbers

**Possible Causes:**
1. Filter applied
2. Browser cache
3. Recent import not reflected yet
4. Status filter changed

**Solutions:**
1. Clear all filters
2. Refresh browser (Ctrl+F5)
3. Wait 2 minutes for updates
4. Check status filter is "All"

---

### Issue: Can't Generate Invite Code

**Possible Causes:**
1. Not enough permissions
2. Network issue
3. Organisation limit reached

**Solutions:**
1. Verify you're Admin or Owner
2. Check internet connection
3. Contact support if persistent

---

## Emergency Procedures

### Security Breach Suspected

**Immediate Actions:**
1. Note the time and what you observed
2. Do NOT log out (preserves evidence)
3. Take screenshot if safe to do so
4. Email security@zomiwealth.com immediately
5. Note any IP addresses or user IDs involved
6. Do not discuss with others yet

**Contact:** security@zomiwealth.com (24/7)

---

### System Unavailable

**Check:**
1. Is your internet working? (try another website)
2. Are colleagues also affected?
3. Check status.zomiwealth.com for planned maintenance

**If Unplanned Outage:**
1. Note the time
2. Try different browser
3. Wait 5 minutes
4. Email support@zomiwealth.com if still down
5. Document for incident log

---

### Data Subject Access Request (DSAR)

**Timeline:** Must respond within 30 days

**Steps:**
1. Log request immediately
2. Verify requester's identity (photo ID)
3. Search system for all their data
4. Export their complete record:
   - Personal details
   - Employment history
   - Audit trail entries
5. Review for third-party information
6. Redact if necessary
7. Send via secure method
8. Document completion

**Contact:** dpo@zomiwealth.com for guidance

---

### Suspected Data Breach

**Definition:** Unauthorised access, loss, or disclosure of personal data

**Immediate Actions (First Hour):**
1. Document what happened
2. Contain the issue (e.g., deactivate compromised account)
3. Preserve evidence (don't delete logs)
4. Notify security@zomiwealth.com
5. Don't notify affected individuals yet (compliance team decides)

**What Happens Next:**
- Compliance team assesses risk
- ICO notification if required (within 72 hours)
- Individual notification if high risk
- Investigation and remediation
- Procedures updated

---

## Quick Reference Tables

### User Roles Comparison

| Permission | Owner | Admin | User |
|------------|-------|-------|------|
| View dashboard | ✓ | ✓ | ✓ |
| View employees | ✓ | ✓ | ✓ |
| Add/edit employees | ✓ | ✓ | ✓ |
| Delete employees | ✓ | ✓ | ✗ |
| Create users | ✓ | ✓ | ✗ |
| Create admins | ✓ | ✓ | ✗ |
| Create owners | ✓ | ✗ | ✗ |
| View audit logs | ✓ | ✓ | ✗ |
| Export data | ✓ | ✓ | Limited |
| Modify settings | ✓ | Limited | ✗ |

---

### Data Retention Periods

| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| Active employee records | Duration of employment + 7 years | HMRC requirement |
| Leaver records | 7 years after departure | HMRC requirement |
| Audit logs | 7 years | FCA/regulatory |
| User accounts (deactivated) | 7 years | Accountability |
| Backup files | 30 days rolling | Business continuity |
| Exported reports | Delete after use | Data minimisation |

---

### Validation Rules

| Field | Rule | Example |
|-------|------|---------|
| NI Number | AA123456A format | QQ123456C |
| Date of Birth | At least 16 years ago | 01/01/2000 |
| Pension Start Date | In the future | 01/06/2030 |
| Email | Valid email format | user@company.com |
| Salary | Positive number | 45000.00 |
| Postcode | UK postcode format | SW1A 1AA |
| Phone | UK phone format | 020 7946 0958 |

---

### Security Settings

| Setting | Default Value | Range | Recommendation |
|---------|---------------|-------|----------------|
| Session timeout | 15 minutes | 5-60 min | Keep at 15 |
| Password length | 8 characters | 8-32 | Use 12+ |
| Password complexity | All types | N/A | Cannot disable |
| Failed login limit | 5 attempts | Fixed | Cannot change |
| Lockout duration | 15 minutes | Fixed | Cannot change |
| Invite code expiry | 2 hours | 1-24 hours | 2 hours |

---

## Keyboard Shortcuts

### General Navigation
- `Ctrl+K` - Open search
- `Ctrl+/` - Show shortcuts menu
- `Esc` - Close dialogs
- `Tab` - Move between fields

### Members Table
- `Ctrl+F` - Focus search box
- `↑↓` - Navigate rows
- `Enter` - Open selected record
- `Ctrl+E` - Export data

### Forms
- `Ctrl+S` - Save (when in form)
- `Ctrl+Z` - Undo
- `Tab` - Next field
- `Shift+Tab` - Previous field

---

## Contact Information

**General Support:**  
support@zomiwealth.com  
Monday-Friday, 9:00-17:00 GMT  
Response: 4 hours

**Security Incidents:**  
security@zomiwealth.com  
24/7 for critical issues  
Response: 1 hour

**Data Protection:**  
dpo@zomiwealth.com  
For GDPR queries  
Response: 24 hours

**Technical Emergency:**  
Phone: [To be provided]  
For system outages only

---

## Monthly Admin Checklist

**Week 1:**
- [ ] Review all user accounts
- [ ] Check for leavers needing deactivation
- [ ] Generate quarterly compliance report

**Week 2:**
- [ ] Review audit logs
- [ ] Update employee statuses
- [ ] Check data quality reports

**Week 3:**
- [ ] Verify backups running
- [ ] Test restore process
- [ ] Update documentation

**Week 4:**
- [ ] User access audit
- [ ] Security review
- [ ] Plan next month's tasks

---

**Document Version:** 1.0  
**Last Updated:** February 2026  
**Next Review:** May 2026

*Keep this guide accessible for quick reference during daily administration tasks.*
