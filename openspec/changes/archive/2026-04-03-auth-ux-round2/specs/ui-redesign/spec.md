## ADDED Requirements

### Requirement: Data page preview of existing data

The Data/Upload page SHALL allow users to preview existing uploaded data without replacing it.

#### Scenario: Data exists — preview available
- **WHEN** the user navigates to the Data page and data exists
- **THEN** a collapsible "Preview first 5 rows" section SHALL appear inside the data status card
- **AND** expanding it SHALL show a table with row index, NPS score, and comment text

#### Scenario: No data exists
- **WHEN** the user navigates to the Data page and no data exists
- **THEN** no preview section SHALL appear
- **AND** the upload zone SHALL be shown as the primary action

---

### Requirement: Categories confirm button hidden when already saved

The Categories page SHALL NOT show the "Confirm Categories & Continue" button when categories are already saved to the database.

#### Scenario: Categories loaded from database
- **WHEN** the user navigates to the Categories page and categories already exist in the database
- **THEN** the confirm button SHALL NOT be visible
- **AND** the toolbar with "Suggest More" and "Add Category" SHALL remain visible

#### Scenario: Categories modified after loading
- **WHEN** the user edits, adds, removes, or re-discovers categories
- **THEN** the confirm button SHALL reappear to save the changes

#### Scenario: Categories confirmed successfully
- **WHEN** the user clicks confirm and the save succeeds
- **THEN** the confirm button SHALL disappear

---

### Requirement: Top bar shows embedding model alongside LLM

The top bar status badge SHALL display both the active LLM model and the embedding model.

#### Scenario: Both LLM and embedding configured
- **WHEN** the top bar renders with an active LLM provider and a configured embedding provider
- **THEN** the badge SHALL display both: e.g., "ollama / mistral:latest | nomic-embed-text"

#### Scenario: Only LLM configured (no embedding)
- **WHEN** the top bar renders with an active LLM but no embedding provider
- **THEN** the badge SHALL display only the LLM: e.g., "ollama / mistral:latest"
