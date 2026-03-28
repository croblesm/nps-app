# Data Export

Capability: Filtered CSV download and project metadata export/import.

## ADDED Requirements

### Requirement: Download currently filtered data as CSV

The system SHALL allow the user to download the currently filtered and visible data from the dashboard as a CSV file.

#### Scenario: User exports filtered data

WHEN the user has applied one or more filters on the dashboard and clicks "Export CSV"
THEN the system SHALL generate a CSV file containing only the rows that match the current filter criteria
AND the system SHALL download the file to the user's device.

#### Scenario: User exports data with no filters applied

WHEN the user clicks "Export CSV" with no active filters on the dashboard
THEN the system SHALL generate a CSV file containing all rows in the project
AND the system SHALL download the file to the user's device.

---

### Requirement: CSV export includes all visible columns plus classification fields

The exported CSV SHALL include all columns currently visible in the data table, plus the AI-assigned Category and Actionable flag columns.

#### Scenario: CSV export contains expected columns

WHEN the user downloads the filtered CSV
THEN the exported file SHALL include every column currently displayed in the data table
AND the file SHALL include a "Category" column with the AI-assigned category for each comment
AND the file SHALL include an "Actionable" column indicating whether the comment was flagged as actionable
AND the column order SHALL match the table display order with Category and Actionable appended.

---

### Requirement: Export project metadata as JSON

The system SHALL allow the user to export project metadata as a JSON file. The export MUST include project configuration, report structure, category definitions, and noise filter configurations.

#### Scenario: User exports project metadata

WHEN the user clicks "Export Metadata" on a project with completed categorization
THEN the system SHALL generate a JSON file containing the project name, project description, report structure configuration, category definitions with descriptions, and noise filter configurations
AND the system SHALL download the file to the user's device.

---

### Requirement: Metadata export excludes raw comment data

The metadata JSON export MUST NOT include raw comment data or individual survey responses. This requirement exists for privacy and file size considerations.

#### Scenario: Metadata export contains no comment data

WHEN the user exports project metadata as JSON
THEN the exported file SHALL NOT contain any individual comment text, NPS scores for individual responses, or personally identifiable information from the survey data
AND the file SHALL contain only structural and configuration data.

---

### Requirement: Import metadata JSON when creating a new project

The system SHALL allow the user to import a previously exported metadata JSON file during new project creation. The imported metadata SHALL pre-configure the new project.

#### Scenario: User imports valid metadata JSON during project creation

WHEN the user uploads a valid metadata JSON file on the new project creation page
THEN the system SHALL pre-populate the project with the imported category definitions, noise filter configurations, and report structure column selections
AND the system SHALL display the imported configuration for the user to review.

#### Scenario: User imports invalid JSON file

WHEN the user uploads a file that is not valid JSON or does not conform to the expected metadata schema
THEN the system SHALL display an error message describing the validation failure
AND the system SHALL NOT apply any imported settings to the new project.

---

### Requirement: Imported metadata pre-configures categories, noise filters, and column selections

The system SHALL use imported metadata to pre-configure category definitions, noise filter rules, and column selections for the new project. The user MUST be able to modify all imported settings before finalizing the project.

#### Scenario: User reviews and modifies imported settings

WHEN the user has imported metadata and proceeds through the project setup workflow
THEN each configuration step (column selection, category review, noise filters) SHALL display the imported settings as defaults
AND the user SHALL be able to add, edit, or remove any imported setting before confirming.

#### Scenario: User imports metadata and then uploads CSV data

WHEN the user has imported metadata and uploads a CSV file for the new project
THEN the system SHALL apply the imported report structure to the uploaded CSV columns
AND if the CSV does not contain columns referenced in the imported structure, the system SHALL warn the user about missing columns.

---

### Requirement: User must still upload CSV data after import

Importing metadata SHALL NOT substitute for uploading CSV data. The user MUST still upload a CSV file and complete the data validation step after importing metadata.

#### Scenario: User imports metadata without uploading CSV

WHEN the user has imported metadata but has not uploaded a CSV file
THEN the system SHALL prompt the user to upload CSV data before proceeding to the dashboard
AND the system SHALL NOT allow access to the dashboard without uploaded data.

---

### Requirement: Export filenames include project name and date

All exported files (CSV and JSON) SHALL have filenames that include the project name and the current date.

#### Scenario: CSV export filename format

WHEN the user downloads a filtered CSV export from a project named "MSSQL Extension Q4"
THEN the downloaded file SHALL be named using the pattern `{project-name}-export-{YYYY-MM-DD}.csv` (e.g., "mssql-extension-q4-export-2026-03-28.csv")
AND special characters in the project name SHALL be replaced with hyphens or removed.

#### Scenario: JSON metadata export filename format

WHEN the user downloads a metadata JSON export from a project named "MSSQL Extension Q4"
THEN the downloaded file SHALL be named using the pattern `{project-name}-metadata-{YYYY-MM-DD}.json` (e.g., "mssql-extension-q4-metadata-2026-03-28.json")
AND special characters in the project name SHALL be replaced with hyphens or removed.
