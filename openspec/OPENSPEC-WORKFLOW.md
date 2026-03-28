# OpenSpec Workflow — Step-by-Step Breakdown

This document explains the OpenSpec spec-driven development workflow used to plan the NPS Insight Engine project.

---

## What is OpenSpec?

OpenSpec is a spec-driven development tool that structures your work into **changes** — self-contained units of work with standardized artifacts. It uses a schema (`spec-driven`) that defines what artifacts are needed and in what order.

## The Schema: `spec-driven`

The `spec-driven` schema requires 4 artifacts created in dependency order:

```
proposal.md → design.md ──┐
                           ├→ tasks.md
proposal.md → specs/*.md ──┘
```

| Artifact | Purpose | Depends On |
|----------|---------|------------|
| `proposal.md` | **WHY** — the problem, what changes, capabilities list | Nothing |
| `design.md` | **HOW** — architecture decisions, trade-offs, data flow | proposal |
| `specs/**/*.md` | **WHAT** — detailed requirements with testable scenarios | proposal |
| `tasks.md` | **DO** — implementation checklist with trackable checkboxes | design + specs |

---

## Steps Followed

### Step 1: Configure OpenSpec Context

**File:** `openspec/config.yaml`

Before creating any change, I updated the config with project context so OpenSpec (and AI) understands the tech stack, conventions, and domain:

```yaml
schema: spec-driven
context: |
  Project: NPS Insight Engine
  Tech stack: Next.js 15, React 19, TypeScript, Tailwind CSS 4
  ORM: Drizzle ORM with SQL Server 2025
  AI: Vercel AI SDK — multi-provider
  ...
rules:
  proposal:
    - Always include a "Non-goals" section
  tasks:
    - Break tasks into chunks of max 4 hours
    - Each task should be independently testable
```

**Command used:** Manual edit (no CLI command needed)

---

### Step 2: Create a New Change

**Command:**
```bash
npx openspec new change "nps-insight-engine"
```

**What it does:** Creates a scaffolded directory at `openspec/changes/nps-insight-engine/` with a `.openspec.yaml` file that tracks artifact status.

**Result:**
```
openspec/changes/nps-insight-engine/
  .openspec.yaml    ← tracks which artifacts exist and their status
```

---

### Step 3: Check Status (Artifact Build Order)

**Command:**
```bash
npx openspec status --change "nps-insight-engine" --json
```

**What it tells you:** Which artifacts are `ready` (dependencies met, can be created), `blocked` (dependencies not yet created), or `done` (already created). Also shows `applyRequires` — the artifacts that must be done before you can implement.

**Initial status:**
```
proposal  → ready
design    → blocked (needs: proposal)
specs     → blocked (needs: proposal)
tasks     → blocked (needs: design, specs)
```

---

### Step 4: Get Instructions for Each Artifact

**Command:**
```bash
npx openspec instructions <artifact-id> --change "nps-insight-engine" --json
```

**What it returns:**
- `template` — the structure/skeleton to use for the file
- `instruction` — guidelines on what to include
- `context` — project context from config.yaml (used as constraints, NOT copied into the file)
- `rules` — artifact-specific rules from config.yaml
- `dependencies` — completed artifacts to read for context
- `outputPath` — where to write the file

**Example:** `npx openspec instructions proposal --change "nps-insight-engine" --json`

---

### Step 5: Create Artifacts in Dependency Order

#### 5a. Proposal (`proposal.md`)

**Created first** because it has no dependencies.

**Sections written:**
- **Why** — problem statement and motivation
- **What Changes** — bullet list of all changes (new, removed, breaking)
- **Non-Goals** — what's explicitly out of scope
- **User Flow** — the step-by-step user journey
- **Capabilities** — list of new capabilities (this is critical — each becomes a spec file)

**Capabilities defined:**
1. `project-management`
2. `csv-upload-validation`
3. `ai-categorization`
4. `nps-dashboard`
5. `noise-filters`
6. `ai-summary`
7. `llm-configuration`
8. `data-export`

---

#### 5b. Design (`design.md`) + Specs (`specs/`)

