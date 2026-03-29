## ADDED Requirements

### Requirement: README includes quick-start badges
The README SHALL include clickable badges for opening the project in GitHub Codespaces and VS Code Dev Containers.

#### Scenario: Codespaces badge
- **WHEN** a user visits the repository on GitHub
- **THEN** they see an "Open in GitHub Codespaces" badge that links to `codespaces.new/croblesm/nps-app`

#### Scenario: Dev Containers badge
- **WHEN** a user visits the repository on GitHub
- **THEN** they see an "Open in Dev Containers" badge that triggers VS Code to clone and open in a container

### Requirement: SQL Server runs on Apple Silicon via Rosetta
The Docker Compose configuration SHALL specify `platform: linux/amd64` for the SQL Server service so it runs under Rosetta emulation on Apple Silicon Macs.

#### Scenario: Running on Apple Silicon
- **WHEN** a developer on an M1/M2/M3/M4 Mac runs `docker compose up -d`
- **THEN** the SQL Server container starts successfully under x86 emulation via Rosetta

#### Scenario: Rosetta not enabled
- **WHEN** a developer has not enabled "Use Rosetta for x86_64/amd64 emulation" in Docker Desktop
- **THEN** the README documents this prerequisite clearly

### Requirement: Dev Container provides one-click setup
The system SHALL include a `.devcontainer/` configuration that provides a fully working development environment when opened in VS Code with the Dev Containers extension.

#### Scenario: Opening project in Dev Container
- **WHEN** a developer opens the project in VS Code and selects "Reopen in Container"
- **THEN** the container builds with Node.js 22, SQL Server 2025 starts as a sidecar service, and all required VS Code extensions are installed automatically

#### Scenario: SQL Server is accessible from the app container
- **WHEN** the Dev Container is running
- **THEN** the app can connect to SQL Server using hostname `sqlserver` on port 1433

### Requirement: Dev Container includes required VS Code extensions
The Dev Container SHALL auto-install VS Code extensions for the project's tech stack.

#### Scenario: Extensions are present after container build
- **WHEN** the Dev Container finishes building
- **THEN** the following extensions are installed: MSSQL (ms-mssql.mssql), SQL Database Projects, ESLint, Prettier, Tailwind CSS IntelliSense, Docker, TypeScript Nightly, GitHub Copilot, GitHub Copilot Chat, Claude Code, OpenAI Codex

### Requirement: Pre-configured SQL Server connection
The Dev Container SHALL include a pre-configured MSSQL connection profile so developers can browse the database without manual setup.

#### Scenario: Connecting to SQL Server from MSSQL extension
- **WHEN** a developer opens the MSSQL sidebar in VS Code
- **THEN** a saved connection profile "NPS Insight Engine (Dev)" is available and connects without additional configuration

### Requirement: SQL Server container has resource limits
The Docker Compose configuration SHALL set memory and CPU limits on the SQL Server container to prevent it from consuming excessive host resources.

#### Scenario: Container resource limits
- **WHEN** a developer runs `docker compose up -d`
- **THEN** the SQL Server container is limited to 2GB memory, 1 CPU core, and 512MB internal SQL Server memory (`MSSQL_MEMORY_LIMIT_MB`)

#### Scenario: Default SQL Server memory behavior is overridden
- **WHEN** the SQL Server container starts
- **THEN** it does NOT consume 80% of host memory (the default), but instead stays within the configured 512MB internal limit

### Requirement: Database creation is managed by the application
The Dev Container SHALL NOT use post-start or post-create hooks to create the database or schema. Database and table creation MUST be handled by the application (TypeORM synchronize or `npm run db:init`).

#### Scenario: Fresh container start
- **WHEN** the Dev Container starts for the first time
- **THEN** SQL Server is running but the `nps_insight_engine` database does not exist until the developer runs `npm run db:init` or `npm run dev`

### Requirement: Environment file for Dev Container
The project SHALL include a `.devcontainer/.env.local` file with correct connection settings for the containerized environment.

#### Scenario: Copying env file
- **WHEN** a developer copies `.devcontainer/.env.local` to `.env.local`
- **THEN** the app connects to SQL Server via the Docker service name `sqlserver` instead of `localhost`

