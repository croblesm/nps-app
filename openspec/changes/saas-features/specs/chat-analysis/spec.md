# Chat Analysis

Capability: RAG-based natural language Q&A over NPS comments using vector embeddings and JavaScript cosine similarity search.

## ADDED Requirements

### Requirement: Enable Chat Analysis via floating action button

The dashboard SHALL display a floating action button (FAB) in the bottom-right corner for Chat Analysis. The FAB behavior changes based on whether embeddings have been generated: when chat is not yet enabled, clicking the FAB triggers the embedding pipeline; when chat is enabled, clicking the FAB toggles the chat overlay.

#### Scenario: Dashboard loads after classification with no embeddings

WHEN the user opens a project dashboard that has completed classification but has no embeddings generated
THEN a FAB SHALL appear in the bottom-right corner with a `MessageSquare` icon and "Enable Chat" label
AND clicking the FAB SHALL trigger the embedding pipeline.

#### Scenario: Dashboard loads when embeddings already exist

WHEN the user opens a project dashboard where embeddings have already been generated
THEN the FAB SHALL display a `MessageSquare` icon and "Chat" label
AND clicking the FAB SHALL toggle the floating chat overlay.

#### Scenario: Dashboard loads before classification is complete

WHEN the user opens a project dashboard that has not completed classification
THEN the FAB SHALL NOT be displayed (the classification prompt is shown instead).

---

### Requirement: Embedding pipeline with SSE streaming progress

The system SHALL generate vector embeddings for all classified comments when the user clicks the "Enable Chat" FAB. The embed API route (`/api/ai/embed`) uses Server-Sent Events (SSE) to stream real-time progress back to the client. Progress is displayed in a fixed blue banner at the top of the page (below the header).

#### Scenario: User clicks Enable Chat FAB

WHEN the user clicks the "Enable Chat" FAB
THEN the system SHALL POST to `/api/ai/embed` with the projectId
AND the FAB SHALL show a spinner and "Embedding..." label and be disabled
AND a fixed blue banner SHALL appear at the top of the page showing progress steps.

#### Scenario: SSE progress steps during embedding

WHEN the embedding pipeline runs
THEN the SSE stream SHALL send progress events for each step:
1. "Checking Ollama embedding model..." (if provider is Ollama)
2. "Pulling embedding model..." (if Ollama model not installed locally)
3. "Loading comments..."
4. "Embedding comments... X/Y" (updated after each batch of 10)
AND the blue banner SHALL update with each progress step.

#### Scenario: Embedding pipeline completes successfully

WHEN the embedding pipeline finishes processing all comments
THEN the system SHALL store each embedding as a JSON string in the comments table embedding column
AND set the project's `chatEnabled` flag to true
AND a success toast SHALL be displayed
AND the chat overlay SHALL open automatically.

#### Scenario: Embedding pipeline skips already-embedded comments

WHEN the embedding pipeline runs and some comments already have embeddings
THEN the system SHALL skip those comments and only embed the remaining ones
AND if all comments are already embedded, mark `chatEnabled` as true immediately.

#### Scenario: Embedding pipeline encounters an error

WHEN the embedding pipeline fails during processing
THEN the system SHALL send an SSE error event
AND the FAB SHALL be re-enabled so the user can retry
AND a toast error SHALL be displayed.

---

### Requirement: Chat panel component

The ChatPanel component SHALL provide a full chat interface with text input, scrollable message history, and citation display. It supports both inline (card) and overlay (floating) rendering modes via an optional `onClose` prop.

#### Scenario: Chat panel renders with message history

WHEN the chat panel is displayed
THEN the panel SHALL include a text input field with placeholder text "Ask a question about your NPS data..."
AND the panel SHALL include a scrollable area for displaying conversation history.

#### Scenario: Chat panel in overlay mode

WHEN the ChatPanel is rendered with an `onClose` prop
THEN a close (X) button SHALL appear in the panel header
AND clicking close SHALL call the `onClose` callback to dismiss the overlay.

---

### Requirement: Natural language queries with cited comments

The system SHALL answer natural language queries by retrieving relevant comments via vector similarity search and generating an LLM response that cites specific comments. Each citation MUST reference the original comment text and NPS score.

#### Scenario: User asks a question about a theme

WHEN the user submits the query "What are users saying about performance?"
THEN the system SHALL perform a vector similarity search using JavaScript cosine similarity to find the top 10 most relevant comments
AND the LLM SHALL generate a response summarizing the findings
AND the response SHALL include inline citations referencing specific comment text and NPS scores.

#### Scenario: User asks a question with no relevant comments

WHEN the user submits a query and all comments have cosine similarity below 0.3 (the threshold)
THEN the system SHALL NOT call the LLM
AND respond with a guidance message: "I couldn't find any comments closely related to your question. Try asking about specific themes like: [category names]."
AND the message SHALL be saved to chat history.

#### Scenario: Citations are clickable

WHEN the system displays a response with citations
THEN each citation badge (both inline [N] and in the "Cited comments" section) SHALL be clickable
AND clicking a citation SHALL scroll to the referenced comment row in the data table (via `comment-{id}` element ID)
AND highlight the row with a blue ring for 3 seconds.

---

### Requirement: Vector similarity search

The system SHALL retrieve the top K most relevant comments for each query. K MUST default to 20 and be configurable. The current implementation uses JavaScript-based cosine similarity as a fallback; a future optimization will use the SQL Server 2025 VECTOR_DISTANCE function for database-level search.

#### Scenario: System retrieves relevant comments for a query

