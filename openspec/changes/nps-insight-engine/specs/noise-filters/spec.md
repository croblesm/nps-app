# Noise Filters

Capability: Configurable keyword-based noise filters with NPS score exclusion.

## ADDED Requirements

### Requirement: Create a named noise filter

The system SHALL allow a user to create a named noise filter by providing a filter name, description, and a list of keywords. The system MUST persist the noise filter in the database associated with the current project.

#### Scenario: User creates a noise filter with valid inputs

WHEN the user submits the noise filter creation form with a name, description, and one or more keywords
THEN the system SHALL create a noise filter record in the database linked to the current project
AND the system SHALL display the new filter in the noise filters list.

#### Scenario: User creates a noise filter with no keywords

WHEN the user submits the noise filter creation form with a name and description but an empty keyword list
THEN the system SHALL display a validation error indicating that at least one keyword is required
AND the system SHALL NOT create a noise filter record.

---

### Requirement: Toggle NPS score exclusion per filter

Each noise filter SHALL have a toggle labeled "Exclude from NPS score calculation." The system MUST allow the user to enable or disable this toggle independently for each filter.

#### Scenario: User enables NPS exclusion on a noise filter

WHEN the user toggles "Exclude from NPS score calculation" to active on an existing noise filter
THEN the system SHALL mark that filter as exclusion-active in the database
AND comments matched by this filter SHALL be excluded from NPS score calculation on the dashboard.

#### Scenario: User disables NPS exclusion on a noise filter

WHEN the user toggles "Exclude from NPS score calculation" to inactive on an existing noise filter
THEN the system SHALL mark that filter as exclusion-inactive in the database
AND comments matched by this filter SHALL be included in NPS score calculation on the dashboard.

---

### Requirement: Matched comments remain visible in the data table

The system SHALL continue to display comments matched by exclusion-active noise filters in the data table. Excluded comments MUST be visually distinguished from included comments.

#### Scenario: Exclusion-active filter matches comments

WHEN a noise filter with exclusion enabled matches one or more comments
THEN the system SHALL display those comments in the data table with a visual indicator that they are excluded from NPS score calculation
AND the comments SHALL remain searchable and sortable alongside non-excluded comments.

---

### Requirement: Preview matched comment count before activation

The system SHALL show a preview of how many comments match a noise filter's keyword list before the user activates the filter. The preview MUST update as the user modifies the keyword list.

#### Scenario: User adds keywords and sees match preview

WHEN the user enters or modifies keywords in the noise filter creation or edit form
THEN the system SHALL display the count of comments that match the current keyword list
AND the preview count SHALL update in real time as keywords are added or removed.

#### Scenario: No comments match the keyword list

WHEN the user enters keywords that do not match any comments in the project
THEN the system SHALL display a match count of zero
AND the system SHALL still allow the user to save the filter.

---

### Requirement: Edit an existing noise filter

The system SHALL allow a user to edit the name, description, and keyword list of an existing noise filter. Changes MUST be persisted to the database upon save.

#### Scenario: User edits a noise filter's keyword list

WHEN the user modifies the keyword list of an existing noise filter and saves the changes
THEN the system SHALL update the noise filter record in the database with the new keywords
AND the dashboard SHALL recalculate which comments are matched by the updated filter.

#### Scenario: User edits a noise filter's name and description

WHEN the user modifies the name or description of an existing noise filter and saves the changes
THEN the system SHALL update the noise filter record in the database
AND the filter's display name SHALL update in the noise filters list.

---

### Requirement: Delete an existing noise filter

The system SHALL allow a user to delete an existing noise filter. Deletion MUST remove the filter and its exclusion effects immediately.

#### Scenario: User deletes a noise filter that had exclusion active

WHEN the user deletes a noise filter that was actively excluding comments from NPS score calculation
THEN the system SHALL remove the noise filter record from the database
AND the dashboard SHALL recalculate NPS scores to include the previously excluded comments.

#### Scenario: User deletes a noise filter that had exclusion inactive

WHEN the user deletes a noise filter that was not excluding comments from NPS score calculation
THEN the system SHALL remove the noise filter record from the database
AND the dashboard NPS scores SHALL remain unchanged.

---

### Requirement: Multiple noise filters can be active simultaneously

The system SHALL support multiple noise filters being active with exclusion enabled at the same time. The system MUST apply all active exclusion filters when calculating NPS scores.

#### Scenario: Two exclusion-active filters match overlapping comments

WHEN two noise filters with exclusion enabled both match some of the same comments
THEN the system SHALL exclude each matched comment only once from the NPS score calculation
AND the dashboard SHALL display the correct NPS score reflecting the union of all excluded comments.

#### Scenario: Multiple filters active with no overlap

WHEN multiple noise filters with exclusion enabled match entirely different sets of comments
THEN the system SHALL exclude all matched comments from the NPS score calculation
AND the total excluded count SHALL equal the sum of individually matched comments.

---

### Requirement: Dashboard score cards recalculate on exclusion changes

The system SHALL recalculate and update all dashboard NPS score cards whenever a noise filter's exclusion setting is toggled, a filter is edited, or a filter is deleted.

#### Scenario: User toggles exclusion and views updated scores

WHEN the user enables or disables exclusion on a noise filter from the noise console
THEN the dashboard score cards (NPS score, promoter/passive/detractor counts, response count) SHALL recalculate to reflect the current set of excluded comments
AND the updated scores SHALL be displayed without requiring a page refresh.

---

### Requirement: Noise filters are persisted per project

Each noise filter SHALL be associated with a specific project. Noise filters created in one project MUST NOT affect other projects.

#### Scenario: User creates filters in two different projects

WHEN the user creates noise filters in Project A and then navigates to Project B
THEN Project B SHALL NOT display or apply Project A's noise filters
AND each project's noise filters SHALL operate independently.
