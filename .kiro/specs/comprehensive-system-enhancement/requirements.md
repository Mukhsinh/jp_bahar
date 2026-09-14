# Requirements Document

## Introduction

Sistem JASPEL (Enterprise Incentive & KPI System) memerlukan penyempurnaan komprehensif untuk meningkatkan fungsionalitas, keamanan, dan pengalaman pengguna. Penyempurnaan ini mencakup manajemen user yang lengkap, navigasi yang modern, halaman-halaman yang komprehensif, dan sistem pelaporan yang robust.

## Glossary

- **System**: JASPEL Enterprise Incentive & KPI System
- **User**: Pengguna sistem dengan role tertentu (Superadmin, Unit Manager, atau Employee)
- **Superadmin**: Role dengan akses penuh ke seluruh sistem
- **Unit_Manager**: Role yang mengelola data karyawan dalam unit tertentu
- **Employee**: Role yang hanya dapat melihat data pribadi
- **Sidebar**: Menu navigasi vertikal di sisi kiri aplikasi
- **Dashboard**: Halaman utama setelah login yang menampilkan ringkasan data
- **CRUD**: Create, Read, Update, Delete operations
- **RLS**: Row Level Security - keamanan tingkat baris di database
- **Authentication**: Proses verifikasi identitas pengguna
- **Session**: Sesi login pengguna yang aktif

## Requirements

### Requirement 1: Enhanced Login System

**User Story:** Sebagai user, saya ingin sistem login yang aman dengan feedback yang jelas, sehingga saya dapat mengakses sistem dengan mudah dan aman.

#### Acceptance Criteria

1. WHEN a user enters valid credentials THEN THE System SHALL authenticate the user and redirect to the dashboard corresponding to their role (Superadmin to /admin/dashboard, Unit_Manager to /manager/dashboard, Employee to /employee/dashboard) within 3 seconds
2. WHEN a user enters invalid credentials THEN THE System SHALL display the message "Invalid email or password" and remain on the login page
3. WHEN a user's session reaches 8 hours of inactivity THEN THE System SHALL terminate the session, redirect to the login page, and display the message "Your session has expired. Please login again"
4. WHEN a user successfully logs in THEN THE System SHALL create a session with 8-hour inactivity timeout duration
5. WHEN a user clicks "Forgot Password" THEN THE System SHALL send a password reset link to the registered email within 60 seconds
6. WHEN a user with an active session navigates to login page THEN THE System SHALL redirect to their role-specific dashboard within 2 seconds
7. WHEN login fails 5 times consecutively within 15 minutes THEN THE System SHALL lock the account for 15 minutes and display the message "Account temporarily locked due to multiple failed attempts. Please try again in 15 minutes."

### Requirement 2: User Management (CRUD)

**User Story:** Sebagai Superadmin, saya ingin mengelola data user secara lengkap, sehingga saya dapat mengontrol akses sistem dengan baik.

#### Acceptance Criteria

1. WHEN Superadmin accesses user management page THEN THE System SHALL display a table containing all users with columns: name, email, role, unit, and status within 3 seconds
2. WHEN Superadmin creates a new user with all required fields (name, email, role, unit) THEN THE System SHALL create the user account, generate an 8-character alphanumeric temporary password, and display the message "User created successfully. Temporary password sent to [email]"
3. WHEN Superadmin updates user information THEN THE System SHALL validate email format matches pattern [text]@[text].[text], save changes, and display the message "User updated successfully"
4. WHEN Superadmin deactivates a user THEN THE System SHALL revoke all active sessions for that user within 30 seconds and display the message "User deactivated successfully"
5. WHEN Superadmin enters text in the search field THEN THE System SHALL filter the user list within 1 second to show only users where the search term matches any part of name, email, unit, or role fields (case-insensitive)
6. WHEN Superadmin assigns a role to a user THEN THE System SHALL terminate the user's current session and display the message "Role updated. User must re-login for changes to take effect"
7. WHEN Superadmin attempts to create a user with an email that already exists THEN THE System SHALL display the message "Email already exists. Please use a different email address" and maintain the form with entered data
8. WHEN the user list contains more than 50 users THEN THE System SHALL display 50 users per page with pagination controls showing page numbers and next/previous buttons

### Requirement 3: Password Management

**User Story:** Sebagai user, saya ingin dapat mengelola password saya sendiri, sehingga saya dapat menjaga keamanan akun saya.

