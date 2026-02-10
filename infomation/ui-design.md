# Legal AI Platform – UI Design Guidelines

These instructions define how the UI should look, feel, and be implemented. Treat this as the source of truth for all React + Ant Design frontend work.

---

## 1. Design Principles

- Target users are mostly non-technical, older legal professionals. The interface must be calm, obvious, and predictable.
- Prioritize clarity over “fancy”. Keep actions explicit, labels clear, and flows short.
- Use Ant Design components wherever possible instead of custom ones.
- Avoid visual noise: fewer borders, fewer lines, fewer colors, more whitespace.
- No overly rounded corners. Prefer straight or very subtle corners only.

### Core UX Rules

- Everything important must be visible, not hidden behind hover-only or icon-only UI.
- One primary action per screen. Secondary actions must be visually weaker.
- Keep navigation shallow. Avoid more than 2–3 levels deep.
- Minimize required typing. Prefer selects, date pickers, and pre-filled defaults.

---

## 2. Visual Language

### Color Palette

Use one main neutral theme that feels premium and low-strain, not playful or childish.

**Base (Light Theme – default):**

- Background main: `#F5F5F7`
- Surface / cards: `#FFFFFF`
- Primary text: `#1F2933`
- Secondary text: `#6B7280`
- Divider subtle: `#E5E7EB`

**Accent:**

- Primary accent: `#2563EB` (buttons, main links)
- Accent hover: `#1D4ED8`
- Destructive: `#DC2626`
- Destructive hover: `#B91C1C`

**Status:**

- Success: `#16A34A`
- Warning: `#D97706`
- Info: `#0284C7`
- Disabled: `#9CA3AF`

Rules:

- Avoid pure black `#000000` on pure white `#FFFFFF` for large areas.
- Do not use saturated neon colors or gradients.
- Use accent color sparingly: primary buttons, key links, active states.

### Dark Theme (Optional, later)

- Background main: near `#0B1120`
- Surface: around `#111827`
- Text: `#E5E7EB`
- Use same accent colors but slightly desaturated.

### Typography

- Use system font stack or a serious sans-serif (e.g., Inter, SF Pro, Segoe).
- Base font size: `14px` minimum, prefer `15–16px` for reading-heavy pages.
- Headers:
  - H1: 24–28px, medium weight
  - H2: 20–22px, medium
  - H3: 18px, medium
- Body: 14–16px, regular.
- Line height: 1.5–1.6 for body text.

Rules:

- No playful or script fonts.
- Do not use more than two font weights on a screen (regular + medium/bold).
- Use uppercase very rarely; prefer sentence case everywhere.

### Spacing & Layout

- Use an 8px spacing grid.
- Standard padding:
  - Page container: 24px
  - Card content: 16–24px
  - Table cells: 12–16px
- Avoid cramming; leave breathing room around sections.

### Corners & Shapes

- Global border radius:
  - Cards: `4px`
  - Buttons: `4px`
  - Inputs: `4px`
- No pills, no big rounded corners (no `8px+` radii).
- Tables and modals can be `2px–4px` radius or even square.

---

## 3. Layout & Navigation

### Overall Layout

Use Ant Design `Layout` as the base.

- Left sidebar navigation:
  - Fixed, collapsible.
  - Width: ~240px expanded, ~80px collapsed.
  - Icons + labels when expanded; icons only when collapsed with clear tooltips.
- Top header:
  - Contains global search, notifications, user avatar, firm name / logo.
- Main content:
  - Centered column, max width around `1200–1440px` where appropriate.
  - Use breadcrumbs at the top of each main screen.

### Navigation Structure

Sidebar sections (in this order):

1. Dashboard
2. Cases
3. Clients
4. Documents
5. Research
6. Calendar
7. Billing
8. Reports
9. Compliance
10. Settings

Rules:

- Always highlight current section in the sidebar.
- Breadcrumb pattern: `Dashboard / Cases / [Case Name]`.
- Avoid complex nested menus; at most one level of nesting in sidebar.

### Responsiveness

