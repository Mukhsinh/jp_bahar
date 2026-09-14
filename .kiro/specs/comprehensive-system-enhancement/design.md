# Design Document: Comprehensive System Enhancement

## Overview

This design document outlines the comprehensive enhancement of the JASPEL Enterprise Incentive & KPI System. The system is built using Next.js 15, React 19, TypeScript, Supabase (PostgreSQL with Row Level Security), and Tailwind CSS with Radix UI components.

The enhancement focuses on five key areas:
1. **Authentication & Authorization**: Secure login system with role-based access control
2. **User Interface**: Modern sidebar navigation and responsive design
3. **Data Management**: CRUD operations for users, units, KPI configuration, and pool management
4. **Business Logic**: KPI calculation engine with precise decimal arithmetic
5. **Reporting**: Comprehensive reporting with Excel and PDF export capabilities

### Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **UI Components**: Radix UI, Tailwind CSS, Lucide Icons
- **Backend**: Next.js API Routes, Server Components
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth with JWT tokens
- **State Management**: React Server Components with Server Actions
- **Data Validation**: TypeScript type system with runtime validation
- **Decimal Arithmetic**: Decimal.js for precise financial calculations
- **Export Libraries**: xlsx for Excel, jspdf with jspdf-autotable for PDF

## Architecture

### System Architecture

The system follows a modern full-stack architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (Browser)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ React Pages  │  │ UI Components│  │ Client State │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Server Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Server       │  │ API Routes   │  │ Middleware   │      │
│  │ Components   │  │              │  │ (Auth Check) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Service │  │ Calculation  │  │ Export       │      │
│  │              │  │ Service      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Access Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Supabase     │  │ Database     │  │ RLS Policies │      │
│  │ Client       │  │ Queries      │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase PostgreSQL Database                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Master Tables│  │ Transaction  │  │ Auth Tables  │      │
│  │              │  │ Tables       │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Security Architecture

Security is implemented at multiple layers:

1. **Authentication Layer**: Supabase Auth with JWT tokens stored in HTTP-only cookies
2. **Authorization Layer**: Role-based access control (RBAC) with three roles
3. **Database Layer**: Row Level Security (RLS) policies enforce data access rules
4. **Application Layer**: Middleware validates sessions on every request
5. **API Layer**: Server-side validation of all inputs



## Components and Interfaces

### Authentication Components

#### LoginPage Component
- **Location**: `app/login/page.tsx`
- **Purpose**: Handles user authentication
- **State**:
  - `email: string` - User email input
  - `password: string` - User password input
  - `isLoading: boolean` - Loading state during authentication
  - `error: string | null` - Error message display
- **Methods**:
  - `handleLogin()` - Validates credentials and authenticates user
  - `handleForgotPassword()` - Initiates password reset flow
- **Validation**:
  - Email format: `[text]@[text].[text]`
  - Password: minimum 8 characters
- **Success Flow**:
  1. Call Supabase `signInWithPassword()`
  2. Retrieve user session
  3. Query `m_employees` table for user role
  4. Redirect based on role:
     - `superadmin` → `/admin/dashboard`
     - `unit_manager` → `/manager/dashboard`
     - `employee` → `/employee/dashboard`
- **Error Handling**:
  - Invalid credentials → Display "Invalid email or password"
  - Account locked → Display "Account temporarily locked due to multiple failed attempts"
  - Session expired → Display "Your session has expired. Please login again"

#### AuthMiddleware
- **Location**: `middleware.ts`
- **Purpose**: Validates session on every request
- **Flow**:
  1. Extract session from cookies
  2. Validate JWT token with Supabase
  3. If invalid, redirect to `/login`
  4. If valid, allow request to proceed
- **Protected Routes**: All routes except `/login` and public assets

### Navigation Components

#### Sidebar Component
- **Location**: `components/navigation/Sidebar.tsx`
- **Purpose**: Main navigation menu
- **State**:
  - `isCollapsed: boolean` - Sidebar collapse state
  - `activeRoute: string` - Current active route
- **Props**:
  - `userRole: 'superadmin' | 'unit_manager' | 'employee'` - User role for menu filtering
- **Dimensions**:
  - Expanded: 240px width
  - Collapsed: 64px width
  - Transition: 300ms ease-in-out
- **Menu Structure**:
  ```typescript
  interface MenuItem {
    id: string
    label: string
    icon: LucideIcon
    path: string
    roles: string[]
    children?: MenuItem[]
  }
  ```
- **Styling**:
  - Active item: `background: #3b82f6`, `color: #ffffff`
  - Hover: `background: #f3f4f6`
  - Collapsed tooltip: positioned 8px right of icon
- **Responsive Behavior**:
  - Desktop (≥1024px): Always visible
  - Tablet (768-1023px): Collapsible
  - Mobile (<768px): Hidden, hamburger menu shown

### User Management Components

#### UserListPage Component
- **Location**: `app/admin/users/page.tsx`
- **Purpose**: Display and manage users
- **State**:
  - `users: Employee[]` - List of users
  - `searchTerm: string` - Search filter
  - `currentPage: number` - Pagination state
  - `selectedUser: Employee | null` - User being edited
- **Data Fetching**:
  ```typescript
  const { data: users } = await supabase
    .from('m_employees')
    .select('*, m_units(name)')
    .order('created_at', { ascending: false })
  ```
- **Features**:
  - Search: Filters by name, email, unit, role (case-insensitive)
  - Pagination: 50 users per page
  - Actions: Create, Edit, Deactivate, Reset Password

#### UserFormDialog Component
- **Location**: `components/users/UserFormDialog.tsx`
- **Purpose**: Create/Edit user form
- **Fields**:
  - `full_name: string` (required)
  - `email: string` (required, validated)
  - `employee_code: string` (required, unique)
  - `unit_id: UUID` (required, dropdown)
  - `role: 'superadmin' | 'unit_manager' | 'employee'` (required, dropdown)
  - `tax_status: string` (optional, dropdown)
- **Validation**:
  - Email format validation
  - Unique email check
  - Unique employee_code check
- **Create Flow**:
  1. Validate all fields
  2. Generate 8-character alphanumeric temporary password
  3. Create Supabase auth user
  4. Insert record into `m_employees`
  5. Send welcome email with temporary password
- **Update Flow**:
  1. Validate changed fields
  2. Update `m_employees` record
  3. If role changed, terminate user's session



### Dashboard Components

#### SuperadminDashboard Component
- **Location**: `app/admin/dashboard/page.tsx`
- **Purpose**: Display system-wide metrics
- **Data Sources**:
  ```typescript
  // Total units
  const { count: unitCount } = await supabase
    .from('m_units')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
  
  // Total employees
  const { count: employeeCount } = await supabase
    .from('m_employees')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
  
  // Total pool amount
  const { data: pools } = await supabase
    .from('t_pool')
    .select('allocated_amount')
    .eq('status', 'approved')
  
  // Active calculations
  const { count: calculationCount } = await supabase
    .from('t_calculation_results')
    .select('*', { count: 'exact', head: true })
    .gte('calculated_at', startOfMonth)
  ```
- **Metrics Cards**:
  - Total Units (integer)
  - Total Employees (integer)
  - Total Pool Amount (IDR format with thousand separators)
  - Active Calculations (integer)
- **Performance**: Initial render within 2 seconds
- **Loading State**: Skeleton placeholders matching card layout

