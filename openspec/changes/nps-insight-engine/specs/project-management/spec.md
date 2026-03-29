# Project Management

Capability: Project creation, listing, persistence, and metadata export/import.

## ADDED Requirements

### Requirement: Create a new project

The system SHALL allow a user to create a new project by providing a tool name and description. The system MUST persist the project record in SQL Server 2025 with a unique identifier, creation timestamp, and the user-supplied metadata.

#### Scenario: User creates a project with valid inputs

WHEN the user submits a new project form with a tool name, description, and optional analysis hints
THEN the system SHALL create a project record in SQL Server 2025 with a unique ID, the provided tool name, description, analysis hints, and a creation timestamp
AND the system SHALL navigate the user to the newly created project's workflow.

#### Scenario: User provides analysis hints

WHEN the user fills in the "Analysis Focus" field with guidance like "Focus on competitor comparisons with SSMS and Azure Data Studio"
THEN the system SHALL store the analysis hints on the project record and pass them to the AI theme discovery agent as guidance.

#### Scenario: User submits a project with missing required fields

WHEN the user submits a new project form with an empty tool name or empty description
THEN the system SHALL display a validation error indicating the missing field
AND the system SHALL NOT create a project record.

---

### Requirement: List all saved projects on the home page

The system SHALL display all saved projects on the home page. Each project entry MUST show the project name, creation date, and NPS score preview.

#### Scenario: Home page loads with existing projects

WHEN the user navigates to the home page and saved projects exist in the database
THEN the system SHALL display a list of all projects showing each project's name, creation date, and NPS score preview.

#### Scenario: Home page loads with no projects

WHEN the user navigates to the home page and no projects exist in the database
THEN the system SHALL display an empty state with guidance on how to create a new project.

---

### Requirement: Open an existing project

The system SHALL allow a user to open an existing project to view its dashboard.

#### Scenario: User opens a project with completed classification

WHEN the user clicks on a project that has completed CSV upload and AI classification
THEN the system SHALL navigate to that project's dashboard displaying NPS score cards, category breakdown, and the data table.

#### Scenario: User opens a project with incomplete setup

WHEN the user clicks on a project that has not completed all setup steps (upload, validation, or categorization)
THEN the system SHALL navigate the user to the next incomplete step in the project workflow.

---

### Requirement: Delete a project with confirmation

The system SHALL allow a user to delete a project. The system MUST require explicit confirmation before deletion.

#### Scenario: User confirms project deletion

WHEN the user initiates deletion of a project and confirms the action in the confirmation dialog
THEN the system SHALL permanently remove the project and all associated data (comments, categories, report structure, noise filters) from the database
AND the system SHALL redirect the user to the home page.

#### Scenario: User cancels project deletion

WHEN the user initiates deletion of a project and cancels the confirmation dialog
THEN the system SHALL NOT delete the project
AND the project SHALL remain unchanged in the project list.

---

### Requirement: Export project metadata as JSON

The system SHALL allow a user to export project metadata as a JSON file. The export MUST include project configuration, categories, and noise filters. The export MUST NOT include raw CSV data or individual comments.

#### Scenario: User exports metadata from a fully configured project

WHEN the user triggers metadata export on a project that has completed categorization
THEN the system SHALL generate a JSON file containing the project name, description, category definitions, report structure configuration, and noise filter rules
AND the exported file SHALL NOT contain raw comment data or individual survey responses
AND the system SHALL download the file to the user's device.

#### Scenario: User attempts to export metadata from an unconfigured project

WHEN the user triggers metadata export on a project that has not completed categorization
THEN the system SHALL export only the available metadata (project name, description, and any partially configured settings).

---

### Requirement: Import project metadata to pre-configure a new project

The system SHALL allow a user to import a previously exported metadata JSON file to pre-configure a new project.

#### Scenario: User imports valid metadata JSON

WHEN the user uploads a valid metadata JSON file during new project creation
THEN the system SHALL create a new project pre-populated with the imported categories, report structure configuration, and noise filter rules
AND the user SHALL be able to modify the imported configuration before proceeding.

#### Scenario: User imports invalid or corrupted JSON

WHEN the user uploads a file that is not valid JSON or does not match the expected metadata schema
THEN the system SHALL display an error message describing the validation failure
AND the system SHALL NOT create a project from the invalid file.
