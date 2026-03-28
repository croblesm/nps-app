# LLM Configuration

Capability: Multi-provider LLM settings with API key management.

## ADDED Requirements

### Requirement: Settings page accessible from the app header

The system SHALL provide a settings page accessible from the application header or navigation. The settings page MUST be reachable from any page in the application.

#### Scenario: User navigates to LLM settings

WHEN the user clicks the settings link in the application header
THEN the system SHALL navigate to the LLM configuration settings page
AND the page SHALL display the current LLM provider configuration.

---

### Requirement: Select LLM provider

The system SHALL allow the user to select an LLM provider from the following options: Anthropic (default), OpenAI, Azure OpenAI, and Ollama. Anthropic SHALL be the default and priority provider.

#### Scenario: User selects Anthropic as the provider

WHEN the user selects Anthropic from the provider dropdown
THEN the system SHALL display the API key input field and a model selection dropdown
AND Anthropic SHALL be marked as the active provider.

#### Scenario: User selects OpenAI as the provider

WHEN the user selects OpenAI from the provider dropdown
THEN the system SHALL display the API key input field and a model selection dropdown for OpenAI models.

#### Scenario: User selects Azure OpenAI as the provider

WHEN the user selects Azure OpenAI from the provider dropdown
THEN the system SHALL display input fields for API key, endpoint URL, and deployment name.

#### Scenario: User selects Ollama as the provider

WHEN the user selects Ollama from the provider dropdown
THEN the system SHALL display input fields for server URL (pre-filled with http://localhost:11434) and model name
AND the system SHALL NOT display an API key input field.

---

### Requirement: Enter API key for cloud providers

The system SHALL require the user to enter an API key for cloud providers (Anthropic, OpenAI, Azure OpenAI). The API key field MUST mask the input by default.

#### Scenario: User enters an API key for Anthropic

WHEN the user enters an API key in the Anthropic configuration form
THEN the system SHALL mask the key input characters by default
AND the system SHALL provide a toggle to temporarily reveal the entered key.

#### Scenario: User attempts to save cloud provider config without an API key

WHEN the user attempts to save configuration for Anthropic, OpenAI, or Azure OpenAI without entering an API key
THEN the system SHALL display a validation error indicating that an API key is required
AND the system SHALL NOT save the configuration.

---

### Requirement: Azure OpenAI requires endpoint URL and deployment name

The system SHALL require the user to provide an endpoint URL and deployment name when Azure OpenAI is selected as the provider, in addition to the API key.

#### Scenario: User configures Azure OpenAI with all required fields

WHEN the user enters an API key, endpoint URL, and deployment name for Azure OpenAI and saves the configuration
THEN the system SHALL persist all three values and mark Azure OpenAI as the active provider.

#### Scenario: User omits endpoint URL or deployment name for Azure OpenAI

WHEN the user attempts to save Azure OpenAI configuration with a missing endpoint URL or deployment name
THEN the system SHALL display a validation error for each missing field
AND the system SHALL NOT save the configuration.

---

### Requirement: Ollama requires server URL and model name

The system SHALL require the user to provide a server URL and model name when Ollama is selected as the provider. The server URL field SHALL default to http://localhost:11434.

#### Scenario: User configures Ollama with default server URL

WHEN the user selects Ollama and enters a model name without modifying the server URL
THEN the system SHALL use http://localhost:11434 as the server URL
AND the system SHALL persist the configuration with the default URL and the specified model name.

#### Scenario: User configures Ollama with a custom server URL

WHEN the user selects Ollama and modifies the server URL to a custom value and enters a model name
THEN the system SHALL persist the configuration with the custom server URL and the specified model name.

---

### Requirement: Ollama model auto-detection

When the user selects Ollama as the provider, the system SHALL auto-detect installed models from the Ollama server and display them as a dropdown selector instead of a free-text input.

#### Scenario: Ollama models detected

WHEN the user selects Ollama as the provider and Ollama is running locally
THEN the system SHALL query the Ollama API (`/api/tags`) and display installed models in a dropdown selector.

#### Scenario: Ollama not running

WHEN the user selects Ollama but the Ollama server is not reachable
THEN the system SHALL fall back to a text input with a message "No models detected. Make sure Ollama is running, or type the model name manually."

#### Scenario: Custom Ollama URL triggers re-detection

WHEN the user modifies the Ollama Server URL field
THEN the system SHALL re-query for available models at the new URL and update the dropdown.

---

### Requirement: Select a model from the provider's available models

The system SHALL allow the user to select a specific model from the chosen provider's available models. The model selection MUST be required before saving the configuration.

#### Scenario: User selects a model for Anthropic

WHEN the user has selected Anthropic as the provider and entered a valid API key
THEN the system SHALL present a dropdown of available Anthropic models (e.g., Claude Sonnet, Claude Haiku)
AND the user SHALL select one model to use for AI operations.

#### Scenario: User attempts to save configuration without selecting a model

WHEN the user attempts to save the LLM configuration without selecting a model
THEN the system SHALL display a validation error indicating that a model must be selected
AND the system SHALL NOT save the configuration.

---

### Requirement: Validate configuration with a test API call

The system SHALL provide a "Test Connection" button that validates the LLM configuration by making a test API call to the selected provider. The system MUST display the result of the test.

#### Scenario: Test connection succeeds

WHEN the user clicks "Test Connection" and the API call to the configured provider succeeds
THEN the system SHALL display a success message confirming the connection is valid
AND the system SHALL show the response model name and latency.

#### Scenario: Test connection fails due to invalid API key

WHEN the user clicks "Test Connection" and the API call fails due to an invalid or expired API key
THEN the system SHALL display an error message indicating authentication failure
AND the system SHALL NOT save the configuration automatically.

#### Scenario: Test connection fails due to unreachable Ollama server

WHEN the user clicks "Test Connection" for an Ollama configuration and the server URL is unreachable
THEN the system SHALL display an error message indicating the server could not be reached
AND the error message SHALL include the attempted server URL.

---

### Requirement: API keys are stored encrypted

The system SHALL store API keys encrypted using AES-256-GCM in the database. The encryption key MUST be sourced from a server-side environment variable.

#### Scenario: API key is encrypted before storage

WHEN the user saves an LLM configuration with an API key
THEN the system SHALL encrypt the API key using AES-256-GCM before writing it to the database
AND the plaintext API key SHALL NOT be stored in the database.

#### Scenario: API key is decrypted for use

WHEN the system needs to make an API call using the stored LLM configuration
THEN the system SHALL decrypt the API key from the database at runtime using the server-side encryption key
AND the decrypted key SHALL only exist in memory during the API call.

---

### Requirement: LLM configuration is global with future per-project override

The LLM configuration SHALL be global, applying to all projects by default. The system MUST support future extension to per-project overrides without schema changes.

#### Scenario: User configures LLM settings and uses multiple projects

WHEN the user saves an LLM configuration on the settings page and then works across multiple projects
THEN all projects SHALL use the same LLM provider and configuration
AND no per-project LLM override options SHALL be displayed in the current version.

---

### Requirement: Display active provider in the UI

The system SHALL display the currently active LLM provider name in the application UI so the user always knows which provider is in use.

#### Scenario: Active provider is shown in the header

WHEN the user has a configured and validated LLM provider
THEN the application header or navigation SHALL display the name of the active provider (e.g., "Anthropic" or "Ollama").

#### Scenario: No provider is configured

WHEN no LLM provider has been configured
THEN the system SHALL display a warning indicator in the header prompting the user to configure an LLM provider
AND AI-dependent features SHALL be disabled until a provider is configured.