**Created in parallel** because both only depend on the proposal.

**design.md sections:**
- Context, Goals/Non-Goals
- Decisions with rationale (why Next.js over CRA, why Drizzle over Prisma, etc.)
- AI Agent architecture with input/output schemas
- Data flow diagram
- Risks and mitigations
- Migration plan, open questions

**specs/ structure** — one file per capability from the proposal:
```
specs/
  project-management/spec.md
  csv-upload-validation/spec.md
  ai-categorization/spec.md
  nps-dashboard/spec.md
  noise-filters/spec.md
  ai-summary/spec.md
  llm-configuration/spec.md
  data-export/spec.md
```

**Spec format:**
```markdown
## ADDED Requirements

### Requirement: User can create a new project
The system SHALL allow users to create a new project by providing a tool name and description.

#### Scenario: Successful project creation
- **WHEN** user fills in tool name and description and clicks "Create"
- **THEN** system creates a new project record and redirects to the upload page

#### Scenario: Missing required fields
- **WHEN** user submits the form with empty tool name
- **THEN** system displays a validation error and does not create the project
```

Key rules for specs:
- Use `SHALL` / `MUST` for normative requirements
- Every requirement needs at least one `#### Scenario:` with WHEN/THEN
- Scenarios are testable — each one can become a test case

---

#### 5c. Tasks (`tasks.md`)

**Created last** because it depends on both design and specs.

**Format:** Numbered groups with checkbox items:
```markdown
## 1. Project Scaffold and Infrastructure
- [ ] 1.1 Initialize Next.js 15 project with App Router and TypeScript
- [ ] 1.2 Install core dependencies
...
```

The checkbox format (`- [ ]`) is required — OpenSpec tracks progress by parsing these checkboxes during implementation.

---

### Step 6: Verify Completion

**Command:**
```bash
npx openspec status --change "nps-insight-engine"
```

**Final status:**
```
[x] proposal
[x] design
[x] specs
[x] tasks
All artifacts complete!
```

---

## File Map

```
openspec/
  config.yaml                                          ← project context & rules
  changes/
    nps-insight-engine/
      .openspec.yaml                                   ← artifact tracking metadata
      proposal.md                                      ← WHY: problem, changes, capabilities
      design.md                                        ← HOW: architecture, decisions, data flow
      tasks.md                                         ← DO: 55 implementation tasks in 12 groups
      specs/
        project-management/spec.md                     ← WHAT: 7 requirements, 14 scenarios
        csv-upload-validation/spec.md                  ← WHAT: 8 requirements, 15 scenarios
        ai-categorization/spec.md                      ← WHAT: 7 requirements, 16 scenarios
        nps-dashboard/spec.md                          ← WHAT: 10 requirements, 18 scenarios
        noise-filters/spec.md                          ← WHAT: 9 requirements, 13 scenarios
        ai-summary/spec.md                             ← WHAT: 7 requirements, 10 scenarios
        llm-configuration/spec.md                      ← WHAT: 10 requirements, 16 scenarios
        data-export/spec.md                            ← WHAT: 8 requirements, 11 scenarios
  specs/                                               ← archived specs (empty until first archive)
```

---

## Key Commands Reference

| Command | Purpose |
|---------|---------|
| `npx openspec new change "<name>"` | Create a new change scaffold |
| `npx openspec status --change "<name>"` | Check artifact progress |
| `npx openspec status --change "<name>" --json` | Same but machine-readable |
| `npx openspec instructions <artifact> --change "<name>" --json` | Get creation guidelines for an artifact |
| `/opsx:apply` | Start implementing tasks (Claude Code skill) |
| `/opsx:archive` | Archive a completed change (merges specs into `openspec/specs/`) |

---

## Workflow Summary

```
1. Configure    →  Edit config.yaml with project context
2. Create       →  openspec new change "name"
3. Plan         →  Write proposal → design + specs → tasks
4. Implement    →  /opsx:apply (works through tasks.md checkboxes)
5. Archive      →  /opsx:archive (finalizes, merges specs to openspec/specs/)
```