#### UnitManagerDashboard Component
- **Location**: `app/manager/dashboard/page.tsx`
- **Purpose**: Display unit-specific metrics
- **Data Sources**:
  ```typescript
  // Unit average KPI
  const { data: unitScores } = await supabase
    .from('t_unit_scores')
    .select('total_score')
    .eq('unit_id', userUnitId)
    .eq('period', currentPeriod)
    .single()
  
  // Employee count in unit
  const { count: employeeCount } = await supabase
    .from('m_employees')
    .select('*', { count: 'exact', head: true })
    .eq('unit_id', userUnitId)
    .eq('is_active', true)
  
  // Pending realizations
  const { count: pendingCount } = await supabase
    .from('t_realization')
    .select('*', { count: 'exact', head: true })
    .eq('period', currentPeriod)
    .is('achievement_percentage', null)
  ```
- **Metrics Cards**:
  - Unit Average KPI Score (2 decimal places)
  - Number of Employees (integer)
  - Pending Realization Entries (integer)

#### EmployeeDashboard Component
- **Location**: `app/employee/dashboard/page.tsx`
- **Purpose**: Display personal performance metrics
- **Data Sources**:
  ```typescript
  // Personal KPI score
  const { data: individualScore } = await supabase
    .from('t_individual_scores')
    .select('*')
    .eq('employee_id', userId)
    .eq('period', currentPeriod)
    .single()
  
  // Incentive history (last 6 months)
  const { data: incentiveHistory } = await supabase
    .from('t_calculation_results')
    .select('period, net_incentive')
    .eq('employee_id', userId)
    .order('period', { ascending: false })
    .limit(6)
  ```
- **Components**:
  - Personal KPI Score Card (P1, P2, P3 breakdown)
  - Incentive History Table (6 months)
  - Achievement Trend Chart (line chart using Recharts)
- **Chart Configuration**:
  - X-axis: Period (YYYY-MM format)
  - Y-axis: Score (0-100 range)
  - Auto-resize on window resize

### KPI Configuration Components

#### KPIConfigurationPage Component
- **Location**: `app/admin/kpi-config/page.tsx`
- **Purpose**: Configure KPI structure
- **State**:
  - `selectedUnit: UUID | null` - Currently selected unit
  - `categories: KPICategory[]` - Categories for selected unit
  - `expandedNodes: Set<string>` - Expanded tree nodes
- **Tree Structure**:
  ```
  Unit
  ├── P1 Category (weight: X%)
  │   ├── Indicator 1 (weight: Y%)
  │   └── Indicator 2 (weight: Z%)
  ├── P2 Category (weight: X%)
  │   └── Indicators...
  └── P3 Category (weight: X%)
      └── Indicators...
  ```
- **Validation Rules**:
  - Sum of category weights (P1 + P2 + P3) = 100% ± 0.01%
  - Sum of indicator weights within category = 100% ± 0.01%
- **Copy Structure Feature**:
  1. Select source unit
  2. Select target unit
  3. Duplicate all categories and indicators with weights
  4. Validate target unit has no existing structure



### Pool Management Components

#### PoolManagementPage Component
- **Location**: `app/admin/pool/page.tsx`
- **Purpose**: Manage financial pools per period
- **State**:
  - `pools: Pool[]` - List of pools
  - `selectedPool: Pool | null` - Currently selected pool
  - `revenueItems: PoolRevenue[]` - Revenue items for selected pool
  - `deductionItems: PoolDeduction[]` - Deduction items for selected pool
- **Pool Status Flow**:
  ```
  draft → approved → distributed
  ```
- **Calculations**:
  ```typescript
  net_pool = revenue_total - deduction_total
  allocated_amount = net_pool × (global_allocation_percentage / 100)
  ```
- **Draft Mode Operations**:
  - Add/Edit/Delete revenue items
  - Add/Edit/Delete deduction items
  - Modify allocation percentage
- **Approval Flow**:
  1. Validate pool has revenue items
  2. Set status to 'approved'
  3. Record approved_by and approved_at
  4. Prevent further modifications
  5. Trigger calculation process

#### PoolFormDialog Component
- **Location**: `components/pool/PoolFormDialog.tsx`
- **Purpose**: Create new pool
- **Fields**:
  - `period: string` (format: YYYY-MM, unique)
  - `global_allocation_percentage: number` (0-100, default: 100)
- **Validation**:
  - Period format validation
  - Unique period check
  - Allocation percentage range check

### Realization Input Components

#### RealizationInputPage Component
- **Location**: `app/manager/realization/page.tsx`
- **Purpose**: Input KPI realization data
- **Access Control**: Unit_Manager can only see employees in their unit
- **State**:
  - `selectedEmployee: UUID | null` - Selected employee
  - `selectedPeriod: string` - Selected period (YYYY-MM)
  - `indicators: Indicator[]` - Indicators for employee's unit
  - `realizations: Realization[]` - Current realization values
- **Data Flow**:
  1. Select employee (filtered by unit)
  2. Select period
  3. Load indicators for employee's unit
  4. Load existing realizations (if any)
  5. Input realization values
  6. Calculate achievement percentage: `(realization_value / target_value) × 100`
  7. Save to `t_realization` table
- **Bulk Import Feature**:
  - Upload Excel file (.xlsx)
  - Required columns: employee_id, period, indicator_id, realization_value
  - Validate all rows before import
  - Display error report for invalid rows
  - Import valid rows only

### Reporting Components

#### ReportsPage Component
- **Location**: `app/admin/reports/page.tsx`
- **Purpose**: Generate and export reports
- **Report Types**:
  1. **Incentive Report**
     - Columns: employee name, unit, P1 score, P2 score, P3 score, gross incentive, tax amount, net incentive
     - Format: All scores with 2 decimal places, amounts in IDR format
  2. **KPI Achievement Report**
     - Columns: indicator name, target value, realization value, achievement percentage
     - Format: Percentage with 2 decimal places
  3. **Unit Comparison Report**
     - Columns: unit name, average score, total incentive, employee count
     - Format: Score with 2 decimal places, amount in IDR format
  4. **Employee Slip**
     - Sections: P1 breakdown, P2 breakdown, P3 breakdown, gross/tax/net amounts
     - Format: Individual document per employee

#### ExportService
- **Location**: `lib/export/excel-export.ts` and `lib/export/pdf-export.ts`
- **Excel Export**:
  ```typescript
  interface ExcelExportOptions {
    filename: string
    sheetName: string
    headers: string[]
    data: any[][]
    formatting?: {
      boldHeaders?: boolean
      thousandSeparators?: boolean
      percentageColumns?: number[]
    }
  }
  ```
  - Uses `xlsx` library
  - Headers in bold font
  - Numeric columns with thousand separators
  - Percentage columns with % symbol
- **PDF Export**:
  ```typescript
  interface PDFExportOptions {
    filename: string
    title: string
    companyLogo?: string
    headers: string[]
    data: any[][]
    footer?: string
  }
  ```
  - Uses `jspdf` with `jspdf-autotable`
  - Company logo in header (max height 60px)
  - Report title in 16pt font
  - Generation date in format DD/MM/YYYY HH:mm
  - Data in tabular format



## Data Models

### Core Entities

