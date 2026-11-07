# Blueprint AI Backend Implementation Plan

## Overview

Ordered, incremental implementation plan. Each task produces a self-contained, testable deliverable with its own verification cycle. Tests are written first (TDD) where practical. Commits are made after each task passes verification.

Tasks are strictly ordered: no task depends on code not yet written by an earlier task.

## Dependency Version Pins

Verified against the npm registry and the installed type definitions on 2026-11-02. Full rationale in `DECISIONS.md` → D11.

| Package | Pin | Notes |
|---------|-----|-------|
| `next` | `^16.4.3` | Node `>=20.9.0`; `next lint` removed — linting via `eslint .` |
| `react` / `react-dom` | `^19.3.1` | Next 16 peer range `^19.0.0` |
| `@mastra/core` | `^1.81.0` | Agent + workflow engine; Node `>=22.13.0`; the `mastra` meta-package is not used |
| `ai` | `^7.0.159` | Vercel AI SDK core, used as the Mastra model interface |
| `@ai-sdk/openai` / `@ai-sdk/anthropic` | `^4.0.106` / `^4.0.94` | Concrete model providers behind the LLM adapter |
| `inngest` | `^4.26.2` | Durable execution; TypeScript peer `>=5.8.0` |
| `drizzle-orm` | `^0.45.4` | HTTP driver: `drizzle-orm/neon-http` |
| `drizzle-kit` | `^0.31.11` | Migration generation and studio |
| `@neondatabase/serverless` | `^1.2.0` | Neon serverless driver (peer `>=0.10.0`) |
| `@vercel/blob` | `^2.8.2` | v2 API — `put`, `get`, `head`, `del`, `getDownloadUrl`, `issueSignedToken` |
| `zod` | `^4.6.7` | Zod v4 — `.strict()`, `z.toJSONSchema()` |
| `@asteasolutions/zod-to-openapi` | `^9.1.0` | Zod v4 → OpenAPI 3.0 generator |
| `vitest` | `^5.0.5` | Node `^22.12 \|\| ^24 \|\| >=26`; requires `vite` peer |
| `vite` | `^8.3.5` | Vitest 5 peer range `^6.4 \|\| ^7 \|\| ^8` |
| `typescript` | `^5.9.3` | `typescript-eslint@8.x` peer requires TypeScript `<6` |
| `eslint` | `^9.39.5` | ESLint 10 is not accepted by the `eslint-plugin-jsx-a11y@6` / `eslint-plugin-import@2` / `eslint-plugin-react@7` peers bundled with `eslint-config-next@16.4.3` |
| `eslint-config-next` | `^16.4.3` | Flat config via `eslint-config-next/core-web-vitals` |

## Phase 0: Scaffolding & Configuration

### Task 0.1 — Project initialization ✅ (completed in this step)

**Goal:** Initialize a strict TypeScript Next.js App Router project with current stable dependencies and a verifiable toolchain.

**Files:**
- `package.json` — pinned dependencies and scripts
- `tsconfig.json` — strict TypeScript configuration
- `next.config.js` — Next.js configuration (`output: "standalone"`, `serverExternalPackages`)
- `eslint.config.mjs` — ESLint flat config
- `vitest.config.mts` — Vitest configuration
- `drizzle.config.ts` — Drizzle Kit configuration
- `.env.example` — safe placeholder environment variables
- `.gitignore` — standard Node/Next.js ignores
- `src/app/layout.tsx`, `src/app/page.tsx` — minimal App Router shell
- `tests/scaffold/toolchain.test.ts` — toolchain smoke test

**Verification:** `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` — all pass.

### Task 0.2 — Database client and schema foundation

**Goal:** Set up the Drizzle ORM client connected to Neon, with a shared schema module.

**Files to create:**
- `src/lib/db.ts` — Drizzle client singleton over `drizzle-orm/neon-http`
- `src/drizzle/schema.ts` — schema module (tables added in Phase 1)
- `src/lib/schema.ts` — re-export of the schema module
- `src/types/index.ts` — shared type exports

**Tests (Vitest):**
- Database client constructs without a live connection
- Schema module exports resolve

**Verification:** `npm run typecheck` passes.

**Commit:** `feat(db): add Drizzle client and schema foundation`

---

## Phase 1: Database Layer

### Task 1.1 — Users table and first migration

**Goal:** Create the `users` table and the initial migration.

**Files to create:**
- `src/drizzle/schema.ts` — add `users` table definition
- `drizzle/0001_users.sql` — generated migration

**Tests (Vitest):**
- Schema type exports match the table definition
- Generated migration SQL is valid PostgreSQL

**Commit:** `feat(db): add users table and initial migration`

### Task 1.2 — Projects table and migration

**Goal:** Create the `projects` table.

**Files to create:**
- `src/drizzle/schema.ts` — add `projects` table
- `drizzle/0002_projects.sql` — generated migration

**Tests (Vitest):**
- Foreign key to `users`
- Status default value validation
- Index on `user_id`

**Commit:** `feat(db): add projects table and migration`

