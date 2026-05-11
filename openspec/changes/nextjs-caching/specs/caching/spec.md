## ADDED Requirements

### Requirement: React cache() request deduplication

Server-side utilities called multiple times in the same render tree SHALL be deduplicated using React's `cache()` function.

#### Scenario: assertProjectAccess called by layout and page
- **WHEN** a server component page and its layout both call `assertProjectAccess(id)` in the same request
- **THEN** the DB query SHALL execute only once
- **AND** both callers SHALL receive the same result

---

### Requirement: Browser Cache-Control on GET API routes

All GET API route handlers SHALL include `Cache-Control: private, max-age=N` headers to enable browser-level caching.

#### Scenario: Repeated GET request within TTL
- **WHEN** the browser makes a GET request to a cached API route within the max-age window
- **THEN** the browser SHALL serve the response from its local cache without hitting the server

#### Scenario: GET request after TTL expiry
- **WHEN** the browser makes a GET request after the max-age window has expired
- **THEN** the browser SHALL make a fresh request to the server

#### Scenario: Mutation does not use cached response
- **WHEN** a POST, PATCH, or DELETE request is made to any API route
- **THEN** no Cache-Control headers SHALL be added to the response

---

### Requirement: Shared project data hook for layout components

The AppSidebar and TopBar components SHALL share a single project data fetch instead of making independent requests.

#### Scenario: Navigating to a project page
- **WHEN** the user navigates to any project page
- **THEN** the project info SHALL be fetched only once (not twice for sidebar + topbar)

#### Scenario: Cached project data within TTL
- **WHEN** the user navigates between pages within the same project
- **THEN** the project info SHALL be served from the hook's cache without re-fetching

---

### Requirement: Server-side query caching with unstable_cache

Expensive server component DB queries SHALL be cached using `unstable_cache` with project-specific tags for targeted invalidation.

#### Scenario: Summary page cached stats
- **WHEN** the user navigates to the Summary page twice within 30 seconds
- **THEN** the NPS stats DB query SHALL execute only once (second visit uses cache)

#### Scenario: Cache invalidation after mutation
- **WHEN** the user uploads new data, classifies comments, or modifies noise filters
- **THEN** the relevant cached queries SHALL be invalidated via `revalidateTag`
- **AND** the next page visit SHALL fetch fresh data
