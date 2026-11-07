# Blueprint AI Backend Architecture

## Overview

Blueprint AI is a TypeScript backend deployed on Vercel via Next.js App Router Route Handlers. It turns rough software ideas into researched, coherent, validated, implementation-ready documentation through a durable, resumable workflow orchestrated by Inngest and powered by Mastra AI agents.

This document defines the system boundaries, module layout, workflow state machine, and cross-cutting contracts (errors, idempotency, retries) that the implementation plan in `IMPLEMENTATION-PLAN.md` builds against.

## Core Principles

1. **Thin API handlers** — Route Handlers validate input and delegate all business logic to service modules. No business logic lives in a `route.ts` file.
2. **Separation of concerns** — Database access, AI orchestration, research providers, authentication, document generation, and exports live in separate modules with explicit interfaces between them.
3. **Durable workflows** — All long-running work executes via Inngest. No HTTP request stays open for the duration of a blueprint run.
4. **State in PostgreSQL** — Workflow stages, errors, retries, timestamps, and document versions are persisted in Neon PostgreSQL via Drizzle ORM. Nothing important lives in process memory.
5. **Configurable providers** — LLM and research providers are swappable through adapter interfaces. Provider choice is configuration, not a code fork.
6. **Server-side credentials** — All secrets and API keys stay server-side. They are never exposed to clients, logged, or committed.
7. **Validated boundaries** — All external input and all structured model output are validated with Zod before they reach business logic or the database.
8. **Authorization enforced** — Ownership is checked on every project-scoped operation, inside the service layer, not only at the route boundary.
9. **No fabrication** — Sources, citations, research activity, approvals, and review results are never invented. If a provider returns nothing, the workflow records nothing rather than inventing a placeholder.
10. **Idempotent and safe** — Retries are safe. Duplicate approvals and duplicate document versions are prevented by database constraints, not by application-level best effort.

## High-Level Data Flow

```
Client → Route Handler → Service → Inngest Function → Mastra Agent / Research Provider → PostgreSQL → Client (poll / webhook)
```

1. Client submits a project idea to a Route Handler.
2. Route Handler validates the body with Zod, then calls the service layer.
3. Service creates the `projects` row and enqueues an Inngest event.
4. Route Handler returns immediately with a `blueprintId` and `status`.
5. Client polls the status endpoint (or receives a webhook) for workflow progress.
6. The Inngest function executes durable steps in order: research → clarification → decisions → generation → review → final approval.
7. Each step persists its state to PostgreSQL; failures trigger bounded retries with backoff.
8. The final blueprint is exported to Vercel Blob and a time-limited download URL is returned.

## Module Boundaries

```
src/
  app/
    layout.tsx                    - Root layout
    page.tsx                      - Minimal landing page (API base path notice)
    api/
      projects/
        route.ts                  - GET (list), POST (create)
        [id]/
          route.ts                - GET, PATCH
      blueprints/
        route.ts                  - POST (create + enqueue workflow)
        [id]/
          route.ts                - GET (status + state)
          clarify/route.ts        - POST (submit clarification answers)
          decisions/route.ts      - POST (approve consequential decisions)
          review-results/route.ts - POST (record independent review results)
          final-approve/route.ts  - POST (final sign-off)
          versions/
            route.ts              - GET (list document versions)
            [versionId]/
              download/route.ts   - GET (time-limited download URL)
      research/
        route.ts                  - POST (manual research step)
      approvals/
        route.ts                  - GET, POST
      openapi/
        route.ts                  - GET (OpenAPI 3.0 JSON document)
      inngest/
        route.ts                  - GET, POST, PUT (Inngest serve handler)
  auth/
    index.ts                      - Auth strategy, session creation/validation
    middleware.ts                 - Ownership/authorization guard for project-scoped ops
    types.ts                      - Auth types (User, Session, JWTPayload)
  services/
    project/
      index.ts                    - Project CRUD, ownership enforcement
      validation.ts               - Zod schemas for project input
    blueprint/
      index.ts                    - Blueprint lifecycle: create, approve, generate, review
      state.ts                    - Workflow state machine (allowed transitions)
    research/
      index.ts                    - Research provider orchestration
      adapters.ts                 - Research provider adapter interfaces
    document/
      index.ts                    - Document generation and Vercel Blob export
      templates.ts                - Configurable document structure (canonical defaults)
  integrations/
    mastra/
      agents.ts                   - Mastra agents (research, clarify, decide, generate, review)
      adapters.ts                 - LLM provider adapter interfaces
    research/
      providers.ts                - Research provider implementations (search, scrape)
    blob/
      index.ts                    - Vercel Blob upload / download-URL helpers
  hooks/
    inngest/
      client.ts                   - Inngest client singleton
      blueprint.ts                - Durable blueprint generation workflow functions
  lib/
    db.ts                         - Drizzle ORM client (Neon connection)
    schema.ts                     - Re-export of src/drizzle/schema.ts
    zod.ts                        - Reusable Zod validation helpers
    errors.ts                     - Standardized error classes and response shapes
    openapi.ts                    - Zod-to-OpenAPI schema registration
  drizzle/
    schema.ts                     - Drizzle table definitions
  types/
    index.ts                      - Shared TypeScript types
drizzle/
  *.sql                           - Generated versioned SQL migrations
  meta/                           - Drizzle Kit migration journal (not committed)
```