#### Employee
```typescript
interface Employee {
  id: string                    // UUID
  employee_code: string         // Unique identifier
  full_name: string
  unit_id: string              // Foreign key to Unit
  role: 'superadmin' | 'unit_manager' | 'employee'
  email: string                // Unique, used for authentication
  tax_status: string           // TK/0, TK/1, TK/2, TK/3, K/0, K/1, K/2, K/3
  is_active: boolean
  created_at: string           // ISO 8601 timestamp
  updated_at: string           // ISO 8601 timestamp
}
```

#### Unit
```typescript
interface Unit {
  id: string                    // UUID
  code: string                  // Unique identifier
  name: string
  proportion_percentage: number // 0-100, sum of all active units = 100
  is_active: boolean
  created_at: string
  updated_at: string
}
```

#### KPICategory
```typescript
interface KPICategory {
  id: string                    // UUID
  unit_id: string              // Foreign key to Unit
  category: 'P1' | 'P2' | 'P3'
  category_name: string
  weight_percentage: number    // 0-100, sum of P1+P2+P3 per unit = 100
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
```

#### KPIIndicator
```typescript
interface KPIIndicator {
  id: string                    // UUID
  category_id: string          // Foreign key to KPICategory
  code: string                 // Unique within category
  name: string
  target_value: number         // Default: 100.00
  weight_percentage: number    // 0-100, sum within category = 100
  measurement_unit: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
```

#### Pool
```typescript
interface Pool {
  id: string                    // UUID
  period: string               // Format: YYYY-MM, unique
  revenue_total: number        // Sum of all revenue items
  deduction_total: number      // Sum of all deduction items
  net_pool: number             // Computed: revenue_total - deduction_total
  global_allocation_percentage: number  // 0-100, default: 100
  allocated_amount: number     // Computed: net_pool × (allocation% / 100)
  status: 'draft' | 'approved' | 'distributed'
  approved_by: string | null   // Foreign key to Employee
  approved_at: string | null   // ISO 8601 timestamp
  created_at: string
  updated_at: string
}
```

#### Realization
```typescript
interface Realization {
  id: string                    // UUID
  employee_id: string          // Foreign key to Employee
  indicator_id: string         // Foreign key to KPIIndicator
  period: string               // Format: YYYY-MM
  realization_value: number    // Actual achievement value
  achievement_percentage: number | null  // (realization / target) × 100
  score: number | null         // Weighted score
  notes: string | null
  created_by: string | null    // Foreign key to Employee
  created_at: string
  updated_at: string
}
```

#### IndividualScore
```typescript
interface IndividualScore {
  id: string                    // UUID
  employee_id: string          // Foreign key to Employee
  period: string               // Format: YYYY-MM
  p1_score: number             // Sum of P1 indicator scores
  p2_score: number             // Sum of P2 indicator scores
  p3_score: number             // Sum of P3 indicator scores
  p1_weighted: number          // p1_score × P1 category weight
  p2_weighted: number          // p2_score × P2 category weight
  p3_weighted: number          // p3_score × P3 category weight
  individual_total_score: number  // Sum of weighted scores
  individual_weight_percentage: number  // Default: 100
  weighted_individual_score: number
  created_at: string
  updated_at: string
}
```

#### CalculationResult
```typescript
interface CalculationResult {
  id: string                    // UUID
  employee_id: string          // Foreign key to Employee
  period: string               // Format: YYYY-MM
  pool_id: string              // Foreign key to Pool
  unit_score: number           // Unit's total score
  individual_score: number     // Employee's individual score
  final_score: number          // Combined score
  unit_allocated_amount: number  // Amount allocated to unit
  score_proportion: number     // Employee's proportion of unit score
  gross_incentive: number      // Before tax
  tax_amount: number           // Tax based on tax_status
  net_incentive: number        // After tax
  calculation_metadata: object | null  // Additional calculation details
  calculated_at: string        // ISO 8601 timestamp
  created_at: string
}
```

### Data Relationships

```
m_units (1) ──< (N) m_employees
m_units (1) ──< (N) m_kpi_categories
m_kpi_categories (1) ──< (N) m_kpi_indicators
m_employees (1) ──< (N) t_realization
m_kpi_indicators (1) ──< (N) t_realization
t_pool (1) ──< (N) t_pool_revenue
t_pool (1) ──< (N) t_pool_deduction
t_pool (1) ──< (N) t_calculation_results
m_employees (1) ──< (N) t_calculation_results
m_employees (1) ──< (N) t_individual_scores
m_units (1) ──< (N) t_unit_scores
```

### Database Constraints

1. **Unique Constraints**:
   - `m_units.code` - Unit code must be unique
   - `m_employees.employee_code` - Employee code must be unique
   - `m_employees.email` - Email must be unique
   - `m_kpi_categories(unit_id, category)` - One category per type per unit
   - `m_kpi_indicators(category_id, code)` - Indicator code unique within category
   - `t_pool.period` - One pool per period
   - `t_realization(employee_id, indicator_id, period)` - One realization per combination
   - `t_individual_scores(employee_id, period)` - One score record per employee per period
   - `t_calculation_results(employee_id, period)` - One result per employee per period

2. **Check Constraints**:
   - `m_units.proportion_percentage` - Between 0 and 100
   - `m_kpi_categories.weight_percentage` - Between 0 and 100
   - `m_kpi_indicators.weight_percentage` - Between 0 and 100
   - `t_pool.global_allocation_percentage` - Between 0 and 100
   - `m_employees.role` - Must be 'superadmin', 'unit_manager', or 'employee'
   - `m_employees.tax_status` - Must be valid tax status code
   - `t_pool.status` - Must be 'draft', 'approved', or 'distributed'

3. **Foreign Key Constraints**:
   - All foreign keys use `ON DELETE RESTRICT` or `ON DELETE CASCADE` appropriately
   - Cascade deletes for dependent data (e.g., indicators when category deleted)
   - Restrict deletes for referenced data (e.g., cannot delete unit with employees)



## Calculation Engine

### Overview

The calculation engine is the core business logic component that computes KPI scores and incentive distribution. It uses `Decimal.js` for all monetary calculations to ensure precision and avoid floating-point errors.

### Calculation Flow

```
1. Validate Prerequisites
   ↓
2. Calculate Individual Scores (P1, P2, P3)
   ↓
3. Calculate Unit Scores
   ↓
4. Distribute Pool to Units
   ↓
5. Distribute Unit Allocation to Employees
   ↓
6. Calculate Tax and Net Incentive
   ↓
7. Store Results
```

### Step 1: Validate Prerequisites

Before calculation, validate:
- Pool exists for the period and status is 'approved'
- All active employees have realization data for all required indicators
- All KPI category weights sum to 100% (±0.01%) per unit
- All indicator weights sum to 100% (±0.01%) per category
- All unit proportions sum to 100% (±0.01%)

### Step 2: Calculate Individual Scores

For each employee, calculate P1, P2, and P3 scores:

