# Blueprint AI Backend API Plan

## Overview

REST API built with Next.js App Router Route Handlers under `src/app/api/**`. All handlers are thin — validation, business logic, and persistence are delegated to service modules. Every endpoint validates input with Zod and returns standardized JSON envelopes.

## Base Conventions

- Base path: `/api`
- Content-Type: `application/json`
- All request bodies validated with Zod schemas (`.strict()`)
- Standardized success and error envelopes
- Pagination: `?cursor=...&limit=...` (default 20, max 100)
- ISO-8601 timestamps
- UUIDs for all resource identifiers
- Authorization: Bearer token or session cookie, validated server-side on every protected route
- Optional `Idempotency-Key` request header on mutating endpoints

## Success Response Envelope

```json
{
  "data": { },
  "meta": { "requestId": "uuid", "timestamp": "ISO-8601" }
}
```

List endpoints extend `meta` with pagination state:

```json
{
  "data": [],
  "meta": { "requestId": "uuid", "timestamp": "ISO-8601", "nextCursor": "opaque" }
}
```

`nextCursor` is omitted when there is no further page.

## Error Response Envelope

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

## Endpoints

### Projects

#### POST /api/projects

Create a new project with a software idea.

**Request body:**

```json
{
  "title": "string",
  "description": "string"
}
```

**Response (201):** Project object

**Auth:** Required (user must be authenticated)

**Errors:** 400 validation error

---

#### GET /api/projects

List the authenticated user's projects with cursor pagination.

**Query params:** `?cursor=...&limit=...`

**Response (200):** `{ "data": Project[], "meta": { "nextCursor": "..." } }`

**Auth:** Required — only the caller's own projects are returned

---

#### GET /api/projects/:id

Get a single project by ID.

**Response (200):** Project object

**Auth:** Required (ownership enforced)

**Errors:** 404 if not found, 403 if not owned

---

#### PATCH /api/projects/:id

Update project title, description, or status.

**Request body:**

```json
{
  "title": "string",
  "description": "string",
  "status": "draft | archived"
}
```

**Response (200):** Updated project

**Auth:** Required (ownership enforced)

**Errors:** 400 validation error, 403 if not owned, 404 if not found

---

### Blueprints

#### POST /api/blueprints

Create a blueprint from a project and enqueue the Inngest workflow.

**Request body:**

```json
{
  "projectId": "uuid"
}
```

**Response (201):** `{ "blueprintId": "uuid", "status": "pending" }`

**Auth:** Required (project ownership enforced)

**Behavior:** Returns immediately; the Inngest function runs durably in the background.

**Errors:** 403 if the project is not owned, 409 if a pending blueprint already exists for the project

---

#### GET /api/blueprints/:id

Get blueprint status and current state.

**Response (200):** Blueprint object with `status`, `researchSummary`, `clarificationQuestions`, `decisions`, `reviewResults`, and approval metadata.

**Auth:** Required (project ownership enforced)

**Errors:** 404 if not found, 403 if not owned

---

#### POST /api/blueprints/:id/clarify

Submit answers to clarification questions.

**Request body:**

```json
{
  "answers": { "questionId": "string" }
}
```

**Response (200):** Updated blueprint

**Auth:** Required (project ownership enforced)

**Behavior:** Creates or updates the approval record of type `clarification`.

**Errors:** 409 if the blueprint is not in a state that accepts clarifications, 400 if an answer does not match a pending question

---

#### POST /api/blueprints/:id/decisions

Approve consequential decisions.

**Request body:**

```json
{
  "decisionIds": ["uuid"],
  "approved": true
}
```

**Response (200):** Updated blueprint

**Auth:** Required (project ownership enforced)

**Behavior:** Creates or updates approval records of type `decision`. Rejecting a decision moves the blueprint to `rejected`.

**Errors:** 409 if a decision is not in an approvable state

---

#### POST /api/blueprints/:id/review-results

Submit independent review results (system-generated, not user-submitted).

**Request body:**

```json
{
  "reviewResults": { }
}
```

**Response (200):** Updated blueprint

**Auth:** Required (project ownership enforced)

**Behavior:** Creates or updates the approval record of type `review`. Review results are only accepted from the workflow path — user-facing writes to this endpoint are rejected in the MVP.

---

#### POST /api/blueprints/:id/final-approve

Give final approval to the blueprint.

**Request body:** `{}`

**Response (200):** Blueprint with `approvedAt` and `approvedBy` set

**Auth:** Required (project ownership enforced)

**Behavior:** Idempotent by contract but implemented as a guarded transition — returns 409 if the blueprint is already approved.

**Errors:** 409 if already approved or if the blueprint has not reached `review_complete`

