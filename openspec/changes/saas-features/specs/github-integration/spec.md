# GitHub Integration

Capability: Configure GitHub repositories, export NPS categories and comments as GitHub issues with templates and labels, and track created issues.

## ADDED Requirements

### Requirement: GitHub repo configuration with validation

The system SHALL provide a GitHub configuration panel in project settings where the user can enter a repository owner, repository name, and personal access token (PAT). The system MUST validate the configuration by attempting to read the repository via the GitHub API.

#### Scenario: User configures a valid GitHub repository

WHEN the user enters a valid owner, repo name, and PAT with repo scope
AND clicks "Validate & Save"
THEN the system SHALL call the GitHub API to verify access to the repository
AND display a success message with the repository name and a green checkmark
AND persist the configuration encrypted in the github_configs database table.

#### Scenario: User enters an invalid PAT

WHEN the user enters a PAT that lacks the required repo scope or is expired
AND clicks "Validate & Save"
THEN the system SHALL display an error message indicating the token is invalid or lacks permissions
AND the configuration SHALL NOT be saved.

#### Scenario: User enters a non-existent repository

WHEN the user enters a repository owner/name combination that does not exist or is inaccessible
AND clicks "Validate & Save"
THEN the system SHALL display an error message indicating the repository was not found
AND the configuration SHALL NOT be saved.

---

### Requirement: Category-level export to GitHub issues

The system SHALL allow the user to export an entire category as a single GitHub issue from the dashboard. The CategoryBreakdown component (components/nps/CategoryBreakdown.tsx) accepts a githubEnabled prop that controls visibility of the "Export to GitHub" button on each category card. The dashboard page (app/project/[id]/dashboard/page.tsx) wires this by checking the GitHub config via fetchGitHubConfig and passing the githubEnabled boolean and handleExportCategory callback.

#### Scenario: Dashboard checks GitHub configuration

WHEN the dashboard page loads
THEN the system SHALL call fetchGitHubConfig to check if a valid GitHub config exists for the project
AND set the githubEnabled state accordingly
AND pass githubEnabled as a prop to CategoryBreakdown and DataTable components.

#### Scenario: User exports a category to GitHub

WHEN the user clicks "Export to GitHub" on a category card (visible only when githubEnabled is true)
THEN the dashboard SHALL call handleExportCategory(categoryName, commentCount)
AND the system SHALL create a GitHub issue with the category name as the title
AND the issue body SHALL follow the issue template including NPS impact, representative quotes, and recommendations
AND the issue SHALL be labeled with "nps-feedback" and the category name.

#### Scenario: User exports a category with no GitHub configuration

WHEN githubEnabled is false (no valid GitHub config for the project)
THEN the "Export to GitHub" button SHALL NOT be rendered on category cards.

---

### Requirement: Individual comment selection and batch export

The system SHALL allow the user to select individual comments from the data table (components/nps/DataTable.tsx) and export them as GitHub issues. The DataTable component accepts githubEnabled and onExportSelected props from the dashboard page. When githubEnabled is true, the table renders checkbox columns for row selection using internal selected state (Set of IDs). The dashboard wires handleExportSelected as the callback.

#### Scenario: Checkbox selection in data table

WHEN githubEnabled is true
THEN the DataTable SHALL render a checkbox column with a header "select all" checkbox and per-row checkboxes
AND selected rows SHALL be visually highlighted with a blue tint background
AND a selection toolbar SHALL appear above the table showing "{N} comment(s) selected" with "Export to GitHub" and "Clear" buttons.

#### Scenario: User selects comments and exports to GitHub

WHEN the user selects comments via checkboxes and clicks "Export to GitHub" in the selection toolbar
THEN the DataTable SHALL call onExportSelected(selectedComments) with the filtered comment objects
AND the dashboard handleExportSelected function SHALL create ONE GitHub issue containing all selected comments.

#### Scenario: User selects comments across multiple categories

#### Scenario: User selects comments across multiple categories

WHEN the user selects comments from different categories and exports
THEN the system SHALL group the selected comments by category
AND create one issue PER category, each titled with its category name
AND each issue SHALL contain only the comments from that category
AND a toast SHALL confirm how many issues were created (e.g., "Created 3 GitHub issues (one per category)").

#### Scenario: User selects a single comment and exports

