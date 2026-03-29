## ADDED Requirements

### Requirement: Migrate to shadcn/ui component library
The application SHALL use shadcn/ui as the component library for all UI elements, providing consistent, accessible, and polished components across all pages.

#### Scenario: shadcn/ui initialization
- **WHEN** the project is set up
- **THEN** shadcn/ui SHALL be initialized with the Next.js App Router configuration, Tailwind CSS 4, and the "new-york" style variant

#### Scenario: Component consistency
- **WHEN** any page renders UI elements (buttons, cards, inputs, dialogs, dropdowns, badges, tabs, progress bars)
- **THEN** they SHALL use shadcn/ui components instead of raw HTML/Tailwind

---

### Requirement: Lucide icons throughout the application
The application SHALL use Lucide React icons for all iconography, replacing text-only labels with icon+text combinations.

#### Scenario: Navigation icons
- **WHEN** the project sidebar renders
- **THEN** each step (Upload, Structure, Categories, Dashboard, Noise, Summary) SHALL have a corresponding Lucide icon

#### Scenario: Action button icons
- **WHEN** action buttons render (New Project, Export, Delete, Settings, etc.)
- **THEN** they SHALL include a Lucide icon alongside the text label

---

### Requirement: Light and dark mode with proper color palette
The application SHALL support both light and dark modes with a cohesive color palette that looks professional in both themes.

#### Scenario: Theme toggle
- **WHEN** the user clicks a theme toggle in the header
- **THEN** the application switches between light and dark mode, persisting the preference

#### Scenario: Light mode appearance
- **WHEN** light mode is active
- **THEN** the application uses a white/gray background with dark text, blue accents, and colored badges that are readable on light backgrounds

#### Scenario: Dark mode appearance
- **WHEN** dark mode is active
- **THEN** the application uses a deep blue-gray background (not pure black) with light text, blue primary accents, and colored badges that are readable on dark backgrounds. The dark theme SHALL use HSL-based blue-tinted grays for cards, borders, and muted elements to avoid the flat black appearance.

---

### Requirement: Polished card-based layouts
All data display areas SHALL use shadcn/ui Card components with consistent padding, borders, hover effects, and shadow treatments.

#### Scenario: Dashboard score cards
- **WHEN** the dashboard renders NPS score cards
- **THEN** they SHALL use shadcn/ui Card components with proper border radius, shadow, and hover transitions

#### Scenario: Category cards with sentiment badges
- **WHEN** category breakdown cards render
- **THEN** each card SHALL display the category name, count, percentage, and a colored Badge component for the sentiment type

#### Scenario: Comment cards
- **WHEN** individual feedback items are displayed
- **THEN** they SHALL render as cards with title, source info, sentiment badge, category badge, and expandable content

---

### Requirement: Modern form elements
All forms SHALL use shadcn/ui form components (Input, Textarea, Select, Checkbox, Label) with proper focus states, validation styling, and accessibility.

#### Scenario: Noise filter keyword input
- **WHEN** the user manages noise filter keywords
- **THEN** keywords SHALL display as removable pill/badge components (similar to tag inputs) instead of comma-separated text

#### Scenario: Settings form
- **WHEN** the LLM settings form renders
- **THEN** all fields SHALL use shadcn/ui Input, Select, and Checkbox components with Labels

---

### Requirement: Proper modal dialogs
All confirmation prompts and detail views SHALL use shadcn/ui Dialog components instead of browser `confirm()` or `alert()`.

#### Scenario: Delete confirmation
- **WHEN** the user clicks delete on a project or noise filter
- **THEN** a shadcn/ui AlertDialog SHALL appear with a title, description, Cancel and Confirm buttons

#### Scenario: Progress modal for AI operations
- **WHEN** an AI operation is in progress (embedding, classification, discovery)
- **THEN** a Dialog SHALL display with an animated progress bar, descriptive text, and a Cancel button

---

### Requirement: Top-nav + tabs layout instead of sidebar
The project layout SHALL use a full-width top navigation with horizontal tabs instead of a vertical sidebar. The layout follows the GitHub Spark app pattern: project title bar at top, horizontal tabs below, full-width content area.

#### Scenario: No sidebar visible
- **WHEN** the user opens any project page
- **THEN** there SHALL be no vertical sidebar. Content uses the full width of the viewport (max-w-7xl centered).

#### Scenario: Project title bar
- **WHEN** the user is on a project page
- **THEN** the project name SHALL be displayed prominently (text-2xl bold) with description below it, and a "← All Projects" back link above it.

#### Scenario: Horizontal tab navigation
- **WHEN** the user navigates between project pages
- **THEN** horizontal tabs with icons SHALL be displayed: Dashboard, Data (upload+structure), Categories, Noise Filters, Summary. The active tab SHALL have a primary-colored bottom border underline.

#### Scenario: Data tab groups upload and structure
- **WHEN** the user is on either the upload or structure page
- **THEN** the "Data" tab SHALL be highlighted as active.

---

### Requirement: Toast notifications for user feedback
The application SHALL use shadcn/ui Toast/Sonner for success, error, and info notifications instead of inline text messages.

#### Scenario: Save success
- **WHEN** the user successfully saves settings, categories, or noise filters
- **THEN** a toast notification SHALL appear briefly confirming the action

#### Scenario: Error notification
- **WHEN** an API call fails
- **THEN** a toast notification SHALL appear with the error message in red/destructive styling
