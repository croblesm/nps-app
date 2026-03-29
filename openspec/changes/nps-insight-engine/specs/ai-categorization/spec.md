# AI Categorization

Capability: AI theme discovery, user review and editing of categories, and bulk comment classification.

## ADDED Requirements

### Requirement: AI Theme Discovery from stratified sample

The AI Theme Discovery agent SHALL propose 5 to 10 categories derived from a stratified sample of 50 to 100 comments. Each proposed category MUST include a name, a description, and 3 to 5 sample comments that exemplify the category.

#### Scenario: AI discovers themes from a dataset with diverse feedback

WHEN the system sends a stratified sample of comments (spanning promoters, passives, and detractors) to the AI Theme Discovery agent
THEN the agent SHALL return between 5 and 10 proposed categories
AND each category SHALL include a name, a description, and 3 to 5 representative sample comments.

#### Scenario: AI discovers themes from a small dataset

WHEN the project contains fewer than 50 comments
THEN the system SHALL send all available comments to the AI Theme Discovery agent
AND the agent SHALL propose categories based on the available data.

---

### Requirement: User can rename, merge, delete, or add categories

The system SHALL allow the user to edit the AI-proposed categories before classification. The user MUST be able to rename a category, merge two or more categories into one, delete a category, or add a new category manually.

#### Scenario: User renames a category

WHEN the user edits the name of a proposed category
THEN the system SHALL update the category name
AND the sample comments for that category SHALL remain associated with it.

#### Scenario: User merges two categories

WHEN the user selects two categories and triggers a merge operation
THEN the system SHALL combine them into a single category with a user-specified name
AND the sample comments from both original categories SHALL be associated with the merged category.

#### Scenario: User deletes a non-mandatory category

WHEN the user deletes a proposed category that is not "General Feedback"
THEN the system SHALL remove that category from the list
AND comments previously sampled under it SHALL be unassigned.

#### Scenario: User adds a new category

WHEN the user creates a new category by providing a name and description
THEN the system SHALL add the category to the list of confirmed categories.

---

### Requirement: General Feedback is a mandatory fallback category

The system MUST ensure a "General Feedback" category exists at all times. The "General Feedback" category SHALL NOT be deletable by the user.

#### Scenario: User attempts to delete General Feedback

WHEN the user attempts to delete the "General Feedback" category
THEN the system SHALL prevent the deletion and display a message explaining that "General Feedback" is a mandatory fallback category.

#### Scenario: AI proposal does not include General Feedback

WHEN the AI Theme Discovery agent returns categories that do not include a "General Feedback" category
THEN the system SHALL automatically add "General Feedback" as an additional category before presenting the list to the user.

#### Scenario: AI proposal includes General Feedback (deduplication)

WHEN the AI Theme Discovery agent returns a category named "General Feedback"
THEN the system SHALL remove the AI-proposed version and keep only the mandatory fallback version to avoid duplicate entries.

#### Scenario: Rename hint visible on hover

WHEN the user hovers over a non-fallback category name
THEN a "click to rename" hint SHALL appear next to the name to indicate editability.

---

### Requirement: AI Classifier classifies all comments in batches

After the user confirms categories, the AI Classifier agent SHALL classify ALL comments into the confirmed categories. Classification MUST be performed in batches. Each classification MUST include a confidence score between 0 and 1 and a brief reasoning string.

#### Scenario: Batch classification of 500 comments

WHEN the user confirms the category list and the project contains 500 comments
THEN the AI Classifier agent SHALL process all 500 comments in batches (e.g., 20-30 per batch)
AND each comment SHALL receive exactly one category assignment, a confidence score between 0 and 1, and a brief reasoning for the classification.

#### Scenario: AI assigns low-confidence classification

WHEN the AI Classifier agent assigns a confidence score below 0.5 to a comment
THEN the comment SHALL still be assigned to the best-matching category
AND the low confidence SHALL be recorded for the user to review.

---

### Requirement: AI flags non-actionable comments

The AI Classifier agent SHALL flag comments that are non-actionable. Non-actionable comments include nonsensical text, single-word responses, redacted content, and purely emotional statements without constructive feedback.

#### Scenario: Comment contains only emotional expression

WHEN the AI Classifier processes a comment such as "I hate it!!!" with no constructive detail
THEN the classifier SHALL assign a category and flag the comment as non-actionable
AND the reasoning SHALL indicate why the comment is non-actionable.

#### Scenario: Comment contains redacted or placeholder text

WHEN the AI Classifier processes a comment such as "[REDACTED]" or "N/A"
THEN the classifier SHALL flag the comment as non-actionable.

---

### Requirement: Empty comments are flagged deterministically as No Comment

The system SHALL flag empty or whitespace-only comments as "No Comment" deterministically without sending them to the AI Classifier.

#### Scenario: Comment field is empty

WHEN a comment field contains an empty string or only whitespace characters
THEN the system SHALL assign the comment a "No Comment" flag deterministically
AND the system SHALL NOT send the comment to the AI Classifier agent.

#### Scenario: Comment field contains only whitespace and newlines

WHEN a comment field contains only spaces, tabs, or newline characters
THEN the system SHALL treat it as empty and assign the "No Comment" flag.

---

### Requirement: Show classification progress

The system SHALL display classification progress to the user during bulk classification. Progress MUST be shown as a progress bar or percentage indicator.

#### Scenario: Classification is in progress

WHEN the AI Classifier is processing batches of comments
THEN the system SHALL display a progress indicator showing the number of comments classified out of the total
AND the progress SHALL update after each batch completes.

#### Scenario: Classification completes

WHEN all batches have been processed
THEN the system SHALL display a completion message
AND the system SHALL navigate the user to the project dashboard or provide a link to it.

---

### Requirement: User can trigger re-classification after category changes

The system SHALL allow the user to modify categories after initial classification and trigger a re-classification of all comments.

#### Scenario: User modifies categories and re-classifies

WHEN the user edits, adds, or removes categories after the initial classification has completed and triggers re-classification
THEN the system SHALL re-run the AI Classifier agent on all comments using the updated category list
AND the previous classifications SHALL be replaced with the new results.

#### Scenario: User is warned about re-classification cost

WHEN the user triggers re-classification
THEN the system SHALL display a confirmation dialog informing the user that all existing classifications will be replaced and additional AI API calls will be made.
