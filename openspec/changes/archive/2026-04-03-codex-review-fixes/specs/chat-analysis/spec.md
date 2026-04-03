## MODIFIED Requirements

### Requirement: Natural language queries with cited comments

The system SHALL answer natural language queries by retrieving relevant comments via vector similarity search and generating an LLM response that cites specific comments. Each citation MUST reference the original comment text and NPS score.

#### Scenario: User asks a question about a theme

- **WHEN** the user submits the query "What are users saying about performance?"
- **THEN** the system SHALL perform a vector similarity search using JavaScript cosine similarity to find the top 10 most relevant comments
- **AND** the LLM SHALL generate a response summarizing the findings
- **AND** the response SHALL include inline citations referencing specific comment text and NPS scores.

#### Scenario: User asks a question with no relevant comments

- **WHEN** the user submits a query and all comments have cosine similarity below 0.3 (the threshold)
- **THEN** the system SHALL NOT call the LLM
- **AND** respond with a guidance message: "I couldn't find any comments closely related to your question. Try asking about specific themes like: [category names]."
- **AND** the message SHALL be saved to chat history.

#### Scenario: Citations are clickable

- **WHEN** the system displays a response with citations
- **THEN** each citation badge (both inline [N] and in the "Cited comments" section) SHALL be clickable
- **AND** clicking a citation SHALL scroll to the referenced comment row in the data table (via `comment-{id}` element ID)
- **AND** highlight the row with a blue ring for 3 seconds.

#### Scenario: Chat respects multi-category filters
- **WHEN** the user has multiple categories selected on the dashboard (comma-separated in filters)
- **THEN** the chat API SHALL split the category filter on commas and match comments belonging to any of the specified categories
- **AND** the similarity search SHALL only consider comments matching the active category filters
