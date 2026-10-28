# Blueprint AI Backend Security

## Overview

Security is implemented at every layer — not as a final pass. Credentials stay server-side, all input is validated, authorization is enforced on every project-scoped operation, and no secrets or sensitive data leak to clients.

## Authentication

- Sessions validated server-side on every protected route
- Auth provider: TBD (see DECISIONS.md — Clerk, NextAuth custom, or custom JWT)
- User identity derived from validated session token, never from client-provided headers
- Tokens stored in HTTP-only, Secure, SameSite cookies where applicable
- No authentication state stored in localStorage or exposed via client-side JS

## Authorization

- Ownership enforced on every project-scoped operation (projects, blueprints, research_steps, approvals, document_versions)
- Middleware checks `user_id` ownership before service layer executes
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

- All external input validated with Zod at API Route Handler boundary
- All internal model outputs (LLM responses, provider responses) validated with Zod before database persistence
- Zod `.strict()` used to reject unknown fields
- No query string or body data trusted without validation
- File uploads validated for type, size, and name before Vercel Blob storage

## Output Sanitization

- No internal stack traces returned to clients — generic error messages only
- No secrets, tokens, or PII logged to stdout/stderr in production
- Error responses use standardized shape without internal implementation details
- Vercel Blob signed URLs expire after a bounded TTL

## Provider Security

- LLM and research provider API calls made server-side only
- Provider responses validated before use — never blindly trusted
- No prompt injection protection delegated to client
- Research results include source URLs and timestamps; no fabricated sources
- LLM output never rendered without validation

## Abuse Prevention

- Rate limiting considered at Vercel Edge Config or middleware level
- Research endpoints bounded to prevent provider quota exhaustion
- Webhook endpoints protected by Inngest signature verification
- Duplicate prevention: unique constraints on `(blueprint_id, type, status='pending')` for approvals
- Idempotency keys for write operations where appropriate

## Database Security

- Neon PostgreSQL with connection pooling via `@neondatabase/serverless`
- Foreign key constraints with `ON DELETE CASCADE` for user-owned resources
- Row-level ownership checks at application layer (Drizzle does not enforce RLS by default)
- Parameterized queries only — no string interpolation in SQL
- Migration files reviewed before deployment; no destructive migrations without authorization

## Vercel Blob Security

- Uploads authenticated server-side before Blob write
- Downloads via signed URLs with expiration
- Blob tokens never exposed in client-side code
- File type and size validation before upload

## Incident Boundaries

- Failed auth attempts logged (count only, no credentials)
- Provider errors caught and converted to generic client messages
- Workflow failures recorded in PostgreSQL with error details (no secrets)
- No production stack traces exposed via API responses