WHEN the user selects exactly one comment and exports
THEN the issue title SHALL use the comment's category name (e.g., "[NPS Feedback] Performance Issues")
AND the labels SHALL use the comment's category name.

---

### Requirement: Issue template with NPS impact, quotes, and recommendations

Every GitHub issue created from NPS data SHALL follow a standard template defined in `lib/github/issue-template.ts`. The template MUST include: an Impact section with comment count and NPS score breakdown, a Representative Quotes section with verbatim comments and their NPS scores (blockquoted), a Recommended Action section, and a footer attributing the issue to NPS Insight Engine with a link to the GitHub repository.

#### Scenario: Category export issue template

WHEN a category with 25 comments (8 detractors, 10 passives, 7 promoters) is exported
THEN the issue body SHALL include:
- An NPS Impact section showing 25 comments with the score distribution
- A Quotes section with up to 5 representative verbatim comments
- A Recommendations section with AI-generated action items
- A footer with attribution linking to the NPS Insight Engine GitHub repository.

#### Scenario: Individual comment export issue template

WHEN a single comment with NPS score 3 and category "Performance" is exported
THEN the issue body SHALL include the full comment text, the NPS score, the category, and an AI-generated recommendation for addressing the feedback.

---

### Requirement: Labels include nps-feedback and category name

Every GitHub issue created by the system SHALL include the label `"nps-feedback"` and the category name (lowercased, spaces replaced with hyphens).

#### Scenario: Category export labels

WHEN a category named "Performance Issues" is exported as a GitHub issue
THEN the issue SHALL have labels: `"nps-feedback"` and `"performance-issues"`.

#### Scenario: Labels that do not exist in the repository are created

WHEN the system attempts to apply a label that does not exist in the target repository
THEN the system SHALL attempt to create the label in the repository before applying it to the issue
AND if label creation fails (e.g., insufficient permissions), the system SHALL continue with issue creation anyway.

#### Scenario: LLM-based bug/feature-request labels

WHEN a category or comment is exported as a GitHub issue
THEN the system SHALL use the active LLM (via `generateObject`) to classify the comments as "bug", "feature-request", or "feedback"
AND if the type is "bug" or "feature-request", add it as an additional label (red for bug, teal for feature-request)
AND the label SHALL be created in the repository if it does not exist
AND if the LLM is unavailable, the system SHALL fall back to "feedback" (no extra label).

---

### Requirement: GitHub Issues tracker on the GitHub page

The GitHub page (`app/project/[id]/github/page.tsx`) SHALL display all issues created from the project below the configuration card. The GitHubIssue entity stores: `id`, `projectId`, `categoryId` (nullable), `githubIssueNumber`, `githubUrl`, `title`, `labels` (JSON string, nullable), `status` (nvarchar 20, defaults to "open"), and `createdAt`.

#### Scenario: User views the GitHub Issues tracker

WHEN the user navigates to the GitHub page for a project with created issues
THEN the system SHALL display a list of issues showing issue number, status badge (green for open, purple for closed), title, labels (as Badge components), and a link icon to open the issue on GitHub.

#### Scenario: No issues have been created yet

#### Scenario: No issues created yet — empty state with guidance

WHEN the user navigates to the GitHub page, has a valid config, and no issues have been created
THEN the system SHALL display an empty state message: "No issues created yet. Go to the Dashboard tab to export categories or selected comments as GitHub issues."

#### Scenario: User refreshes issue statuses

WHEN the user clicks the "Refresh Status" button on the issues tracker
THEN the system SHALL call PATCH `/api/projects/[id]/github/issues`
AND the API SHALL fetch each issue's current status from the GitHub API via Octokit
AND update the local `status` field if it has changed (e.g., from "open" to "closed")
AND the issue list SHALL reload to reflect updated statuses.

---

### Requirement: Link back from issue to NPS repository

Every GitHub issue created by the system SHALL include a footer with an attribution line linking to the NPS Insight Engine repository, and when a projectId is available, a "View in Dashboard" link with the category as a query parameter.

#### Scenario: User views a created GitHub issue

WHEN a user views a GitHub issue that was created from the NPS Insight Engine
THEN the issue body SHALL contain a footer with:
- A link to the NPS Insight Engine GitHub repository
- A "View in Dashboard" link pointing to the project dashboard with `?category=<categoryName>` query parameter to highlight the relevant category.