Route Handlers live under `src/app/api/**` because the App Router only serves `route.ts` files from inside the `app` directory. A `src/api/**` layout would compile but would never be routed.

## Workflow State Machine

Blueprint status is a closed set. Transitions are validated in `src/services/blueprint/state.ts` and enforced at the database level by the enum-like `status` column.

```
pending
  → research_complete
  → clarification_complete
  → decisions_approved
  → generating
  → review_complete
  → approved
```

Any state may transition to `rejected`. The following transitions are invalid and must be rejected with `409 Conflict`:

- Skipping a stage (for example `pending` → `decisions_approved`)
- Moving backwards (for example `review_complete` → `generating`)
- Re-approving an already approved blueprint (`approved` → `approved`) — the final approval endpoint returns `409` instead
- Any transition on a blueprint whose owner no longer matches the authenticated user

Project status mirrors the blueprint lifecycle for list filtering: `draft`, `researching`, `clarifying`, `deciding`, `generating`, `reviewing`, `approved`, `archived`.

## Canonical Document Structure

The document structure is configurable, but every deployment starts from the same canonical default so that two blueprints of the same project shape are comparable and diffable.

Canonical default sections (in order):

1. `executive_summary` — what the software idea is and what the blueprint recommends.
2. `requirements` — functional and non-functional requirements.
3. `architecture` — components, boundaries, and data flow.
4. `data_model` — entities, relationships, and lifecycle.
5. `api_contracts` — endpoints, request/response shapes, error semantics.
6. `security_and_privacy` — threat surface, authorization model, data handling.
7. `implementation_plan` — phased, independently committable tasks.
8. `risks_and_open_questions` — unresolved decisions carried forward from `DECISIONS.md`.
9. `sources` — citation list with URL and retrieval timestamp.

Rules:

- The section set is stored per blueprint in `blueprints.generated_content`, so a project may override the canonical default with its own section list before generation.
- Every generated section must be present in the output, even if its body is an explicit "not applicable" note. Missing sections are a generation error, not a silent omission.
- The `sources` section is populated only from `research_steps.sources`. If no research produced sources, the section states that no sources were retrieved. URLs are never synthesised.
- Section identifiers are stable strings; ordering is explicit. Downstream consumers (including PromptForge-style document comparison) key on the identifier, not on the rendered position.

## Error Handling Strategy

### Error Classification

| Error Type | HTTP Status | Retryable | Client Message |
|------------|-------------|-----------|----------------|
| ValidationError | 400 | No | Specific field errors |
| AuthenticationError | 401 | No | Auth required |
| AuthorizationError | 403 | No | Not permitted |
| NotFoundError | 404 | No | Resource not found |
| ConflictError | 409 | No | Duplicate / state conflict |
| ProviderError | 502 | Yes (bounded) | External service unavailable |
| WorkflowError | 500 | Yes (bounded) | Workflow step failed |
| InternalError | 500 | No | Unexpected server error |

