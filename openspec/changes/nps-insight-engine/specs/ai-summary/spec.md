# AI Summary

Capability: On-demand AI-generated markdown insight report.

## ADDED Requirements

### Requirement: Trigger summary generation from the dashboard

The system SHALL provide a button on the project dashboard that allows the user to trigger AI summary generation on demand. The system MUST indicate that generation is in progress while the AI processes the request.

#### Scenario: User triggers summary generation

WHEN the user clicks the "Generate Summary" button on the dashboard
THEN the system SHALL display a loading indicator while the AI processes the request
AND the system SHALL disable the button to prevent duplicate requests during generation.

#### Scenario: User triggers summary generation with no classified comments

WHEN the user attempts to generate a summary for a project that has no classified comments
THEN the system SHALL display an error message indicating that comment classification must be completed before generating a summary.

---

### Requirement: AI Summary agent receives required context

The system SHALL provide the AI Summary agent with project metadata, NPS statistics, category breakdown, top comments per category, and noise filter impact data. The agent MUST receive sufficient context to produce an accurate and comprehensive report.

#### Scenario: Summary agent receives complete context

WHEN the system invokes the AI Summary agent
THEN the system SHALL pass the following data to the agent: project name, project description, overall NPS score, total response count, promoter/passive/detractor breakdown, category names with comment counts and percentages, top representative comments per category, and a list of active noise filters with their excluded comment counts.

#### Scenario: Summary agent receives context with active noise filters

WHEN the system invokes the AI Summary agent and one or more noise filters have exclusion active
THEN the context sent to the agent SHALL include the names of active noise filters, the count of comments excluded by each filter, and the NPS score both with and without exclusions applied.

---

### Requirement: Output is a structured markdown report

The AI Summary agent SHALL produce a structured markdown report containing the following sections: executive summary, NPS score analysis, top themes with impact assessment, key quotes per theme, prioritized recommendations, and noise filter impact statement.

#### Scenario: Summary report contains all required sections

WHEN the AI Summary agent completes generation
THEN the output SHALL be a valid markdown document containing clearly delineated sections for executive summary, NPS score analysis, top themes with impact, key quotes per theme, prioritized recommendations, and noise filter impact statement
AND each section SHALL contain substantive content derived from the provided project data.

#### Scenario: Summary report reflects noise filter impact

WHEN the AI Summary agent generates a report for a project with active noise filter exclusions
THEN the noise filter impact statement section SHALL describe which filters are active, how many comments each filter excluded, and the effect on the reported NPS score.

---

### Requirement: Render summary in-app using markdown renderer

The system SHALL render the generated markdown summary within the application using a markdown renderer. The rendered view MUST support headings, lists, bold/italic text, and blockquotes.

#### Scenario: User views the rendered summary

WHEN the AI summary generation completes
THEN the system SHALL display the summary as rendered markdown within the application
AND the rendered output SHALL correctly format headings, bulleted lists, numbered lists, bold text, italic text, and blockquotes.

---

### Requirement: Download summary as a markdown file

The system SHALL allow the user to download the generated summary as a `.md` file. The downloaded file MUST contain the same content as the in-app rendered summary.

#### Scenario: User downloads the summary

WHEN the user clicks the download button on a generated summary
THEN the system SHALL download a `.md` file to the user's device
AND the file content SHALL match the markdown content displayed in the application
AND the filename SHALL include the project name and generation date.

---

### Requirement: Persist summary in the database with timestamp

The system SHALL persist each generated summary in the database with its full markdown content and a generation timestamp. The summary record MUST be associated with the project.

#### Scenario: Summary is saved after generation

WHEN the AI Summary agent completes generation of a summary
THEN the system SHALL store the summary markdown content in the database with a generation timestamp and a reference to the project
AND the summary SHALL be retrievable when the user returns to the project.

---

### Requirement: Regenerate summary while preserving previous versions

The system SHALL allow the user to regenerate the summary at any time. Regeneration MUST create a new summary version without deleting previously generated summaries. The system SHALL display the most recent summary by default.

#### Scenario: User regenerates the summary

WHEN the user clicks "Regenerate Summary" on a project that already has a generated summary
THEN the system SHALL invoke the AI Summary agent to produce a new summary
AND the system SHALL store the new summary as a separate record with its own generation timestamp
AND the previously generated summary SHALL remain in the database.

#### Scenario: User views previous summary versions

WHEN a project has multiple generated summaries
THEN the system SHALL display the most recent summary by default
AND the system SHALL provide a way for the user to view previously generated summaries with their generation timestamps.
