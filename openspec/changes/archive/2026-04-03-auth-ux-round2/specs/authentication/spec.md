## ADDED Requirements

### Requirement: Conditional OAuth provider registration

The auth system SHALL only register OAuth providers (GitHub, Google) when their environment variables are present. The login page SHALL only display OAuth buttons for configured providers.

#### Scenario: OAuth env vars missing
- **WHEN** `AUTH_GITHUB_ID` or `AUTH_GITHUB_SECRET` is not set
- **THEN** the GitHub provider SHALL NOT be registered with NextAuth
- **AND** the login page SHALL NOT display the "Continue with GitHub" button

#### Scenario: OAuth env vars present
- **WHEN** `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` are both set
- **THEN** the GitHub provider SHALL be registered and functional
- **AND** the login page SHALL display the "Continue with GitHub" button

#### Scenario: Available providers API
- **WHEN** the login page loads
- **THEN** it SHALL fetch `GET /api/auth/providers` to determine which OAuth buttons to show
- **AND** the endpoint SHALL return `{ github: boolean, google: boolean }`

---

### Requirement: Credential sign-in error feedback

The login page SHALL display clear error messages when credential sign-in fails, instead of silently doing nothing.

#### Scenario: Invalid credentials
- **WHEN** the user enters wrong email or password and clicks sign in
- **THEN** an inline error message SHALL appear (e.g., "Invalid email or password")
- **AND** the page SHALL NOT redirect

#### Scenario: Successful credentials sign-in
- **WHEN** the user enters correct credentials and clicks sign in
- **THEN** the page SHALL redirect to the home page

---

### Requirement: Profile API respects AUTH_REQUIRED=false

The profile API SHALL function in local dev mode (AUTH_REQUIRED=false) without requiring an active session.

#### Scenario: GET profile in dev mode
- **WHEN** `AUTH_REQUIRED=false` and no session exists
- **THEN** `GET /api/auth/profile` SHALL return a stub dev profile instead of 401

#### Scenario: PATCH profile in dev mode
- **WHEN** `AUTH_REQUIRED=false` and no session exists
- **THEN** `PATCH /api/auth/profile` SHALL return a success response instead of 401

---

### Requirement: /register page exists

The application SHALL have a `/register` route that directs users to the sign-up form.

#### Scenario: User navigates to /register
- **WHEN** the user navigates to `/register`
- **THEN** they SHALL be redirected to `/login?signup=true`
- **AND** the login page SHALL display the sign-up form

---

### Requirement: Dev user fallback for getCurrentUserId

The `getCurrentUserId()` function SHALL return a valid user ID when AUTH_REQUIRED=false, instead of null.

#### Scenario: No session in dev mode
- **WHEN** `AUTH_REQUIRED=false` and no session exists
- **THEN** `getCurrentUserId()` SHALL return the first user's ID from the database
- **AND** if no users exist, SHALL return a fixed dev UUID

---

### Requirement: Production safety guard

The system SHALL warn when AUTH_REQUIRED=false is set in a production environment.

#### Scenario: AUTH_REQUIRED=false in production
- **WHEN** `AUTH_REQUIRED=false` and `NODE_ENV=production`
- **THEN** a console warning SHALL be emitted at startup

---

### Requirement: Registration handles concurrent requests

The registration endpoint SHALL handle concurrent registration attempts for the same email without crashing.

#### Scenario: Concurrent registration race condition
- **WHEN** two concurrent requests try to register the same email
- **THEN** one SHALL succeed and the other SHALL return 409
- **AND** no unhandled database errors SHALL occur

---

### Requirement: Profile name validation rejects whitespace-only

The profile update SHALL reject display names that are only whitespace.

#### Scenario: Whitespace-only name
- **WHEN** the user submits a display name of only spaces
- **THEN** the API SHALL reject with a validation error