### Requirement: Environment example file
The project SHALL include a `.env.example` file documenting all required environment variables without exposing actual secrets.

#### Scenario: New developer setup
- **WHEN** a developer clones the repository
- **THEN** `.env.example` exists with all variable names, descriptions, and generation instructions for the encryption key

#### Scenario: Secrets are not committed
- **WHEN** a developer sets values in `.env.local`
- **THEN** `.env.local` is excluded from git via `.gitignore`, while `.env.example` remains tracked

### Requirement: Environment variables load consistently across all scripts
The `.env.local` file SHALL be loaded by all project scripts — Next.js auto-loads it for `dev`/`build`/`start`, and standalone scripts (like `db:init`) SHALL load it via `dotenv`.

#### Scenario: Running db:init loads env vars
- **WHEN** a developer runs `npm run db:init`
- **THEN** the script loads `DATABASE_PASSWORD` and other variables from `.env.local` via dotenv

#### Scenario: Running next dev loads env vars
- **WHEN** a developer runs `npm run dev`
- **THEN** Next.js auto-loads `.env.local` and all API routes can access environment variables

### Requirement: Environment files are consistent across environments
All environment files (`.env.example`, `.env.local`, `.devcontainer/.env.local`) SHALL define the same set of variables: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`, `ENCRYPTION_KEY`, `NODE_ENV`.

#### Scenario: Dev Container env matches local env
- **WHEN** a developer compares `.devcontainer/.env.local` with `.env.example`
- **THEN** both files define the same variables, differing only in `DATABASE_HOST` (`sqlserver` vs `localhost`)

### Requirement: Security headers
The application SHALL set security headers on all responses to mitigate common web vulnerabilities.

#### Scenario: Response headers are present
- **WHEN** any page or API route responds
- **THEN** the response includes X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, and Permissions-Policy restricting camera/microphone/geolocation

### Requirement: TypeORM synchronize is development-only
The TypeORM DataSource SHALL only use `synchronize: true` in non-production environments to prevent accidental schema mutations.

#### Scenario: Production environment
- **WHEN** `NODE_ENV` is set to `production`
- **THEN** TypeORM `synchronize` is `false` and schema changes require explicit migrations

#### Scenario: Development environment
- **WHEN** `NODE_ENV` is `development` or unset
- **THEN** TypeORM `synchronize` is `true` and tables are auto-created on startup

### Requirement: Footer attribution on all pages
The application SHALL display a footer with copyright and attribution on every page.

#### Scenario: Viewing any page
- **WHEN** a user scrolls to the bottom of any page
- **THEN** a footer is visible showing the current year, "croblesm" linked to croblesm.com, and "All rights reserved"

### Requirement: Error boundary for graceful failure
The application SHALL include a global React error boundary that catches runtime errors and displays a recovery UI.

#### Scenario: Component throws an error
- **WHEN** a React component throws an unhandled runtime error
- **THEN** the error boundary displays an error message and a "Try again" button instead of a blank page

### Requirement: Server-side NPS aggregation
NPS statistics and category breakdowns SHALL be computed server-side via SQL aggregation queries, not by fetching all comments to the client.

#### Scenario: Dashboard loads NPS stats
- **WHEN** the dashboard page loads
- **THEN** NPS score, promoter/passive/detractor counts, and category breakdown are fetched from `/api/projects/[id]/stats` which computes them via SQL GROUP BY

### Requirement: Connection pooling
The database connection SHALL use connection pooling to manage concurrent requests efficiently.

#### Scenario: Multiple concurrent API requests
- **WHEN** multiple API requests arrive simultaneously
- **THEN** the connection pool serves them using up to 10 concurrent connections with a minimum of 2 idle connections

### Requirement: Input sanitization on database name
The database initialization script SHALL validate the database name to prevent SQL injection.

#### Scenario: Valid database name
- **WHEN** `DATABASE_NAME` contains only alphanumeric characters, underscores, and hyphens
- **THEN** the database is created successfully

#### Scenario: Invalid database name
- **WHEN** `DATABASE_NAME` contains special characters like quotes or semicolons
- **THEN** the initialization script throws an error and does not execute the SQL statement