#### Acceptance Criteria

1. WHEN a user accesses profile settings THEN THE System SHALL display a "Change Password" button
2. WHEN a user submits a password change request THEN THE System SHALL verify the current password matches before processing the change
3. WHEN a new password is submitted THEN THE System SHALL validate that it contains minimum 8 characters, at least 1 uppercase letter, at least 1 number, and at least 1 special character
4. WHEN password change is successful THEN THE System SHALL send a confirmation email to the user's registered email address within 60 seconds
5. WHEN Superadmin resets a user's password THEN THE System SHALL generate an 8-character temporary password and send it to the user's email within 60 seconds
6. WHEN a user logs in with a temporary password THEN THE System SHALL redirect to password change page before allowing access to other pages
7. WHEN a password reset link is generated THEN THE System SHALL set expiration time to 24 hours from generation time

### Requirement 4: Role-Based Access Control

**User Story:** Sebagai System Administrator, saya ingin sistem memiliki kontrol akses berbasis role yang ketat, sehingga data sensitif terlindungi.

#### Acceptance Criteria

1. WHEN a user logs in THEN THE System SHALL load the permission set corresponding to their assigned role
2. WHEN a user attempts to access a page not permitted for their role THEN THE System SHALL redirect to a 403 Forbidden page with the message "You do not have permission to access this page"
3. WHEN a Unit_Manager queries data THEN THE System SHALL return only records where the unit_id matches their assigned unit
4. WHEN an Employee queries data THEN THE System SHALL return only records where the employee_id matches their user ID
5. WHEN a Superadmin queries any data THEN THE System SHALL return all records without filtering
6. WHEN a user's role is changed THEN THE System SHALL terminate their current session and require re-login to apply new permissions
7. WHEN rendering navigation menu THEN THE System SHALL display only menu items where the user's role has read permission

### Requirement 5: Modern Sidebar Navigation

**User Story:** Sebagai user, saya ingin navigasi yang modern dan intuitif, sehingga saya dapat mengakses fitur dengan mudah.

#### Acceptance Criteria

1. WHEN a user views the sidebar THEN THE System SHALL display a sidebar with width 240px containing menu items with icons and text labels
2. WHEN a user clicks the collapse button THEN THE System SHALL animate the sidebar width from 240px to 64px over 300ms and hide text labels while keeping icons visible
3. WHEN a user hovers over a menu item THEN THE System SHALL change the background color to #f3f4f6 within 100ms
4. WHEN a user is on a specific page THEN THE System SHALL apply background color #3b82f6 and text color #ffffff to the corresponding menu item in the sidebar
5. WHEN the sidebar is collapsed and user hovers over a menu item THEN THE System SHALL display a tooltip containing the menu item label positioned 8px to the right of the icon
6. WHEN a user accesses the system on a device with screen width less than 768px THEN THE System SHALL hide the sidebar and display a hamburger menu icon in the top-left corner
7. WHEN a menu has sub-items THEN THE System SHALL display a chevron icon that rotates 90 degrees clockwise when clicked to expand the submenu and rotates 90 degrees counter-clockwise when clicked to collapse
8. WHEN a user clicks logout THEN THE System SHALL display a modal dialog with the message "Are you sure you want to logout?" and buttons labeled "Cancel" and "Logout"

### Requirement 6: Comprehensive Dashboard Pages

**User Story:** Sebagai user, saya ingin dashboard yang informatif dan lengkap, sehingga saya dapat memahami status sistem dengan cepat.

#### Acceptance Criteria

1. WHEN Superadmin views dashboard THEN THE System SHALL display cards showing: total number of units, total number of employees, total pool amount in IDR, and count of active calculations
2. WHEN Unit_Manager views dashboard THEN THE System SHALL display: unit's average KPI score, number of employees in the unit, and count of pending realization entries
3. WHEN Employee views dashboard THEN THE System SHALL display: personal KPI score for current period, incentive history for last 6 months, and line chart showing achievement trends
4. WHEN dashboard loads THEN THE System SHALL complete initial render within 2 seconds
5. WHEN data is loading THEN THE System SHALL display animated skeleton placeholders matching the layout of the content
6. WHEN dashboard displays charts THEN THE System SHALL render charts that resize automatically when window size changes
7. WHEN dashboard data is older than 5 minutes THEN THE System SHALL display a refresh button that reloads data when clicked

