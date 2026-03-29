# AI Assistant

Capability: Contextual AI chat panel available on every project page with step-aware guidance and recommendations.

## ADDED Requirements

### Requirement: Collapsible chat panel on every project page

The system SHALL display a collapsible AI assistant chat panel on every project page (upload, structure, categories, dashboard, noise, summary). The panel MUST be accessible via a persistent floating button and SHALL NOT obstruct the main content when collapsed.

#### Scenario: User opens the AI assistant on the dashboard page

WHEN the user clicks the AI assistant floating button on the dashboard page
THEN the system SHALL expand a chat panel on the right side of the screen
AND the panel SHALL include a text input and a scrollable message area.

#### Scenario: User collapses the AI assistant

WHEN the user clicks the collapse button on the AI assistant panel
THEN the panel SHALL minimize to the floating button
AND the main content area SHALL reclaim the full width.

#### Scenario: AI assistant state persists across page navigation

WHEN the user has the AI assistant open and navigates to another project page
THEN the AI assistant panel SHALL remain open on the new page
AND the conversation history SHALL be preserved.

---

### Requirement: Context-aware responses based on current step

The AI assistant SHALL be aware of the user's current step in the workflow, the uploaded data, discovered categories, and NPS statistics. The assistant MUST tailor its responses and suggestions to the context of the current page.

#### Scenario: User asks for help on the upload page

WHEN the user opens the AI assistant on the upload page and asks "What format should my CSV be?"
THEN the assistant SHALL respond with guidance about the expected CSV format, required columns, and common formatting issues
AND the response SHALL reference the upload step specifically.

#### Scenario: User asks for help on the categories page

WHEN the user opens the AI assistant on the categories page where 8 categories have been discovered
THEN the assistant SHALL have access to the list of 8 categories with their names, descriptions, and sample comments
AND respond with context-specific advice about reviewing and editing categories.

#### Scenario: User asks about NPS score on the dashboard

WHEN the user opens the AI assistant on the dashboard page with an NPS score of -15
THEN the assistant SHALL have access to the current NPS score, score distribution, category breakdown, and filter state
AND provide analysis specific to the project's data.

---

### Requirement: Answer questions and make proactive recommendations

The AI assistant SHALL answer user questions about their NPS data, the analysis workflow, and the platform features. The assistant MUST also make proactive recommendations when the user's data or workflow state suggests actionable improvements.

#### Scenario: User asks a data question

WHEN the user asks "Which category has the most detractors?"
THEN the assistant SHALL analyze the available category and score data
AND respond with the category name, detractor count, and percentage.

#### Scenario: Assistant makes a proactive recommendation

WHEN the user opens the AI assistant on the noise filters page and there are comments containing "N/A" or "test" that have not been filtered
THEN the assistant SHALL proactively suggest adding noise filters for those patterns.

#### Scenario: User asks a platform question

WHEN the user asks "How do I export my data?"
THEN the assistant SHALL explain the available export options (CSV export, JSON export)
AND provide guidance on how to access them from the current page or the relevant page.

---

### Requirement: Uses configured LLM provider

The AI assistant SHALL use the LLM provider configured in the application settings (Anthropic, OpenAI, Azure OpenAI, or Ollama). The assistant MUST fall back gracefully if no provider is configured.

#### Scenario: LLM provider is configured

WHEN the user opens the AI assistant and an LLM provider is configured in settings
THEN the assistant SHALL use that provider for generating responses.

#### Scenario: No LLM provider is configured

WHEN the user opens the AI assistant and no LLM provider is configured
THEN the system SHALL display a message indicating that an LLM provider must be configured in settings
AND provide a link to the settings page.

---

### Requirement: Lightweight implementation without RAG

The AI assistant SHALL NOT use vector embeddings or RAG for context retrieval. Instead, the assistant MUST send the relevant page context (current step, project metadata, NPS statistics, category list, active filters) directly in the LLM prompt. The context payload MUST be kept under a reasonable token limit to ensure fast responses.

#### Scenario: Assistant context includes page-specific data

WHEN the user submits a question on the dashboard page
THEN the system SHALL construct an LLM prompt that includes: the current page name, project name, total response count, NPS score, score distribution, category names with counts, and any active filters
AND the prompt SHALL NOT include raw comment embeddings or perform vector search.

#### Scenario: Assistant context on the upload page is minimal

WHEN the user submits a question on the upload page before any data is uploaded
THEN the system SHALL construct an LLM prompt with minimal context: the current page name, project name, and guidance about the upload step
AND the response time SHALL be fast due to the small context size.
