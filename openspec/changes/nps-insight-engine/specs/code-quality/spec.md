## ADDED Requirements

### Requirement: Consistent loading indicators across all pages
Every async operation in the UI SHALL display a visible spinner with a descriptive label so users know something is happening. The application SHALL use a shared Spinner component (`components/ui/Spinner.tsx`) for all loading states.

#### Scenario: Async button shows spinner
- **WHEN** a user clicks a button that triggers an async operation (test connection, save, upload, classify, generate)
- **THEN** the button shows an inline spinner with a short label AND a separate descriptive spinner block appears above/below the button

#### Scenario: Spinner is consistent across pages
- **WHEN** any page performs an async operation
- **THEN** it uses the same `Spinner` component with the same visual style (blue spinner, gray label text, blue-tinted background block)

#### Scenario: Pages with spinners
- **WHEN** the following pages perform async operations
- **THEN** they all show loading indicators: Settings (test/save), New Project (create), Upload (upload/validate), Structure (AI analyze/save), Categories (discover/save), Dashboard (classify), Noise (create filter), Summary (generate report)

### Requirement: Dashboard is composed of reusable components
The NPS dashboard SHALL be composed of individual, reusable components rather than a monolithic page component.

#### Scenario: Component decomposition
- **WHEN** the dashboard page renders
- **THEN** it uses separate components: ScoreCards, CategoryBreakdown, SearchBar, FilterPanel, and DataTable from `components/nps/`

#### Scenario: Components are independently importable
- **WHEN** a developer imports `ScoreCards` from `components/nps/ScoreCards`
- **THEN** the component renders correctly with the required props without pulling in dashboard page logic

### Requirement: NPS thresholds are defined as shared constants
The application SHALL define NPS score thresholds (promoter >= 9, passive 7-8, detractor <= 6) as named constants in a single location.

#### Scenario: Threshold constants exist
- **WHEN** any code needs to classify an NPS score
- **THEN** it uses `NPS_THRESHOLDS` from `lib/nps/calculator.ts` instead of hardcoded numbers

#### Scenario: Helper functions use constants
- **WHEN** `isPromoter(9)` is called
- **THEN** it returns `true` based on `NPS_THRESHOLDS.PROMOTER_MIN`

### Requirement: All API routes validate input with Zod schemas
Every API route that accepts a request body SHALL validate it using a Zod schema before processing.

#### Scenario: Valid input passes validation
- **WHEN** a POST request sends a valid JSON body matching the route's schema
- **THEN** the route processes the request normally

#### Scenario: Invalid JSON is rejected
- **WHEN** a POST request sends malformed JSON
- **THEN** the route returns 400 with error "Invalid JSON body"

#### Scenario: Missing required fields are rejected
- **WHEN** a POST request omits required fields defined in the Zod schema
- **THEN** the route returns 400 with a descriptive error message listing the validation issues

#### Scenario: Input length limits are enforced
- **WHEN** a project name exceeds 255 characters
- **THEN** the route returns 400 with a validation error

### Requirement: Consistent API response format
All API routes SHALL use a consistent error response format with `{ error: string }` for failures.

#### Scenario: Error response format
- **WHEN** any API route encounters a validation error, not-found, or server error
- **THEN** the response body contains an `error` field with a human-readable message

### Requirement: Unit tests cover core business logic and error handling
The project SHALL include unit tests for NPS calculator, CSV validator, stratified sampler, API validation schemas, encryption utilities, and API error handling (invalid JSON, empty body, missing fields, wrong types).

#### Scenario: Tests pass
- **WHEN** `npm test` is run
- **THEN** all tests pass (67 tests across 6 test files)

#### Scenario: NPS calculator tests
- **WHEN** NPS calculator tests run
- **THEN** they verify: empty input, all promoters (NPS=100), all detractors (NPS=-100), mixed scores, null handling, percentage calculations, and the reference dataset NPS of 18

#### Scenario: Schema validation tests
- **WHEN** schema tests run
- **THEN** they verify: valid inputs pass, empty/missing fields fail, invalid types fail, length limits enforced, UUID format validated

#### Scenario: Encryption round-trip tests
- **WHEN** encryption tests run
- **THEN** they verify: encrypt/decrypt round-trip, different ciphertext per call (random IV), unicode handling, tampered ciphertext detection

#### Scenario: API error handling tests
- **WHEN** API error handling tests run
- **THEN** they verify: invalid JSON body returns error, empty body returns error, missing required fields return descriptive error, wrong types rejected, valid input passes through, UUID format validated, null body handled gracefully

### Requirement: Test framework configuration
The project SHALL use Vitest as the test runner with Node.js environment and path alias support.

#### Scenario: Running tests
- **WHEN** a developer runs `npm test`
- **THEN** Vitest executes all `__tests__/**/*.test.ts` files with `@/` path aliases resolved correctly
