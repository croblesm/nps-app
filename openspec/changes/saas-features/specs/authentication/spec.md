# Authentication

Capability: NextAuth.js v5 authentication with multiple providers, user-scoped projects, and admin settings.

## ADDED Requirements

### Requirement: NextAuth.js v5 with GitHub, Google, and email/password providers

The system SHALL implement authentication using NextAuth.js v5 with support for GitHub OAuth, Google OAuth, and email/password (credentials) providers. The sign-in page MUST display all configured providers.

#### Scenario: User signs in with GitHub

WHEN the user clicks "Sign in with GitHub" on the sign-in page
THEN the system SHALL redirect to the GitHub OAuth consent screen
AND upon successful authorization, create or update the user record in the database
AND redirect the user to the projects list page.

#### Scenario: User signs in with Google

WHEN the user clicks "Sign in with Google" on the sign-in page
THEN the system SHALL redirect to the Google OAuth consent screen
AND upon successful authorization, create or update the user record in the database
AND redirect the user to the projects list page.

#### Scenario: User signs in with email and password

WHEN the user enters a valid email and password on the sign-in page and clicks "Sign In"
THEN the system SHALL verify the credentials against the stored hashed password
AND create a session for the authenticated user
AND redirect the user to the projects list page.

#### Scenario: User signs in with invalid credentials

WHEN the user enters an incorrect email or password and clicks "Sign In"
THEN the system SHALL display an error message "Invalid email or password"
AND the user SHALL remain on the sign-in page.

#### Scenario: New user registers with email and password

WHEN a new user fills in the registration form with name, email, and password
THEN the system SHALL hash the password using bcrypt
AND create a new user record in the database
AND sign the user in automatically.

---

### Requirement: User table in database

The system SHALL store user accounts in a users database table. The table MUST include: id, name, email, hashed password (nullable for OAuth users), avatar URL, provider, provider account ID, created date, and updated date.

#### Scenario: OAuth user record is created

WHEN a user signs in via GitHub for the first time
THEN the system SHALL create a user record with the GitHub display name, email, avatar URL, provider set to "github", and provider account ID
AND the hashed password field SHALL be null.

#### Scenario: Existing OAuth user signs in again

WHEN a user who previously signed in via GitHub signs in again
THEN the system SHALL update the existing user record with the latest name and avatar URL from GitHub
AND SHALL NOT create a duplicate user record.

#### Scenario: Account linking by email

WHEN a user signs in via Google with the same email address as an existing GitHub-linked account
THEN the system SHALL link both providers to the same user record
AND the user SHALL see all their projects regardless of which provider they used to sign in.

---

### Requirement: Protected routes via middleware

The system SHALL protect all application routes using Next.js middleware. Unauthenticated users attempting to access protected routes MUST be redirected to the sign-in page. The sign-in page, API health check, and static assets SHALL be excluded from protection.

#### Scenario: Unauthenticated user accesses a project page

WHEN an unauthenticated user navigates to /project/123/dashboard
THEN the middleware SHALL redirect the user to the sign-in page
AND the originally requested URL SHALL be preserved so the user is redirected back after sign-in.

#### Scenario: Authenticated user accesses a project page

WHEN an authenticated user with a valid session navigates to /project/123/dashboard
THEN the middleware SHALL allow the request to proceed
AND the page SHALL render normally.

#### Scenario: Sign-in page is accessible without authentication

WHEN an unauthenticated user navigates to the sign-in page
THEN the page SHALL render without redirection.

#### Scenario: API routes require authentication

WHEN an unauthenticated request is made to /api/projects
THEN the API SHALL return a 401 Unauthorized response with a JSON error message.

---

### Requirement: Projects scoped to authenticated user

All projects SHALL be scoped to the authenticated user who created them. The system MUST ensure that users can only view, edit, and delete their own projects. The projects table SHALL include a user_id foreign key.

#### Scenario: User creates a new project

WHEN an authenticated user creates a new project
THEN the system SHALL associate the project with the user's ID
AND the project SHALL only be visible to that user.

#### Scenario: User views the projects list

WHEN an authenticated user navigates to the projects list page
THEN the system SHALL display only projects owned by that user
AND projects belonging to other users SHALL NOT be visible.

#### Scenario: User attempts to access another user's project

WHEN an authenticated user navigates to a project URL belonging to a different user
THEN the system SHALL return a 404 Not Found response
AND SHALL NOT reveal that the project exists.

---

### Requirement: Admin settings page

The system SHALL provide an admin settings page where the authenticated user can manage their account. The settings page MUST allow the user to change their display name and view connected OAuth accounts.

#### Scenario: User changes their display name

WHEN the user navigates to admin settings and updates their display name to "Carlos M."
AND clicks "Save"
THEN the system SHALL update the user's name in the database
AND the header SHALL reflect the new display name immediately.

#### Scenario: User views connected accounts

WHEN the user navigates to admin settings
THEN the system SHALL display a list of connected OAuth providers (e.g., GitHub, Google) with the associated email for each
AND provide a visual indicator showing which providers are linked.

#### Scenario: User with only OAuth cannot set a password

WHEN an OAuth-only user views the admin settings page
THEN the system SHALL NOT display a password change form
AND SHALL display a note explaining that their account is managed by the OAuth provider.

---

### Requirement: Session management

The system SHALL manage user sessions using NextAuth.js JWT strategy. Sessions MUST expire after 30 days of inactivity. The system SHALL provide a sign-out mechanism accessible from the application header.

#### Scenario: User signs out

WHEN the user clicks "Sign Out" in the header dropdown
THEN the system SHALL invalidate the current session
AND redirect the user to the sign-in page.

#### Scenario: Session expires due to inactivity

WHEN a user's session has been inactive for more than 30 days
THEN the next request SHALL be treated as unauthenticated
AND the user SHALL be redirected to the sign-in page.

#### Scenario: Active session is refreshed

WHEN an authenticated user makes a request within the 30-day window
THEN the system SHALL extend the session expiry by another 30 days from the current time.