```typescript
// For each category (P1, P2, P3)
function calculateCategoryScore(
  employeeId: string,
  categoryId: string,
  period: string
): Decimal {
  // Get all indicators for this category
  const indicators = await getIndicators(categoryId)
  
  let categoryScore = new Decimal(0)
  
  for (const indicator of indicators) {
    // Get realization for this indicator
    const realization = await getRealization(employeeId, indicator.id, period)
    
    // Calculate achievement percentage
    const achievementPct = new Decimal(realization.realization_value)
      .div(indicator.target_value)
      .mul(100)
    
    // Calculate weighted score for this indicator
    const indicatorScore = achievementPct
      .mul(indicator.weight_percentage)
      .div(100)
    
    categoryScore = categoryScore.add(indicatorScore)
  }
  
  return categoryScore
}

// Calculate all three categories
const p1Score = calculateCategoryScore(employeeId, p1CategoryId, period)
const p2Score = calculateCategoryScore(employeeId, p2CategoryId, period)
const p3Score = calculateCategoryScore(employeeId, p3CategoryId, period)

// Apply category weights
const p1Weighted = p1Score.mul(p1CategoryWeight).div(100)
const p2Weighted = p2Score.mul(p2CategoryWeight).div(100)
const p3Weighted = p3Score.mul(p3CategoryWeight).div(100)

// Calculate individual total score
const individualTotalScore = p1Weighted.add(p2Weighted).add(p3Weighted)

// Store in t_individual_scores
await storeIndividualScore({
  employee_id: employeeId,
  period,
  p1_score: p1Score.toDecimalPlaces(2),
  p2_score: p2Score.toDecimalPlaces(2),
  p3_score: p3Score.toDecimalPlaces(2),
  p1_weighted: p1Weighted.toDecimalPlaces(2),
  p2_weighted: p2Weighted.toDecimalPlaces(2),
  p3_weighted: p3Weighted.toDecimalPlaces(2),
  individual_total_score: individualTotalScore.toDecimalPlaces(2)
})
```

### Step 3: Calculate Unit Scores

For each unit, sum all employee scores:

```typescript
function calculateUnitScore(unitId: string, period: string): Decimal {
  // Get all active employees in this unit
  const employees = await getEmployeesByUnit(unitId)
  
  let unitTotalScore = new Decimal(0)
  
  for (const employee of employees) {
    const individualScore = await getIndividualScore(employee.id, period)
    unitTotalScore = unitTotalScore.add(individualScore.individual_total_score)
  }
  
  return unitTotalScore
}

// Calculate for all units
for (const unit of activeUnits) {
  const unitScore = calculateUnitScore(unit.id, period)
  
  await storeUnitScore({
    unit_id: unit.id,
    period,
    total_score: unitScore.toDecimalPlaces(2),
    unit_weight_percentage: unit.proportion_percentage
  })
}
```

### Step 4: Distribute Pool to Units

Allocate the pool amount to units based on their proportion:

```typescript
function distributePoolToUnits(poolId: string, period: string): void {
  const pool = await getPool(poolId)
  const allocatedAmount = new Decimal(pool.allocated_amount)
  
  const units = await getActiveUnits()
  
  for (const unit of units) {
    // Calculate unit's allocation based on proportion
    const unitAllocation = allocatedAmount
      .mul(unit.proportion_percentage)
      .div(100)
    
    // Store unit allocation
    await updateUnitScore(unit.id, period, {
      unit_allocated_amount: unitAllocation.toDecimalPlaces(2)
    })
  }
}
```

### Step 5: Distribute Unit Allocation to Employees

Within each unit, distribute based on individual score proportion:

```typescript
function distributeUnitAllocationToEmployees(
  unitId: string,
  period: string
): void {
  const unitScore = await getUnitScore(unitId, period)
  const unitAllocation = new Decimal(unitScore.unit_allocated_amount)
  const unitTotalScore = new Decimal(unitScore.total_score)
  
  const employees = await getEmployeesByUnit(unitId)
  
  for (const employee of employees) {
    const individualScore = await getIndividualScore(employee.id, period)
    const employeeScore = new Decimal(individualScore.individual_total_score)
    
    // Calculate employee's proportion of unit score
    const scoreProportion = employeeScore.div(unitTotalScore)
    
    // Calculate gross incentive
    const grossIncentive = unitAllocation.mul(scoreProportion)
    
    // Store preliminary result
    await storeCalculationResult({
      employee_id: employee.id,
      period,
      pool_id: poolId,
      unit_score: unitTotalScore.toDecimalPlaces(2),
      individual_score: employeeScore.toDecimalPlaces(2),
      unit_allocated_amount: unitAllocation.toDecimalPlaces(2),
      score_proportion: scoreProportion.toDecimalPlaces(6),
      gross_incentive: grossIncentive.toDecimalPlaces(2)
    })
  }
}
```

### Step 6: Calculate Tax and Net Incentive

Apply tax based on employee's tax status:

```typescript
// Tax rates based on TER (Tarif Efektif Rata-rata)
const TAX_RATES = {
  'TK/0': 0.05,   // 5%
  'TK/1': 0.15,   // 15%
  'TK/2': 0.25,   // 25%
  'TK/3': 0.30,   // 30%
  'K/0': 0.05,    // 5%
  'K/1': 0.15,    // 15%
  'K/2': 0.25,    // 25%
  'K/3': 0.30     // 30%
}

function calculateTaxAndNet(employeeId: string, period: string): void {
  const employee = await getEmployee(employeeId)
  const result = await getCalculationResult(employeeId, period)
  
  const grossIncentive = new Decimal(result.gross_incentive)
  const taxRate = new Decimal(TAX_RATES[employee.tax_status] || 0)
  
  // Calculate tax amount
  const taxAmount = grossIncentive.mul(taxRate)
  
  // Calculate net incentive
  const netIncentive = grossIncentive.sub(taxAmount)
  
  // Update result
  await updateCalculationResult(employeeId, period, {
    tax_amount: taxAmount.toDecimalPlaces(2),
    net_incentive: netIncentive.toDecimalPlaces(2)
  })
}
```

### Step 7: Store Results

All calculation results are stored in `t_calculation_results` with:
- Complete score breakdown
- Monetary amounts with 2 decimal places
- Score proportions with 6 decimal places
- Calculation metadata (timestamp, version, etc.)
- Audit trail in `t_calculation_log`

### Error Handling

The calculation engine implements transactional processing:

```typescript
async function runCalculation(period: string): Promise<void> {
  const transaction = await beginTransaction()
  
  try {
    // Step 1: Validate
    await validatePrerequisites(period)
    
    // Step 2-6: Calculate
    await calculateIndividualScores(period)
    await calculateUnitScores(period)
    await distributePoolToUnits(period)
    await distributeToEmployees(period)
    await calculateTaxes(period)
    
    // Commit transaction
    await transaction.commit()
    
    // Log success
    await logCalculation({
      period,
      status: 'success',
      employee_count: employeeCount,
      end_time: new Date()
    })
    
  } catch (error) {
    // Rollback transaction
    await transaction.rollback()
    
    // Log error
    await logCalculation({
      period,
      status: 'error',
      error_message: error.message,
      end_time: new Date()
    })
    
    throw error
  }
}
```

### Precision Requirements

All monetary calculations use `Decimal.js` with:
- Precision: 15 digits
- Rounding mode: ROUND_HALF_UP
- Decimal places for storage:
  - Monetary amounts: 2 decimal places
  - Percentages: 2 decimal places
  - Score proportions: 6 decimal places



## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be combined or where one property implies another:

1. **Authentication properties** (1.1, 1.6) can be combined into a single property about role-based redirection
2. **User management CRUD properties** (2.1-2.8) cover distinct operations and should remain separate
3. **RLS filtering properties** (4.3, 4.4, 4.5) test the same filtering mechanism across different roles - can be combined
4. **Calculation properties** (11.1-11.7) test different aspects of the calculation engine and should remain separate
5. **Export properties** (12.5, 12.6, 16.1, 16.2, 16.7) test similar export functionality - can be grouped
6. **Validation properties** for weights (7.5, 8.2, 8.3) test the same validation logic - can be combined

