# Legal AI Platform – Implementation Plan

> Complete step-by-step build plan derived from `index.md`, `features.md`, `tech.md`, and `ui-design.md`.

---

## Phase 0: Project Scaffolding & Infrastructure

### Step 0.1 – Initialize Next.js Monorepo
- Create Next.js 15+ app with TypeScript in `/app` directory.
- Configure `tsconfig.json` with strict mode.
- Install core dependencies:
  - `antd` (Ant Design)
  - `@ant-design/icons`
  - `tailwindcss` (optional utility classes)
  - `@tanstack/react-query` (TanStack Query)
  - `axios`
  - `dayjs` (date library for Ant Design)
  - `recharts` (charts)
  - `zustand` (lightweight state if needed beyond context)
- Setup path aliases (`@/` → `src/`).

### Step 0.2 – Docker Compose Infrastructure
- Create `docker-compose.yml` with services:
  - `web` – Next.js app (port 3000)
  - `postgres` – PostgreSQL 15 (port 5432)
  - `redis` – Redis 7 (port 6379)
  - `qdrant` – Qdrant vector DB (port 6333)
  - `minio` – MinIO S3 storage (port 9000/9001)
- Create `.env` and `.env.docker` environment files.
- Create `Dockerfile` for the web app (multi-stage build).

### Step 0.3 – Database Schema (Prisma)
- Install Prisma, initialize with PostgreSQL.
- Define schema models:
  - `Firm` (multi-tenancy root)
  - `User` (with roles, firm_id)
  - `Role` / `Permission`
  - `Case` (with status enum, firm_id)
  - `Client` (individual/company, firm_id)
  - `Document` (metadata, file refs, firm_id)
  - `Task` (linked to cases)
  - `Event` / `CalendarEvent`
  - `TimeEntry` (billing)
  - `Invoice` / `InvoiceLineItem`
  - `Expense`
  - `Note`
  - `AuditLog`
  - `ComplianceItem`
  - `CaseTimeline` (adjacency table for events)
- Add indexes, relations, enums.
- Generate Prisma client.

### Step 0.4 – Environment & Config Files
- `.env.local` – local dev secrets (DB URL, JWT secret, API keys).
- `next.config.ts` – Next.js configuration.
- `.gitignore` – standard ignores.
- `prettier.config.js` / `.eslintrc.json` – code quality.

---

## Phase 1: Theme, Layout & Core Components

### Step 1.1 – Ant Design Theme Configuration
- Create `src/theme/themeConfig.ts`:
  - Primary color: `#2563EB`
  - Border radius: `4px`
  - Font family: Inter / system stack
  - Font size base: `14px`
  - Colors matching `ui-design.md` palette
- Create `src/theme/tokens.ts` for raw color/spacing tokens.
- Wrap app in `ConfigProvider` with theme.

### Step 1.2 – Global CSS & Tailwind Setup
- Configure `tailwind.config.ts` extending Ant Design tokens.
- Create `globals.css` with:
  - Background: `#F5F5F7`
  - Font imports (Inter)
  - Base resets

### Step 1.3 – App Layout Component
- Create `src/components/layout/AppLayout.tsx`:
  - Ant Design `Layout` with `Sider` + `Header` + `Content`.
  - **Sidebar** (240px expanded / 80px collapsed):
    - Logo/firm name at top.
    - Navigation items: Dashboard, Cases, Clients, Documents, Research, Calendar, Billing, Reports, Compliance, Settings.
    - Icons from `@ant-design/icons`.
    - Collapse toggle button.
    - Highlight active route.
  - **Header**:
    - Global search input (⌘K hint).
    - Notification bell icon.
    - User avatar + dropdown (profile, logout).
    - Firm name display.
  - **Content**: Breadcrumbs + padded content area (max-width 1440px).

### Step 1.4 – Shared UI Components
- `src/components/PageHeader.tsx` – Title, breadcrumb, action buttons.
- `src/components/StatusTag.tsx` – Colored status pills for cases/tasks.
- `src/components/StatCard.tsx` – Dashboard metric cards.
- `src/components/EmptyState.tsx` – Empty state placeholders.
- `src/components/LoadingSkeleton.tsx` – Skeleton loaders for tables/cards.
- `src/components/ConfirmModal.tsx` – Reusable delete/action confirmation.

---

## Phase 2: API Layer, Auth & State Management

### Step 2.1 – Axios Instance & API Modules
- Create `src/lib/api/client.ts`:
  - Base Axios instance with interceptors.
  - Request interceptor: attach auth cookies/tokens.
  - Response interceptor: handle 401 → redirect to login.