### Task 1.3 — Blueprints table and migration

**Goal:** Create the `blueprints` table with JSONB fields and versioning.

**Files to create:**
- `src/drizzle/schema.ts` — add `blueprints` table
- `drizzle/0003_blueprints.sql` — generated migration

**Tests (Vitest):**
- Foreign key to `projects`
- Unique constraint on `(project_id, version)`
- JSONB field type validation

**Commit:** `feat(db): add blueprints table and migration`

### Task 1.4 — Research steps, approvals, document_versions tables

**Goal:** Create the remaining tables.

**Files to create:**
- `src/drizzle/schema.ts` — add `research_steps`, `approvals`, `document_versions`
- `drizzle/0004_research_approvals_documents.sql` — generated migration

**Tests (Vitest):**
- All foreign keys resolve
- Unique constraints prevent duplicates (including the partial unique index for pending approvals)
- Indexes on all foreign-key columns

**Commit:** `feat(db): add research_steps, approvals, document_versions tables`

---

## Phase 2: Authentication & Authorization

### Task 2.1 — Auth module and session validation

**Goal:** Implement the auth strategy (provider per `DECISIONS.md` → U1) and the ownership guard.

**Files to create:**
- `src/auth/index.ts` — auth strategy, session creation/validation
- `src/auth/middleware.ts` — ownership enforcement helper
- `src/auth/types.ts` — `User`, `Session`, `JWTPayload` types

**Tests (Vitest):**
- Session validation accepts valid tokens, rejects invalid ones
- Ownership guard returns 403 for unauthorized project access
- Ownership guard allows access for resource owners

**Commit:** `feat(auth): implement session validation and ownership middleware`

**Blocked by:** U1 (authentication provider)

---

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

### Task 3.2 — Blueprint service and state machine

**Goal:** Blueprint lifecycle: create, update status, manage fields.

**Files to create:**
- `src/services/blueprint/index.ts` — blueprint state transitions
- `src/services/blueprint/state.ts` — workflow state machine definitions

**Tests (Vitest):**
- Create blueprint from project
- Status transitions follow the allowed sequence
- Invalid transitions are rejected with a conflict error
- Duplicate version creation is rejected

**Commit:** `feat(service): blueprint lifecycle and state machine`

### Task 3.3 — Research service

**Goal:** Research step orchestration with provider adapters.

**Files to create:**
- `src/services/research/index.ts` — research provider orchestration
- `src/services/research/adapters.ts` — research provider adapter interfaces

**Tests (Vitest):**
- Research step creates a record with sources
- Provider adapter interface is implemented
- Invalid provider is rejected
- A provider returning no sources yields an empty source list, never a fabricated one

**Commit:** `feat(service): research orchestration with provider adapters`

### Task 3.4 — Document service

**Goal:** Document generation and Vercel Blob export.

**Files to create:**
- `src/services/document/index.ts` — document generation
- `src/services/document/templates.ts` — configurable document structure with canonical defaults

**Tests (Vitest):**
- Document content is generated from blueprint state
- Every canonical section is present in the output
- Vercel Blob upload returns a stored reference
- Document version is created with an incremented version number
- A concurrent version insert fails on the unique constraint rather than creating a duplicate

**Commit:** `feat(service): document generation and Vercel Blob export`

---

## Phase 4: AI & Integrations

### Task 4.1 — Mastra agents with adapter pattern

**Goal:** Mastra agents for research, clarification, decision, generation, and review.

**Files to create:**
- `src/integrations/mastra/agents.ts` — agent definitions (`Agent` from `@mastra/core/agent`)
- `src/integrations/mastra/adapters.ts` — LLM provider adapter interface

**Tests (Vitest):**
- Each agent has a defined system prompt and output schema
- The LLM provider adapter can be swapped
- Agent output is validated with Zod before it is persisted

**Commit:** `feat(ai): Mastra agents with swappable LLM adapter`

**Blocked by:** U3 (LLM provider)

### Task 4.2 — Research provider adapters

**Goal:** Configurable research providers (search, scrape).

**Files to create:**
- `src/integrations/research/providers.ts` — provider implementations

**Tests (Vitest):**
- Provider returns sources with URLs and timestamps
- No fabricated sources
- Provider failure is handled gracefully and surfaced as a retryable error

**Commit:** `feat(integration): research provider adapters`

**Blocked by:** U2 (research provider)

### Task 4.3 — Vercel Blob integration

**Goal:** Blob upload and time-limited download URL generation.

**Files to create:**
- `src/integrations/blob/index.ts` — upload, download URL, delete (`put`, `getDownloadUrl`, `issueSignedToken`, `del`)

**Tests (Vitest):**
- Upload returns a blob URL and access token
- Download URL expires after its TTL
- Upload validates file type and size before writing

**Commit:** `feat(integration): Vercel Blob upload and signed access`

---

## Phase 5: Inngest Workflows

### Task 5.1 — Inngest client and blueprint workflow

**Goal:** Durable blueprint generation workflow with retry-safe steps.

