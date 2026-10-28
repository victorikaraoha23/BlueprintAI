# Blueprint AI Backend Architecture

## Overview

Blueprint AI is a TypeScript-based AI SaaS backend deployed on Vercel via Next.js App Router Route Handlers. It transforms rough software ideas into researched, coherent, validated, implementation-ready documentation through a durable, resumable workflow orchestrated by Inngest and powered by Mastra AI agents.

## Core Principles

1. **Thin API handlers** — Route Handlers delegate all business logic to service modules.
2. **Separation of concerns** — Database access, AI orchestration, research providers, authentication, document generation, and exports live in separate modules.
3. **Durable workflows** — All long-running tasks execute via Inngest; no HTTP request stays open for an entire blueprint run.

## High-Level Data Flow

```
Client → Route Handler → Service → Inngest Function → Mastra Agent/Research Provider → PostgreSQL → Client (poll/webhook)
```

1. Client submits a project idea via Route Handler.
2. Route Handler validates input with Zod, calls service layer.
3. Service creates project/blueprint records in PostgreSQL and enqueues an Inngest function.
4. Route Handler returns immediately with a `blueprintId` and status.
5. Client polls status endpoint (or receives webhook) for workflow progress.
6. Inngest function executes durable steps: research → clarification → decisions → approval → generation → review → final approval.

## Module Boundaries

```
src/
  auth/
    index.ts          - Auth strategy, session creation/validation
    middleware.ts     - Ownership/authorization middleware for project-scoped ops
    types.ts          - Auth types (User, Session, JWTPayload)
  services/
    project/
      index.ts        - Project CRUD, workflow state transitions
      validation.ts   - Zod schemas for project input
    blueprint/
      index.ts        - Blueprint lifecycle: create, approve, generate, review
      state.ts        - Workflow state machine definitions
    research/
      index.ts        - External research provider orchestration
      adapters.ts     - Research provider adapter interfaces
    document/
      index.ts        - Document generation and Vercel Blob export
      templates.ts    - Configurable document structure defaults
  integrations/
    mastra/
      agents.ts       - Mastra agent definitions (research, clarify, decide, generate, review)
      adapters.ts     - LLM provider adapter interfaces
    research/
      providers.ts    - Research provider implementations (search, scrape, etc.)
    blob/
      index.ts        - Vercel Blob upload/signed URL helpers

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


## API Conventions

- Base path: `/api`
- Content-Type: `application/json`
- All request bodies validated with Zod schemas
- All responses use standardized error/success envelopes
- Pagination: `?cursor=...&limit=...` (max limit 100)
- ISO-8601 timestamps everywhere
- UUIDs for all resource identifiers

## Deployment Assumptions

- Platform: Vercel (Next.js App Router + Route Handlers + Edge/API functions)
- Database: Neon PostgreSQL (serverless, connection pooling via `@neondatabase/serverless`)
- File storage: Vercel Blob
- Auth: Environment-based session management (provider TBD — see DECISIONS.md)
- AI providers: Mastra with configurable LLM adapters (provider TBD)
- Research providers: Configurable adapters (provider TBD)
- Background execution: Inngest (self-hosted or Inngest Cloud)
- Environment variables never committed; `.env.example` contains safe placeholders only

## Security Boundaries

- All credentials loaded from `process.env` only — never hardcoded
- Auth tokens validated server-side on every protected route
- Ownership checked on every project-scoped database operation
- Input validated at API boundary with Zod before reaching service layer
- LLM output validated with Zod before database persistence
- No internal stack traces or secrets leaked to clients
- Vercel Blob access via signed URLs with expiration
- Rate limiting considered at API gateway / Vercel edge config
### Retry Policy (Inngest)

- Maximum 3 attempts per step
- Exponential backoff: 1s, 4s, 16s
- Jitter applied to prevent thundering herd
- Non-retryable errors (validation, auth, not found) fail immediately
- Failed steps record error details, timestamp, and attempt count in PostgreSQL
  hooks/
    inngest/
      client.ts       - Inngest client singleton
      blueprint.ts    - Durable blueprint generation workflow functions
  lib/
    db.ts             - Drizzle ORM client (Neon connection)
    schema.ts         - Shared Drizzle table definitions (re-exported from drizzle/)
    zod.ts            - Reusable Zod validation helpers
    errors.ts         - Standardized error classes and response shapes
  drizzle/
    schema.ts         - Drizzle table schemas
    migrations/       - Versioned SQL migrations
  types/
    index.ts          - Shared TypeScript types
  api/
    projects/         - Route Handlers: GET/POST /api/projects
    blueprints/       - Route Handlers: GET/POST/PATCH /api/blueprints
    research/         - Route Handlers: POST /api/research
    approvals/        - Route Handlers: POST /api/approvals
    webhooks/         - Inngest webhook handler
7. Each step persists state to PostgreSQL; failures trigger bounded retries.
8. Final blueprint is exported to Vercel Blob and a signed URL is returned.
4. **State in PostgreSQL** — Workflow stages, errors, retries, timestamps, and document versions are persisted in Neon PostgreSQL via Drizzle ORM.
5. **Configurable providers** — LLM and research providers are swappable through adapter interfaces.
6. **Server-side credentials** — All secrets and API keys stay server-side; never exposed to clients.
7. **Validated boundaries** — All external input and all structured model output are validated with Zod.
8. **Authorization enforced** — Ownership and authorization are checked on every project-scoped operation.
9. **No fabrication** — Sources, citations, research activity, approvals, and review results are never fabricated.
10. **Idempotent and safe** — Retries are safe; duplicate approvals and duplicate document versions are prevented.