### Authentication and Authorization Properties

Property 1: Role-based dashboard redirection
*For any* user with valid credentials, logging in should redirect to the dashboard corresponding to their role: superadmin → /admin/dashboard, unit_manager → /manager/dashboard, employee → /employee/dashboard
**Validates: Requirements 1.1, 1.6**

Property 2: Invalid credentials error handling
*For any* invalid credential combination (wrong email, wrong password, or non-existent user), the login attempt should display the message "Invalid email or password" and remain on the login page
**Validates: Requirements 1.2**

Property 3: Role-based access control enforcement
*For any* user attempting to access a page, if the page requires a role the user does not have, the system should redirect to a 403 Forbidden page with the message "You do not have permission to access this page"
**Validates: Requirements 4.2**

Property 4: Row-level security filtering
*For any* user querying data, the system should return only records matching their access level: Unit_Manager sees only their unit's data, Employee sees only their own data, Superadmin sees all data
**Validates: Requirements 4.3, 4.4, 4.5**

Property 5: Session termination on role change
*For any* user whose role is changed, the system should terminate their current session and require re-login to apply new permissions
**Validates: Requirements 2.6, 4.6**

Property 6: Menu filtering by role permissions
*For any* user viewing the navigation menu, the system should display only menu items where the user's role has read permission
**Validates: Requirements 4.7**

### User Management Properties

Property 7: User creation with temporary password
*For any* valid user data (name, email, role, unit), creating a new user should generate an 8-character alphanumeric temporary password and create the user account
**Validates: Requirements 2.2**

Property 8: Email format validation
*For any* email string, the system should validate it matches the pattern [text]@[text].[text] before saving
**Validates: Requirements 2.3**

Property 9: User deactivation and session revocation
*For any* active user, deactivating the user should set is_active to false and revoke all active sessions for that user within 30 seconds
**Validates: Requirements 2.4**

Property 10: User search filtering
*For any* search term, the system should filter the user list to show only users where the search term matches any part of name, email, unit, or role fields (case-insensitive)
**Validates: Requirements 2.5**

Property 11: Duplicate email prevention
*For any* email that already exists in the system, attempting to create a new user with that email should display the message "Email already exists" and prevent user creation
**Validates: Requirements 2.7**

Property 12: Pagination for large datasets
*For any* user list containing more than 50 users, the system should display 50 users per page with pagination controls showing page numbers and next/previous buttons
**Validates: Requirements 2.8, 20.2**

### Password Management Properties

Property 13: Password validation rules
*For any* new password, the system should validate it contains minimum 8 characters, at least 1 uppercase letter, at least 1 number, and at least 1 special character
**Validates: Requirements 3.3**

Property 14: Current password verification
*For any* password change request, the system should verify the current password matches before processing the change
**Validates: Requirements 3.2**

Property 15: Temporary password generation
*For any* password reset by Superadmin, the system should generate an 8-character alphanumeric temporary password
**Validates: Requirements 3.5**

Property 16: Password reset link expiration
*For any* password reset link generated, the system should set expiration time to 24 hours from generation time
**Validates: Requirements 3.7**

### Unit Management Properties

Property 17: Unit code uniqueness
*For any* new unit, the system should verify the unit code is unique before creating the unit record
**Validates: Requirements 7.2**

Property 18: Unit deletion constraint
*For any* unit where employee count is greater than 0, attempting to delete the unit should display the message "Cannot delete unit with assigned employees" and prevent deletion
**Validates: Requirements 7.4**

Property 19: Unit proportion sum validation
*For any* set of active units, the sum of all unit proportions should equal 100% with tolerance of ±0.01%
**Validates: Requirements 7.5**

Property 20: Unit deactivation and calculation exclusion
*For any* active unit, deactivating the unit should set is_active to false, exclude the unit from new calculations, and preserve all historical calculation data
**Validates: Requirements 7.7**

### KPI Configuration Properties

Property 21: Category weight sum validation
*For any* unit with KPI categories, the sum of category weights (P1 + P2 + P3) should equal 100% with tolerance of ±0.01%
**Validates: Requirements 8.2**

Property 22: Indicator weight sum validation
*For any* KPI category with indicators, the sum of all indicator weights within that category should equal 100% with tolerance of ±0.01%
**Validates: Requirements 8.3**

Property 23: Weight update triggers recalculation
*For any* indicator weight update, the system should recalculate KPI scores for all employees in the current period
**Validates: Requirements 8.4**

Property 24: Indicator deletion constraint
*For any* indicator where realization record count is greater than 0, attempting to delete the indicator should display a warning modal with the message "This indicator has existing realization data. Deletion will affect historical calculations. Continue?"
**Validates: Requirements 8.5**

Property 25: KPI structure copying
*For any* source unit and target unit, copying KPI structure should duplicate all categories and indicators with their weights to the target unit
**Validates: Requirements 8.7**

### Pool Management Properties

Property 26: Pool period uniqueness and format validation
*For any* new pool, the system should validate the period format is YYYY-MM and that no pool exists for that period
**Validates: Requirements 9.1**

Property 27: Revenue total calculation
*For any* pool with revenue items, the total revenue should equal the sum of all revenue item amounts
**Validates: Requirements 9.2**

Property 28: Net pool calculation
*For any* pool with revenue and deduction items, the net pool should equal total revenue minus sum of all deduction amounts
**Validates: Requirements 9.3**

Property 29: Allocated amount calculation
*For any* pool with allocation percentage, the allocated amount should equal net pool multiplied by allocation percentage divided by 100
**Validates: Requirements 9.4**

Property 30: Pool approval immutability
*For any* pool with status "Approved", the system should prevent modifications to revenue items, deduction items, and allocation percentage
**Validates: Requirements 9.5**

Property 31: Draft pool mutability
*For any* pool with status "Draft", the system should allow adding, editing, and deleting revenue and deduction items
**Validates: Requirements 9.7**

### Realization Input Properties

Property 32: Unit manager data filtering
*For any* Unit_Manager accessing realization input, the system should display only employees where unit_id matches the Unit_Manager's assigned unit
**Validates: Requirements 10.1**

Property 33: Achievement percentage calculation
*For any* realization value and target value, the achievement percentage should equal (realization_value / target_value) × 100 rounded to 2 decimal places
**Validates: Requirements 10.3, 10.7**

Property 34: Realization data validation
*For any* realization save request, the system should validate that all required indicator fields are filled before saving to t_kpi_realization table
**Validates: Requirements 10.4**

Property 35: Bulk import validation
*For any* Excel file upload, the system should validate that the file contains columns: employee_id, period, indicator_id, realization_value, and import only rows with valid data
**Validates: Requirements 10.5**

Property 36: Realization update capability
*For any* existing realization data (employee-period-indicator combination), the system should allow updates and store the previous value with timestamp in modification history
**Validates: Requirements 10.6**

### Calculation Engine Properties

Property 37: Individual KPI score calculation
*For any* active employee in a period, the system should calculate P1, P2, and P3 scores by multiplying each indicator achievement by its weight, summing within category, then multiplying by category weight
**Validates: Requirements 11.1, 11.2**

Property 38: Unit score aggregation
*For any* unit in a period, the unit score should equal the sum of all individual employee scores within that unit
**Validates: Requirements 11.3**

