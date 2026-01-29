# Employee Database Redesign Plan

## 📋 Overview
Complete redesign of the Employee Database frontend with improved filtering, hidden backend fields, and IO Bulk Upload template export functionality.

---

## 🎯 Phase 1: Column Visibility & Mapping

### 1.1 Columns to HIDE from Frontend Display
These fields remain in the database but won't be shown in the UI:
- ❌ `id` (ID)
- ❌ `organization_id` (Organization ID)
- ❌ `company_id` (Company ID) - **REPLACE with `company_name` lookup**
- ❌ `source_form_id` (Source Form ID)
- ❌ `submission_token` (Submission Token)
- ❌ `submitted_via` (Submitted Via)
- ❌ `ip_address` (IP Address)
- ❌ `user_agent` (User Agent)
- ❌ `created_by_user_id` (Created By User ID)

### 1.2 Columns to SHOW in Frontend (Visible Columns)
✅ **Personal Information:**
- Title
- First Name*
- Surname*
- NI Number
- Date of Birth*
- Email Address
- Gender
- Marital Status
- Mobile Number
- Home Number
- UK Resident
- Nationality

✅ **Address:**
- Address Line 1
- Address Line 2
- Address Line 3
- Address Line 4
- City/Town
- County
- Country
- Postcode

✅ **Employment & Pension:**
- Job Title
- Employment Start Date
- Date Joined Scheme
- Pensionable Salary
- Pensionable Salary Start Date
- Salary Post Sacrifice
- Selected Retirement Age
- Pension Investment Approach
- Pension Start Date
- Policy Number

✅ **Company/Scheme Information:**
- **Company Name** (fetched from companies table using company_id)
- Scheme Ref*
- Category Name
- Advice Type*
- Selling Adviser ID*
- Pension Provider Info (Pension Provider)

✅ **Group Benefits:**
- Has Group Life
- Has GCI (Group Critical Illness)
- Has GIP (Group Income Protection)
- Has BUPA

✅ **Status & Tracking:**
- Service Status
- Client Category
- Is Pension Active
- Is Smart Pension
- Send Pension Pack
- IO Upload Status
- Operational Notes

✅ **Timestamps:**
- Created At
- Updated At

---

## 🗺️ Phase 2: Employee DB → IO Bulk Upload Template Mapping

### Column Mapping Table
| **Employee DB Field** | **IO Bulk Upload Column** | **Required?** | **Notes** |
|----------------------|---------------------------|---------------|-----------|
| `surname` | Surname* | ✅ Required | Direct mapping |
| `first_name` | FirstName* | ✅ Required | Direct mapping |
| `scheme_ref` | SchemeRef* | ✅ Required | From company data |
| `client_category` | CategoryName | Optional | e.g., "5.00%EE 4.00%ER.SMART" |
| `title` | Title | Optional | Direct mapping |
| `address_line_1` | AddressLine1 | Optional | Direct mapping |
| `address_line_2` | AddressLine2 | Optional | Direct mapping |
| `address_line_3` | AddressLine3 | Optional | Direct mapping |
| `address_line_4` | AddressLine4 | Optional | Direct mapping |
| `city_town` | CityTown | Optional | Direct mapping |
| `county` | County | Optional | Direct mapping |
| `country` | Country | Optional | Direct mapping |
| `postcode` | PostCode | Optional | Direct mapping |
| `advice_type` | AdviceType* | ✅ Required | "Migrated Plans" or "Pre-Existing Plan" |
| `date_joined_scheme` | DateJoinedScheme | Optional | Direct mapping |
| `date_of_birth` | DateofBirth* | ✅ Required | Format: YYYY-MM-DD or DD/MM/YYYY |
| `email_address` | EmailAddress | Optional | Direct mapping |
| `gender` | Gender | Optional | Direct mapping |
| `home_number` | HomeNumber | Optional | Direct mapping |
| `mobile_number` | MobileNumber | Optional | Direct mapping |
| `ni_number` | NINumber | Optional | Direct mapping |
| `pensionable_salary` | PensionableSalary | Optional | Direct mapping |
| `pensionable_salary_start_date` | PensionableSalaryStartDate | Optional | Direct mapping |
| `salary_post_sacrifice` | SalaryPostSacrifice | Optional | Direct mapping |
| `policy_number` | PolicyNumber | Optional | Direct mapping |
| `selling_adviser_id` | SellingAdviserId* | ✅ Required | From company data (e.g., "132972") |
| `split_template_group_name` | SplitTemplateGroupName | Optional | Direct mapping |
| `split_template_group_source` | SplitTemplateGroupSource | Optional | Direct mapping |
| `service_status` | ServiceStatus | Optional | Direct mapping |
| N/A | ClientCategory | Optional | May need to map from `client_category` |

