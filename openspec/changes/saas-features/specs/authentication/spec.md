# Authentication

Capability: NextAuth.js v5 authentication with multiple providers, user-scoped projects, and admin settings.

## ADDED Requirements

### Requirement: NextAuth.js v5 with GitHub, Google, and email/password providers

The system SHALL implement authentication using NextAuth.js v5 with a split configuration pattern for Edge compatibility:
- **lib/auth/config.ts** — Edge-compatible config with no Node.js-only imports (TypeORM, bcryptjs). Contains empty providers array, custom pages config (signIn: "/login"), and callbacks for jwt (propagates user.id to token), session (propagates token.id to session.user.id), and authorized (checks AUTH_REQUIRED env var, allows /login and /api/auth routes without auth). Used by middleware.ts.
- **lib/auth/index.ts** — Full Node.js config that spreads authConfig and adds the actual providers: GitHub, Google, and Credentials. The Credentials provider performs email/password lookup via getDb() + bcryptjs compare. Exports auth, handlers, signIn, signOut.
- **components/providers.tsx** — Client component wrapping children in NextAuth SessionProvider, used in the root layout to enable useSession() throughout the app.

The sign-in page (app/login/page.tsx) MUST display all configured providers and support a sign-up toggle.

#### Scenario: User signs in with GitHub

WHEN the user clicks "Continue with GitHub" on the login page
THEN the system SHALL call signIn("github", { callbackUrl: "/" }) to redirect to the GitHub OAuth consent screen
AND upon successful authorization, create or update the user record in the database
AND redirect the user to the projects list page.

#### Scenario: User signs in with Google

WHEN the user clicks "Continue with Google" on the login page
THEN the system SHALL call signIn("google", { callbackUrl: "/" }) to redirect to the Google OAuth consent screen
AND upon successful authorization, create or update the user record in the database
AND redirect the user to the projects list page.

#### Scenario: User signs in with email and password

WHEN the user enters a valid email and password on the login page and clicks "Sign in with Email"
THEN the system SHALL call signIn("credentials", { email, password, callbackUrl: "/" })
AND the Credentials provider authorize function SHALL look up the user by lowercased email, compare the password with bcryptjs, and return the user object with id, name, email, image
AND the jwt callback SHALL set token.id = user.id
AND the session callback SHALL set session.user.id = token.id
AND the user SHALL be redirected to the projects list page.

#### Scenario: User signs in with invalid credentials

WHEN the user enters an incorrect email or password and clicks "Sign in with Email"
THEN the Credentials authorize function SHALL return null
AND the login page SHALL display an error message
AND the user SHALL remain on the login page.

#### Scenario: New user registers with email and password

WHEN the user toggles to sign-up mode on the login page and fills in name, email, and password
AND clicks "Create Account"
THEN the login page SHALL POST to /api/auth/register with name, email, and password (validated by Zod: name 1-255 chars, valid email, password 8-128 chars)
AND the register API route SHALL hash the password with bcryptjs (12 rounds), create a new User record with lowercased email
AND return 201 with user id, name, email
AND the login page SHALL then call signIn("credentials") to automatically sign the user in.

#### Scenario: Registration with existing email

WHEN a user attempts to register with an email that already exists in the database
THEN the register API route SHALL return 409 with error "An account with this email already exists."

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

All projects SHALL be scoped to the authenticated user who created them. The system MUST ensure that users can only view, edit, and delete their own projects. The projects table SHALL include a userId foreign key.

The system provides a helper function getCurrentUserId() in lib/auth/get-user.ts that calls auth() to get the session and returns session.user.id. This helper is used in project CRUD API routes to scope queries by userId.

#### Scenario: User creates a new project

WHEN an authenticated user creates a new project
THEN the system SHALL call getCurrentUserId() to obtain the user's ID
AND associate the project with that userId
AND the project SHALL only be visible to that user.

#### Scenario: User views the projects list

WHEN an authenticated user navigates to the projects list page
THEN the system SHALL query projects WHERE userId = getCurrentUserId()
AND display only projects owned by that user
AND projects belonging to other users SHALL NOT be visible.

#### Scenario: User attempts to access another user's project

WHEN an authenticated user navigates to a project URL belonging to a different user
THEN the system SHALL return a 404 Not Found response
AND SHALL NOT reveal that the project exists.

#### Scenario: AUTH_REQUIRED is false

WHEN AUTH_REQUIRED environment variable is set to "false"
THEN getCurrentUserId() returns null (no session required)
AND the authorized callback in authConfig allows all requests through
AND projects are not user-scoped in development mode.

---

### Requirement: Admin settings page

The system SHALL provide an admin settings page (app/admin/page.tsx) where the authenticated user can manage their account. The settings page MUST allow the user to change their display name, view connected OAuth accounts, and change their password. The page uses useSession() from next-auth/react and calls the profile API route (PATCH /api/auth/profile) for updates.

#### Scenario: User changes their display name

WHEN the user navigates to admin settings and updates their display name to "Carlos M."
AND clicks "Save Changes"
THEN the system SHALL call PATCH /api/auth/profile with the new name
AND update the user's name in the database
AND refresh the session via updateSession() so the header reflects the new display name immediately
AND display a toast notification confirming the update.

#### Scenario: User views connected accounts

WHEN the user navigates to admin settings
THEN the system SHALL display a list of connected providers (Email/Password, GitHub, Google) each in a bordered row with a Lucide icon
AND provide a Badge component showing "Active"/"Connected" or "Not set"/"Not connected" for each provider.

#### Scenario: User changes their password

WHEN a credentials-authenticated user enters their current password, a new password (minimum 8 characters), and confirms it
AND clicks "Update Password"
THEN the system SHALL call PATCH /api/auth/profile with currentPassword and newPassword
AND the API SHALL verify the current password via bcryptjs compare, hash the new password, and save it
AND display a toast notification confirming the password was updated
AND clear the password form fields.

#### Scenario: Password change fails due to wrong current password

WHEN the user enters an incorrect current password
THEN the API SHALL return a 400 error with message "Current password is incorrect"
AND the page SHALL display a toast error notification.

#### Scenario: OAuth-only user attempts password change

WHEN an OAuth-only user (no stored password) attempts to change their password via the API
THEN the API SHALL return a 400 error with message "No password set -- this account uses OAuth login."

---

### Requirement: Session management

The system SHALL manage user sessions using NextAuth.js JWT strategy. The jwt callback propagates user.id into the token, and the session callback propagates token.id into session.user.id, ensuring the user ID is available throughout the app. Sessions MUST expire after 30 days of inactivity. The system SHALL provide a sign-out mechanism accessible from the application header.

A SessionProvider from next-auth/react is wrapped around the root layout via components/providers.tsx, enabling useSession() in client components (e.g., admin settings page).

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