Property 39: Decimal precision maintenance
*For any* monetary calculation, the system should use DECIMAL(15,2) precision and round all monetary amounts to 2 decimal places
**Validates: Requirements 11.4**

Property 40: Tax calculation by status
*For any* employee with a tax status, the tax amount should equal gross incentive multiplied by the TER rate corresponding to that tax status
**Validates: Requirements 11.5**

Property 41: Calculation result storage
*For any* successful calculation, the system should insert records into t_calculation_results with employee_id, period, scores, and amounts
**Validates: Requirements 11.6**

Property 42: Calculation error rollback
*For any* calculation that encounters a validation error, the system should log the error to t_calculation_log and revert all changes made during that calculation run
**Validates: Requirements 11.7**



### Reporting and Export Properties

Property 43: Incentive report generation
*For any* period with calculation data, generating an incentive report should include columns: employee name, unit, P1 score, P2 score, P3 score, gross incentive, tax amount, and net incentive, all formatted with 2 decimal places for scores and IDR format for amounts
**Validates: Requirements 12.2**

Property 44: KPI achievement report generation
*For any* period with realization data, generating a KPI achievement report should display for each indicator: indicator name, target value, realization value, and achievement percentage formatted with 2 decimal places
**Validates: Requirements 12.3**

Property 45: Unit comparison report generation
*For any* period with calculation data, generating a unit comparison report should display for each unit: unit name, average score (2 decimal places), total incentive (IDR format), and employee count (integer)
**Validates: Requirements 12.4**

Property 46: Excel export formatting
*For any* data export to Excel, the system should create a .xlsx file with formatted headers in bold font, numeric columns with thousand separators, and percentage columns with % symbol
**Validates: Requirements 12.5, 16.1, 16.2, 16.7**

Property 47: PDF export formatting
*For any* data export to PDF, the system should generate a .pdf document with company logo in header (max height 60px), report title in 16pt font, generation date in format DD/MM/YYYY HH:mm, and data in tabular format
**Validates: Requirements 12.6**

Property 48: Empty period handling
*For any* report period where calculation record count equals 0, the system should display the message "No data available for the selected period"
**Validates: Requirements 12.7**

Property 49: Employee slip generation
*For any* employee with calculation data, generating an employee slip should include sections for: P1 breakdown with indicators and weights, P2 breakdown with indicators and weights, P3 breakdown with indicators and weights, gross amount (IDR format), tax amount (IDR format), and net amount (IDR format)
**Validates: Requirements 12.8**

### Data Import Properties

Property 50: Import validation
*For any* Excel file import, the system should validate that all required columns are present and contain valid data types before importing
**Validates: Requirements 16.3**

Property 51: Import error reporting
*For any* import with validation errors, the system should display a table showing row numbers, field names, and error descriptions for each validation failure
**Validates: Requirements 16.4**

Property 52: Import success feedback
*For any* successful import, the system should display the message "Successfully imported [N] records" where N is the count of imported rows
**Validates: Requirements 16.5**

Property 53: Template generation
*For any* template download request, the system should generate an Excel file (.xlsx) with column headers in row 1, sample data in row 2, and instructions in a separate sheet named "Instructions"
**Validates: Requirements 16.6**

### Profile Management Properties

Property 54: Profile information display
*For any* user accessing their profile page, the system should display current user information including: name, email, role, unit, and profile photo within 2 seconds
**Validates: Requirements 17.1**

Property 55: Profile update validation
*For any* profile update, the system should validate required fields are not empty, save changes to the database, and display the message "Profile updated successfully"
**Validates: Requirements 17.2**

Property 56: Profile photo validation
*For any* profile photo upload, the system should validate image format is JPG, PNG, or GIF and file size is maximum 2MB (2,097,152 bytes)
**Validates: Requirements 17.3**

Property 57: Tax status update application
*For any* Employee updating tax status, the system should save the new tax status (TK/0, TK/1, TK/2, TK/3, K/0, K/1, K/2, or K/3) and apply it to all future incentive calculations
**Validates: Requirements 17.6**

Property 58: Profile update error messages
*For any* profile update that fails validation, the system should display the message "[Field name] is invalid: [specific reason]" and maintain the form with entered data
**Validates: Requirements 17.7**

### Search and Filter Properties

Property 59: Search functionality
*For any* search query entered by a user, the system should search across relevant fields and update results within 500ms of the last keystroke
**Validates: Requirements 18.1**

Property 60: Filter application
*For any* filters applied by a user, the system should update results within 1 second without page reload
**Validates: Requirements 18.2**

Property 61: Multiple filter combination
*For any* multiple filters applied, the system should combine filters with AND logic and display only records matching all filter criteria
**Validates: Requirements 18.3**

Property 62: Filter reset
*For any* filter clear action, the system should reset to default view showing all records within 1 second
**Validates: Requirements 18.4**

Property 63: Empty search results handling
*For any* search that returns zero results, the system should display the message "No results found for '[search term]'. Try different keywords or clear filters."
**Validates: Requirements 18.5**

Property 64: Date range filter validation
*For any* date range filter, the system should validate that start date is not after end date and apply filter to show only records where date field is between start date and end date (inclusive)
**Validates: Requirements 18.6**

Property 65: Filtered data export
*For any* export action with active filters, the system should export only the records currently visible after applying all active filters
**Validates: Requirements 18.7**

### Dashboard and Display Properties

Property 66: Superadmin dashboard metrics
*For any* Superadmin viewing the dashboard, the system should display cards showing: total number of active units, total number of active employees, total pool amount in IDR format, and count of active calculations
**Validates: Requirements 6.1**

Property 67: Unit Manager dashboard metrics
*For any* Unit_Manager viewing the dashboard, the system should display: unit's average KPI score (2 decimal places), number of employees in the unit, and count of pending realization entries
**Validates: Requirements 6.2**

Property 68: Employee dashboard metrics
*For any* Employee viewing the dashboard, the system should display: personal KPI score for current period, incentive history for last 6 months, and line chart showing achievement trends
**Validates: Requirements 6.3**

Property 69: Stale data indicator
*For any* dashboard where data is older than 5 minutes, the system should display a refresh button that reloads data when clicked
**Validates: Requirements 6.7**

Property 70: Unit list display
*For any* unit management page access, the system should display a table with all units showing: unit code, name, proportion as percentage with 2 decimal places, and status as text "Active" or "Inactive" within 3 seconds
**Validates: Requirements 7.1, 7.6**

Property 71: KPI tree structure display
*For any* KPI configuration page access, the system should display a tree view showing categories (P1, P2, P3) with their indicators grouped by unit within 3 seconds
**Validates: Requirements 8.1, 8.6**

Property 72: Pool history display
*For any* pool management page access, the system should display a table with all pools showing: period, status, total revenue, total deductions, net pool, and allocated amount
**Validates: Requirements 9.6**

### Application Settings Properties

Property 73: Tax rate validation
*For any* tax rate configuration, the system should validate that TER table contains entries for all tax statuses (TK/0, TK/1, TK/2, TK/3, K/0, K/1, K/2, K/3) with rates between 0% and 50%
**Validates: Requirements 13.3**

Property 74: Calculation parameter validation
*For any* calculation parameter update, the system should validate that minimum score is less than maximum score before saving the configuration
**Validates: Requirements 13.4**