### Requirement 7: Unit Management Module

**User Story:** Sebagai Superadmin, saya ingin mengelola unit organisasi, sehingga struktur organisasi dapat dikelola dengan baik.

#### Acceptance Criteria

1. WHEN Superadmin accesses unit management THEN THE System SHALL display a table with columns: unit code, unit name, proportion percentage, and active status within 3 seconds
2. WHEN Superadmin creates a new unit THEN THE System SHALL verify unit code is unique, create the unit record, and display the message "Unit created successfully"
3. WHEN Superadmin updates unit proportion THEN THE System SHALL save the new proportion value, recalculate incentive distribution for the current period, and display the message "Proportion updated and calculations refreshed"
4. WHEN Superadmin attempts to delete a unit where employee count is greater than 0 THEN THE System SHALL display the message "Cannot delete unit with assigned employees. Please reassign employees first" and maintain the unit record unchanged
5. WHEN Superadmin sets unit proportions THEN THE System SHALL validate that the sum of all active unit proportions equals 100% with tolerance of ±0.01%
6. WHEN viewing unit list THEN THE System SHALL display unit code, name, proportion as percentage with 2 decimal places, and status as text "Active" or "Inactive"
7. WHEN Superadmin deactivates a unit THEN THE System SHALL exclude the unit from new calculations, preserve all historical calculation data, and display the message "Unit deactivated successfully"

### Requirement 8: KPI Configuration Module

**User Story:** Sebagai Superadmin, saya ingin mengkonfigurasi KPI categories dan indicators, sehingga sistem dapat disesuaikan dengan kebutuhan organisasi.

#### Acceptance Criteria

1. WHEN Superadmin accesses KPI configuration THEN THE System SHALL display a tree view showing categories (P1, P2, P3) with their indicators grouped by unit within 3 seconds
2. WHEN Superadmin creates a KPI category for a unit THEN THE System SHALL validate that the sum of category weights (P1 + P2 + P3) for that unit equals 100% with tolerance of ±0.01%
3. WHEN Superadmin adds an indicator to a category THEN THE System SHALL validate that the sum of all indicator weights within that category equals 100% with tolerance of ±0.01%
4. WHEN Superadmin updates indicator weights THEN THE System SHALL recalculate KPI scores for all employees in the current period and display the message "Weights updated and scores recalculated"
5. WHEN Superadmin attempts to delete an indicator where realization record count is greater than 0 THEN THE System SHALL display a modal dialog with the message "This indicator has existing realization data. Deletion will affect historical calculations. Continue?" and buttons labeled "Cancel" and "Delete"
6. WHEN viewing KPI structure THEN THE System SHALL display a hierarchical tree with expandable/collapsible nodes showing unit > category > indicator relationships with expand/collapse icons
7. WHEN Superadmin selects "Copy KPI Structure" THEN THE System SHALL display a form to select source unit and target unit, then duplicate all categories and indicators with their weights to the target unit

### Requirement 9: Pool Management Module

**User Story:** Sebagai Superadmin, saya ingin mengelola pool dana per periode, sehingga distribusi insentif dapat dilakukan dengan akurat.

#### Acceptance Criteria

1. WHEN Superadmin creates a pool THEN THE System SHALL validate that the period format is YYYY-MM and that no pool exists for that period
2. WHEN Superadmin adds revenue items to a pool THEN THE System SHALL calculate total revenue as the sum of all revenue item amounts
3. WHEN Superadmin adds deduction items to a pool THEN THE System SHALL calculate net pool as total revenue minus sum of all deduction amounts
4. WHEN Superadmin sets allocation percentage THEN THE System SHALL calculate allocated amount as net pool multiplied by allocation percentage
5. WHEN Superadmin approves a pool THEN THE System SHALL set pool status to "Approved", prevent further modifications, and trigger the calculation process for that period
6. WHEN viewing pool history THEN THE System SHALL display a table with columns: period, status, total revenue, total deductions, net pool, and allocated amount
7. WHEN a pool has status "Draft" THEN THE System SHALL allow Superadmin to add, edit, or delete revenue and deduction items

### Requirement 10: Realization Input Module

**User Story:** Sebagai Unit_Manager, saya ingin menginput realisasi KPI karyawan, sehingga pencapaian dapat dicatat dan dihitung.

#### Acceptance Criteria