**Files to create:**
- `src/hooks/inngest/client.ts` — Inngest client singleton
- `src/hooks/inngest/blueprint.ts` — workflow functions (`createWorkflow` / `createStep` from `@mastra/core/workflows` where a Mastra workflow is used; `step` from `inngest` for durable steps)
- `src/app/api/inngest/route.ts` — serve handler exporting `GET`, `POST`, `PUT`

**Tests (Vitest):**
- Workflow is enqueued on blueprint creation
- Steps execute in sequence: research → clarify → decide → generate → review → approve
- Failed steps retry with bounded attempts and non-retryable errors fail immediately
- State is persisted after each step
- Re-running a step does not duplicate approvals, document versions, or research records

**Commit:** `feat(workflow): Inngest blueprint generation workflow`

**Blocked by:** U5 (Inngest deployment mode)

---

## Phase 6: API Route Handlers

All handlers live under `src/app/api/**` (App Router routing requirement).

### Task 6.1 — Project Route Handlers

**Goal:** `GET`/`POST`/`PATCH` project handlers.

**Files to create:**
- `src/app/api/projects/route.ts` — list and create
- `src/app/api/projects/[id]/route.ts` — get and update

**Tests (Vitest):**
- All endpoints return standardized envelopes
- Validation errors return 400 with field details
- Auth failures return 401/403

**Commit:** `feat(api): project Route Handlers`

### Task 6.2 — Blueprint Route Handlers

**Goal:** Blueprint CRUD and action handlers.

**Files to create:**
- `src/app/api/blueprints/route.ts` — create
- `src/app/api/blueprints/[id]/route.ts` — get
- `src/app/api/blueprints/[id]/clarify/route.ts` — clarification
- `src/app/api/blueprints/[id]/decisions/route.ts` — decisions
- `src/app/api/blueprints/[id]/review-results/route.ts` — review
- `src/app/api/blueprints/[id]/final-approve/route.ts` — final approval

**Tests (Vitest):**
- Blueprint creation enqueues the Inngest workflow
- Clarification creates an approval record
- Decisions create approval records
- Final approval is guarded and returns 409 when already approved

**Commit:** `feat(api): blueprint Route Handlers`

### Task 6.3 — Research, approvals, versions, and Inngest handlers

**Goal:** Remaining Route Handlers.

**Files to create:**
- `src/app/api/research/route.ts`
- `src/app/api/approvals/route.ts`
- `src/app/api/blueprints/[id]/versions/route.ts`
- `src/app/api/blueprints/[id]/versions/[versionId]/download/route.ts`

**Tests (Vitest):**
- Version download returns a time-limited URL
- Approval creation prevents duplicates
- Research results contain only provider-returned sources

**Commit:** `feat(api): research, approvals, versions handlers`

### Task 6.4 — Approval notifications

**Goal:** Notify the owner when an approval is required, if a delivery channel is chosen.

**Files to create:**
- `src/integrations/notifications/index.ts` — notification adapter interface and implementation

**Tests (Vitest):**
- A notification is emitted when a blueprint enters an approval-requiring state
- Notification failure never fails the workflow step (logged, not fatal)

**Commit:** `feat(api): approval notifications`

**Blocked by:** U4 (email delivery for approval notifications)

---

## Phase 7: OpenAPI Documentation

### Task 7.1 — OpenAPI spec generation

**Goal:** Generate an OpenAPI 3.0 spec from the Zod schemas.

**Files to create:**
- `src/app/api/openapi/route.ts` — OpenAPI JSON endpoint
- `src/app/api/docs/route.ts` — interactive docs
- `src/lib/openapi.ts` — Zod-to-OpenAPI schema registration (`@asteasolutions/zod-to-openapi` v9)

**Tests (Vitest):**
- The OpenAPI spec is valid JSON and parses
- All endpoints are documented
- All schemas have required fields marked

**Commit:** `feat(docs): OpenAPI 3.0 specification from Zod schemas`

---

## Phase 8: Testing & Verification

### Task 8.1 — Integration tests

**Goal:** End-to-end workflow tests covering the happy path and edge cases.

**Files to create:**
- `tests/integration/blueprint-workflow.test.ts`
- `tests/integration/auth-authorization.test.ts`
- `tests/integration/duplicate-prevention.test.ts`

**Tests (Vitest):**
- Full blueprint flow from project creation to final approval
- Unauthorized access is blocked
- Duplicate approval is prevented
- Duplicate document version is prevented

**Commit:** `test: add integration tests for blueprint workflow`

---

## Total Estimated Tasks: ~21

Each task is independently committable and testable. No task depends on code not yet written.

## Unresolved Decisions Blocking Tasks

| ID | Decision | Blocks |
|----|----------|--------|
| U1 | Authentication provider | Task 2.1 and every protected route |
| U2 | Research provider | Task 4.2 |
| U3 | LLM provider | Task 4.1 |
| U4 | Approval notification channel | Task 6.4 |
| U5 | Inngest deployment mode | Task 5.1 |

Tasks not blocked by an unresolved decision can proceed.
