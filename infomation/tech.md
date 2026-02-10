# Legal AI Platform – Tech Stack Specification

Goal: Single, coherent stack that Cursor can implement quickly, is production-ready, cost-efficient, and works well with Docker Compose, vector search, and strong RAG.

---

## 1. High-Level Architecture

- Monorepo with:
  - Web app (Next.js)
  - API (Next.js route handlers / server actions)
  - Background worker (Node script or separate service)
  - Python AI/RAG service
- Shared Docker Compose environment for local + production-like setup.
- Core storage:
  - PostgreSQL for all relational data.
  - Redis for cache, sessions, queues.
  - Qdrant for vector search.
- Optionally emulate graph-like relations using PostgreSQL schemas and adjacency tables, instead of a dedicated graph DB (to keep cost and complexity low).

---

## 2. Frontend

### Framework

- **Next.js 15+ (React 18 + TypeScript)**  
  - File-based routing for pages.
  - Server components where helpful.
  - Route handlers for simple APIs if needed.
  - Built-in asset handling and optimizations.[web:21]

### UI

- Ant Design (React) as primary UI library.
- Tailwind CSS optional for utility classes (spacing/layout), but keep Ant Design theming as the main source of truth.
- Use your existing `ui-design.md` rules as the authority for UX and styling.

### Frontend Patterns

- Use React Query (TanStack Query) for server data where client caching is needed.
- Use a single Axios instance (or Fetch wrapper) for calls to the backend API.
- Auth:
  - Use HTTP-only cookies (JWT or session) managed by API.
  - Frontend reads auth state via `/me` endpoint.

---

## 3. Backend (Core App)

### Runtime

- **Next.js API routes / route handlers** for:
  - Auth
  - Cases
  - Clients
  - Documents (metadata)
  - Billing and calendar endpoints
- Language:
  - TypeScript
- Framework:
  - Native Next.js route handlers (no extra Express layer unless absolutely necessary for complexity).

Reason: Fewer moving parts, easier for Cursor to maintain, deploy, and scale as one app.[web:21]

### Business Logic

- Organize backend logic in `app/(api)/…` or `src/server/…` directories.
- Domain modules:
  - `cases`
  - `clients`
  - `documents`
  - `research`
  - `billing`
  - `calendar`
  - `compliance`
  - `users` / `auth`
- Use a service layer per domain (e.g., `CasesService`) that encapsulates DB calls + validations.

---

## 4. Databases and Storage

### Primary DB: PostgreSQL

- Version: PostgreSQL 15+
- ORM: Prisma or Drizzle (recommended: **Prisma** for easier schema evolution).
- Use Postgres for:
  - Users, roles, permissions
  - Firms and multi-tenancy
  - Cases, clients, tasks, events, billing, compliance records
  - Document metadata and links to file storage and vector IDs

Graph-style features:

- Model relationships in Postgres with:
  - Join tables (many-to-many).
  - Foreign keys with proper indexes.
  - Adjacency tables for timelines and relationships (e.g., case-event graph).
- Only introduce a specialized graph DB later if truly necessary.

### Cache & Queue: Redis

- Version: Redis 7+
- Use Redis for:
  - Caching frequently-read data (dashboards, user preferences).
  - Rate limiting.
  - Background job queues (BullMQ or custom minimal queue).
  - Short-lived tokens (email verification, password reset).

### Vector DB: Qdrant

- Vector database: **Qdrant** (self-hosted in Docker) for embeddings and similarity search.[web:16][web:20]
  - REST or gRPC API.
  - Supports metadata filtering and high-performance similarity search.
- Collections:
  - `documents` (chunks)
  - `cases_research`
  - `knowledge_base`
- Store in Qdrant:
  - Embedding vectors.
  - Metadata: case ID, document ID, type, jurisdiction, date, tags.
- Store Qdrant IDs in PostgreSQL as references.

Reason: Open source, good performance, easy Docker deployment, cost-effective vs managed services.[web:16][web:26]

### File Storage

- For local/dev: MinIO (S3-compatible) via Docker.
- For production: S3-compatible storage (AWS S3/B2/Wasabi, etc.) using the same S3 SDK.
- Store:
  - Original documents (PDF, DOCX, images).
  - AI artifacts (e.g., generated memos) if needed.

---

## 5. AI & RAG Layer

### Separate Python Service

- Service: `rag-service` (Python + FastAPI).
- Responsibilities:
  - Ingestion pipeline (chunking + embedding).
  - RAG query pipeline (retrieve + rank + build prompt).
  - Specialized AI tasks (contract analysis, citation checking, summarization).
- Communicates with:
  - Qdrant (vector store).
  - Postgres (optional, for additional metadata).
  - OpenAI / Gemini APIs.

### LLM Providers

- **OpenAI**:
  - Use GPT-5 mini or GPT-4o-like models for most reasoning and drafting to balance cost and quality.[web:22]
  - Use cheaper embedding models (e.g., `text-embedding-3-small`).
- **Gemini**:
  - Use Gemini Flash/Pro for:
    - Vision-related tasks (scanned documents, complex images).
    - Large-context reading when needed (long PDFs, 2M token contexts).[web:22]
  - Use cost-effective model (e.g., Gemini 2.5 Flash) for bulk analysis where possible.[web:22][web:28]