- Desktop-first design (most users are on desktop/laptop).
- Tablet: collapse sidebar, keep header and main content readable.
- Mobile: full-height drawer for sidebar, simplified lists and actions.

---

## 4. Components Usage (Ant Design)

### Buttons

- Use `primary` button for the main action on a screen.
- Use `default` or `text` for secondary actions.
- Use `danger` only for destructive actions (delete, remove, close case).

Patterns:

- Place primary action on the right side in toolbars and modals.
- Button sizes: default. Use large only for very important CTAs on landing-like screens.
- No icon-only buttons for critical actions; always pair icon + label.

### Inputs & Forms

- Use Ant Design `Form`, `Input`, `Select`, `DatePicker`, `TimePicker`, `Upload`.
- Labels are always visible, never placeholder-only.
- Help text can appear under fields, not as tooltips only.
- Validation:
  - Show error messages inline under the field.
  - Avoid showing multiple modals for form errors.

Form layout:

- Use vertical layout for most forms (label on top, input below).
- For long forms, split into sections with clear headings.
- Use stepper/wizard only for truly multi-step operations (e.g., case creation).

### Tables & Lists

- Use `Table` for all structured lists (cases, clients, documents, invoices).
- Features:
  - Sorting on key columns (date, status, name).
  - Column filters for status, type, date range.
  - Pagination at the bottom (page size selector).
- Row height: comfortable (48–56px) so clicks are easy for older users.
- Avoid zebra stripes unless necessary; prefer subtle separators.

Row actions:

- Prefer a rightmost “Actions” column with clearly labeled buttons.
- For crowded actions, use a single “More” button with a dropdown menu.

### Cards & Panels

- Use cards for dashboard summaries, detail side panels, and smaller groupings.
- Card content should be simple: title, main metric/value, optional trend.

### Modals & Drawers

- Use modals for confirmations and short forms.
- Use right-side drawers for editing existing entities without leaving context (e.g., editing client details while viewing a case).
- Always include:
  - Title
  - Clear primary button (Save/Confirm)
  - Clear secondary (Cancel/Close)

### Feedback Components

- Use `message` or `notification` for global feedback:
  - `success` after save/submit.
  - `error` for failures with clear explanation.
  - `warning` for potential issues.
- Use skeletons for loading lists and key content areas.

---

## 5. Accessibility & Older Users

- Minimum tap/click target: 40px height.
- Font sizes: do not go below `14px`. Prefer `15–16px` for key content.
- Contrast: ensure text and icons are clearly readable on background surfaces.
- Avoid hidden gestures or complex interactions.
- Never rely on color alone to communicate status; always include text or icons.

Text & language:

- Use clear, non-technical wording. For example: “Create Case”, “View Client”, “Upload Document”.
- Avoid abbreviations unless they are common legal terms.

---

## 6. Screen Patterns

### 6.1 Dashboard

Purpose: High-level overview for daily work.

Layout:

- Top: greeting + date + quick actions (Create Case, Add Client, Upload Document, Schedule Event).
- Left column:
  - Cards: Active cases, open tasks, upcoming deadlines, unpaid invoices.
- Right column:
  - Calendar preview (next 7–14 days).
  - Recent activity list (case updates, uploaded documents).

Rules:

- Use charts sparingly. Prefer simple bar/line charts for trends and avoid clutter.
- Do not overload the dashboard; show only the most important 6–8 items.

### 6.2 Case List

- Page header: “Cases” + primary button “New Case”.
- Toolbar:
  - Search input (by case name, client).
  - Filters: status, practice area, attorney, date range.
- Table columns:
  - Case name (link)
  - Client
  - Status
  - Lead attorney
  - Next hearing / key date
  - Last updated
  - Actions

Row click:

- Clicking case name navigates to case details.
- Do not mix row-click + action buttons that cause confusion.

### 6.3 Case Detail

Two-column layout:

- Left/main:
  - Header: case name, client, status pill, edit button.
  - Tabs: Overview, Timeline, Tasks, Documents, Billing, Notes.