- Create domain API modules:
  - `src/lib/api/auth.ts` – login, logout, register, me.
  - `src/lib/api/cases.ts` – CRUD + filters.
  - `src/lib/api/clients.ts` – CRUD + search.
  - `src/lib/api/documents.ts` – upload, list, analyze.
  - `src/lib/api/billing.ts` – time entries, invoices.
  - `src/lib/api/calendar.ts` – events CRUD.
  - `src/lib/api/research.ts` – search, chat.
  - `src/lib/api/compliance.ts` – items, deadlines.
  - `src/lib/api/users.ts` – user management.
  - `src/lib/api/dashboard.ts` – metrics, activity.

### Step 2.2 – React Contexts
- `src/contexts/AuthContext.tsx`:
  - User info, firm, roles/permissions.
  - Login/logout methods.
  - `/me` endpoint on mount.
- `src/contexts/ThemeContext.tsx`:
  - Light/dark theme toggle.
  - Persist preference in localStorage.
- `src/contexts/LayoutContext.tsx`:
  - Sidebar collapsed state.
  - Global loading flags.

### Step 2.3 – Custom Hooks
- `src/hooks/useAuth.ts` – consume AuthContext.
- `src/hooks/useCases.ts` – React Query for cases.
- `src/hooks/useClients.ts` – React Query for clients.
- `src/hooks/useDocuments.ts` – React Query for documents.
- `src/hooks/useDashboard.ts` – React Query for dashboard data.
- `src/hooks/usePagination.ts` – table pagination state.
- `src/hooks/useDebounce.ts` – debounced search input.

### Step 2.4 – Auth Pages
- `app/login/page.tsx` – Login form (email + password).
- `app/register/page.tsx` – Registration form (name, email, password, firm name).
- `app/forgot-password/page.tsx` – Password reset request.
- Middleware: `middleware.ts` – protect routes, redirect unauthenticated users.

---

## Phase 3: Backend API Route Handlers

### Step 3.1 – Auth API
- `app/api/auth/login/route.ts` – POST login, set HTTP-only cookie.
- `app/api/auth/register/route.ts` – POST register user + firm.
- `app/api/auth/logout/route.ts` – POST clear cookie.
- `app/api/auth/me/route.ts` – GET current user.
- Helper: `src/server/auth.ts` – JWT sign/verify, password hash (bcrypt).

### Step 3.2 – Cases API
- `app/api/cases/route.ts` – GET list (with filters), POST create.
- `app/api/cases/[id]/route.ts` – GET detail, PUT update, DELETE.
- `app/api/cases/[id]/timeline/route.ts` – GET timeline events.
- `app/api/cases/[id]/tasks/route.ts` – GET/POST tasks.
- `app/api/cases/[id]/documents/route.ts` – GET linked documents.
- Service: `src/server/services/cases.ts`.

### Step 3.3 – Clients API
- `app/api/clients/route.ts` – GET list, POST create.
- `app/api/clients/[id]/route.ts` – GET detail, PUT, DELETE.
- `app/api/clients/[id]/cases/route.ts` – GET client's cases.
- Service: `src/server/services/clients.ts`.

### Step 3.4 – Documents API
- `app/api/documents/route.ts` – GET list, POST upload metadata.
- `app/api/documents/[id]/route.ts` – GET, PUT, DELETE.
- `app/api/documents/upload/route.ts` – POST file upload (to MinIO).
- Service: `src/server/services/documents.ts`.

### Step 3.5 – Other Domain APIs
- `app/api/billing/time-entries/route.ts` – CRUD.
- `app/api/billing/invoices/route.ts` – CRUD + generate.
- `app/api/calendar/events/route.ts` – CRUD.
- `app/api/compliance/route.ts` – CRUD.
- `app/api/research/route.ts` – POST query (calls RAG service).
- `app/api/dashboard/route.ts` – GET metrics.
- `app/api/users/route.ts` – CRUD (admin).
- `app/api/settings/route.ts` – GET/PUT firm settings.

---

## Phase 4: Frontend Modules (Pages)

### Step 4.1 – Dashboard Page
- Route: `app/(main)/dashboard/page.tsx`
- Layout:
  - Greeting + date + quick action buttons.
  - Row of StatCards: Active cases, open tasks, upcoming deadlines, clients.
  - Left: Case trend chart (Recharts bar chart), task completion.
  - Right: Calendar preview (next 7 days), recent activity feed.