Property 75: Session timeout validation
*For any* session timeout configuration, the system should validate the value is between 1 and 24 hours and apply the timeout to all sessions created after the change
**Validates: Requirements 13.6**

Property 76: Settings change audit logging
*For any* setting change, the system should insert a record in t_audit_log with: setting name, old value, new value, changed_by user_id, and timestamp
**Validates: Requirements 13.7**

### Audit and Logging Properties

Property 77: CRUD operation audit logging
*For any* create, update, or delete operation on any table, the system should insert a record in t_audit_log with: table name, operation type, record ID, user ID, and timestamp
**Validates: Requirements 14.1**

Property 78: Audit log filtering
*For any* audit log view, the system should display a table with filter options for: date range, user, table name, and operation type
**Validates: Requirements 14.2**

Property 79: Calculation logging
*For any* calculation performed, the system should store in t_calculation_log: period, start time, end time, status, employee count processed, and any error messages
**Validates: Requirements 14.3**

Property 80: Authentication logging
*For any* user login or logout, the system should insert a record in t_auth_log with: user ID, action type (login/logout), IP address, and timestamp
**Validates: Requirements 14.4**

Property 81: Sensitive data access logging
*For any* user access to tables containing employee personal data or financial data, the system should log the access in t_audit_log with: user ID, table name, record ID, and timestamp
**Validates: Requirements 14.5**

Property 82: Audit log export
*For any* audit log export request, the system should generate an Excel or CSV file containing all log entries matching the selected filters
**Validates: Requirements 14.6**

### Notification Properties

Property 83: Notification unread count display
*For any* user accessing the notifications page, the system should display a badge with the count of unread notifications
**Validates: Requirements 15.5**

Property 84: Notification read and navigation
*For any* notification clicked by a user, the system should mark the notification as read and navigate to the page related to that notification
**Validates: Requirements 15.6**

### Performance and Optimization Properties

Property 85: Background processing for large calculations
*For any* calculation involving more than 50 employees, the system should process data in background thread and display progress bar updating every 10% completion
**Validates: Requirements 20.3**

Property 86: Image lazy loading
*For any* images on a page, the system should use lazy loading to defer loading images until they are within 200px of viewport and serve images in WebP format where supported
**Validates: Requirements 20.4**

Property 87: Client-side routing
*For any* navigation between pages, the system should use client-side routing to transition within 300ms without full page reload
**Validates: Requirements 20.5**

Property 88: Response caching
*For any* data accessed more than 3 times within 5 minutes, the system should cache the response for 5 minutes
**Validates: Requirements 20.6**

### Responsive Design Properties

Property 89: Mobile form input types
*For any* form field on mobile devices, the system should use input type="email" for email fields, input type="tel" for phone fields, and input type="number" for numeric fields
**Validates: Requirements 19.6**



## Error Handling

### Error Handling Strategy

The system implements a comprehensive error handling strategy across all layers:

1. **Client-Side Validation**: Immediate feedback for user input errors
2. **Server-Side Validation**: Authoritative validation before database operations
3. **Database Constraints**: Final safety net for data integrity
4. **Transaction Management**: Atomic operations with rollback on failure
5. **Error Logging**: Comprehensive logging for debugging and audit

### Error Categories

#### 1. Validation Errors

**Client-Side Validation**:
- Email format validation
- Password strength validation
- Required field validation
- Numeric range validation
- Date format validation

**Server-Side Validation**:
- Duplicate email check
- Unique code check
- Sum validation (weights, proportions)
- Foreign key existence check
- Business rule validation

**Error Response Format**:
```typescript
interface ValidationError {
  field: string
  message: string
  code: string
}

interface ErrorResponse {
  success: false
  errors: ValidationError[]
}
```

#### 2. Authentication Errors

**Error Types**:
- Invalid credentials
- Account locked
- Session expired
- Insufficient permissions
- Invalid token

**Error Handling**:
```typescript
try {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) {
    if (error.message.includes('Invalid')) {
      return { error: 'Invalid email or password' }
    }
    if (error.message.includes('locked')) {
      return { error: 'Account temporarily locked due to multiple failed attempts' }
    }
    return { error: 'Authentication failed. Please try again.' }
  }
  
  return { data }
} catch (error) {
  console.error('Authentication error:', error)
  return { error: 'An unexpected error occurred. Please try again.' }
}
```

#### 3. Database Errors

**Error Types**:
- Unique constraint violation
- Foreign key constraint violation
- Check constraint violation
- Connection timeout
- Transaction rollback

**Error Handling**:
```typescript
try {
  const { data, error } = await supabase
    .from('m_employees')
    .insert(employeeData)
  
  if (error) {
    if (error.code === '23505') { // Unique violation
      return { error: 'Email already exists' }
    }
    if (error.code === '23503') { // Foreign key violation
      return { error: 'Invalid unit selected' }
    }
    if (error.code === '23514') { // Check constraint violation
      return { error: 'Invalid data: constraints not met' }
    }
    throw error
  }
  
  return { data }
} catch (error) {
  console.error('Database error:', error)
  return { error: 'Database operation failed. Please try again.' }
}
```

#### 4. Calculation Errors

**Error Types**:
- Missing prerequisite data
- Invalid calculation input
- Precision overflow
- Division by zero
- Validation failure

**Error Handling**:
```typescript
async function runCalculation(period: string): Promise<CalculationResult> {
  const transaction = await beginTransaction()
  
  try {
    // Validate prerequisites
    const validation = await validateCalculationPrerequisites(period)
    if (!validation.valid) {
      throw new CalculationError(
        'Validation failed',
        validation.errors
      )
    }
    
    // Perform calculations
    await calculateIndividualScores(period)
    await calculateUnitScores(period)
    await distributeIncentives(period)
    
    // Commit transaction
    await transaction.commit()
    
    // Log success
    await logCalculation({
      period,
      status: 'success',
      employee_count: employeeCount
    })
    
    return { success: true }
    
  } catch (error) {
    // Rollback transaction
    await transaction.rollback()
    
    // Log error
    await logCalculation({
      period,
      status: 'error',
      error_message: error.message,
      error_stack: error.stack
    })
    
    return {
      success: false,
      error: 'Calculation failed. Please check the logs for details.'
    }
  }
}
```

#### 5. File Upload Errors

**Error Types**:
- Invalid file format
- File size exceeded
- Corrupted file
- Invalid data format
- Missing required columns

**Error Handling**:
```typescript
async function handleFileUpload(file: File): Promise<UploadResult> {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!validTypes.includes(file.type)) {
    return {
      success: false,
      error: 'Invalid file format. Please upload JPG, PNG, or GIF.'
    }
  }
  
  // Validate file size (2MB max)
  const maxSize = 2 * 1024 * 1024 // 2MB in bytes
  if (file.size > maxSize) {
    return {
      success: false,
      error: 'File size exceeds 2MB limit.'
    }
  }
  
  try {
    // Upload file
    const { data, error } = await supabase.storage
      .from('profile-photos')
      .upload(`${userId}/${file.name}`, file)
    
    if (error) throw error
    
    return { success: true, data }
    
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: 'File upload failed. Please try again.'
    }
  }
}
```

### Error Logging

All errors are logged with appropriate context:

