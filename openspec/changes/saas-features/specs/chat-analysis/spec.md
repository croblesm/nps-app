# Chat Analysis

Capability: RAG-based natural language Q&A over NPS comments using SQL Server 2025 VECTOR type and vector similarity search.

## ADDED Requirements

### Requirement: Enable Chat Analysis button on dashboard

The dashboard SHALL display an "Enable Chat Analysis" button after classification is complete. The button MUST only be visible when the project has classified comments and embeddings have not yet been generated.

#### Scenario: Dashboard loads after classification with no embeddings

WHEN the user opens a project dashboard that has completed classification but has no embeddings generated
THEN the system SHALL display an "Enable Chat Analysis" button in the dashboard toolbar.

#### Scenario: Dashboard loads when embeddings already exist

WHEN the user opens a project dashboard where embeddings have already been generated
THEN the system SHALL NOT display the "Enable Chat Analysis" button
AND the chat panel SHALL be available immediately.

#### Scenario: Dashboard loads before classification is complete

WHEN the user opens a project dashboard that has not completed classification
THEN the system SHALL NOT display the "Enable Chat Analysis" button.

---

### Requirement: Embedding pipeline with progress indicator

The system SHALL generate vector embeddings for all classified comments when the user clicks "Enable Chat Analysis." The embedding process MUST display a progress indicator showing the number of comments processed out of the total.

#### Scenario: User clicks Enable Chat Analysis

WHEN the user clicks the "Enable Chat Analysis" button
THEN the system SHALL begin generating embeddings for all classified comments
AND a progress indicator SHALL display showing "Embedding X of Y comments..."
AND the button SHALL be disabled during the embedding process.

#### Scenario: Embedding pipeline completes successfully

WHEN the embedding pipeline finishes processing all comments
THEN the system SHALL store each embedding in the comments table using the SQL Server 2025 VECTOR column type
AND the progress indicator SHALL be replaced by the chat panel
AND a success message SHALL be displayed briefly.

#### Scenario: Embedding pipeline encounters an error

WHEN the embedding pipeline fails during processing
THEN the system SHALL display an error message with the number of comments successfully embedded
AND the "Enable Chat Analysis" button SHALL be re-enabled so the user can retry.

---

### Requirement: Chat panel at bottom of dashboard

The dashboard SHALL display a chat panel at the bottom of the page once embeddings are available. The chat panel MUST include a text input for natural language queries and a scrollable message history area.

#### Scenario: Chat panel renders after embeddings are ready

WHEN the dashboard loads and embeddings exist for the project
THEN the system SHALL render a chat panel at the bottom of the dashboard
AND the panel SHALL include a text input field with placeholder text "Ask a question about your NPS data..."
AND the panel SHALL include a scrollable area for displaying conversation history.

#### Scenario: Chat panel is collapsible

WHEN the user clicks the collapse toggle on the chat panel
THEN the chat panel SHALL minimize to a compact bar showing only the toggle button
AND clicking the toggle again SHALL restore the full panel.

---

### Requirement: Natural language queries with cited comments

The system SHALL answer natural language queries by retrieving relevant comments via vector similarity search and generating an LLM response that cites specific comments. Each citation MUST reference the original comment text and NPS score.

#### Scenario: User asks a question about a theme

WHEN the user submits the query "What are users saying about performance?"
THEN the system SHALL perform a vector similarity search using VECTOR_DISTANCE to find the most relevant comments
AND the LLM SHALL generate a response summarizing the findings
AND the response SHALL include inline citations referencing specific comment text and NPS scores.

#### Scenario: User asks a question with no relevant comments

WHEN the user submits a query that has no semantically similar comments in the dataset
THEN the system SHALL respond with a message indicating no relevant feedback was found for that query
AND suggest alternative questions based on the available categories.

#### Scenario: Citations are clickable

WHEN the system displays a response with citations
THEN each citation SHALL be clickable
AND clicking a citation SHALL highlight or scroll to the referenced comment in the data table above.

---

### Requirement: Vector similarity search via VECTOR_DISTANCE

The system SHALL use the SQL Server 2025 VECTOR_DISTANCE function with cosine similarity to retrieve the top K most relevant comments for each query. K MUST default to 20 and be configurable.

#### Scenario: System retrieves relevant comments for a query

WHEN the system processes a user query for RAG retrieval
THEN the system SHALL embed the query text using the same embedding model used for comments
AND execute a SQL query using VECTOR_DISTANCE with cosine similarity to rank comments
AND return the top K comments ordered by similarity score.

#### Scenario: Active dashboard filters are respected in similarity search

WHEN the user has active filters (score card, category, dropdown, or search) on the dashboard and submits a chat query
THEN the vector similarity search SHALL apply those filters as additional WHERE clauses
AND the retrieved comments SHALL match both the semantic query and the active filters.

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

#### Scenario: User navigates to dashboard during embedding generation

WHEN the user opens the dashboard while embedding generation is in progress
THEN the system SHALL display the progress indicator with the current embedding status
AND the chat input SHALL be disabled with a message "Embeddings are being generated..."

#### Scenario: Embeddings are partially generated due to previous failure

WHEN the user opens the dashboard and only some comments have embeddings
THEN the system SHALL display a message indicating incomplete embeddings
AND offer a button to resume embedding generation for the remaining comments.

---

### Requirement: Anthropic provider detection for embeddings

The system SHALL detect when the configured LLM provider is Anthropic and return a clear error message, since Anthropic does not support embedding generation. This detection is implemented in both the embed and chat API routes.

#### Scenario: User triggers embedding with Anthropic provider configured

WHEN the user clicks "Enable Chat Analysis" and the configured LLM provider is "anthropic"
THEN the embed API route (app/api/ai/embed/route.ts) SHALL check config.provider === "anthropic"
AND return a 400 error with the message: "Anthropic does not support embeddings. To use Chat Analysis, configure an additional provider with embedding support (OpenAI, Azure OpenAI, or Ollama) in Settings."
AND the embedding pipeline SHALL NOT proceed.

#### Scenario: User sends a chat message with Anthropic provider and no prior embedding provider

WHEN the user sends a chat query and the LLM provider is "anthropic" and project.embeddingProvider is not set
THEN the chat API route (app/api/ai/chat/route.ts) SHALL check config.provider === "anthropic" && !project.embeddingProvider
AND return a 400 error with the message: "Anthropic does not support embeddings. Configure OpenAI, Azure OpenAI, or Ollama in Settings to use Chat Analysis."

#### Scenario: Anthropic provider with existing embedding provider

WHEN the user sends a chat query and the LLM provider is "anthropic" but project.embeddingProvider is already set (from a previous successful embedding run with a different provider)
THEN the chat API route SHALL proceed using the stored embeddingProvider and embeddingModel for query embedding
AND SHALL NOT block the request.
