# Requirements Document

## Introduction

Sistem Penilaian KPI adalah fitur baru yang memungkinkan unit manager dan superadmin untuk melakukan penilaian kinerja pegawai berdasarkan struktur KPI yang telah dikonfigurasi. Sistem ini akan mengintegrasikan penilaian dengan pool dana yang ada untuk menghasilkan perhitungan insentif yang akurat berdasarkan penilaian kinerja.

## Glossary

- **KPI_Assessment_System**: Sistem penilaian kinerja pegawai berbasis KPI
- **Assessment_Form**: Form penilaian yang berisi indikator KPI untuk dinilai
- **Assessment_Score**: Nilai penilaian untuk setiap indikator KPI
- **Unit_Manager**: Pengguna dengan role unit_manager yang dapat menilai pegawai di unitnya
- **Superadmin**: Pengguna dengan role superadmin yang dapat menilai semua pegawai
- **Employee**: Pegawai yang dinilai kinerjanya
- **KPI_Indicator**: Indikator KPI yang menjadi dasar penilaian
- **Assessment_Period**: Periode penilaian (format YYYY-MM)
- **Gross_Incentive**: Nilai insentif kotor sebelum pajak
- **Tax_Amount**: Jumlah pajak yang dipotong
- **Net_Incentive**: Nilai insentif bersih setelah pajak

## Requirements

### Requirement 1: Menu Navigation

**User Story:** Sebagai unit manager atau superadmin, saya ingin mengakses menu "Penilaian KPI" di sidebar, sehingga saya dapat melakukan penilaian kinerja pegawai.

#### Acceptance Criteria

1. WHEN a unit manager or superadmin accesses the sidebar, THE System SHALL display "Penilaian KPI" menu item
2. WHEN an employee accesses the sidebar, THE System SHALL NOT display "Penilaian KPI" menu item
3. WHEN a user clicks "Penilaian KPI" menu, THE System SHALL navigate to the assessment page
4. THE System SHALL use "ClipboardCheck" icon for the menu item
5. THE System SHALL position the menu item between "Input Realisasi" and "Laporan"

### Requirement 2: Assessment Page Display

**User Story:** Sebagai unit manager, saya ingin melihat daftar pegawai di unit saya yang perlu dinilai, sehingga saya dapat melakukan penilaian secara sistematis.

#### Acceptance Criteria

1. WHEN a unit manager accesses the assessment page, THE System SHALL display only employees from their unit
2. WHEN a superadmin accesses the assessment page, THE System SHALL display all employees from all units
3. WHEN displaying employee list, THE System SHALL show employee name, unit, current period, and assessment status
4. WHEN no employees are found, THE System SHALL display appropriate empty state message
5. THE System SHALL provide period selector to choose assessment period (YYYY-MM format)

### Requirement 3: Assessment Form Creation

**User Story:** Sebagai unit manager atau superadmin, saya ingin membuka form penilaian untuk pegawai tertentu, sehingga saya dapat memberikan penilaian berdasarkan KPI yang telah dikonfigurasi.

#### Acceptance Criteria

1. WHEN a user clicks "Nilai" button for an employee, THE System SHALL open assessment form dialog
2. WHEN opening assessment form, THE System SHALL load all KPI indicators for the employee's unit
3. WHEN displaying KPI indicators, THE System SHALL group them by category (P1, P2, P3)
4. WHEN showing each indicator, THE System SHALL display indicator name, target value, weight percentage, and measurement unit
5. THE System SHALL provide input fields for realization value and notes for each indicator

### Requirement 4: Assessment Score Calculation

**User Story:** Sebagai sistem, saya ingin menghitung skor penilaian secara otomatis berdasarkan nilai realisasi yang diinput, sehingga penilaian menjadi objektif dan konsisten.

#### Acceptance Criteria

1. WHEN a user inputs realization value, THE System SHALL calculate achievement percentage automatically
2. WHEN calculating achievement percentage, THE System SHALL use formula: (realization_value / target_value) * 100
3. WHEN achievement percentage is calculated, THE System SHALL determine score based on achievement level
4. WHEN achievement is >= 100%, THE System SHALL assign score of 100
5. WHEN achievement is < 100%, THE System SHALL assign score equal to achievement percentage