- Data: `useDashboard` hook fetching `/api/dashboard`.

### Step 4.2 – Cases Module
- **Case List** – `app/(main)/cases/page.tsx`:
  - PageHeader: "Cases" + "New Case" button.
  - Search + filter toolbar (status, practice area, attorney, date).
  - Ant Design Table with columns: name, client, status, attorney, next date, updated, actions.
  - Pagination at bottom.
- **Case Detail** – `app/(main)/cases/[id]/page.tsx`:
  - Two-column layout.
  - Left: Header (name, status tag, edit) + Tabs (Overview, Timeline, Tasks, Documents, Billing, Notes).
  - Right sidebar: Key info card, quick actions.
- **Case Create** – Modal or `app/(main)/cases/new/page.tsx`:
  - Multi-step form: Basic info → Client → Details → Review.

### Step 4.3 – Clients Module
- **Client List** – `app/(main)/clients/page.tsx`:
  - PageHeader: "Clients" + "Add Client" button.
  - Search + filters.
  - Table: Name, type, contact, active matters, last interaction, actions.
- **Client Detail** – `app/(main)/clients/[id]/page.tsx`:
  - Contact info, tabs (Overview, Cases, Documents, Communication, Billing).

### Step 4.4 – Documents Module
- **Document List** – `app/(main)/documents/page.tsx`:
  - Upload button (primary), search, filters.
  - Table: Name, type, case/client, uploaded by, date, status, actions.
- Upload: Ant Design Upload component → MinIO via API.

### Step 4.5 – Research Module
- **Research Page** – `app/(main)/research/page.tsx`:
  - Search bar for legal research queries.
  - Chat-style interface for AI assistant.
  - Results panel with sources and citations.
  - Saved research list.

### Step 4.6 – Calendar Module
- **Calendar Page** – `app/(main)/calendar/page.tsx`:
  - Monthly/weekly/daily calendar view.
  - Event creation modal.
  - Event types: Hearing, Meeting, Deadline, Task.
  - Sidebar: Upcoming events list.

### Step 4.7 – Billing Module
- **Time Tracking** – `app/(main)/billing/page.tsx`:
  - Timer widget + manual entry form.
  - Time entries table with case/client association.
- **Invoices** – `app/(main)/billing/invoices/page.tsx`:
  - Invoice list, create, preview.

### Step 4.8 – Reports Module
- **Reports Page** – `app/(main)/reports/page.tsx`:
  - KPI cards.
  - Charts: Case analytics, financial, attorney performance.
  - Export buttons (PDF, CSV).

### Step 4.9 – Compliance Module
- **Compliance Page** – `app/(main)/compliance/page.tsx`:
  - Deadline tracker table.
  - Risk assessment cards.
  - Audit log viewer.

### Step 4.10 – Settings Module
- **Settings Page** – `app/(main)/settings/page.tsx`:
  - Tabs: Profile, Firm, Users, Roles, Integrations, Security.
  - User management table (add/edit/remove).
  - Firm branding settings.

---

## Phase 5: RAG Python Service

### Step 5.1 – FastAPI Service Setup
- Create `/rag-service/` directory.
- `main.py` – FastAPI app with CORS.
- `requirements.txt` – fastapi, uvicorn, qdrant-client, openai, langchain, pdfplumber, python-multipart.
- `Dockerfile` for the RAG service.

### Step 5.2 – Ingestion Pipeline
- `routers/ingest.py` – POST endpoint to ingest documents.
- `services/chunking.py` – Semantic-aware chunking:
  - Legal documents: preserve clauses/sections.
  - Case law: chunk by Facts, Issues, Holding, Reasoning.
  - General: paragraph-based with 700–1200 token chunks, 100–200 overlap.
- `services/embedding.py` – Generate embeddings (OpenAI `text-embedding-3-small`).
- `clients/qdrant_client.py` – Qdrant connection, upsert, search.

### Step 5.3 – RAG Query Pipeline
- `routers/query.py` – POST endpoint for research queries.
- `services/retrieval.py`:
  1. Classify query type.
  2. Build retrieval config (collections, filters, top_k).
  3. Retrieve from Qdrant with firm_id filter.
  4. Re-rank results.
  5. Build LLM prompt with citations.
  6. Return structured response.
- `clients/openai_client.py` – OpenAI API wrapper.
- `clients/gemini_client.py` – Gemini API wrapper.