1. WHEN Unit_Manager accesses realization input THEN THE System SHALL display a list containing only employees where unit_id matches the Unit_Manager's assigned unit
2. WHEN Unit_Manager selects an employee and period THEN THE System SHALL display all KPI indicators configured for that employee's unit
3. WHEN Unit_Manager enters a realization value THEN THE System SHALL calculate achievement percentage as (realization value / target value) × 100
4. WHEN Unit_Manager clicks save THEN THE System SHALL validate that all required indicator fields are filled and save the realization data to t_kpi_realization table
5. WHEN Unit_Manager uploads an Excel file THEN THE System SHALL validate that the file contains columns: employee_id, period, indicator_id, realization_value, and import all rows with valid data
6. WHEN realization data already exists for an employee-period-indicator combination THEN THE System SHALL allow updates and store the previous value with timestamp in modification history
7. WHEN calculating achievement percentage THEN THE System SHALL use the formula: (realization_value / target_value) × 100 and round to 2 decimal places

### Requirement 11: Calculation Engine

**User Story:** Sebagai System, saya ingin menghitung skor dan insentif secara otomatis, sehingga distribusi dapat dilakukan dengan akurat dan konsisten.

#### Acceptance Criteria

1. WHEN calculation is triggered for a period THEN THE System SHALL calculate individual KPI scores for all active employees in that period
2. WHEN calculating P1, P2, P3 scores THEN THE System SHALL multiply each indicator achievement by its weight, sum within category, then multiply by category weight
3. WHEN calculating unit scores THEN THE System SHALL sum all individual employee scores within each unit
4. WHEN calculating monetary amounts THEN THE System SHALL use precision of 2 decimal places for all currency values
5. WHEN calculating tax for an employee THEN THE System SHALL apply the TER rate corresponding to the employee's tax status (TK0, K0, K1, K2, K3)
6. WHEN calculation completes successfully THEN THE System SHALL store calculation results with employee_id, period, scores, and amounts
7. WHEN calculation encounters a validation error THEN THE System SHALL log the error with timestamp, error description, and affected employee_id, then revert all changes made during that calculation run

### Requirement 12: Reporting Module

**User Story:** Sebagai user, saya ingin mengakses berbagai laporan, sehingga saya dapat menganalisis data dan membuat keputusan.

#### Acceptance Criteria

1. WHEN Superadmin accesses reports page THEN THE System SHALL display a list of report types: Incentive Report, KPI Achievement Report, Unit Comparison Report, and Employee Slip within 2 seconds
2. WHEN generating incentive report for a period THEN THE System SHALL include columns: employee name, unit, P1 score, P2 score, P3 score, gross incentive, tax amount, and net incentive formatted with 2 decimal places
3. WHEN generating KPI achievement report THEN THE System SHALL display for each indicator: indicator name, target value, realization value, and achievement percentage formatted with 2 decimal places
4. WHEN generating unit comparison report THEN THE System SHALL display a table with rows for each unit showing: unit name, average score (2 decimal places), total incentive (IDR format with thousand separators), and employee count (integer)
5. WHEN exporting to Excel THEN THE System SHALL create a .xlsx file with formatted headers in bold font, numeric columns with thousand separators, and percentage columns with % symbol
6. WHEN exporting to PDF THEN THE System SHALL generate a .pdf document with company logo in header (max height 60px), report title in 16pt font, generation date in format DD/MM/YYYY HH:mm, and data in tabular format
7. WHEN selecting a report period where calculation record count equals 0 THEN THE System SHALL display the message "No data available for the selected period"
8. WHEN generating employee slip THEN THE System SHALL include sections for: P1 breakdown with indicators and weights, P2 breakdown with indicators and weights, P3 breakdown with indicators and weights, gross amount (IDR format), tax amount (IDR format), and net amount (IDR format)

### Requirement 13: Application Settings

**User Story:** Sebagai Superadmin, saya ingin mengkonfigurasi pengaturan aplikasi, sehingga sistem dapat disesuaikan dengan kebutuhan organisasi.

#### Acceptance Criteria

