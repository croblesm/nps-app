# NPS Dashboard

Capability: Dynamic NPS score cards, category breakdown, filters, search, and sortable data table.

## ADDED Requirements

### Requirement: Display NPS score cards

The dashboard SHALL display score cards for: Total Responses, Promoters (scores 9-10), Passives (scores 7-8), Detractors (scores 0-6), and NPS Score. The NPS Score card MUST display an emoji indicator based on value ranges.

#### Scenario: Dashboard loads with classified data

WHEN the user opens a project dashboard that has completed classification
THEN the system SHALL display score cards showing Total Responses count, Promoters count and percentage (scores 9-10), Passives count and percentage (scores 7-8), Detractors count and percentage (scores 0-6), and the calculated NPS Score.

#### Scenario: NPS Score card color reflects score (standard NPS scale)

WHEN the NPS Score is displayed
THEN the card background color SHALL reflect the standard NPS scale:
- Score >= 70: emerald/dark green (Excellent) with 🤩
- Score 50-69: green (Very Good) with 😀
- Score 30-49: green (Good) with 🙂
- Score 0-29: orange (Needs Improvement) with 😐
- Score < 0: red (Critical) with 😟

#### Scenario: Noise filter indicator on dashboard

WHEN noise filters with "Exclude from NPS" are active
THEN the dashboard SHALL display a banner showing "X noise filters applied — Y comments excluded from NPS score"
AND the NPS calculation SHALL exclude comments flagged as noise.

---

### Requirement: Score cards are clickable to filter the table

Each score card SHALL be clickable. Clicking a score card MUST filter the data table to show only the corresponding respondent group.

#### Scenario: User clicks the Promoters card

WHEN the user clicks the Promoters score card
THEN the data table SHALL filter to show only responses with NPS scores of 9 or 10
AND the active filter SHALL be visually indicated on the card.

#### Scenario: User clicks the active score card again

WHEN the user clicks a score card that is already active as a filter
THEN the system SHALL remove that filter and show all responses.

---

### Requirement: Category breakdown with dynamic cards

The dashboard SHALL display a dynamic grid of category cards. Each card MUST show the category name, the count of comments in that category, and the percentage of total comments.

#### Scenario: Dashboard displays category breakdown

WHEN the dashboard loads with classified comments across 7 categories
THEN the system SHALL render 7 category cards in a responsive grid
AND each card SHALL display the category name, comment count, and percentage of total.

#### Scenario: Category with zero comments

WHEN a confirmed category has zero comments assigned after classification
THEN the system SHALL still display the category card with a count of 0 and 0%.

---

### Requirement: Category cards are clickable to filter

Each category card SHALL be clickable to filter the data table to show only comments in that category.

#### Scenario: User clicks a category card

WHEN the user clicks a category card labeled "Connectivity"
THEN the data table SHALL filter to show only comments classified under "Connectivity"
AND the clicked card SHALL be visually highlighted as active.

---

### Requirement: Full-text search across comment text

The dashboard SHALL provide a search input that performs full-text search across comment text. Search results MUST update the data table in real time.

#### Scenario: User searches for a keyword

WHEN the user types "slow" into the search input
THEN the data table SHALL filter to show only rows where the comment text contains "slow" (case-insensitive).

#### Scenario: User clears the search input

WHEN the user clears the search input
THEN the data table SHALL remove the search filter and respect any other active filters.

---

### Requirement: Dynamic filter dropdowns from report structure columns

The dashboard SHALL generate filter dropdowns dynamically from the columns included in the confirmed report structure. Version SHALL be a standard filter column when present in the data.

#### Scenario: Report structure includes version and platform columns

WHEN the confirmed report structure includes "version" and "platform" columns
THEN the dashboard SHALL render a dropdown filter for "version" populated with distinct values from the data and a dropdown filter for "platform" populated with distinct values from the data.

#### Scenario: User selects a value from a dynamic filter

WHEN the user selects "1.40" from the version dropdown filter
THEN the data table SHALL filter to show only rows where the version column equals "1.40".

---

### Requirement: Sortable paginated data table

The dashboard SHALL display a sortable, paginated data table. The user MUST be able to configure the number of rows per page with options of 10, 25, 50, and 100.

#### Scenario: User sorts by NPS score descending

WHEN the user clicks the NPS score column header to sort descending
THEN the data table SHALL reorder rows by NPS score from highest to lowest
AND pagination SHALL reset to page 1.

#### Scenario: User changes rows per page

WHEN the user selects 50 from the rows-per-page selector
THEN the data table SHALL display up to 50 rows per page
AND pagination SHALL reset to page 1.

#### Scenario: User navigates to page 3

WHEN the user clicks page 3 in the pagination controls
THEN the data table SHALL display the rows for page 3 based on the current sort order and active filters.

---

### Requirement: Table columns from report structure plus classification

The data table columns SHALL be derived from the confirmed report structure columns plus a Category column and an Actionable flag column added by the classification step.

#### Scenario: Report structure has 5 columns

WHEN the confirmed report structure includes 5 columns (e.g., NPS Score, Comment, Version, Platform, Date)
THEN the data table SHALL display 7 columns: the 5 report structure columns plus Category and Actionable.

---

### Requirement: Dark mode support with toggle

The dashboard SHALL support dark mode. The system MUST provide a toggle that allows the user to switch between light and dark modes.

#### Scenario: User enables dark mode

WHEN the user clicks the dark mode toggle while in light mode
THEN the dashboard SHALL switch to dark mode styling
AND the preference SHALL be persisted for subsequent visits.

#### Scenario: User disables dark mode

WHEN the user clicks the dark mode toggle while in dark mode
THEN the dashboard SHALL switch to light mode styling.

---

### Requirement: All filters work together with AND logic

All active filters, search input, and score card or category card selections SHALL combine using AND logic.

#### Scenario: User applies score card filter and search simultaneously

WHEN the user clicks the Detractors score card and types "bug" in the search input
THEN the data table SHALL show only rows where the NPS score is 0-6 AND the comment text contains "bug".

#### Scenario: User applies category filter, dropdown filter, and search

WHEN the user clicks the "Quality/Performance" category card, selects version "1.40" from the dropdown, and types "crash" in the search input
THEN the data table SHALL show only rows where the category is "Quality/Performance" AND the version is "1.40" AND the comment text contains "crash".

#### Scenario: User clears all filters

WHEN the user clears all active filters, search input, and card selections
THEN the data table SHALL display all rows with the default sort order and pagination.
