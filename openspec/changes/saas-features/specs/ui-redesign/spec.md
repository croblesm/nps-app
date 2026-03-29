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
- **THEN** the application uses a near-black neutral background (`hsl(0 0% 3.9%)`) with light text, blue primary accents, and neutral gray surfaces for cards/borders/muted elements. Cards use `hsl(0 0% 5.5%)` with `ring-1 ring-foreground/10` borders for subtle depth.

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

### Requirement: Collapsible sidebar layout with minimal top bar
The application SHALL use a collapsible left sidebar for navigation (replacing the previous top-nav + horizontal tabs). The sidebar uses the shadcn/ui Sidebar component with icon+text navigation items, user info at the bottom, and AI assistant access. A minimal top bar provides sidebar toggle, breadcrumb, LLM status, and theme toggle.

#### Scenario: Sidebar on project pages
- **WHEN** the user opens any project page
- **THEN** a left sidebar SHALL display with navigation items: Dashboard, Data (upload+structure), Categories, Noise Filters, Summary, GitHub — each with a Lucide icon
- **AND** the active page SHALL be highlighted in the sidebar
- **AND** the sidebar header SHALL show the project name

#### Scenario: Sidebar on home/global pages
- **WHEN** the user is on the projects list, settings, or admin page
- **THEN** the sidebar SHALL show "NPS Insight Engine" branding with links to Projects and Settings

#### Scenario: Sidebar collapse
- **WHEN** the user clicks the sidebar toggle in the top bar
- **THEN** the sidebar SHALL collapse to icon-only mode (showing only navigation icons)
- **AND** expanding the sidebar SHALL restore full icon+text labels
- **AND** the collapsed/expanded state SHALL persist across page navigations (via cookie)

#### Scenario: Mobile sidebar
- **WHEN** the user is on a mobile viewport
- **THEN** the sidebar SHALL render as a Sheet (slide-over overlay) triggered by the sidebar toggle button

#### Scenario: User info in sidebar footer
- **WHEN** the sidebar renders
- **THEN** the footer SHALL show the user's avatar, name, and email with a dropdown containing "Account Settings" and "Sign Out" options

#### Scenario: Minimal top bar
- **WHEN** any page renders
- **THEN** a minimal h-12 top bar SHALL display with: sidebar toggle (left), breadcrumb navigation (center-left), LLM status badge + theme toggle (right)

#### Scenario: Data tab groups upload and structure
- **WHEN** the user is on either the upload or structure page
- **THEN** the "Data" sidebar item SHALL be highlighted as active

---

### Requirement: Upload page shows data status
The upload page SHALL clearly indicate when data has already been uploaded, instead of always showing the empty upload zone.

#### Scenario: Data already uploaded
- **WHEN** the user navigates to the Data page and comments already exist for the project
- **THEN** the page SHALL show a success card with file info (row count, column count) and a "Replace Data" button
- **AND** the upload zone SHALL be hidden unless the user clicks "Replace Data"

#### Scenario: No data uploaded
- **WHEN** the user navigates to the Data page and no comments exist
- **THEN** the page SHALL show the drag-and-drop upload zone as the primary action

---

### Requirement: Categories page with visible edit actions
The categories page SHALL make category editing discoverable without requiring hover interactions.

#### Scenario: Category rename is always visible
- **WHEN** the categories page renders discovered categories
- **THEN** each category card SHALL show a visible pencil/edit icon next to the category name (not hidden behind a hover state)

#### Scenario: Suggest More and AI Scan promoted to toolbar
- **WHEN** the categories page renders with existing categories
- **THEN** a toolbar row SHALL appear at the top with "Suggest More Categories" and "AI Scan" as prominent buttons
- **AND** the "Add Custom Category" action SHALL open a Dialog instead of inline form

---

### Requirement: Editable noise filters
Existing noise filters SHALL be editable after creation, not just deletable.

#### Scenario: User edits an existing noise filter
- **WHEN** the user clicks the edit icon on an existing noise filter
- **THEN** a Dialog SHALL open pre-populated with the filter's name, description, keywords, and exclude setting
- **AND** saving SHALL update the filter via a PATCH API call

#### Scenario: Match count displayed per filter
- **WHEN** the noise filters page renders existing filters
- **THEN** each filter SHALL display a badge showing how many comments match its keywords

---

### Requirement: Summary page with NPS visual cards
The summary page SHALL display visual NPS breakdown cards (charts) above the AI-generated markdown report.

#### Scenario: NPS visual cards render
- **WHEN** the summary page loads and NPS stats are available
- **THEN** a row of visual cards SHALL display above the markdown, including a donut/pie chart showing promoter/passive/detractor distribution using recharts

---

### Requirement: GitHub page with tabbed layout
The GitHub page SHALL use tabs to separate configuration from issue tracking.

#### Scenario: GitHub tabs
- **WHEN** the user navigates to the GitHub page
- **THEN** two tabs SHALL be displayed: "Configuration" and "Created Issues"
- **AND** the "Created Issues" tab label SHALL include a badge showing the issue count
- **AND** default tab SHALL be "Configuration" if no config exists, "Created Issues" if config exists and issues > 0

---

### Requirement: Dashboard data visualization charts
The dashboard SHALL include data visualization charts for NPS distribution and category breakdown using recharts.

#### Scenario: NPS distribution donut chart
- **WHEN** the dashboard renders with NPS stats
- **THEN** a donut/pie chart SHALL display showing promoter/passive/detractor segments with the NPS score in the center

#### Scenario: Category breakdown bar chart
- **WHEN** the dashboard renders with category breakdown data
- **THEN** a horizontal bar chart SHALL display showing comment count per category
- **AND** clicking a bar SHALL filter the dashboard by that category

---

### Requirement: Toast notifications for user feedback
The application SHALL use shadcn/ui Toast/Sonner for success, error, and info notifications instead of inline text messages.

#### Scenario: Save success
- **WHEN** the user successfully saves settings, categories, or noise filters
- **THEN** a toast notification SHALL appear briefly confirming the action

#### Scenario: Error notification
- **WHEN** an API call fails
- **THEN** a toast notification SHALL appear with the error message in red/destructive styling

---

### Requirement: Design system consistency — no hardcoded colors

All component and page files SHALL use CSS variable-based color classes exclusively. No hardcoded Tailwind color classes (`gray-200`, `blue-600`, `green-500`, etc.) are allowed in `.tsx` files. Colors MUST reference the design system tokens (`text-foreground`, `bg-card`, `bg-muted`, `border-border`, `bg-primary`, `text-destructive`, etc.).

#### Scenario: NPS domain colors as CSS custom properties
- **WHEN** NPS score indicators render (promoter/passive/detractor badges, score cards)
- **THEN** they SHALL use CSS custom properties (`--nps-promoter`, `--nps-passive`, `--nps-detractor`, `--nps-excellent`) defined in globals.css that adapt to light/dark mode

#### Scenario: Raw HTML replaced with shadcn/ui components
- **WHEN** any page renders form inputs, selects, checkboxes, buttons, or tables
- **THEN** they SHALL use the corresponding shadcn/ui component (Input, Select, Checkbox, Button, Table) instead of raw HTML with hardcoded styles

#### Scenario: Status and alert banners use semantic tokens
- **WHEN** informational banners render (loading, warning, error, partial status)
- **THEN** they SHALL use `bg-muted border-border text-muted-foreground` for informational, `bg-destructive/10 text-destructive` for errors, and `bg-primary text-primary-foreground` for active progress