1. WHEN Superadmin accesses settings page THEN THE System SHALL display sections for: Company Information, Tax Configuration, Calculation Parameters, Email Templates, and Session Settings
2. WHEN Superadmin updates company information (name, address, logo) THEN THE System SHALL save changes and display the updated information in all generated reports
3. WHEN Superadmin configures tax rates THEN THE System SHALL validate that TER table contains entries for all tax statuses (TK0, K0, K1, K2, K3) with rates between 0% and 50%
4. WHEN Superadmin sets calculation parameters (minimum score, maximum score) THEN THE System SHALL validate that minimum score is less than maximum score and save the configuration
5. WHEN Superadmin updates email templates THEN THE System SHALL display a preview of the template with sample data and save the template content
6. WHEN Superadmin configures session timeout THEN THE System SHALL validate the value is between 1 and 24 hours and apply the timeout to all sessions created after the change
7. WHEN any setting is changed THEN THE System SHALL insert a record in t_audit_log with: setting name, old value, new value, changed_by user_id, and timestamp

### Requirement 14: Audit Trail and Logging

**User Story:** Sebagai Superadmin, saya ingin melihat audit trail semua aktivitas penting, sehingga sistem dapat diaudit dan dipantau.

#### Acceptance Criteria

1. WHEN a user performs create, update, or delete operations on any table THEN THE System SHALL log the operation with: table name, operation type, record ID, user ID, and timestamp
2. WHEN viewing audit logs THEN THE System SHALL display a table with filter options for: date range, user, table name, and operation type
3. WHEN a calculation is performed THEN THE System SHALL log: period, start time, end time, status, employee count processed, and any error messages
4. WHEN a user logs in or logs out THEN THE System SHALL log the authentication event with: user ID, action type (login/logout), IP address, and timestamp
5. WHEN a user accesses tables containing employee personal data or financial data THEN THE System SHALL log the access with: user ID, table name, record ID, and timestamp
6. WHEN Superadmin exports audit logs THEN THE System SHALL generate an Excel or CSV file containing all log entries matching the selected filters
7. WHEN audit log records reach 2 years of age THEN THE System SHALL archive them to a separate storage location and remove from active logs

### Requirement 15: Notification System

**User Story:** Sebagai user, saya ingin menerima notifikasi untuk event penting, sehingga saya dapat merespons dengan cepat.

#### Acceptance Criteria

1. WHEN a pool status changes to "Approved" THEN THE System SHALL send an email notification to all users with Unit_Manager role within 5 minutes
2. WHEN calculation completes successfully THEN THE System SHALL send email notifications to Superadmin and all employees included in the calculation within 5 minutes
3. WHEN a password is reset THEN THE System SHALL send a confirmation email to the user's registered email address within 60 seconds
4. WHEN a new user account is created THEN THE System SHALL send a welcome email containing the temporary password to the user's email within 60 seconds
5. WHEN a user accesses the notifications page THEN THE System SHALL display a badge with the count of unread notifications
6. WHEN a user clicks on a notification THEN THE System SHALL mark the notification as read and navigate to the page related to that notification
7. WHEN an email fails to send THEN THE System SHALL retry sending up to 3 times with 5-minute intervals and log the failure if all attempts fail

### Requirement 16: Data Export and Import

**User Story:** Sebagai user, saya ingin mengekspor dan mengimpor data dalam format Excel, sehingga data dapat dikelola secara batch.

#### Acceptance Criteria

1. WHEN exporting employee data THEN THE System SHALL generate an Excel file (.xlsx) containing columns: employee_id, name, email, unit, role, status, and creation date within 10 seconds
2. WHEN exporting KPI template THEN THE System SHALL generate an Excel file (.xlsx) with columns: indicator_id, indicator_name, category, unit, weight, target_value with headers in bold and sample data in row 2
3. WHEN importing realization data THEN THE System SHALL validate that all required columns (employee_id, period, indicator_id, realization_value) are present and contain valid data types
4. WHEN import contains errors THEN THE System SHALL display a table showing row numbers, field names, and error descriptions for each validation failure
5. WHEN import is successful THEN THE System SHALL display the message "Successfully imported [N] records" where N is the count of imported rows
6. WHEN downloading template THEN THE System SHALL generate an Excel file (.xlsx) with column headers in row 1, sample data in row 2, and instructions in a separate sheet named "Instructions"
7. WHEN exporting calculation results THEN THE System SHALL generate an Excel file (.xlsx) with sheets for: Summary (totals), Employee Details (individual scores), and Formulas (calculation breakdown) within 15 seconds

### Requirement 17: Profile Management