**✅ All Required Fields Available in Employee DB:**
- `scheme_ref` → SchemeRef* ✅ (Already in employees table)
- `advice_type` → AdviceType* ✅ (Already in employees table)  
- `selling_adviser_id` → SellingAdviserId* ✅ (Already in employees table)
- `surname` → Surname* ✅
- `first_name` → FirstName* ✅
- `date_of_birth` → DateofBirth* ✅

**No missing fields - all IO template columns can be mapped directly from employees table!**

---

## 🎨 Phase 3: UI/UX Redesign

### 3.1 Filter Bar Redesign

**REMOVE:**
- ❌ "ALL status" filter
- ❌ "all approaches" filter
- ❌ "copy data" button

**REPLACE WITH:**

#### Primary Filters (Always Visible):
1. **Advice Type Dropdown**
   - Values from Corporate Information.csv:
     - "Migrated Plans"
     - "Pre-Existing Plan"
   - Placeholder: "Filter by Advice Type"
   - Allow "All" option

2. **Pension Provider Dropdown**
   - Values extracted from `pension_provider_info` field:
     - "Royal London"
     - "Aegon"
     - "Scottish Widows"
     - "Aviva"
     - "Opt Enrol"
   - Placeholder: "Filter by Pension Provider"
   - Allow "All" option

3. **Export Button** (Replaces "copy data")
   - Icon: Download icon
   - Opens modal with glassmorphism design
   - See details in Phase 3.2

#### Search Bar:
- Global search across all visible columns
- Real-time filtering
- Debounced for performance

---

### 3.2 Export Modal Design

**Design Specs:**
- **Glassmorphism effect:**
  - `backdrop-filter: blur(10px)`
  - `background: rgba(255, 255, 255, 0.1)`
  - Border: `1px solid rgba(255, 255, 255, 0.18)`
  - Box shadow: `0 8px 32px 0 rgba(31, 38, 135, 0.37)`

**Modal Structure:**

```
┌─────────────────────────────────────────┐
│  Export Employee Data                   │
│  ─────────────────────────────────────  │
│                                          │
│  📄 Export Format:                       │
│  ○ CSV   ○ Excel                         │
│                                          │
│  🔍 Advanced Filters                     │
│  ────────────────────────────            │
│                                          │
│  📅 Date Range:                          │
│  [From Date Picker] - [To Date Picker]  │
│                                          │
│  🏢 Company:                             │
│  [Searchable Dropdown - All Companies]  │
│                                          │
│  💼 Advice Type:                         │
│  [Dropdown - All Advice Types]          │
│                                          │
│  🏦 Pension Provider:                    │
│  [Dropdown - All Providers]             │
│                                          │
│  ✅ Service Status:                      │
│  ☑ Active  ☑ Inactive  ☑ Pending        │
│                                          │
│  ────────────────────────────────        │
│  [Cancel]              [Export Data] →  │
└─────────────────────────────────────────┘
```

