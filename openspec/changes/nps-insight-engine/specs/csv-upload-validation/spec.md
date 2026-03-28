# CSV Upload and Validation

Capability: CSV file upload, parsing, and AI-powered structure validation.

## ADDED Requirements

### Requirement: Upload a CSV file via drag-and-drop or file picker

The system SHALL allow a user to upload a CSV file using either drag-and-drop onto a designated upload area or a file picker dialog.

#### Scenario: User uploads a CSV via drag-and-drop

WHEN the user drags a CSV file onto the upload drop zone
THEN the system SHALL accept the file and begin client-side preview processing.

#### Scenario: User uploads a CSV via file picker

WHEN the user clicks the file picker button and selects a CSV file
THEN the system SHALL accept the file and begin client-side preview processing.

#### Scenario: User uploads a non-CSV file

WHEN the user attempts to upload a file that is not a CSV
THEN the system SHALL reject the file and display an error message indicating that only CSV files are accepted.

---

### Requirement: Show client-side preview of first 5 rows

The system SHALL display a client-side preview of the first 5 rows of the uploaded CSV before sending it to the server.

#### Scenario: User uploads a CSV with more than 5 rows

WHEN the user uploads a valid CSV file containing more than 5 data rows
THEN the system SHALL parse the file client-side and display the column headers and the first 5 data rows in a table preview
AND the system SHALL display the total row count.

#### Scenario: User uploads a CSV with fewer than 5 rows

WHEN the user uploads a valid CSV file containing fewer than 5 data rows
THEN the system SHALL display all available rows in the table preview.

---

### Requirement: Server-side CSV validation

The system SHALL validate the uploaded CSV server-side. Validation MUST include a parse check to ensure the file is valid CSV, a corruption check, and a file size check with a maximum limit of 10 MB.

#### Scenario: User uploads a valid CSV under 10 MB

WHEN the user submits a CSV file that is well-formed and under 10 MB
THEN the system SHALL accept the file and proceed to column analysis.

#### Scenario: User uploads a CSV exceeding 10 MB

WHEN the user submits a CSV file larger than 10 MB
THEN the system SHALL reject the file and display an error message stating the file exceeds the 10 MB size limit.

#### Scenario: User uploads a corrupt or malformed CSV

WHEN the user submits a file that fails CSV parsing (mismatched columns, encoding errors, or binary content)
THEN the system SHALL reject the file and display an error message describing the parse failure.

---

### Requirement: Detect column data types and null percentages

The system SHALL analyze each column in the uploaded CSV to detect its data type and calculate the percentage of null or empty values.

#### Scenario: CSV with mixed column types

WHEN the system processes a valid CSV containing numeric, text, and date columns with some null values
THEN the system SHALL report the detected data type for each column (e.g., numeric, text, date)
AND the system SHALL report the null/empty percentage for each column.

---

### Requirement: AI Data Validator agent analyzes sample data

The AI Data Validator agent SHALL analyze a sample of the uploaded data and produce a recommendation report. The report MUST identify the likely NPS score column, the likely comments column, any data quality issues, and a recommendation to include or exclude each column with reasoning.

#### Scenario: AI analyzes a standard NPS survey CSV

WHEN the system sends sample rows and column metadata to the AI Data Validator agent
THEN the agent SHALL return a report identifying the NPS score column, the comment column, a list of data quality issues (if any), and per-column include/exclude recommendations with reasoning.

#### Scenario: AI cannot confidently identify NPS or comment columns

WHEN the AI Data Validator agent cannot determine which column contains NPS scores or comments with sufficient confidence
THEN the agent SHALL flag the ambiguous columns and present its best guesses with explanations so the user can make the final selection.

---

### Requirement: User reviews and configures report structure

The system SHALL present the AI-generated report structure to the user for review. The user MUST be able to toggle each column on or off and view the AI reasoning for each column recommendation.

#### Scenario: User accepts AI recommendations as-is

WHEN the user reviews the AI-generated column recommendations and agrees with all suggestions
THEN the user SHALL confirm the report structure without changes
AND the system SHALL save the confirmed structure.

#### Scenario: User overrides AI recommendations

WHEN the user disagrees with an AI column recommendation and toggles a column's include/exclude status
THEN the system SHALL update the report structure to reflect the user's choice
AND the system SHALL retain the AI reasoning for reference.

---

### Requirement: User confirms report structure before categorization

The system SHALL require explicit user confirmation of the report structure before proceeding to the categorization step.

#### Scenario: User confirms the report structure

WHEN the user clicks the confirm button after reviewing the report structure
THEN the system SHALL lock the report structure for this project
AND the system SHALL proceed to the AI categorization step.

#### Scenario: User navigates away without confirming

WHEN the user navigates away from the report structure review without confirming
THEN the system SHALL preserve the current state so the user can return and continue.

---

### Requirement: Store raw CSV data in the database

The system SHALL store all rows from the uploaded CSV in the Comment table in the database after the user confirms the report structure.

#### Scenario: User confirms structure for a 500-row CSV

WHEN the user confirms the report structure for a CSV containing 500 rows
THEN the system SHALL insert all 500 rows into the Comment table, preserving all column values from the confirmed report structure
AND each row SHALL be associated with the current project.
