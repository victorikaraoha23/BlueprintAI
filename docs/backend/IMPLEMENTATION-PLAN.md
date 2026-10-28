# Blueprint AI Backend Implementation Plan

## Overview

Ordered, incremental implementation plan. Each task produces a self-contained, testable deliverable with its own verification cycle. Tests written first (TDD) where practical. Commits made after each task passes verification.

## Phase 0: Scaffolding & Configuration

### Task 0.1 — Project initialization

**Goal:** Initialize TypeScript strict Next.js App Router project with all dependencies.

**Files to create:**
- `package.json` — dependencies and scripts
- `tsconfig.json` — strict TypeScript configuration
- `next.config.js` — Next.js configuration
- `.env.example` — safe placeholder environment variables
- `.gitignore` — standard Node/Next.js ignores
- `vitest.config.ts` — Vitest configuration
- `drizzle.config.ts` — Drizzle Kit configuration

**Dependencies:**
- `next`, `react`, `react-dom` (App Router)
- `typescript`, `@types/node`, `@types/react`
- `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`, `pg`
- `mastra` (AI agents/framework)
- `inngest` (durable workflows)
- `zod` (validation)
- `@vercel/blob` (file storage)
- `vitest` (testing)

**Verification:**
- `npx tsc --noEmit` passes with no errors
- `npx vitest run` passes (empty suite initially)
- `next build` succeeds

## Phase 1: Database Layer

### Task 1.1 — Users table and first migration

**Goal:** Create `users` table and initial migration.

**Files to create:**
- `src/drizzle/schema.ts` — add `users` table definition
- `drizzle/migrations/0001_users.sql` — migration SQL

**Tests (Vitest):**
- Schema type exports match table definition
- Migration SQL is valid PostgreSQL

**Commit:** `feat(db): add users table and initial migration`

### Task 1.2 — Projects table and migration

**Goal:** Create `projects` table.

**Files to create:**
- `src/drizzle/schema.ts` — add `projects` table
- `drizzle/migrations/0002_projects.sql` — migration SQL

**Tests (Vitest):**

## Phase 2: Authentication & Authorization

### Task 2.1 — Auth module and session validation

**Goal:** Implement auth strategy (provider per DECISIONS.md) and session middleware.

**Files to create:**
- `src/auth/index.ts` — auth strategy, session creation/validation
- `src/auth/middleware.ts` — ownership enforcement middleware
- `src/auth/types.ts` — User, Session, JWTPayload types

**Tests (Vitest):**
- Session validation accepts valid tokens, rejects invalid
- Middleware returns 403 for unauthorized project access
- Middleware allows access for resource owners

**Commit:** `feat(auth): implement session validation and ownership middleware`

## Phase 3: Service Layer

### Task 3.1 — Project service

**Goal:** Project CRUD with ownership enforcement.

**Files to create:**
- `src/services/project/index.ts` — create, list, get, update projects
- `src/services/project/validation.ts` — Zod schemas

**Tests (Vitest):**
- Create project validates input
- List projects filters by user
- Get project enforces ownership
- Update project rejects non-owners

**Commit:** `feat(service): project CRUD with ownership enforcement`

### Task 3.2 — Blueprint service

## Phase 4: AI & Integrations

### Task 4.1 — Mastra agents with adapter pattern

**Goal:** Mastra agents for research, clarification, decision, generation, review.

**Files to create:**
- `src/integrations/mastra/agents.ts` — agent definitions
- `src/integrations/mastra/adapters.ts` — LLM provider adapter interface

**Tests (Vitest):**
- Each agent has defined system prompt and output schema
- LLM provider adapter can be swapped
- Agent output validated with Zod

**Commit:** `feat(ai): Mastra agents with swappable LLM adapter`

### Task 4.2 — Research provider adapters

**Goal:** Configurable research providers (search, scrape).

**Files to create:**
- `src/integrations/research/providers.ts` — provider implementations

**Tests (Vitest):**
- Provider returns sources with URLs and timestamps
- No fabricated sources

## Phase 6: API Route Handlers

### Task 6.1 — Project Route Handlers

**Goal:** POST/GET/PATCH /api/projects handlers.

**Files to create:**
- `src/api/projects/route.ts` — list and create
- `src/api/projects/[id]/route.ts` — get and update

**Tests (Vitest):**
- All endpoints return standardized envelopes
- Validation errors return 400 with field details
- Auth failures return 401/403

**Commit:** `feat(api): project Route Handlers`

### Task 6.2 — Blueprint Route Handlers

**Goal:** Blueprint CRUD and action handlers.

**Files to create:**
- `src/api/blueprints/route.ts` — create
- `src/api/blueprints/[id]/route.ts` — get
- `src/api/blueprints/[id]/clarify/route.ts` — clarification
- `src/api/blueprints/[id]/decisions/route.ts` — decisions
- `src/api/blueprints/[id]/review-results/route.ts` — review
- `src/api/blueprints/[id]/final-approve/route.ts` — final approval

## Phase 7: OpenAPI Documentation

### Task 7.1 — OpenAPI spec generation

**Goal:** Generate OpenAPI 3.0 spec from Zod schemas.

**Files to create:**
- `src/api/openapi/route.ts` — OpenAPI JSON endpoint
- `src/lib/openapi.ts` — Zod-to-OpenAPI schema mapping

**Tests (Vitest):**
- OpenAPI spec is valid JSON
- All endpoints documented
- All schemas have required fields marked

**Commit:** `feat(docs): OpenAPI 3.0 specification from Zod schemas`

