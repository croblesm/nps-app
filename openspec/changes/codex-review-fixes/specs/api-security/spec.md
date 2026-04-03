## ADDED Requirements

### Requirement: Project ownership guard on all project-scoped API routes

The system SHALL verify that the authenticated user owns the requested project before processing any project-scoped API request. A shared `assertProjectAccess(projectId, userId)` utility SHALL be used across all routes under `/api/projects/[id]/` and all AI routes that accept `projectId` in the request body.

#### Scenario: Authenticated user accesses their own project sub-route
- **WHEN** an authenticated user sends a request to any `/api/projects/[id]/*` sub-route (comments, stats, categories, structure, export, noise, chat, summary, github, github/issues) with a projectId they own
- **THEN** the route SHALL process the request normally

#### Scenario: Authenticated user accesses another user's project sub-route
- **WHEN** an authenticated user sends a request to any `/api/projects/[id]/*` sub-route with a projectId owned by a different user
- **THEN** the route SHALL return HTTP 404 with body `{ error: "Project not found" }`
- **AND** no project data SHALL be returned or modified

#### Scenario: AI routes with projectId in request body
- **WHEN** an authenticated user sends a request to any `/api/ai/*` route (validate, categorize, classify, summarize, embed, chat, assistant) with a `projectId` in the request body
- **THEN** the route SHALL verify ownership before processing
- **AND** return HTTP 404 if the user does not own the project

#### Scenario: AUTH_REQUIRED=false bypasses ownership check
- **WHEN** `AUTH_REQUIRED` is set to `false` (local dev mode)
- **THEN** the ownership guard SHALL allow all requests regardless of session state
- **AND** no 404 errors SHALL occur due to missing session

---

### Requirement: Noise filter count endpoint without hard limit

The system SHALL provide a way to get accurate keyword match counts for noise filter previews without the comments API's hard limit of 100.

#### Scenario: Noise page requests match counts for a keyword set
- **WHEN** the noise page needs to preview how many comments match a set of keywords
- **THEN** the system SHALL return the exact count of matching comments
- **AND** the count SHALL NOT be capped by the comments API's pagination limit

#### Scenario: Dedicated count endpoint or internal limit bypass
- **WHEN** the noise page requests match counts
- **THEN** the system SHALL use a dedicated `/api/projects/[id]/noise/count` endpoint (or equivalent) that queries comment counts directly via SQL COUNT
- **AND** no full comment payloads SHALL be returned (performance optimization)
