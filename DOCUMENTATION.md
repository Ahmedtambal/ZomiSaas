# Zomi Wealth SaaS Platform
## Phase One Documentation

**Version:** Phase One (February 2026)  
**Organisation:** Zomi Wealth Management  
**Document Classification:** Internal Use

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Core Features and Modules](#core-features-and-modules)
4. [User Roles and Permissions](#user-roles-and-permissions)
5. [Data Protection and GDPR Compliance](#data-protection-and-gdpr-compliance)
6. [UK Regulatory Compliance](#uk-regulatory-compliance)
7. [Security Measures](#security-measures)
8. [Technology Services](#technology-services)
9. [User Guide](#user-guide)
10. [Administrative Controls](#administrative-controls)
11. [Compliance Monitoring](#compliance-monitoring)
12. [Support and Maintenance](#support-and-maintenance)

---

## Executive Summary

Zomi Wealth SaaS is a comprehensive pension and employee management platform designed specifically for UK wealth management firms. Phase One delivers essential workforce management tools with built-in compliance features that meet UK regulatory requirements and GDPR standards.

The platform enables organisations to:
- Manage employee records securely with field-level encryption
- Track pension obligations and key performance indicators
- Generate compliance reports for regulatory oversight
- Control user access with role-based permissions
- Maintain complete audit trails of all system activities

This system has been built with data protection at its core, ensuring that all personally identifiable information (PII) is encrypted and handled in accordance with UK GDPR requirements.

---

## System Overview

### Purpose

Zomi Wealth SaaS provides wealth management organisations with a centralised platform to manage their workforce, track pension obligations, and maintain compliance with UK financial regulations. The system replaces manual spreadsheets and disconnected systems with a unified, secure solution.

### Key Benefits

**For Management:**
- Real-time visibility of workforce metrics and pension obligations
- Executive dashboard showing key performance indicators
- Historical trend analysis for workforce planning
- Automated compliance tracking

**For Compliance Officers:**
- Complete audit logs of all data access and modifications
- GDPR-compliant data handling and encryption
- Role-based access controls to restrict sensitive information
- Built-in data retention and privacy controls

**For Administrators:**
- Secure user management with invite-based registration
- Field-level encryption for sensitive personal data
- Automated session management and activity tracking
- Comprehensive security event logging

**For General Users:**
- Simple, intuitive interface requiring no technical knowledge
- Secure access to authorised employee information
- Quick search and filtering capabilities
- Mobile-friendly design for access anywhere

---

## Core Features and Modules

### 1. Executive Dashboard

The dashboard provides at-a-glance visibility of your organisation's key workforce metrics:

**Current Metrics Display:**
- **Total Employees:** Current headcount across all service statuses
- **Active Employees:** Number of currently employed staff members
- **Pension Liability:** Total financial obligation for pension commitments
- **Average Salary:** Mean pensionable salary across the workforce
- **Days to Next Pension:** Countdown to the next employee's pension start date

**Workforce Analytics:**
- **Weekly Employee Growth:** Track recruitment trends over the past 16 weeks
- **Age Distribution:** Visualise your workforce demographics by age brackets
- **Gender Split:** Monitor workforce diversity with gender breakdowns
- **Departmental Analysis:** View employee distribution across business units

**Historical Trends:**
- 12-month view of key metrics showing how your workforce has evolved
- Trend lines for headcount, pension liability, and salary averages
- Comparative analysis against previous periods

**Purpose:** This module allows senior management to make informed decisions based on real-time workforce data, identify trends, and plan for future obligations.

### 2. Members Management

The core employee database where all workforce records are stored and managed:

**Employee Records Include:**
- Personal details (name, contact information, address)
- Employment information (department, job title, start date)
- Financial data (salary, pension contributions)
- Sensitive information (National Insurance number, date of birth)
- Service status (Active, Pensioner, Leaver)

**Key Features:**
- **Advanced Search:** Find employees quickly using any field
- **Filtering:** Sort by department, status, or other criteria
- **Bulk Import:** Upload multiple employee records from Excel files
- **Individual Forms:** Add or edit employee details through structured forms
- **Data Validation:** Automatic checks ensure data quality and consistency
- **Field-Level Encryption:** Sensitive data (NI numbers, dates of birth, salaries) are encrypted at rest

**Purpose:** This module serves as your single source of truth for all employee information, replacing scattered spreadsheets with a centralised, secure database.

### 3. Forms and Data Collection

Dynamic form system for capturing structured employee information:

**Form Builder:**
- Create custom forms tailored to your organisation's needs
- Define field types (text, numbers, dates, dropdowns)
- Set validation rules to ensure data quality
- Reorder fields through drag-and-drop interface

**Form Renderer:**
- Clean, user-friendly forms that guide users through data entry
- Real-time validation prevents errors before submission
- Mobile-responsive design for data collection on any device
- Automatic saving to prevent data loss

**Use Cases:**
- New employee onboarding questionnaires
- Annual data verification exercises
- Pension enrolment forms
- Exit interview templates

**Purpose:** Standardise data collection across your organisation whilst maintaining flexibility to adapt to changing requirements.

### 4. Settings and Configuration

Comprehensive controls for system administrators:

**Profile Management:**
- Update your personal details (name, job title)
- Change your password with strong security requirements
- View your role and permissions within the system

**Security Settings:**
- Change password functionality with complexity requirements
- Session timeout after 15 minutes of inactivity
- Account lockout after failed login attempts
- Email notifications for security events

**Team Management (Admin/Owner Only):**
- View all users within your organisation
- Generate invite codes for new users
- Assign roles and permissions (Owner, Admin, User)
- Deactivate user accounts when staff leave
- Set invite code expiry times

**Purpose:** Maintain complete control over who can access your organisation's data and what actions they can perform.

---

## User Roles and Permissions

The system operates on a three-tier role structure:

### Owner Role

**Access Level:** Full system access  
**Typical User:** Managing Director, Chief Executive

**Permissions:**
- Complete access to all employee records
- View all KPI dashboards and analytics
- Create and manage user accounts
- Generate invite codes for administrators and users
- Modify organisation settings
- Access complete audit logs
- Export all system data

**Responsibilities:**
- Overall system governance
- User access approval
- Compliance oversight

### Admin Role

**Access Level:** Administrative access  
**Typical User:** HR Manager, Operations Director

**Permissions:**
- Access to all employee records
- View all KPI dashboards and analytics
- Create and manage standard user accounts
- Generate invite codes for users
- Modify employee records
- Run compliance reports
- View audit logs for their organisation

**Responsibilities:**
- Day-to-day user management
- Employee data maintenance
- First-line compliance monitoring

### User Role

**Access Level:** Standard access  
**Typical User:** HR Officers, Payroll Staff, Compliance Officers

**Permissions:**
- View employee records (within their organisation)
- Search and filter employee database
- Access KPI dashboards
- Update their own profile information
- Submit data through forms

**Restrictions:**
- Cannot create or manage other users
- Cannot modify system settings
- Cannot access audit logs
- Cannot export sensitive data in bulk

**Purpose:** Provides operational staff with the access they need whilst protecting sensitive administrative functions.

---

## Data Protection and GDPR Compliance

Zomi Wealth SaaS has been designed from the ground up to comply with the UK General Data Protection Regulation (UK GDPR).

### Legal Basis for Processing

The platform processes personal data under the following lawful bases:

1. **Contract Performance** (Article 6(1)(b)): Processing employee data as necessary for employment contracts
2. **Legal Obligation** (Article 6(1)(c)): Maintaining records for HMRC, pension regulators, and FCA requirements
3. **Legitimate Interests** (Article 6(1)(f)): Business operations requiring workforce management

**Special Category Data:** National Insurance numbers and dates of birth are processed under Article 9(2)(b) as necessary for employment, social security, and social protection law.

### Data Minimisation

The system only collects data that is strictly necessary for:
- Employment record keeping
- Pension obligation tracking
- Regulatory compliance
- Payroll processing

No unnecessary personal information is collected or stored.

### Data Security

**Encryption:**
- **Field-Level Encryption:** Sensitive fields (NI numbers, dates of birth, pensionable salaries) are encrypted using AES-256-CBC encryption with HMAC verification
- **In-Transit Encryption:** All data transmitted between your browser and our servers uses TLS 1.3 encryption
- **At-Rest Encryption:** Database is encrypted at rest using industry-standard protocols

**Access Controls:**
- Role-based access ensures users only see data relevant to their duties
- Multi-factor authentication available for enhanced security
- Session management with automatic timeout after inactivity
- Account lockout after multiple failed login attempts

**Audit Logging:**
- Every action (view, create, update, delete) is logged with timestamp and user ID
- Logs include IP addresses for security monitoring
- Audit trails maintained for 7 years to meet regulatory requirements
- Logs are tamper-proof and cannot be modified by any user

### Data Subject Rights

The system supports all UK GDPR data subject rights:

**Right to Access (Article 15):**
- Individuals can request copies of their personal data
- Administrators can export individual records in portable format

**Right to Rectification (Article 16):**
- Incorrect data can be corrected through the Members Management interface
- All changes are logged in the audit trail

**Right to Erasure (Article 17):**
- Employee records can be permanently deleted (subject to legal retention requirements)
- Deletion is logged and cannot be undone

**Right to Restrict Processing (Article 18):**
- Employee status can be changed to "Leaver" to restrict active processing
- Data remains for compliance purposes but is clearly marked as inactive

**Right to Data Portability (Article 20):**
- Export functionality allows data to be transferred in machine-readable format
- Excel export maintains data structure for migration to other systems

**Right to Object (Article 21):**
- Processing ceases when an employee leaves (status changed to "Leaver")
- Marketing communications are not sent through this system

### Data Retention

**Active Employees:** Data retained throughout employment period  
**Leavers:** Records retained for 7 years after departure (HMRC requirement)  
**Audit Logs:** Retained for 7 years (regulatory requirement)  
**Automatic Deletion:** System can be configured to automatically delete records after retention period expires

### Privacy by Design

- Encryption is applied automatically to sensitive fields
- Default permissions are restrictive (least privilege principle)
- Personal data is segregated by organisation (no cross-organisation access)
- Data minimisation enforced through form design

### Data Processing Records

The system maintains records of processing activities as required by Article 30 UK GDPR:
- Purpose of processing documented for each data category
- Categories of data subjects clearly defined (employees, pensioners)
- Technical security measures documented
- International transfers: None (all data stored within UK/EU)

---

## UK Regulatory Compliance

### Financial Conduct Authority (FCA)

**Senior Managers & Certification Regime (SM&CR):**
- Audit trails support accountability requirements
- User roles align with responsibility mapping
- Activity logging demonstrates oversight

**SYSC Requirements (Systems and Controls):**
- Documented security controls
- Regular access reviews supported by user management tools
- Incident logging capabilities

### Pensions Regulator

**Record Keeping Requirements:**
- Pension start dates tracked for all employees
- Contribution records maintained with field-level encryption
- Historical data preserved for regulatory reporting

**Scheme Administration:**
- Automatic calculations of pension liability
- Alerts for upcoming pension start dates
- Data quality controls prevent errors

### HM Revenue & Customs (HMRC)

**PAYE Record Keeping:**
- National Insurance numbers stored securely
- Employment start and end dates recorded
- 7-year retention period enforced

**Real Time Information (RTI) Support:**
- Export capabilities for payroll data
- Date validation ensures accuracy for submissions

### Information Commissioner's Office (ICO)

**Data Protection Registration:**
- Processing activities clearly documented
- Data flows mapped and understood
- Technical security measures implemented

**Breach Notification Compliance:**
- Security event logging enables rapid breach detection
- Audit trails support incident investigation
- User activity monitoring detects suspicious access patterns

---

## Security Measures

### Authentication and Access Control

**Password Requirements:**
- Minimum 8 characters
- Must contain uppercase, lowercase, numbers, and special characters
- Passwords hashed using bcrypt (industry standard)
- No password reuse

**Session Management:**
- JWT (JSON Web Token) based authentication
- 15-minute inactivity timeout
- Automatic logout on browser close
- Tokens expire after 30 minutes (refreshable)

**Account Lockout:**
- 5 failed login attempts trigger 15-minute lockout
- IP addresses logged for security monitoring
- Lockout notifications sent to administrators

**Invite-Based Registration:**
- No public registration - all users must be invited
- Invite codes expire after 2 hours
- One-time use codes prevent unauthorised access
- Organisation automatically assigned upon registration

### Infrastructure Security

**Hosting:**
- Render.com (cloud platform with ISO 27001 certification)
- Automatic SSL/TLS certificates
- DDoS protection included
- 99.9% uptime SLA

**Database:**
- Supabase (PostgreSQL-based platform)
- Row-level security enabled
- Automated backups every 24 hours
- Point-in-time recovery available

**Network Security:**
- HTTPS enforced (no unencrypted traffic)
- CORS policies restrict cross-origin requests
- Rate limiting prevents abuse
- API endpoints protected by JWT authentication

### Application Security

**Input Validation:**
- All user input sanitised to prevent XSS attacks
- SQL injection prevented through parameterised queries
- File uploads restricted and validated
- Character encoding validated

**Output Encoding:**
- HTML sanitisation prevents script injection
- CSV exports properly escaped
- API responses validated against schemas

**Security Headers:**
- Content Security Policy enforced
- X-Frame-Options prevents clickjacking
- Strict-Transport-Security enabled
- X-Content-Type-Options prevents MIME sniffing

### Monitoring and Incident Response

**Security Event Logging:**
- All login attempts (successful and failed)
- Data access events
- Permission changes
- User account modifications
- Suspicious activity patterns

**Monitoring:**
- Real-time error tracking
- Performance monitoring
- Uptime monitoring with alerts
- Security event correlation

**Incident Response:**
- Documented procedures for security breaches
- Automated alerts for suspicious activity
- 24-hour response time commitment
- Post-incident review process

---

## Technology Services

### Core Technology Stack

**Frontend (User Interface):**
- **React 18:** Modern JavaScript framework for responsive user interfaces
- **TypeScript:** Adds type safety to prevent coding errors
- **TailwindCSS:** Utility-first CSS framework for consistent design
- **Recharts:** Data visualisation library for charts and graphs
- **Purpose:** Creates a fast, intuitive interface that works on any device

**Backend (Server Logic):**
- **FastAPI:** Modern Python framework for API development
- **Python 3.13:** Latest version for security and performance
- **Pydantic:** Data validation ensures data quality
- **HTTPX:** Async HTTP client for external service communication
- **Purpose:** Handles business logic, security, and data processing

**Database:**
- **Supabase (PostgreSQL):** Secure, scalable database platform
- **Row-Level Security:** Database-enforced access controls
- **Automatic Backups:** Daily backups with point-in-time recovery
- **Purpose:** Stores all application data securely

**Authentication:**
- **Supabase Auth:** Managed authentication service
- **JWT Tokens:** Industry-standard token-based authentication
- **bcrypt Hashing:** Secure password storage
- **Purpose:** Ensures only authorised users can access the system

**Encryption:**
- **Fernet (AES-256-CBC):** Symmetric encryption for sensitive data
- **HMAC Verification:** Prevents tampering with encrypted data
- **Secure Key Management:** Encryption keys stored separately from data
- **Purpose:** Protects sensitive personal information

### Third-Party Services

**Hosting and Infrastructure:**
- **Render.com:** Application hosting with automatic deployments
  - Location: EU/UK data centres
  - Compliance: ISO 27001, SOC 2 Type II
  - Purpose: Runs the application reliably 24/7

**Email Services (Future):**
- **Planned:** Email notifications for password resets and invites
- **Compliance:** Will be UK/EU-based provider only

**Monitoring:**
- **Render Logs:** Application logging and error tracking
- **Purpose:** Detect and resolve issues proactively

### Data Residency

**Primary Region:** United Kingdom  
**Backup Region:** European Union  
**Data Transfers:** No international data transfers outside UK/EU  
**Purpose:** Ensures UK GDPR compliance and data sovereignty

### Service Level Agreements

**Availability:** 99.9% uptime (less than 45 minutes downtime per month)  
**Response Time:** API responses under 200ms for 95% of requests  
**Backup Frequency:** Every 24 hours with 30-day retention  
**Recovery Time Objective:** 4 hours maximum  
**Recovery Point Objective:** Maximum 24 hours of data loss

---

## User Guide

### Getting Started

#### 1. Receiving Your Invitation

When an administrator creates your account, you'll receive an invitation code. This is a unique code that allows you to register for the system.

**Important:** Invitation codes expire after 2 hours for security reasons. If your code expires, contact your administrator for a new one.

#### 2. Creating Your Account

1. Navigate to the registration page using the link provided
2. Enter the invitation code you received
3. Provide your details:
   - Full name
   - Email address (this will be your username)
   - Job title
   - Password (must meet security requirements)
4. Click "Sign Up"
5. You'll be logged in automatically

**Password Requirements:**
- At least 8 characters long
- Include uppercase letters (A-Z)
- Include lowercase letters (a-z)
- Include numbers (0-9)
- Include special characters (!@#$%^&*)

#### 3. Logging In

1. Visit the login page
2. Enter your email address
3. Enter your password
4. Click "Sign In"

**Security Note:** After 5 failed login attempts, your account will be locked for 15 minutes. If you've forgotten your password, contact your administrator.

### Daily Use

#### Viewing the Dashboard

The dashboard is the first screen you see after logging in. It shows:

- **Key metrics** at the top (total employees, pension liability, etc.)
- **Charts** showing workforce trends over time
- **Age distribution** graphs showing workforce demographics
- **Growth trends** displaying recent hiring patterns

**Tips:**
- Hover over charts to see detailed numbers
- Use the time period selectors to view different date ranges
- Dashboard updates automatically when new employee data is added

#### Searching for Employees

1. Click "Members" in the navigation menu
2. You'll see a table of all employees
3. Use the search box at the top to find specific people
4. Search works on names, departments, or any other field
5. Click on a row to view full employee details

**Advanced Search:**
- Use filters to narrow results by status (Active, Pensioner, Leaver)
- Sort columns by clicking the column header
- Pagination controls appear at the bottom for large databases

#### Adding New Employees

1. Navigate to Members → Add New Employee
2. Complete the form with employee details
3. Required fields are marked with an asterisk (*)
4. The system will validate data as you type
5. Click "Save" when complete

**Important Fields:**
- **National Insurance Number:** Automatically validated for correct format
- **Date of Birth:** Must be in the past and result in employee being at least 16 years old
- **Pension Start Date:** Must be in the future
- **Salary:** Automatically formatted as currency

#### Updating Employee Records

1. Find the employee using search
2. Click on their name to open their record
3. Click "Edit" button
4. Make your changes
5. Click "Save"

**Security:** All changes are logged in the audit trail with your user ID and timestamp.

#### Importing Multiple Employees

1. Navigate to Members → Import
2. Download the Excel template
3. Fill in your employee data following the template structure
4. Upload the completed file
5. System will validate all data before importing
6. Review any errors and correct them
7. Confirm import

**Data Validation:**
- System checks for duplicate National Insurance numbers
- Dates must be in correct format
- Required fields cannot be blank
- Invalid data is highlighted with clear error messages

### Managing Your Profile

#### Updating Your Details

1. Click your name in the top-right corner
2. Select "Settings"
3. Go to "Profile" tab
4. Update your name or job title
5. Click "Save Changes"

#### Changing Your Password

1. Go to Settings → Security
2. Enter your current password
3. Enter your new password (must meet security requirements)
4. Confirm new password
5. Click "Change Password"

**Security Tip:** Change your password every 90 days and never share it with anyone.

---

## Administrative Controls

### User Management (Admin and Owner Only)

#### Creating New Users

1. Navigate to Settings → Team Management
2. Click "Generate Invite Code"
3. Select the user's role:
   - **User:** Standard access for operational staff
   - **Admin:** Administrative access for managers
   - **Owner:** Full system access (only available to current Owners)
4. Set expiry time (default 2 hours)
5. Copy the generated code
6. Send to the new user via secure method (email, Teams, etc.)

**Best Practices:**
- Only generate codes when the person is ready to register
- Don't send codes via insecure channels (SMS, WhatsApp)
- Verify the person's identity before sending

#### Viewing Team Members

1. Go to Settings → Team Management
2. See list of all users in your organisation
3. Information displayed:
   - Name
   - Email address
   - Role
   - Last login date
   - Account status (Active/Inactive)

#### Deactivating User Accounts

When an employee leaves your organisation:

1. Go to Settings → Team Management
2. Find the user in the list
3. Click "Deactivate" next to their name
4. Confirm deactivation
5. User will be immediately logged out
6. They cannot log back in

**Important:** This does not delete their audit trail entries. All their historical actions remain in the system for compliance purposes.

### Audit Log Review

#### Accessing Audit Logs (Owner and Admin Only)

1. Navigate to Settings → Audit Logs
2. View chronological list of all system activities
3. Each entry shows:
   - Date and time
   - User who performed the action
   - Action type (create, update, delete, view)
   - Resource affected (employee record, user account, etc.)
   - IP address

#### Filtering Audit Logs

- **By User:** See all actions by a specific person
- **By Date Range:** View activity within specific timeframe
- **By Action Type:** Filter for only creates, updates, or deletes
- **By Resource:** See all changes to a specific employee record

#### Exporting Audit Logs

1. Set your filters
2. Click "Export"
3. Choose format (CSV or PDF)
4. Download file

**Compliance Note:** Audit logs should be reviewed monthly for unusual activity and exported quarterly for records.

### Data Export and Backup

#### Exporting Employee Data

1. Navigate to Members
2. Apply any filters to limit export if needed
3. Click "Export" button
4. Select format:
   - **Excel:** For further analysis or migration
   - **PDF:** For printing or archival
5. Download file

**Security Warning:** Exported files contain sensitive personal data. Store them securely and delete when no longer needed.

#### Backup Procedures

**Automatic Backups:**
- System automatically backs up all data every 24 hours
- Backups retained for 30 days
- Stored in geographically separate location

**Manual Exports:**
- Recommended before major system changes
- Should be performed monthly for additional protection
- Store encrypted backups offline

### System Configuration

#### Organisation Settings (Owner Only)

1. Navigate to Settings → Organisation
2. Update organisation name if required
3. Set data retention policies
4. Configure session timeout duration
5. Enable/disable features

#### Security Settings

**Session Timeout:**
- Default: 15 minutes of inactivity
- Range: 5-60 minutes
- Recommendation: Keep at 15 minutes for security

**Account Lockout:**
- Default: 5 failed attempts = 15-minute lockout
- Cannot be disabled (security requirement)

**Password Policy:**
- Cannot be weakened (compliance requirement)
- Complexity rules always enforced

---

## Compliance Monitoring

### Regular Compliance Checks

#### Monthly Tasks

**User Access Review:**
- Review all active user accounts
- Verify each user still requires access
- Check roles are appropriate for current job function
- Deactivate any orphaned accounts

**Audit Log Review:**
- Export previous month's audit logs
- Review for unusual activity patterns
- Investigate any suspicious access
- Document findings

**Data Quality Check:**
- Run validation reports
- Identify records with missing data
- Correct any errors found
- Update leaver statuses

#### Quarterly Tasks

**Full Access Audit:**
- Document who has access to what data
- Verify all access is appropriate
- Update role assignments if needed
- Report to data protection officer

**Backup Verification:**
- Verify backups are running successfully
- Test restore procedure
- Document results

**Security Review:**
- Review security event logs
- Check for failed login patterns
- Update security procedures if needed
- Train users on any new threats

#### Annual Tasks

**GDPR Compliance Audit:**
- Review all processing activities
- Update privacy notices if needed
- Verify data retention policies are followed
- Document compliance status

**Penetration Testing:**
- Commission external security assessment
- Remediate any findings
- Update security procedures

**User Training:**
- Refresh training on data protection
- Cover any system updates
- Test user knowledge
- Document completion

### Compliance Reporting

#### Data Subject Access Requests (DSARs)

When an employee requests their personal data:

1. Log the request (required within 24 hours)
2. Verify identity of requester
3. Search system for all their data
4. Export their complete record
5. Review for third-party information
6. Provide data within 30 days (UK GDPR requirement)

**System Features:**
- Single-click export of individual records
- Includes all audit trail entries for that person
- Portable format (Excel)

#### Breach Notifications

If a data breach occurs:

1. **Immediate Actions (within 1 hour):**
   - Contain the breach
   - Preserve evidence in audit logs
   - Assess scope and risk

2. **Notification (within 72 hours if high risk):**
   - Report to ICO if required
   - Notify affected individuals if high risk
   - Document all actions taken

3. **Investigation:**
   - Use audit logs to determine cause
   - Identify all affected records
   - Assess impact

4. **Remediation:**
   - Fix vulnerabilities
   - Update procedures
   - Retrain users

**System Support:**
- Complete audit trails aid investigation
- User activity logs show exact access times
- IP addresses help identify unauthorised access

#### Regulatory Reporting

The system supports various regulatory reports:

**FCA Reporting:**
- User activity logs demonstrate oversight
- Audit trails support accountability
- Access controls show segregation of duties

**Pensions Regulator:**
- Export pension liability data
- List upcoming pension start dates
- Show contribution tracking

**HMRC Reporting:**
- Export employee tax data
- NI number validation
- Employment start/end dates

---

## Support and Maintenance

### Getting Help

#### Technical Support

**For System Issues:**
- Email: support@zomiwealth.com
- Response Time: Within 4 hours during business hours
- Available: Monday-Friday, 9:00-17:00 GMT

**For Urgent Issues:**
- Critical system outages
- Security concerns
- Data integrity issues
- Response Time: Within 1 hour, 24/7

#### User Training

**New User Onboarding:**
- 30-minute video tutorial
- Step-by-step written guides
- Practical exercises
- Completion certificate

**Refresher Training:**
- Quarterly webinars
- Email tips and tricks
- Release notes for new features

#### Documentation

**Available Resources:**
- This comprehensive user manual
- Quick reference guides
- Video tutorials
- FAQs

**Location:** All documentation available at https://docs.zomiwealth.com

### Planned Maintenance

**Schedule:**
- Monthly updates: First Sunday of each month, 02:00-04:00 GMT
- Emergency patches: As required with 24-hour notice

**Notification:**
- Email alerts sent 1 week before planned maintenance
- In-app notifications 24 hours before
- Status page available during maintenance

**What to Expect:**
- Brief system unavailability (typically 10-15 minutes)
- No data loss
- Automatic backup before any changes
- Rollback available if issues occur

### System Updates

#### Update Process

1. **Development:** New features built and tested
2. **Testing:** Comprehensive testing including security checks
3. **Documentation:** User guides updated
4. **Notification:** Users informed of upcoming changes
5. **Deployment:** Updates applied during maintenance window
6. **Verification:** System tested after update
7. **Communication:** Release notes sent to all users

#### Recent Updates (Phase One)

**February 2026 - Initial Release:**
- Executive Dashboard with KPI metrics
- Employee database with encryption
- User management and invite system
- Role-based access controls
- Audit logging
- Form builder
- Excel import/export
- Mobile-responsive design

**Upcoming in Phase Two (Q2 2026):**
- Email notifications
- Advanced reporting
- Custom dashboard widgets
- Bulk edit capabilities
- Enhanced search filters
- API access for integrations
- Mobile app

---

## Appendices

### Appendix A: Glossary of Terms

**AES-256-CBC:** Advanced Encryption Standard using 256-bit keys in Cipher Block Chaining mode - military-grade encryption

**API:** Application Programming Interface - allows different software systems to communicate

**Audit Log:** Tamper-proof record of all system activities

**Authentication:** Process of verifying a user's identity

**Bcrypt:** Secure password hashing algorithm

**CORS:** Cross-Origin Resource Sharing - security feature controlling resource access

**GDPR:** General Data Protection Regulation - EU/UK data protection law

**HMAC:** Hash-based Message Authentication Code - prevents data tampering

**JWT:** JSON Web Token - secure method for transmitting user identity

**NI Number:** National Insurance Number - unique identifier for UK tax purposes

**PII:** Personally Identifiable Information - data that can identify an individual

**RLS:** Row-Level Security - database feature restricting data access

**TLS:** Transport Layer Security - encryption for data in transit

**XSS:** Cross-Site Scripting - type of security vulnerability

### Appendix B: Security Incident Response Plan

**Phase 1: Detection and Assessment (0-1 hour)**
1. Identify incident through monitoring or user report
2. Assess severity and scope
3. Activate incident response team
4. Preserve evidence

**Phase 2: Containment (1-4 hours)**
1. Isolate affected systems if needed
2. Block malicious access
3. Prevent further damage
4. Maintain business continuity

**Phase 3: Investigation (4-24 hours)**
1. Review audit logs
2. Determine root cause
3. Identify affected data
4. Assess regulatory notification requirements

**Phase 4: Notification (24-72 hours)**
1. Notify ICO if required (72-hour deadline)
2. Inform affected individuals if high risk
3. Communicate with stakeholders
4. Document all actions

**Phase 5: Recovery (1-7 days)**
1. Fix vulnerabilities
2. Restore normal operations
3. Implement additional controls
4. Update procedures

**Phase 6: Post-Incident (7-30 days)**
1. Complete investigation report
2. Conduct lessons learned session
3. Update security measures
4. Retrain users
5. Close incident

### Appendix C: Contact Information

**System Owner:**
Zomi Wealth Management  
Email: info@zomiwealth.com  
Phone: [To be provided]

**Technical Support:**
Email: support@zomiwealth.com  
Hours: Monday-Friday, 9:00-17:00 GMT

**Data Protection Officer:**
Email: dpo@zomiwealth.com

**Security Incidents:**
Email: security@zomiwealth.com  
Available: 24/7 for critical issues

**Compliance Queries:**
Email: compliance@zomiwealth.com

### Appendix D: Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | February 2026 | Initial Phase One documentation | Zomi Technical Team |

---

## Document Sign-Off

This document has been reviewed and approved by:

**Technical Lead:** _________________ Date: _________

**Data Protection Officer:** _________________ Date: _________

**Compliance Officer:** _________________ Date: _________

**Managing Director:** _________________ Date: _________

---

**Document Classification:** Internal Use  
**Review Frequency:** Quarterly  
**Next Review Date:** May 2026  
**Document Owner:** Zomi Wealth Management  
**Copyright:** © 2026 Zomi Wealth Management. All rights reserved.

---

*This documentation is confidential and intended for authorised users of the Zomi Wealth SaaS platform only. Unauthorised distribution is prohibited.*
