# Blueprint AI Backend API Plan

## Overview

REST API built with Next.js App Router Route Handlers. All handlers are thin — validation, business logic, and persistence are delegated to service modules. Every endpoint validates input with Zod and returns standardized JSON envelopes.

## Base Conventions

- Base path: `/api`
- Content-Type: `application/json`
- All request bodies validated with Zod schemas
- Standardized success and error envelopes
- Pagination: `?cursor=...&limit=...` (max limit 100)
- ISO-8601 timestamps
- UUIDs for all resource identifiers
- Authorization: Bearer token or session cookie validated on every protected route

## Endpoints

### POST /api/projects

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

---


### POST /api/blueprints

Create a blueprint from a project and enqueue the Inngest workflow.

**Request body:**
```json
{
  "projectId": "uuid"
}
```

**Response (201):** `{ blueprintId: "uuid", status: "pending" }`

**Auth:** Required (project ownership enforced)

**Behavior:** Returns immediately; Inngest function runs durably in background

---

### GET /api/blueprints/:id

Get blueprint status and current state.

**Response (200):** Blueprint object with status, research_summary, clarification_questions, decisions, etc.

**Auth:** Required (project ownership enforced)

**Errors:** 404 if not found, 403 if not owned

---

### POST /api/blueprints/:id/clarify

Submit answers to clarification questions.

**Request body:**
```json
{

### POST /api/research

Trigger a research step manually (for testing/admin).

**Request body:**
```json
{
  "blueprintId": "uuid",
  "query": "string",
  "provider": "string"
}
```

**Response (200):** Research step result with sources

**Auth:** Required

---

### POST /api/approvals

Create or update an approval record.

**Request body:**
```json
{
  "blueprintId": "uuid",
  "type": "clarification | decision | generation | review | final",

## OpenAPI Documentation

- OpenAPI 3.0 specification at `/api/openapi.json`
- Interactive docs at `/api/docs` (Swagger UI or similar)
- All Zod schemas mapped to OpenAPI schemas
- Authentication schemes: bearerAuth (JWT/session)
- Tagged by resource: projects, blueprints, research, approvals, webhooks

## Zod Validation Patterns

All input validation uses Zod with `.strict()` to reject unknown fields. Shared schemas in `src/lib/zod.ts`:

- `uuidSchema` — UUID v4 validation
- `paginationSchema` — cursor and limit
- `projectCreateSchema` — title, description
- `blueprintCreateSchema` — projectId
- `clarificationSubmitSchema` — answers object
- `decisionApproveSchema` — decisionIds, approved boolean
- `finalApproveSchema` — empty object

All service-layer inputs also validated with Zod before database operations.

## Rate Limiting

- Considered at Vercel Edge Config or middleware level
- Authenticated endpoints: higher limits based on user tier
- Webhook endpoint: Inngest-provided signature verification
- Research endpoint: bounded to prevent provider abuse
  "status": "pending | approved | rejected",
  "payload": { ... }
}
```

**Response (200):** Approval object

**Auth:** Required (project ownership enforced)

**Behavior:** Idempotent — prevents duplicate pending approvals of same type per blueprint

---

### GET /api/blueprints/:id/versions

List document versions for a blueprint.

**Response (200):** `{ data: DocumentVersion[], meta: {...} }`

**Auth:** Required (project ownership enforced)

---

### GET /api/blueprints/:id/versions/:versionId/download

Get signed URL to download a document version from Vercel Blob.

**Response (200):** `{ downloadUrl: "string", expiresAt: "ISO-8601" }`

**Auth:** Required (project ownership enforced)

---

### POST /api/webhooks/inngest

Inngest webhook endpoint for durable workflow execution.

**Auth:** Inngest signature verification (no user auth)

**Behavior:** Triggers Inngest functions for blueprint workflow steps
  "answers": { "questionId": "string" }
}
```

**Response (200):** Updated blueprint

**Auth:** Required (project ownership enforced)

**Behavior:** Creates/updates approval record of type `clarification`

---

### POST /api/blueprints/:id/decisions

Approve consequential decisions.

**Request body:**
```json
{
  "decisionIds": ["uuid", ...],
  "approved": boolean
}
```

**Response (200):** Updated blueprint

**Auth:** Required (project ownership enforced)

**Behavior:** Creates/updates approval records of type `decision`

---

### POST /api/blueprints/:id/review-results

Submit independent review results (system-generated, not user-submitted).

**Request body:**
```json
{
  "reviewResults": { ... }
}
```

**Response (200):** Updated blueprint

**Auth:** Required (project ownership enforced)

**Behavior:** Creates/updates approval record of type `review`

---

### POST /api/blueprints/:id/final-approve

Give final approval to the blueprint.

**Request body:** `{}`

**Response (200):** Blueprint with `approved: true`, `approvedAt`, `approvedBy`

**Auth:** Required (project ownership enforced)

**Behavior:** Idempotent — returns 409 if already approved
### GET /api/projects

List user's projects with pagination.

**Query params:** `?cursor=...&limit=...`

**Response (200):** `{ data: Project[], meta: { nextCursor?: string } }`

**Auth:** Required

---

### GET /api/projects/:id

Get a single project by ID.

**Response (200):** Project object

**Auth:** Required (ownership enforced)

**Errors:** 404 if not found, 403 if not owned

---

### PATCH /api/projects/:id

Update project title or description.

**Request body:** Partial project fields

**Response (200):** Updated project

**Auth:** Required (ownership enforced)

## Success Response Envelope

```json
{
  "data": { ... },
  "meta": { "requestId": "uuid", "timestamp": "ISO-8601" }
}
```

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