- Right sidebar:
  - Key info (attorney, client contacts, important dates).
  - Quick links (open in calendar, email client, upload doc).

Overview tab:

- Show:
  - Summary / description
  - Upcoming events
  - Open tasks
  - Recent documents

Timeline tab:

- Vertical list of events with timestamps and icons.

### 6.4 Client List & Detail

Similar to Cases:

- Client List:
  - Search by name / company.
  - Columns: Name, type (individual/company), primary contact, active matters, last interaction.
- Client Detail:
  - Contact info, communication history, related cases, documents.

### 6.5 Documents

- Toolbar:
  - Upload button (primary)
  - Search, filters (type, date, tag, related case).
- Table:
  - Name
  - Type
  - Case / client
  - Uploaded by
  - Uploaded on
  - Status (e.g., analyzed/not analyzed)
  - Actions (view, download, analyze)

---

## 7. Implementation Conventions

### Technology Stack

- React + TypeScript.
- Ant Design as UI component library.
- Axios for HTTP.
- React Context + hooks for global state (auth, user, theme, layout).

### Project Structure (Frontend)

Example high-level structure:

- `src/`
  - `api/` – Axios instance, API modules per domain (cases, clients, auth, etc.).
  - `components/` – Reusable UI components (Button, PageHeader, Layout, Form components, Table wrappers).
  - `modules/` – Feature-specific UIs (dashboard, cases, clients, documents, billing, calendar, settings).
  - `contexts/` – React Contexts (AuthContext, ThemeContext, LayoutContext).
  - `hooks/` – Reusable hooks (useAuth, useApi, usePagination, useQueryParams).
  - `routes/` – Route definitions and layout wrappers.
  - `theme/` – Ant Design theme config, color tokens.
  - `utils/` – Helpers (formatters, validators).
  - `types/` – Shared TypeScript types and interfaces.

### Axios Instance (Middle API Layer)

- Create a single Axios instance with:
  - Base URL from environment config.
  - Request interceptors for auth token.
  - Response interceptors for error handling and refresh token logic.
- Expose domain-level API modules that wrap Axios calls:
  - Example: `casesApi.getCases(params)`, `casesApi.createCase(payload)`.
- Components must not call Axios directly; they call these domain APIs.

### Context & State

- AuthContext:
  - Holds user info, tokens, roles/permissions, login/logout methods.
- ThemeContext:
  - Current theme (light/dark), theme toggler.
- LayoutContext:
  - Sidebar collapsed state, global loading flags.

Rules:

- Use React Query or similar for server state (lists, details, caching).
- Use Context only for global app state, not for every feature-specific detail.
- Prefer custom hooks (`useCases`, `useClients`, etc.) that encapsulate API + transformations.

### Code Style

- TypeScript strict mode.
- No inline `any`.
- Prefer function components and hooks.
- No unnecessary comments; code should be self-explanatory.
- Keep components small and focused; extract subcomponents when JSX grows too large.

Patterns:

- One screen = container component in `modules/` using shared components from `components/`.
- Shared page layout wrapper (e.g., `AppLayout`) handles sidebar, header, and content padding.
- Use a unified `PageHeader` component across all pages for title, breadcrumb, and actions.

---

## 8. Performance & UX Details

- Use lazy-loading for heavy modules (documents, analytics).
- Debounce search inputs.
- Cache frequently used lists (cases, clients) to avoid unnecessary refetches.
- Show skeletons or spinners instead of blank states during loading.

Animations:

- Keep animations subtle and fast (150–200ms).
- Do not use bouncing, overshooting, or playful effects.

---

## 9. Quality Checklist (Per Screen)

Before a screen is “done”:

- [ ] Uses Ant Design components and theme tokens.
- [ ] Primary action clearly visible and named.
- [ ] All text is readable and large enough.
- [ ] Keyboard navigation works for main flows.
- [ ] Error messages are helpful, not technical.
- [ ] No unnecessary icons, lines, or borders.
- [ ] Fits the chosen color palette and spacing rules.
- [ ] Works on at least desktop and tablet widths.