**Modal Features:**
1. **Format Selection:**
   - Radio buttons: CSV or Excel
   - Default: CSV (matches IO Bulk Upload Template format)

2. **Date Range Picker:**
   - Library: `react-datepicker` (web alternative to react-native-time-date-picker)
   - Filter by `created_at` or `employment_start_date`
   - Modern calendar UI with range selection

3. **Company Filter:**
   - Searchable dropdown (using `react-select`)
   - Fetches companies from `/api/companies`
   - Shows company name
   - Option: "All Companies" (default)

4. **Additional Filters:**
   - Advice Type dropdown
   - Pension Provider dropdown
   - Service Status checkboxes (multi-select)

5. **Export Logic:**
   - Apply all selected filters
   - Transform data to IO Bulk Upload Template format
   - Generate CSV/Excel with correct headers
   - Auto-download file: `employee_export_YYYYMMDD.csv`

---

## 🔧 Phase 4: Technical Implementation

### 4.1 New Dependencies
```json
{
  "react-datepicker": "^4.25.0",
  "react-select": "^5.8.0",
  "date-fns": "^3.0.0",
  "xlsx": "^0.18.5"
}
```

### 4.2 File Structure
```
frontend/src/
├── components/
│   └── members/
│       ├── MembersTable.tsx (UPDATE)
│       ├── ExportModal.tsx (NEW)
│       ├── AdvancedFilters.tsx (NEW)
│       └── DateRangePicker.tsx (NEW)
├── services/
│   ├── employeeService.ts (UPDATE - add export with filters)
│   └── companyService.ts (UPDATE - add getCompanyName method)
├── types/
│   └── index.ts (UPDATE - add ExportOptions interface)
└── utils/
    └── exportHelpers.ts (NEW - CSV/Excel generation)
```

### 4.3 Backend Changes Required

#### New Endpoint: `/api/employees/export-io-template`
```python
@router.get("/employees/export-io-template")
async def export_employees_io_template(
    format: str = "csv",  # csv or excel
    company_id: Optional[str] = None,
    advice_type: Optional[str] = None,
    pension_provider: Optional[str] = None,
    service_status: Optional[List[str]] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Export employees in IO Bulk Upload Template format
    with optional advanced filters
    """
    # Filter employees based on criteria
    # Join with companies table to get company name
    # Transform to IO template format
    # Return CSV or Excel file
```

#### Update Employee Response to Include Company Name:
```python
# In employees route, join with companies table
response = db_service.client.table("employees").select(
    "*, companies(name)"  # Add company name to response
).execute()
```

### 4.4 Key Functions

#### Frontend: `exportHelpers.ts`
```typescript
export const transformToIOTemplate = (employees: Employee[]): IOTemplateRow[] => {
  return employees.map(emp => ({
    'Surname*': emp.surname,
    'FirstName*': emp.first_name,
    'SchemeRef*': emp.scheme_ref || '',
    'CategoryName': emp.client_category || '',
    'Title': emp.title || '',
    // ... map all 30 columns
  }));
};

export const generateCSV = (data: IOTemplateRow[]): Blob => {
  // CSV generation logic
};

export const generateExcel = (data: IOTemplateRow[]): Blob => {
  // Excel generation using xlsx library
};
```

---

## 📊 Phase 5: Data Validation

### 5.1 Required Fields Check
Before export, validate that all required fields have data:
- ✅ Surname*
- ✅ FirstName*
- ✅ SchemeRef*
- ✅ AdviceType*
- ✅ DateofBirth*
- ✅ SellingAdviserId*

### 5.2 Export Warning
Show warning if any employee is missing required fields:
```
⚠️ Warning: 3 employees are missing required fields and will be excluded from export.
View Details | Export Anyway | Cancel
```

---

## 🎯 Phase 6: Implementation Order

### Step 1: Backend Updates (Priority 1)
1. ✅ Add company name to employee response
2. ✅ Create `/api/employees/export-io-template` endpoint
3. ✅ Implement filtering logic
4. ✅ Add CSV/Excel generation