## Phase 8: Testing & Verification

### Task 8.1 — Integration tests

**Goal:** End-to-end workflow tests covering happy path and edge cases.

**Files to create:**
- `tests/integration/blueprint-workflow.test.ts`
- `tests/integration/auth-authorization.test.ts`
- `tests/integration/duplicate-prevention.test.ts`

**Tests (Vitest):**
- Full blueprint flow from project creation to final approval
- Unauthorized access blocked
- Duplicate approval prevented
- Duplicate document version prevented

**Commit:** `test: add integration tests for blueprint workflow`

## Total Estimated Tasks: ~20

Each task is independently committable and testable. No task depends on code not yet written.

**Tests (Vitest):**
- Blueprint creation enqueues Inngest workflow
- Clarification creates approval record
- Decisions create approval records
- Final approval is idempotent

**Commit:** `feat(api): blueprint Route Handlers`

### Task 6.3 — Research, approvals, versions, webhook handlers

**Goal:** Remaining Route Handlers.

**Files to create:**
- `src/api/research/route.ts`
- `src/api/approvals/route.ts`
- `src/api/blueprints/[id]/versions/route.ts`
- `src/api/blueprints/[id]/versions/[versionId]/download/route.ts`
- `src/api/webhooks/inngest/route.ts`

**Tests (Vitest):**
- Webhook verifies Inngest signature
- Version download returns signed URL
- Approval creation prevents duplicates

**Commit:** `feat(api): research, approvals, versions, webhook handlers`
- Provider failure handled gracefully

**Commit:** `feat(integration): research provider adapters`

### Task 4.3 — Vercel Blob integration

**Goal:** Blob upload and signed URL generation.

**Files to create:**
- `src/integrations/blob/index.ts` — upload, signed URL, delete

**Tests (Vitest):**
- Upload returns blob URL and token
- Signed URL expires after TTL
- Upload validates file type and size

**Commit:** `feat(integration): Vercel Blob upload and signed URLs`

## Phase 5: Inngest Workflows

### Task 5.1 — Inngest client and blueprint workflow

**Goal:** Durable blueprint generation workflow with retry-safe steps.

**Files to create:**
- `src/hooks/inngest/client.ts` — Inngest client singleton
- `src/hooks/inngest/blueprint.ts` — workflow functions

**Tests (Vitest):**
- Workflow enqueues on blueprint creation
- Steps execute in sequence: research → clarify → decide → generate → review → approve
- Failed steps retry with bounded attempts
- State persisted after each step

**Commit:** `feat(workflow): Inngest blueprint generation workflow`

**Goal:** Blueprint lifecycle: create, update status, manage fields.

**Files to create:**
- `src/services/blueprint/index.ts` — blueprint state transitions
- `src/services/blueprint/state.ts` — workflow state machine definitions

**Tests (Vitest):**
- Create blueprint from project
- Status transitions follow allowed sequence
- Invalid transitions rejected
- Duplicate version creation rejected

**Commit:** `feat(service): blueprint lifecycle and state machine`

### Task 3.3 — Research service

**Goal:** Research step orchestration with provider adapters.

**Files to create:**
- `src/services/research/index.ts` — research provider orchestration
- `src/services/research/adapters.ts` — research provider adapter interfaces

**Tests (Vitest):**
- Research step creates record with sources
- Provider adapter interface is implemented
- Invalid provider rejected

**Commit:** `feat(service): research orchestration with provider adapters`

### Task 3.4 — Document service

**Goal:** Document generation and Vercel Blob export.

**Files to create:**
- `src/services/document/index.ts` — document generation
- `src/services/document/templates.ts` — configurable document structure defaults

**Tests (Vitest):**
- Document content generated from blueprint state
- Vercel Blob upload returns signed URL
- Document version created with incremented version number

**Commit:** `feat(service): document generation and Vercel Blob export`
- Foreign key to users
- Status default value validation
- Index on user_id

**Commit:** `feat(db): add projects table and migration`

### Task 1.3 — Blueprints table and migration

**Goal:** Create `blueprints` table with JSONB fields and versioning.

**Files to create:**
- `src/drizzle/schema.ts` — add `blueprints` table
- `drizzle/migrations/0003_blueprints.sql` — migration SQL

**Tests (Vitest):**
- Foreign key to projects
- Unique constraint on (project_id, version)
- JSONB field type validation

**Commit:** `feat(db): add blueprints table and migration`

### Task 1.4 — Research steps, approvals, document_versions tables

**Goal:** Create remaining tables: `research_steps`, `approvals`, `document_versions`.

**Files to create:**
- `src/drizzle/schema.ts` — add remaining tables
- `drizzle/migrations/0004_research_approvals_documents.sql` — migration SQL

**Tests (Vitest):**
- All foreign keys resolve
- Unique constraints prevent duplicates
- Indexes on all FK columns

**Commit:** `feat(db): add research_steps, approvals, document_versions tables`

**Commit:** `chore: initialize project scaffold with TypeScript, Next.js, Drizzle, Mastra, Inngest, Vitest`

---

### Task 0.2 — Database client and schema foundation

**Goal:** Set up Drizzle ORM client connected to Neon, with shared schema module.

**Files to create:**
- `src/lib/db.ts` — Drizzle client singleton
- `src/drizzle/schema.ts` — empty schema file (tables added in Task 1)
- `src/types/index.ts` — shared type exports

**Verification:**
- `npx tsc --noEmit` passes
- Database client imports without error

**Commit:** `feat(db): add Drizzle client and schema foundation`