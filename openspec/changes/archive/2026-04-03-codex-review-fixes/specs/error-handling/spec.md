## ADDED Requirements

### Requirement: Dashboard error state on API failure

The dashboard page SHALL display an actionable error state when stats or comments API calls fail, instead of remaining in a perpetual skeleton/loading state.

#### Scenario: Stats fetch fails
- **WHEN** the `/api/projects/[id]/stats` request fails (network error or non-200 response)
- **THEN** the dashboard SHALL display an error card with the message "Failed to load dashboard data" and a "Retry" button
- **AND** clicking "Retry" SHALL re-fetch stats

#### Scenario: Comments fetch fails
- **WHEN** the `/api/projects/[id]/comments` request fails
- **THEN** the comments table area SHALL display an error state with "Failed to load comments" and a "Retry" button
- **AND** the skeleton loader SHALL be replaced by the error state

---

### Requirement: Projects page error state on fetch failure

The projects page SHALL display an explicit error state when the project list fetch fails, instead of showing "No projects yet."

#### Scenario: Projects fetch fails
- **WHEN** the `/api/projects` request fails
- **THEN** the page SHALL display "Failed to load projects" with a "Retry" button
- **AND** the empty-state "No projects yet" message SHALL NOT be shown

---

### Requirement: Top quote cards terminal states

The top promoter and top concern quote cards on the projects page SHALL have terminal states for all outcomes: loaded, no data, and error.

#### Scenario: Quote fetch fails
- **WHEN** the quote fetch for a project card fails
- **THEN** the quote area SHALL display "—" (em dash) instead of remaining "Loading..."

#### Scenario: No qualifying comments exist
- **WHEN** a project has no promoter or detractor comments qualifying for a quote
- **THEN** the quote area SHALL display "No quotes available" instead of remaining "Loading..."

---

### Requirement: Categories stats populated for existing categories

The categories page SHALL display accurate stats when loading existing (persisted) categories, not default 0/0 values.

#### Scenario: User opens categories page with existing categories
- **WHEN** the categories page loads and categories already exist in the database
- **THEN** the stats display SHALL show the actual sample size and total comment count from the last discovery run
- **AND** the text "Analyzed 0 of 0 comments" SHALL NOT appear for existing categories