```typescript
interface ErrorLog {
  timestamp: string
  level: 'error' | 'warning' | 'info'
  category: string
  message: string
  stack?: string
  user_id?: string
  request_id?: string
  metadata?: object
}

async function logError(error: Error, context: object): Promise<void> {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    level: 'error',
    category: context.category || 'general',
    message: error.message,
    stack: error.stack,
    user_id: context.userId,
    request_id: context.requestId,
    metadata: context.metadata
  }
  
  // Log to database
  await supabase
    .from('t_error_log')
    .insert(errorLog)
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorLog)
  }
}
```

## Testing Strategy

### Overview

The testing strategy employs a dual approach combining unit tests and property-based tests to ensure comprehensive coverage and correctness validation.

### Testing Approach

1. **Unit Tests**: Verify specific examples, edge cases, and error conditions
2. **Property-Based Tests**: Verify universal properties across all inputs
3. **Integration Tests**: Verify component interactions and end-to-end flows
4. **Manual Testing**: Verify UI/UX aspects that cannot be automated

### Property-Based Testing Framework

**Framework**: fast-check (for TypeScript/JavaScript)

**Installation**:
```bash
npm install --save-dev fast-check @types/fast-check
```

**Configuration**:
- Minimum 100 iterations per property test
- Each property test references its design document property
- Tag format: `Feature: comprehensive-system-enhancement, Property {number}: {property_text}`

### Test Organization

```
tests/
├── unit/
│   ├── auth/
│   │   ├── login.test.ts
│   │   └── password.test.ts
│   ├── users/
│   │   ├── crud.test.ts
│   │   └── validation.test.ts
│   ├── kpi/
│   │   ├── configuration.test.ts
│   │   └── calculation.test.ts
│   └── reports/
│       ├── generation.test.ts
│       └── export.test.ts
├── property/
│   ├── auth.property.test.ts
│   ├── users.property.test.ts
│   ├── kpi.property.test.ts
│   ├── calculation.property.test.ts
│   └── reports.property.test.ts
└── integration/
    ├── calculation-flow.test.ts
    ├── realization-flow.test.ts
    └── reporting-flow.test.ts
```

### Property Test Examples

#### Example 1: Role-based Dashboard Redirection (Property 1)

```typescript
import fc from 'fast-check'

describe('Feature: comprehensive-system-enhancement, Property 1: Role-based dashboard redirection', () => {
  it('should redirect users to role-specific dashboards', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8 }),
          role: fc.constantFrom('superadmin', 'unit_manager', 'employee')
        }),
        async (user) => {
          // Setup: Create user with role
          await createTestUser(user)
          
          // Act: Login
          const result = await login(user.email, user.password)
          
          // Assert: Verify redirect URL matches role
          const expectedDashboard = {
            'superadmin': '/admin/dashboard',
            'unit_manager': '/manager/dashboard',
            'employee': '/employee/dashboard'
          }[user.role]
          
          expect(result.redirectUrl).toBe(expectedDashboard)
          
          // Cleanup
          await deleteTestUser(user.email)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

#### Example 2: Achievement Percentage Calculation (Property 33)

```typescript
describe('Feature: comprehensive-system-enhancement, Property 33: Achievement percentage calculation', () => {
  it('should calculate achievement percentage correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          realizationValue: fc.float({ min: 0, max: 1000 }),
          targetValue: fc.float({ min: 1, max: 1000 }) // Avoid division by zero
        }),
        async ({ realizationValue, targetValue }) => {
          // Act: Calculate achievement
          const achievement = calculateAchievementPercentage(
            realizationValue,
            targetValue
          )
          
          // Assert: Verify formula and rounding
          const expected = Number(
            ((realizationValue / targetValue) * 100).toFixed(2)
          )
          
          expect(achievement).toBe(expected)
          expect(achievement.toString()).toMatch(/^\d+\.\d{2}$/)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

#### Example 3: Unit Proportion Sum Validation (Property 19)

```typescript
describe('Feature: comprehensive-system-enhancement, Property 19: Unit proportion sum validation', () => {
  it('should validate unit proportions sum to 100%', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            code: fc.string({ minLength: 2, maxLength: 10 }),
            name: fc.string({ minLength: 3, maxLength: 50 }),
            proportion: fc.float({ min: 0, max: 100 })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (units) => {
          // Calculate sum
          const sum = units.reduce((acc, u) => acc + u.proportion, 0)
          
          // Act: Validate
          const validation = validateUnitProportions(units)
          
          // Assert: Should pass if sum is 100 ± 0.01
          const isValid = Math.abs(sum - 100) <= 0.01
          expect(validation.valid).toBe(isValid)
          
          if (!isValid) {
            expect(validation.error).toContain('sum')
            expect(validation.error).toContain('100%')
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Unit Test Examples

#### Example 1: Login with Invalid Credentials

```typescript
describe('Login - Invalid Credentials', () => {
  it('should display error message for invalid email', async () => {
    const result = await login('invalid@example.com', 'password123')
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid email or password')
  })
  
  it('should display error message for wrong password', async () => {
    await createTestUser({
      email: 'test@example.com',
      password: 'correct123'
    })
    
    const result = await login('test@example.com', 'wrong123')
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid email or password')
  })
})
```

#### Example 2: Password Validation

```typescript
describe('Password Validation', () => {
  it('should reject password shorter than 8 characters', () => {
    const result = validatePassword('Short1!')
    
    expect(result.valid).toBe(false)
    expect(result.error).toContain('minimum 8 characters')
  })
  
  it('should reject password without uppercase letter', () => {
    const result = validatePassword('lowercase123!')
    
    expect(result.valid).toBe(false)
    expect(result.error).toContain('uppercase letter')
  })
  
  it('should accept valid password', () => {
    const result = validatePassword('Valid123!')
    
    expect(result.valid).toBe(true)
  })
})
```

### Integration Test Examples

#### Example 1: Complete Calculation Flow

```typescript
describe('Calculation Flow Integration', () => {
  it('should complete full calculation from realization to incentive', async () => {
    // Setup: Create test data
    const unit = await createTestUnit()
    const employees = await createTestEmployees(unit.id, 5)
    const categories = await createTestKPICategories(unit.id)
    const indicators = await createTestIndicators(categories)
    const pool = await createTestPool('2024-01')
    
    // Input realizations
    for (const employee of employees) {
      for (const indicator of indicators) {
        await createRealization({
          employee_id: employee.id,
          indicator_id: indicator.id,
          period: '2024-01',
          realization_value: Math.random() * 100
        })
      }
    }
    
    // Approve pool
    await approvePool(pool.id)
    
    // Run calculation
    const result = await runCalculation('2024-01')
    
    // Verify results
    expect(result.success).toBe(true)
    
    // Verify all employees have results
    for (const employee of employees) {
      const calcResult = await getCalculationResult(employee.id, '2024-01')
      
      expect(calcResult).toBeDefined()
      expect(calcResult.gross_incentive).toBeGreaterThan(0)
      expect(calcResult.net_incentive).toBeLessThan(calcResult.gross_incentive)
    }
    
    // Cleanup
    await cleanupTestData()
  })
})
```

### Test Coverage Goals

- **Unit Tests**: 80% code coverage minimum
- **Property Tests**: All correctness properties implemented
- **Integration Tests**: All critical user flows covered
- **Manual Tests**: All UI/UX aspects verified

### Continuous Integration

Tests run automatically on:
- Every commit to feature branches
- Every pull request
- Before deployment to staging
- Before deployment to production

### Test Data Management

- Use factories for test data generation
- Clean up test data after each test
- Use separate test database
- Seed test database with minimal required data

