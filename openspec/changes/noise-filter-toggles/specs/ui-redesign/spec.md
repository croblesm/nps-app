## ADDED Requirements

### Requirement: Interactive noise filter toggle chips

The Dashboard and Summary pages SHALL display noise filters as interactive toggle chips that allow temporary per-filter exclusion control.

#### Scenario: Dashboard displays toggleable filter chips
- **WHEN** the dashboard loads with active noise filters
- **THEN** each filter SHALL render as a clickable Badge chip showing the filter name
- **AND** active filters SHALL appear with a filled/primary style
- **AND** disabled filters SHALL appear with an outline/muted style with strikethrough text

#### Scenario: User toggles a filter off on the dashboard
- **WHEN** the user clicks an active noise filter chip
- **THEN** the chip SHALL switch to disabled style
- **AND** the NPS stats SHALL re-fetch excluding that filter's noise exclusion
- **AND** the excluded comment count SHALL update accordingly

#### Scenario: User toggles a filter back on
- **WHEN** the user clicks a disabled noise filter chip
- **THEN** the chip SHALL switch back to active style
- **AND** the NPS stats SHALL re-fetch with the filter re-applied

#### Scenario: Multiple filters with independent toggles
- **WHEN** the project has two or more noise filters
- **THEN** each filter SHALL be independently toggleable
- **AND** the NPS calculation SHALL respect only the currently-active filter set

#### Scenario: Toggle is session-only
- **WHEN** the user toggles a filter and navigates away then returns
- **THEN** all filters SHALL be reset to their default active state
- **AND** no database changes SHALL have been made

---

### Requirement: Summary page noise filter awareness

The Summary page SHALL display noise filter toggle chips and respect the toggle state when generating AI summaries.

#### Scenario: Summary page shows noise filter chips
- **WHEN** the summary page loads with active noise filters
- **THEN** toggle chips SHALL appear above the AI Summary card
- **AND** the NPS visual cards SHALL respect the current filter state

#### Scenario: Regenerating summary respects filter toggles
- **WHEN** the user toggles noise filters and clicks Regenerate
- **THEN** the AI summary SHALL be generated using only the comments not excluded by active filters
- **AND** the NPS stats in the summary text SHALL match the filtered data

---

### Requirement: Stats API supports filter override

The stats API SHALL accept optional query parameters to control noise filter behavior.

#### Scenario: Custom active filter set
- **WHEN** the client sends `?activeFilterIds=id1,id2` to the stats API
- **THEN** the API SHALL compute noise exclusion using only the specified filters' keywords
- **AND** ignore filters not in the list even if they are active in the database

#### Scenario: No noise exclusion
- **WHEN** the client sends `?excludeNoise=false` to the stats API
- **THEN** the API SHALL return stats without any noise exclusion

#### Scenario: Default behavior unchanged
- **WHEN** no filter override params are provided
- **THEN** the API SHALL behave as before (all active filters applied via isNoise column)