Cost controls:

- Implement per-firm and per-user quotas.
- Store embeddings locally (Qdrant) so you don’t re-embed unchanged content.
- Cache LLM outputs for idempotent tasks (e.g., static document summaries).

### Chunking (World-Class)

Chunking strategy (implemented in Python):

- Use recursive, semantic-aware chunking:
  - Respect headings (H1–H4), sections, paragraphs.
  - Prefer chunk sizes around 700–1200 tokens with overlap (100–200 tokens).
- Different chunking profiles:
  - Legal documents: preserve clauses and numbered sections as intact as possible.
  - Case law: chunk by section (Facts, Issues, Holding, Reasoning).
  - Emails / small docs: simple paragraph chunks.
- Store:
  - Chunk text.
  - Original document ID.
  - Position index, section/heading references.
- Use pre-processing:
  - Normalize whitespace, remove boilerplate where safe.
  - Extract structure from PDF/DOCX (e.g., using Unstructured / pdfplumber).

RAG query flow:

1. Classify query type (research, case-specific, document QA, compliance).
2. Build a structured retrieval config (which collections, filters, top_k).
3. Retrieve from Qdrant with metadata filters (firm, user permissions, case ID).
4. Re-rank if needed (simple reranker or LLM-assisted).
5. Build prompts with:
   - Clear system prompt for legal domain.
   - Explicit instructions for citation formatting.
6. Enforce maximum token budget for context (to control cost and latency).

---

## 6. Docker & Docker Compose

### Docker Compose Services

`docker-compose.yml` (baseline idea):

- `web` – Next.js app (frontend + API).
- `rag-service` – Python FastAPI RAG/AI service.
- `postgres` – PostgreSQL.
- `redis` – Redis.
- `qdrant` – Qdrant vector DB.
- `minio` – MinIO for dev file storage.
- `nginx` (optional for production) – reverse proxy for TLS and routing.

Development:

- Mount local code into `web` and `rag-service` containers for hot reload.
- Use environment files (`.env.local`, `.env.docker`) to configure DB and API keys.

Production:

- Use multi-stage Docker builds for `web` and `rag-service` to keep images small.[web:21][web:24]
- Separate production `docker-compose.prod.yml` or move to orchestrator (Kubernetes) later.
- Nginx or Traefik for SSL termination and routing.

---

## 7. Security & Multi-Tenancy (App Layer)

- Multi-tenant: single database, firm_id column on all relevant tables (users, cases, documents).
- All queries must be scoped by firm_id (enforced in service layer).
- Auth:
  - JWT or session ID stored in HTTP-only cookies.
  - Firm association determined at login.
- API gateway inside Next.js:
  - Single origin for frontend and backend reduces CORS complexity.

Data separation for vector store:

- Include `firm_id` as metadata in Qdrant.
- Always filter by `firm_id` for retrieval.
- Optional: separate collections per firm if needed later.

---

## 8. Logging, Monitoring, and Metrics

- Application logs:
  - Use a structured logger in Node (e.g., pino) and Python (structlog/loguru).
  - Output JSON logs to stdout for centralized collection.
- Metrics:
  - Start simple: `prometheus` + `grafana` (optional phase).
  - Track:
    - Request latency and error rates (web, rag-service).
    - LLM usage (tokens per model, cost estimates).
    - Embedding volume and vector DB latency.
- Error tracking:
  - Sentry or similar for both web and rag-service.

---

## 9. Cost Optimization Strategies

- Self-hosted Postgres, Redis, Qdrant via Docker Compose in early stages (cheapest route).[web:21][web:24]
- Use small VMs and scale up only when necessary.
- Use:
  - Cheaper LLM tiers for bulk tasks (Gemini Flash, GPT-5 mini).[web:22][web:28]
  - Higher-end models only for critical, user-facing interactions where quality matters.
- Batch embedding operations to reduce API overhead.
- Cache:
  - Frequently used research queries per case.
  - Document-level summaries and outlines.

---

## 10. Folder Structure (Monorepo Example)

- `/app` – Next.js (frontend + backend).
  - `app/` – pages, layouts, route handlers.
  - `components/` – shared UI.
  - `lib/` – helpers, API clients, auth utilities.
  - `server/` – domain services, DB access, validations.
  - `types/` – shared types.
- `/rag-service`
  - `main.py` – FastAPI entrypoint.
  - `routers/` – endpoints (ingest, query, admin).
  - `services/` – chunking, retrieval, LLM calls.
  - `clients/` – Qdrant, Postgres, OpenAI, Gemini.
  - `models/` – Pydantic schemas.
- `/infra`
  - `docker-compose.yml`
  - `nginx/` configs
  - `migrations/` (if separate from Prisma)

---

## 11. Non-Goals (For Now)

- No separate dedicated Graph DB (Neo4j, etc.) until there is a proven need.
- No Kubernetes initially; Docker Compose is enough for single-node deployment.
- No over-engineering microservices; keep it to:
  - One Next.js app.
  - One Python RAG service.
  - Supporting infra services.