### Requirement 5: Assessment Data Persistence

**User Story:** Sebagai sistem, saya ingin menyimpan data penilaian ke database, sehingga data penilaian dapat digunakan untuk perhitungan insentif.

#### Acceptance Criteria

1. WHEN a user submits assessment form, THE System SHALL save all assessment data to t_kpi_assessments table
2. WHEN saving assessment data, THE System SHALL include employee_id, indicator_id, period, realization_value, achievement_percentage, score, and notes
3. WHEN assessment already exists for same employee-indicator-period, THE System SHALL update existing record
4. WHEN saving assessment, THE System SHALL record assessor_id (user who performed the assessment)
5. THE System SHALL validate that only unit managers can assess employees in their unit (except superadmin)

### Requirement 6: Incentive Calculation Integration

**User Story:** Sebagai sistem, saya ingin mengintegrasikan penilaian KPI dengan perhitungan insentif, sehingga insentif dihitung berdasarkan penilaian yang telah dilakukan.

#### Acceptance Criteria

1. WHEN calculating incentives, THE System SHALL use assessment scores from t_kpi_assessments table
2. WHEN no assessment exists for an employee-period, THE System SHALL use default score of 0
3. WHEN calculating individual scores, THE System SHALL aggregate scores by category (P1, P2, P3)
4. WHEN calculating weighted scores, THE System SHALL apply category weight percentages
5. THE System SHALL generate gross incentive, tax amount, and net incentive based on final scores

### Requirement 7: Assessment Status Tracking

**User Story:** Sebagai unit manager atau superadmin, saya ingin melihat status penilaian untuk setiap pegawai, sehingga saya dapat memantau progress penilaian.

#### Acceptance Criteria

1. WHEN displaying employee list, THE System SHALL show assessment status for each employee
2. WHEN all KPI indicators have been assessed, THE System SHALL mark status as "Selesai"
3. WHEN some KPI indicators have been assessed, THE System SHALL mark status as "Sebagian"
4. WHEN no KPI indicators have been assessed, THE System SHALL mark status as "Belum Dinilai"
5. THE System SHALL use color coding: green for "Selesai", yellow for "Sebagian", red for "Belum Dinilai"

### Requirement 8: Assessment History and Audit

**User Story:** Sebagai sistem, saya ingin mencatat riwayat penilaian untuk audit trail, sehingga perubahan penilaian dapat dilacak.

#### Acceptance Criteria

1. WHEN assessment is created or updated, THE System SHALL record timestamp and assessor information
2. WHEN assessment is modified, THE System SHALL maintain audit trail of changes
3. WHEN displaying assessment form, THE System SHALL show last assessment date and assessor name
4. THE System SHALL prevent unauthorized users from modifying assessments
5. THE System SHALL log all assessment activities to audit system

### Requirement 9: Assessment Validation

**User Story:** Sebagai sistem, saya ingin memvalidasi data penilaian yang diinput, sehingga data yang tersimpan akurat dan konsisten.

#### Acceptance Criteria

1. WHEN user inputs realization value, THE System SHALL validate that value is numeric and non-negative
2. WHEN realization value exceeds reasonable limits, THE System SHALL show warning message
3. WHEN required fields are empty, THE System SHALL prevent form submission
4. WHEN assessment period is invalid, THE System SHALL show error message
5. THE System SHALL validate that assessment period matches active pool period

### Requirement 10: Assessment Report Generation

**User Story:** Sebagai unit manager atau superadmin, saya ingin melihat laporan penilaian, sehingga saya dapat menganalisis kinerja pegawai dan unit.

#### Acceptance Criteria

1. WHEN accessing assessment reports, THE System SHALL display summary of assessment completion rates
2. WHEN generating reports, THE System SHALL show assessment scores by category and employee
3. WHEN exporting reports, THE System SHALL provide Excel format with detailed breakdown
4. THE System SHALL calculate unit-level performance averages
5. THE System SHALL provide comparison between periods for trend analysis