### Step 2: Frontend - Hide Columns (Priority 2)
1. ✅ Update `MembersTable.tsx` to filter hidden columns
2. ✅ Add company name column (fetch from companies table)
3. ✅ Test column visibility

### Step 3: Frontend - Filter Bar (Priority 3)
1. ✅ Remove old filters ("ALL status", "all approaches")
2. ✅ Add "Advice Type" dropdown
3. ✅ Add "Pension Provider" dropdown
4. ✅ Update filter logic

### Step 4: Frontend - Export Modal (Priority 4)
1. ✅ Install dependencies (react-datepicker, react-select, xlsx)
2. ✅ Create `ExportModal.tsx` with glassmorphism design
3. ✅ Implement date range picker
4. ✅ Implement company searchable dropdown
5. ✅ Implement advanced filters
6. ✅ Connect to backend export endpoint
7. ✅ Add CSV/Excel download logic

### Step 5: Testing & Validation (Priority 5)
1. ✅ Test all filters work correctly
2. ✅ Test export generates correct IO template format
3. ✅ Test with missing required fields
4. ✅ Test with large datasets (1000+ employees)
5. ✅ Cross-browser testing

---

## 📝 Sample Code Snippets

### Filter Bar Component Structure
```tsx
<div className="flex gap-4 mb-6">
  {/* Search */}
  <div className="flex-1">
    <input 
      type="search"
      placeholder="Search employees..."
      className="w-full px-4 py-2 border rounded-lg"
    />
  </div>
  
  {/* Advice Type Filter */}
  <select className="px-4 py-2 border rounded-lg">
    <option value="">All Advice Types</option>
    <option value="Migrated Plans">Migrated Plans</option>
    <option value="Pre-Existing Plan">Pre-Existing Plan</option>
  </select>
  
  {/* Pension Provider Filter */}
  <select className="px-4 py-2 border rounded-lg">
    <option value="">All Providers</option>
    <option value="Royal London">Royal London</option>
    <option value="Scottish Widows">Scottish Widows</option>
    <option value="Aegon">Aegon</option>
    <option value="Aviva">Aviva</option>
  </select>
  
  {/* Export Button */}
  <button 
    onClick={() => setShowExportModal(true)}
    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
  >
    <Download className="inline mr-2" size={16} />
    Export
  </button>
</div>
```

### Glassmorphism Modal CSS
```css
.glassmorphism-modal {
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  background-color: rgba(255, 255, 255, 0.75);
  border-radius: 12px;
  border: 1px solid rgba(209, 213, 219, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

/* Dark mode */
.dark .glassmorphism-modal {
  background-color: rgba(17, 24, 39, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.125);
}
```

---

## ✅ Success Criteria

### Phase 1 Complete When:
- ✅ 9 backend columns hidden from UI
- ✅ Company name displays instead of company_id
- ✅ All visible columns render correctly

### Phase 2 Complete When:
- ✅ Export generates valid IO Bulk Upload Template CSV
- ✅ All 30 columns properly mapped
- ✅ Required fields validated before export

### Phase 3 Complete When:
- ✅ Advice Type filter works
- ✅ Pension Provider filter works  
- ✅ Export modal opens with glassmorphism design
- ✅ Date picker functional
- ✅ Company dropdown searchable
- ✅ Advanced filters apply correctly

### Phase 4 Complete When:
- ✅ CSV export downloads successfully
- ✅ Excel export downloads successfully
- ✅ Exported data matches IO template format exactly
- ✅ No console errors or warnings

---

## 🚀 Ready to Start Implementation?

**Current Priority: Step 1 - Backend Updates**

Would you like me to proceed with:
1. ✅ Update backend to include company name in employee response
2. ✅ Create the export endpoint with filtering
3. ✅ Then move to frontend column hiding

Or would you prefer a different order?