### Step 5.4 – Specialized AI Endpoints
- `routers/analyze.py` – Document analysis (entity extraction, summarization).
- `routers/contract.py` – Contract review (risk identification).
- `services/prompts.py` – Legal domain system prompts.

---

## Phase 6: Integration & Polish

### Step 6.1 – Middleware & Security
- `middleware.ts` – Route protection, auth verification.
- RBAC enforcement in API routes.
- Rate limiting via Redis.
- CORS configuration.
- Input validation (Zod schemas).

### Step 6.2 – Multi-Tenancy Enforcement
- All DB queries scoped by `firm_id`.
- Qdrant queries filtered by `firm_id`.
- Service layer validation.

### Step 6.3 – Error Handling & Feedback
- Global error boundary component.
- API error response format standardization.
- Toast notifications for all user actions.
- Form validation with inline errors.

### Step 6.4 – Performance
- Lazy loading for heavy modules.
- React Query caching strategy.
- Debounced search inputs.
- Skeleton loaders for all list pages.
- Image/asset optimization via Next.js.

### Step 6.5 – Final Quality Checklist
- [ ] All pages use Ant Design + theme tokens.
- [ ] Primary action visible on every screen.
- [ ] Font sizes ≥ 14px everywhere.
- [ ] Keyboard navigation works.
- [ ] Error messages are user-friendly.
- [ ] Color palette matches `ui-design.md`.
- [ ] Responsive on desktop + tablet.
- [ ] Docker Compose starts all services.
- [ ] Prisma migrations run cleanly.
- [ ] Auth flow works end-to-end.

---

## File Tree Summary

```
/app/                          ← Next.js monorepo root
├── app/
│   ├── (main)/                ← Protected routes (with AppLayout)
│   │   ├── dashboard/
│   │   ├── cases/
│   │   ├── clients/
│   │   ├── documents/
│   │   ├── research/
│   │   ├── calendar/
│   │   ├── billing/
│   │   ├── reports/
│   │   ├── compliance/
│   │   └── settings/
│   ├── login/
│   ├── register/
│   ├── api/
│   │   ├── auth/
│   │   ├── cases/
│   │   ├── clients/
│   │   ├── documents/
│   │   ├── billing/
│   │   ├── calendar/
│   │   ├── compliance/
│   │   ├── research/
│   │   ├── dashboard/
│   │   ├── users/
│   │   └── settings/
│   ├── layout.tsx
│   └── middleware.ts
├── src/
│   ├── components/
│   │   ├── layout/
│   │   └── shared/
│   ├── lib/
│   │   └── api/
│   ├── contexts/
│   ├── hooks/
│   ├── server/
│   │   └── services/
│   ├── theme/
│   ├── types/
│   └── utils/
├── prisma/
│   └── schema.prisma
├── public/
├── docker-compose.yml
├── Dockerfile
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json

/rag-service/                  ← Python AI service
├── main.py
├── routers/
├── services/
├── clients/
├── models/
├── Dockerfile
└── requirements.txt

/infra/
├── nginx/
└── scripts/
```

---

## Execution Order

| # | Step | Dependencies |
|---|------|-------------|
| 1 | Initialize Next.js + install deps | None |
| 2 | Docker Compose + env files | None |
| 3 | Prisma schema + generate | PostgreSQL running |
| 4 | Theme config + global CSS | Next.js ready |
| 5 | AppLayout + sidebar + header | Theme ready |
| 6 | Shared components (PageHeader, StatCard, etc.) | Layout ready |
| 7 | Axios client + API modules | Next.js ready |
| 8 | Auth context + middleware + auth pages | API layer ready |
| 9 | Auth API routes (login, register, me) | Prisma ready |
| 10 | Dashboard page | Layout + auth ready |
| 11 | Dashboard API route | Prisma ready |
| 12 | Cases module (list + detail + create) | Layout + API ready |
| 13 | Cases API routes | Prisma ready |
| 14 | Clients module | Layout + API ready |
| 15 | Clients API routes | Prisma ready |
| 16 | Documents module | Layout + API ready |
| 17 | Documents API routes + MinIO | Prisma + MinIO ready |
| 18 | Research module | Layout ready |
| 19 | Calendar module | Layout + API ready |
| 20 | Billing module | Layout + API ready |
| 21 | Reports module | Layout + API ready |
| 22 | Compliance module | Layout + API ready |
| 23 | Settings module | Layout + API ready |
| 24 | Remaining API routes | Prisma ready |
| 25 | RAG service (Python) | Qdrant + OpenAI keys |
| 26 | Integration + polish | All modules ready |