---

#### GET /api/blueprints/:id/versions

List document versions for a blueprint.

**Query params:** `?cursor=...&limit=...`

**Response (200):** `{ "data": DocumentVersion[], "meta": { "nextCursor": "..." } }`

**Auth:** Required (project ownership enforced)

---

#### GET /api/blueprints/:id/versions/:versionId/download

Get a time-limited download URL for a document version stored in Vercel Blob.

**Response (200):** `{ "downloadUrl": "string", "expiresAt": "ISO-8601" }`

**Auth:** Required (project ownership enforced)

**Behavior:** The URL is minted on request via `@vercel/blob` (`getDownloadUrl` / `issueSignedToken`); no permanent blob URL is returned to clients.

**Errors:** 404 if the version or blob does not exist

---

### Research

#### POST /api/research

Trigger a research step manually (testing / admin).

**Request body:**

```json
{
  "blueprintId": "uuid",
  "query": "string",
  "provider": "string"
}
```

**Response (200):** Research step result with sources

**Auth:** Required (project ownership enforced)

**Behavior:** Records a `research_steps` row. If the provider returns nothing, the response contains an empty source list — sources are never synthesised.

**Errors:** 400 if the provider is not a configured adapter, 502 if the provider fails

---

### Approvals

#### GET /api/approvals

List approvals, optionally filtered by blueprint.

**Query params:** `?blueprintId=...&cursor=...&limit=...`

**Response (200):** `{ "data": Approval[], "meta": { "nextCursor": "..." } }`

**Auth:** Required (ownership enforced via the referenced blueprint)

---

#### POST /api/approvals

Create or update an approval record.

**Request body:**

```json
{
  "blueprintId": "uuid",
  "type": "clarification | decision | generation | review | final",
  "status": "pending | approved | rejected",
  "payload": { }
}
```

**Response (200):** Approval object

**Auth:** Required (project ownership enforced)

**Behavior:** Idempotent — the partial unique index on `(blueprint_id, type)` where `status = 'pending'` prevents duplicate pending approvals of the same type. A conflicting concurrent write returns 409.

---

### Inngest

#### GET, POST, PUT /api/inngest

Inngest serve handler for durable workflow execution.

**Auth:** Inngest signature verification (no user auth)

**Behavior:** Exposes the registered Inngest functions and serves the Inngest protocol (event ingestion, function invocation, replay).

---

### OpenAPI

#### GET /api/openapi.json

Serve the generated OpenAPI 3.0 document.

**Response (200):** OpenAPI 3.0 JSON

**Auth:** None in development; behind auth or restricted to internal traffic in production (see `SECURITY.md`).

---

## OpenAPI Documentation

- OpenAPI 3.0 specification served at `/api/openapi.json`
- Interactive docs at `/api/docs` (Swagger UI or similar), added in the same phase as the spec endpoint
- Generated from Zod schemas via `@asteasolutions/zod-to-openapi` (v9 — Zod v4 compatible); Zod remains the single source of truth for validation and documentation
- Authentication schemes: `bearerAuth` (JWT/session)
- Tagged by resource: projects, blueprints, research, approvals, inngest

## Zod Validation Patterns

All input validation uses Zod with `.strict()` to reject unknown fields. Shared schemas in `src/lib/zod.ts`:

- `uuidSchema` — UUID validation
- `paginationSchema` — `cursor` and `limit` (limit max 100, default 20)
- `idempotencyKeySchema` — optional `Idempotency-Key` header
- `projectCreateSchema` — `title`, `description`
- `projectUpdateSchema` — partial `title`, `description`, `status`
- `blueprintCreateSchema` — `projectId`
- `clarificationSubmitSchema` — `answers` object
- `decisionApproveSchema` — `decisionIds`, `approved`
- `reviewSubmitSchema` — `reviewResults`
- `finalApproveSchema` — empty object
- `researchRequestSchema` — `blueprintId`, `query`, `provider`
- `approvalCreateSchema` — `blueprintId`, `type`, `status`, `payload`

Service-layer inputs are validated with the same schemas before any database operation, so a handler bug cannot bypass validation.

## Rate Limiting

- Considered at Vercel Edge Config or middleware level
- Authenticated endpoints: higher limits based on user tier
- Inngest endpoint: protected by Inngest signature verification, not user auth
- Research endpoint: bounded to prevent provider quota exhaustion

## Idempotency

- Mutating endpoints accept an optional `Idempotency-Key` header
- A repeated request with the same key returns the original response instead of creating a duplicate resource
- Server-side uniqueness constraints remain the ultimate guarantee; idempotency keys are a client convenience layered on top