**User Story:** Sebagai user, saya ingin mengelola profil saya sendiri, sehingga informasi saya tetap up-to-date.

#### Acceptance Criteria

1. WHEN a user accesses profile page THEN THE System SHALL display current user information including: name, email, role, unit, and profile photo within 2 seconds
2. WHEN a user updates profile information (name, phone) THEN THE System SHALL validate required fields are not empty, save changes to the database, and display the message "Profile updated successfully"
3. WHEN a user uploads profile photo THEN THE System SHALL validate image format is JPG, PNG, or GIF and file size is maximum 2MB (2,097,152 bytes)
4. WHEN a user changes email THEN THE System SHALL send a verification email to the new address within 60 seconds containing a verification link valid for 24 hours
5. WHEN viewing profile THEN THE System SHALL display role name, unit name, and a list of accessible menu items based on role permissions
6. WHEN Employee updates tax status THEN THE System SHALL save the new tax status (TK0, K0, K1, K2, or K3) and apply it to all future incentive calculations
7. WHEN profile update fails due to validation error THEN THE System SHALL display the message "[Field name] is invalid: [specific reason]" and maintain the form with entered data

### Requirement 18: Search and Filter Functionality

**User Story:** Sebagai user, saya ingin mencari dan memfilter data dengan mudah, sehingga saya dapat menemukan informasi yang dibutuhkan dengan cepat.

#### Acceptance Criteria

1. WHEN a user enters search query THEN THE System SHALL search across relevant fields and update results within 500ms of the last keystroke
2. WHEN a user applies filters THEN THE System SHALL update results within 1 second without page reload
3. WHEN multiple filters are applied THEN THE System SHALL combine filters with AND logic and display only records matching all filter criteria
4. WHEN a user clears filters THEN THE System SHALL reset to default view showing all records within 1 second
5. WHEN search returns zero results THEN THE System SHALL display the message "No results found for '[search term]'. Try different keywords or clear filters."
6. WHEN filtering by date range THEN THE System SHALL validate that start date is not after end date and apply filter to show only records where date field is between start date and end date (inclusive)
7. WHEN exporting filtered data THEN THE System SHALL export only the records currently visible after applying all active filters

### Requirement 19: Responsive Design

**User Story:** Sebagai user, saya ingin mengakses sistem dari berbagai perangkat, sehingga saya dapat bekerja secara fleksibel.

#### Acceptance Criteria

1. WHEN accessing from desktop (screen width ≥ 1024px) THEN THE System SHALL display full sidebar with width 240px and multi-column layouts with up to 3 columns
2. WHEN accessing from tablet (screen width 768px to 1023px) THEN THE System SHALL display sidebar with width 200px and 2-column layouts
3. WHEN accessing from mobile (screen width < 768px) THEN THE System SHALL hide the sidebar, display a hamburger menu icon in the top-left corner, and use single-column layout
4. WHEN rotating device orientation THEN THE System SHALL detect orientation change and adjust layout within 500ms
5. WHEN viewing tables on mobile (screen width < 768px) THEN THE System SHALL enable horizontal scrolling or transform table to card view with stacked fields
6. WHEN interacting with forms on mobile THEN THE System SHALL use input type="email" for email fields, input type="tel" for phone fields, and input type="number" for numeric fields
7. WHEN viewing charts on mobile (screen width < 768px) THEN THE System SHALL scale chart width to 100% of container and adjust height to maintain aspect ratio

### Requirement 20: Performance Optimization

**User Story:** Sebagai user, saya ingin sistem yang responsif dan cepat, sehingga produktivitas tidak terganggu.

#### Acceptance Criteria

1. WHEN loading dashboard THEN THE System SHALL render initial view with all visible content within 2 seconds
2. WHEN fetching datasets with more than 100 records THEN THE System SHALL display 50 records per page with pagination controls or implement virtual scrolling
3. WHEN performing calculations for more than 50 employees THEN THE System SHALL display progress indicator updating every 10% completion
4. WHEN loading images THEN THE System SHALL defer loading images until they are within 200px of viewport
5. WHEN navigating between pages THEN THE System SHALL transition within 300ms
6. WHEN data is accessed more than 3 times within 5 minutes THEN THE System SHALL serve the response from cache for subsequent requests within that 5-minute window
7. WHEN executing database queries THEN THE System SHALL complete queries within 1 second for datasets containing up to 10,000 records
