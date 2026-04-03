## ADDED Requirements

### Requirement: Server-side initial data loading for project pages

Project pages SHALL load their initial data on the server before rendering, so users see correct content immediately without a flash of empty/default state.

#### Scenario: Upload page loads with existing data status
- **WHEN** the user navigates to the Data/Upload page for a project with existing comments
- **THEN** the page SHALL render with "Data uploaded — N rows loaded" immediately
- **AND** the upload zone SHALL NOT flash before the data status appears

#### Scenario: Structure page loads with existing column structure
- **WHEN** the user navigates to the Structure page for a project with a saved structure
- **THEN** the page SHALL render with the saved column selections immediately
- **AND** the AI analysis prompt SHALL NOT flash before the saved structure appears

#### Scenario: Noise page loads with existing filters
- **WHEN** the user navigates to the Noise Filters page for a project with saved filters
- **THEN** the page SHALL render with the existing filter list immediately
- **AND** an empty filter list SHALL NOT flash before the saved filters appear

#### Scenario: Summary page loads with existing summary
- **WHEN** the user navigates to the Summary page for a project with a generated summary
- **THEN** the page SHALL render with the summary content immediately
- **AND** the "Generate Summary" prompt SHALL NOT flash before the summary appears

#### Scenario: GitHub page loads with existing config and issues
- **WHEN** the user navigates to the GitHub Issues page for a project with GitHub configured
- **THEN** the page SHALL render with the config and issue list immediately
- **AND** the empty config form SHALL NOT flash before the saved config appears

#### Scenario: Loading skeleton during server data fetch
- **WHEN** the user navigates to any converted project page
- **THEN** a skeleton loading state SHALL display while the server fetches data
- **AND** the skeleton SHALL be replaced by the fully rendered page once data is ready

#### Scenario: Client-side mutations still work after server render
- **WHEN** the user performs an action (create filter, upload file, generate summary, etc.)
- **THEN** the client component SHALL handle the mutation via fetch() as before
- **AND** the UI SHALL update to reflect the mutation result