Provider and workflow errors are surfaced as `ProviderError` / `WorkflowError` to the client, but are thrown as retryable failures inside Inngest steps so the durable engine can retry them.

### Error Response Shape

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": { "field": ["specific issue"] },
    "requestId": "uuid",
    "timestamp": "ISO-8601"
  }
}
```

Internal stack traces, provider payloads, and SQL fragments never appear in `message` or `details`.

## Idempotency and Concurrency Contracts

- **Approvals** — a partial unique index on `(blueprint_id, type)` where `status = 'pending'` guarantees at most one pending approval per type per blueprint. A second concurrent approval for the same pending type returns `409 Conflict` rather than creating a second row.
- **Document versions** — a unique constraint on `(blueprint_id, version)` plus a version number allocated inside the same transaction guarantees one row per version. A concurrent generation attempt that would reuse a version number fails on the constraint.
- **Workflow steps** — every step is idempotent by construction: steps read current state, write results keyed by a stable identifier, and are safe to re-execute after a retry. `research_steps` rows are keyed by `(blueprint_id, query, provider)` semantics so a retried research step does not duplicate records.
- **Write endpoints** — mutating endpoints accept an optional `Idempotency-Key` header. When present, the key is stored with the resource and a repeated request returns the original result instead of creating a second resource.
- **State transitions** — status changes use a conditional update (`WHERE id = ? AND status = ?`). A lost race updates zero rows and is reported as `409 Conflict` rather than silently overwriting a newer state.

## API Conventions

- Base path: `/api`
- Content-Type: `application/json`
- All request bodies validated with Zod schemas (`.strict()` — unknown fields rejected)
- All responses use standardized success and error envelopes
- Pagination: `?cursor=...&limit=...` (default 20, max 100)
- ISO-8601 timestamps everywhere
- UUIDs for all resource identifiers
- Authorization: Bearer token or session cookie, validated server-side on every protected route

## Deployment Assumptions

- Platform: Vercel (Next.js App Router + Route Handlers, `output: "standalone"`)
- Database: Neon PostgreSQL via `@neondatabase/serverless` (HTTP driver through `drizzle-orm/neon-http`)
- File storage: Vercel Blob (`@vercel/blob` v2 — `put`, `get`, `head`, `del`, `getDownloadUrl`, `issueSignedToken`)
- Auth: session-based, provider TBD (see `DECISIONS.md` → U1)
- AI providers: Mastra agents with a swappable LLM adapter (provider TBD — U3)
- Research providers: configurable adapters (provider TBD — U2)
- Background execution: Inngest (Inngest Cloud or self-hosted — U5)
- Environment variables never committed; `.env.example` contains safe placeholders only

## Security Boundaries

- All credentials loaded from `process.env` only — never hardcoded
- Auth tokens validated server-side on every protected route
- Ownership checked on every project-scoped database operation, inside the service layer
- Input validated at the API boundary with Zod before reaching the service layer
- LLM output validated with Zod before database persistence
- No internal stack traces or secrets leaked to clients
- Vercel Blob access via time-limited signed URLs / download URLs
- Rate limiting considered at the API gateway / Vercel edge config
- Fetched research content is treated as untrusted data: it is delimited, never concatenated into system instructions, and never allowed to change the workflow's instruction set

## Retry Policy (Inngest)

- Maximum 3 attempts per step
- Exponential backoff: 1s, 4s, 16s
- Jitter applied to prevent thundering herd
- Non-retryable errors (validation, auth, not found, conflict) fail immediately — Inngest's `NonRetriableError`
- Failed steps record error details, timestamp, and attempt count in PostgreSQL
- Retries never create duplicate approvals, duplicate document versions, or duplicate research records (see Idempotency and Concurrency Contracts)
