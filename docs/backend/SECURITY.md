# Blueprint AI Backend Security

## Overview

Security is implemented at every layer — not as a final pass. Credentials stay server-side, all input is validated, authorization is enforced on every project-scoped operation, and no secrets or sensitive data leak to clients.

## Authentication

- Sessions validated server-side on every protected route
- Auth provider: TBD (see `DECISIONS.md` → U1)
- User identity derived from the validated session token, never from client-provided headers
- Tokens stored in HTTP-only, Secure, SameSite cookies where applicable
- No authentication state stored in localStorage or exposed via client-side JavaScript
- The Inngest endpoint (`/api/inngest`) is not user-authenticated — it is protected by Inngest signature verification instead

## Authorization

- Ownership enforced on every project-scoped operation (projects, blueprints, research_steps, approvals, document_versions)
- The ownership check lives in the service layer and runs before any database mutation — hiding a UI control is not authorization
- Authorization failures return 403 — never 404 for existing resources owned by others (prevents information leakage)
- No role-based escalation in MVP; all users have equal access to their own resources

## Credential Management

- All secrets loaded exclusively from `process.env`
- No secrets hardcoded in source code
- No secrets committed to version control
- `.env.example` contains safe placeholder names only (no real values)
- Vercel environment variables used for production secrets
- Provider API keys (OpenAI, Anthropic, research APIs, etc.) accessible only within server-side service/integration modules

## Input Validation

- All external input validated with Zod at the API Route Handler boundary
- All internal model outputs (LLM responses, provider responses) validated with Zod before database persistence
- Zod `.strict()` used to reject unknown fields
- No query string or body data trusted without validation
- Pagination `limit` clamped to a maximum of 100
- File uploads validated for type, size, and name before Vercel Blob storage

## Untrusted Content and Prompt Injection

- Research results, scraped pages, and uploaded files are **data**, never instructions
- Fetched content is delimited and passed to the model as untrusted reference material; it cannot alter the system prompt, tool permissions, or the workflow's instruction set
- Model output that embeds fetched text is still schema-validated before persistence
- Retrieved URLs are validated (scheme, host allowlist where configured) before fetching, and redirects to disallowed schemes are rejected
- A model instruction embedded in a source document is treated as content to be reported on, not as a command to follow
- No fetched content is rendered back to a client without validation and escaping

## Output Sanitization

- No internal stack traces returned to clients — generic error messages only
- No secrets, tokens, or PII logged to stdout/stderr in production
- Error responses use the standardized shape without internal implementation details
- Vercel Blob download URLs expire after a bounded TTL and are minted per request

## Provider Security

- LLM and research provider API calls made server-side only
- Provider responses validated before use — never blindly trusted
- Research results include source URLs and timestamps; no fabricated sources
- LLM output never rendered without validation
- Provider API keys are never included in prompts, logs, or error details

## Abuse Prevention

- Rate limiting considered at Vercel Edge Config or middleware level
- Research endpoints bounded to prevent provider quota exhaustion
- Inngest endpoint protected by Inngest signature verification
- Duplicate prevention: partial unique index on `(blueprint_id, type)` where `status = 'pending'` for approvals, and a unique constraint on `document_versions(blueprint_id, version)`
- Idempotency keys for write operations where appropriate — a repeated key returns the original result rather than creating a second resource
- Approval and generation endpoints are guarded state transitions, so a replayed request cannot skip a stage or create a second version

## Database Security

- Neon PostgreSQL with connection pooling via `@neondatabase/serverless`
- Foreign key constraints with `ON DELETE CASCADE` for user-owned resources
- Row-level ownership checks at the application layer (Drizzle does not enforce RLS by default)
- Parameterized queries only — no string interpolation in SQL
- Migration files reviewed before deployment; no destructive migrations without authorization

## Vercel Blob Security

- Uploads authenticated server-side before any Blob write
- Downloads via time-limited signed URLs / download URLs
- Blob tokens never exposed in client-side code
- File type and size validation before upload
- Blob pathname derived server-side from validated identifiers, never taken raw from user input

## Transport and Headers

- HTTPS only; HSTS enabled at the edge
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`
- `Content-Security-Policy` restricted to the API's own origins — the API serves no third-party scripts
- `Cache-Control: no-store` on authenticated responses and on any response containing document content

## API Surface

- `/api/openapi.json` exposes the API contract; in production it is either restricted to internal traffic or served without authentication only if the schema contains no sensitive detail
- Error responses never leak stack traces, SQL, provider payloads, or environment values
- Unauthenticated requests to protected routes return 401 without revealing whether the underlying resource exists

## Incident Boundaries

- Failed auth attempts logged (count only, no credentials)
- Provider errors caught and converted to generic client messages
- Workflow failures recorded in PostgreSQL with error details (no secrets)
- No production stack traces exposed via API responses
