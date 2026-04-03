## MODIFIED Requirements

### Requirement: Polished card-based layouts
All data display areas SHALL use shadcn/ui Card components with consistent padding, borders, hover effects, and shadow treatments.

#### Scenario: Project list cards with NPS donut
- **WHEN** the projects list page renders projects with NPS data
- **THEN** each project card SHALL display a CSS donut chart showing promoter/passive/detractor distribution, a colored legend, and top promoter/detractor verbatim quotes

#### Scenario: Dashboard score cards
- **WHEN** the dashboard renders NPS score cards
- **THEN** they SHALL use shadcn/ui Card components with proper border radius, shadow, and hover transitions

#### Scenario: Category cards with sentiment badges
- **WHEN** category breakdown cards render
- **THEN** each card SHALL display the category name, count, percentage, and a colored Badge component for the sentiment type

#### Scenario: Comment cards
- **WHEN** individual feedback items are displayed
- **THEN** they SHALL render as cards with title, source info, sentiment badge, category badge, and expandable content

#### Scenario: Column checkbox does not double-toggle
- **WHEN** the user clicks a column checkbox on the Structure page
- **THEN** the column selection SHALL toggle exactly once
- **AND** the row `onClick` handler SHALL call `e.stopPropagation()` on the checkbox to prevent double-firing

---

## ADDED Requirements

### Requirement: DataTable selection resets on data change

The DataTable component SHALL reset its selection state when the underlying data changes due to pagination, filtering, or sorting.

#### Scenario: User changes page or filter with active selections
- **WHEN** the user has selected comments in the DataTable and then changes the page, applies a filter, or changes sort order
- **THEN** the selection state SHALL be cleared
- **AND** the selected count SHALL reset to 0

#### Scenario: Selection persists within the same data set
- **WHEN** the user selects comments and the data does not change (no page/filter/sort change)
- **THEN** the selection SHALL persist normally