WHEN the system processes a user query for RAG retrieval
THEN the system SHALL embed the query text using the same embedding model used for comments
AND retrieve the top K comments ordered by descending similarity score.

**Current implementation:** JavaScript cosine similarity with K defaulting to 20. The `topK` parameter in the chat API schema allows callers to override (range 1-50). All comments with embeddings are loaded from the database, parsed, and similarity computed in application code.

#### Scenario: Active dashboard filters are respected in similarity search

WHEN the user has active filters (feedbackType, category, search, actionable) on the dashboard and submits a chat query
THEN the ChatPanel SHALL pass the current filter state to the chat API via a `filters` object
AND the chat route SHALL apply those filters to the comment set before computing cosine similarity
AND the retrieved comments SHALL match both the semantic query and the active filters.

#### Scenario: Migrate to SQL Server 2025 VECTOR_DISTANCE (NOT YET IMPLEMENTED)

WHEN the system processes a user query for RAG retrieval
THEN the system SHALL use the SQL Server 2025 VECTOR_DISTANCE function with cosine similarity to rank comments at the database level
AND K SHALL default to 20 and be configurable.

---

### Requirement: Chat history persisted per project

The system SHALL persist chat messages (both user queries and assistant responses) in a chat_messages database table scoped to the project. Chat history MUST be restored when the user revisits the dashboard.

#### Scenario: User sends a message and revisits later

WHEN the user sends a chat message, navigates away, and returns to the project dashboard
THEN the chat panel SHALL display the full previous conversation history in chronological order.

#### Scenario: User clears chat history

WHEN the user clicks a "Clear History" button in the chat panel
THEN the system SHALL delete all chat messages for that project
AND the chat panel SHALL display an empty state.

---

### Requirement: Handle case when embeddings are not ready

The system SHALL gracefully handle scenarios where the user attempts to use the chat panel before embeddings are fully generated.

#### Scenario: Embedding in progress on current session

WHEN the embedding pipeline is currently running
THEN the FAB SHALL show a spinner and "Embedding..." label and be disabled
AND the fixed blue banner SHALL display the current progress step
AND the user cannot open the chat overlay until embedding completes.

#### Scenario: Embeddings are partially generated due to previous failure

WHEN the user opens the dashboard and the project has an `embeddingProvider` set but `chatEnabled` is false (indicating a prior partial run)
THEN the system SHALL display an orange banner: "Embeddings incomplete — some comments were not embedded in a previous run."
AND offer a "Resume Embedding" button that triggers the embedding pipeline (which automatically skips already-embedded comments).

---

### Requirement: Smart embedding provider resolution

The system SHALL automatically resolve an embedding-capable provider when generating embeddings or processing chat queries. Only providers that support embedding APIs (OpenAI, Azure OpenAI, Ollama) are eligible. The resolution logic is centralized in `lib/ai/get-embedding-config.ts`.

#### Scenario: Default provider supports embeddings

WHEN the user's default LLM provider is OpenAI, Azure OpenAI, or Ollama
THEN the system SHALL use the default provider for embedding operations.

#### Scenario: Default provider is Anthropic with a secondary embedding-capable provider

WHEN the user's default LLM provider is Anthropic
AND the user has a secondary provider configured (e.g., OpenAI or Ollama)
THEN the system SHALL automatically select the secondary provider for embedding operations
AND the embedding pipeline SHALL proceed without error.

#### Scenario: No embedding-capable provider configured

WHEN no configured LLM provider supports embeddings (e.g., only Anthropic is configured)
THEN the system SHALL return a 400 error with code `NO_EMBEDDING_PROVIDER`
AND the error message SHALL guide the user to add OpenAI, Azure OpenAI, or Ollama in Settings.

#### Scenario: Ollama embedding model not installed

WHEN the embedding provider is Ollama and the embedding model (e.g., `nomic-embed-text`) is not available locally
THEN the system SHALL attempt to auto-pull the model via the Ollama `/api/pull` endpoint
AND if the pull fails, return a 400 error with code `MISSING_EMBEDDING_MODEL` and instructions to run `ollama pull <model>`.

#### Scenario: Chat query matches project's stored embedding provider

WHEN the user sends a chat query and `project.embeddingProvider` is set from a previous embedding run
THEN the system SHALL find the LlmConfig matching that specific provider
AND use the same model to embed the query (ensuring vector dimension compatibility).

#### Scenario: Project's stored embedding provider was deleted

WHEN the user sends a chat query and `project.embeddingProvider` references a provider no longer configured
THEN the system SHALL return a clear error: "The embedding provider used for this project is no longer configured. Re-add it in Settings."

---

### Requirement: Chat panel as floating overlay

The dashboard SHALL display the chat panel as a floating overlay (420px wide, 500px tall) anchored above the FAB in the bottom-right corner. The overlay renders the `ChatPanel` component with full functionality.

#### Scenario: Dashboard with chat enabled — open overlay

WHEN the dashboard loads and `chatEnabled` is true and the user clicks the FAB
THEN a floating overlay panel (420px wide, 500px tall) SHALL appear above the FAB
AND the overlay SHALL render the `ChatPanel` component with full functionality.

#### Scenario: Embedding fails due to no provider

WHEN embedding fails with code `NO_EMBEDDING_PROVIDER`
THEN the system SHALL show a toast error with a link to Settings page.

#### Scenario: Chat overlay is dismissable

WHEN the chat overlay is open
THEN the FAB SHALL switch to show an `X` icon and "Close" label
AND clicking the FAB (or the close button inside `ChatPanel`) SHALL hide the overlay and return to the FAB-only state.
