# Blueprint AI Backend — Architectural Decisions

## Overview

Records key architectural decisions, trade-offs considered, rejected alternatives, and unresolved items. This is a living document updated as decisions are made or reversed.

## Decisions

### D1: Monorepo — Single TypeScript codebase on Vercel

**Decision:** One TypeScript codebase deployable to Vercel via Next.js App Router Route Handlers.

**Rationale:**
- Meets the requirement for one codebase deployable to Vercel
- Simplest deployment model — single git repo, single Vercel project
- Shared types between API and service layers
- No API gateway or service mesh complexity

**Alternatives considered:**
- Monorepo with separate packages (rejected — adds tooling complexity without current need)
- Microservices (rejected — premature for MVP; no team scaling or independent deploy needs)

**Status:** DECIDED

### D2: Database — Neon PostgreSQL + Drizzle ORM

**Decision:** Neon PostgreSQL as primary database; Drizzle ORM for data access; versioned SQL migrations.

**Rationale:**
- Meets the requirement for workflow state and approvals in PostgreSQL
- Meets the requirement for versioned migrations
- Neon's serverless architecture fits Vercel deployment
- Drizzle is TypeScript-native, type-safe, and lightweight
- No ORM magic — SQL is explicit and visible

**Alternatives considered:**
- Prisma (rejected — heavier runtime, less SQL transparency)
- TypeORM (rejected — decorator-heavy, less aligned with strict TypeScript)
- Supabase (rejected — adds features not needed; vendor lock-in concerns)
- MongoDB (rejected — relational data model fits workflow state better)

**Status:** DECIDED

### D3: Background execution — Inngest

**Decision:** Inngest for durable background execution, retries, and resumable workflows.

**Rationale:**
- Meets the requirement that no operation depends on an HTTP request remaining open
- Durable execution with automatic retries and resumability
- No infrastructure to manage (Inngest Cloud or self-hosted)
- TypeScript-native with first-class Next.js integration
- Workflow state tracked in PostgreSQL

**Alternatives considered:**
- Temporal (rejected — requires self-managed infrastructure, heavier operational burden)
- BullMQ + Redis (rejected — adds Redis dependency; not as durable by default)
- Next.js background APIs (rejected — not durable; request can be terminated)
- Simple cron + polling (rejected — not resumable, no built-in retry semantics)

**Status:** DECIDED

### D4: AI orchestration — Mastra with adapter pattern

**Decision:** Mastra (`@mastra/core`) for AI agents and workflow orchestration, with an LLM provider adapter pattern.

**Rationale:**
- Meets the requirement that LLM providers are configurable through adapters
- Mastra provides an agent framework with built-in workflow capabilities
- Adapter pattern allows swapping OpenAI, Anthropic, or other providers
- TypeScript-native, designed for production AI applications

**Alternatives considered:**
- LangChain (rejected — heavier, more abstraction layers than needed)
- LlamaIndex (rejected — more focused on RAG; agent framework is secondary)
- Custom agent framework (rejected — reinventing the wheel; Mastra is established)
- Vercel AI SDK alone (rejected — good for generation, lacks workflow/orchestration)

**Status:** DECIDED

### D5: Validation — Zod

**Decision:** Zod for validation of all external and internal data boundaries.

**Rationale:**
- Meets the requirement to validate all external input and structured model output
- TypeScript-first — infers types from schemas
- Shared schemas between API and service layers
- `.strict()` rejects unknown fields
- Active maintenance and wide adoption

**Alternatives considered:**
- Joi (rejected — not TypeScript-native)
- Yup (rejected — less TypeScript integration than Zod)
- Superstruct (rejected — smaller ecosystem, less mature)
- Class-validator (rejected — decorator-based, less functional)

**Status:** DECIDED

### D6: File storage — Vercel Blob

**Decision:** Vercel Blob for uploaded reference files and document exports.

**Rationale:**
- Meets the Vercel Blob requirement
- Native Vercel integration, no separate infrastructure
- Time-limited signed access for secure document delivery
- Simple API for upload/download/delete

**Alternatives considered:**
- AWS S3 (rejected — additional infrastructure, credentials management)
- Cloudflare R2 (rejected — not native to the Vercel ecosystem)
- Local filesystem (rejected — not possible on serverless Vercel)

**Status:** DECIDED

### D7: Testing — Vitest

**Decision:** Vitest for unit and integration tests.

**Rationale:**
- Meets the Vitest requirement
- Fast, Vite-native, TypeScript-first
- Good Next.js integration
- Parallel test execution, watch mode, coverage

**Alternatives considered:**
- Jest (rejected — slower, more configuration)
- Mocha (rejected — older, less TypeScript integration)
- Bun test (rejected — requires Bun runtime, not Node)

**Status:** DECIDED

### D8: API documentation — OpenAPI 3.0

**Decision:** OpenAPI 3.0 specification generated from Zod schemas.

**Rationale:**
- Meets the OpenAPI documentation requirement
- Zod schemas serve as single source of truth for validation and API docs
- Auto-generated spec stays in sync with implementation
- Interactive docs available for developers

**Alternatives considered:**
- Swagger 2.0 (rejected — deprecated in favor of OpenAPI 3.0)
- Manual OpenAPI YAML (rejected — drifts from implementation; Zod is the source of truth)
- GraphQL (rejected — not requested; REST is simpler for this use case)

**Status:** DECIDED

### D9: No frontend — Backend only

**Decision:** Backend is the only deliverable in this phase. No frontend pages, UI components, or separate frontend application.

**Rationale:**
- Meets the product requirement (backend is the only deliverable)
- Route Handlers provide a complete REST API
- Frontend can be added later as a separate concern
- API-first design enables any frontend (web, mobile, CLI)

**Status:** DECIDED

### D10: No mock substitutions

**Decision:** Never silently substitute mock implementations for real integrations.

**Rationale:**
- Meets the requirement for real integrations
- All integrations (LLM, research, Blob, Inngest) use real providers
- Tests use test doubles only at boundaries, never in production code paths
- Feature flags or config switches can disable integrations for local dev, but never silently

**Status:** DECIDED

### D11: Dependency versions — pinned to current stable releases

**Decision:** Pin every dependency to the current stable release (caret ranges), verified against the npm registry and the installed type definitions rather than against remembered or blog-post versions.

**Rationale:**
- The previous scaffold pinned `next@15.2.3`, `mastra@^0.3.0`, `inngest@^3.26.0`, `zod@^3.24.2`, and `vitest@^3.1.1` — several majors behind, and `mastra@0.3` predates the current agent API entirely
- `next lint` was removed in Next 16; the lint script now runs `eslint .` with a flat config
- `experimental.serverComponentsExternalPackages` was replaced by the top-level `serverExternalPackages` key
- The `@mastra/core` package is used directly instead of the `mastra` meta-package, which pulls in `@mastra/deployer` and deployment concerns the API does not need
- Version claims were verified against `npm view` output and the installed `.d.ts` files rather than assumed

**Specific constraints discovered during verification:**
- TypeScript is pinned to `^5.9.3`, not the newer 7.x line, because `typescript-eslint@8.x` (bundled with `eslint-config-next@16.4.3`) requires TypeScript `>=4.8.4 <6.0.0`
- ESLint is pinned to `^9.39.5`, not ESLint 10, because `eslint-plugin-jsx-a11y@6`, `eslint-plugin-import@2`, and `eslint-plugin-react@7` — all pulled in by `eslint-config-next@16.4.3` — declare peer ranges that stop at ESLint 9
- `zod-to-openapi@6.2.0` does not exist (the previous install failed on this); the Zod v4-compatible package is `@asteasolutions/zod-to-openapi@^9.1.0`
- `vitest@5` requires an explicit `vite` peer (`^6.4 || ^7 || ^8`); `vite@^8.3.5` is added as a dev dependency

**Alternatives considered:**
- Pinning exact versions with no caret (rejected — blocks security and patch updates; the lockfile provides exact reproducibility)
- Staying on older majors for stability (rejected — Next 16, Inngest 4, and Zod 4 are the current supported lines; staying behind means building against APIs that are already being removed)
- Relying on `latest` at install time (rejected — non-reproducible)

**Status:** DECIDED

### D12: API base path — `/api`

**Decision:** All REST endpoints live under `/api` (no version segment).

**Rationale:**
- The original `.env.example` declared `NEXT_PUBLIC_API_BASE_URL="/api/v1"`, which contradicted every design document (`/api`)
- A version segment would be added when the first breaking change ships, not before it exists
- The OpenAPI document records the actual served path, so consumers are never guessing

**Alternatives considered:**
- `/api/v1` (rejected — asserts a version that does not exist yet; all six documents already specify `/api`)
- Root-level `/` (rejected — collides with the App Router page routes)

**Status:** DECIDED

### D13: Route Handlers under `src/app/api/**`

**Decision:** Route Handlers live in `src/app/api/**`, not `src/api/**`.

**Rationale:**
- The Next.js App Router only serves `route.ts` files located inside the `app` directory; a `src/api/**` layout compiles but is never routed
- The original plan specified `src/api/...`, which would have produced a backend that built successfully and answered no requests

**Alternatives considered:**
- `src/api/**` (rejected — not routed by Next.js)
- A catch-all rewrite to a custom directory (rejected — adds indirection and fights the framework)

**Status:** DECIDED

## Unresolved Decisions (Awaiting Approval)

### U1: Authentication provider

**Options:** Clerk, NextAuth (custom), or custom JWT

**Factors to consider:**
- Clerk: fastest setup, managed auth, per-user pricing
- NextAuth: self-managed, flexible, more code to maintain
- Custom JWT: full control, most code, most security responsibility

**Decision needed before:** Task 2.1 (Auth module)

### U2: Research provider

**Options:** Tavily, Serper, Brave Search, custom scraping, or multi-provider

**Factors to consider:**
- Cost per query
- Source quality and citation support
- Rate limits
- Ease of integration

**Decision needed before:** Task 4.2 (Research provider adapters)

### U3: LLM provider

**Options:** OpenAI, Anthropic, or multi-provider adapter

**Factors to consider:**
- Model quality for research, clarification, generation, and review tasks
- Cost
- Rate limits
- Feature support (structured output, tool calling, etc.)

**Decision needed before:** Task 4.1 (Mastra agents)

### U4: Email delivery for approval notifications

**Options:** Resend, SendGrid, AWS SES, or none (polling only)

**Factors to consider:**
- User experience (email vs polling for approval status)
- Cost
- Deliverability
- Implementation complexity

**Decision needed before:** Task 6.4 (Approval notifications)

### U5: Inngest deployment

**Options:** Inngest Cloud (managed) or self-hosted

**Factors to consider:**
- Operational overhead
- Cost
- Data residency requirements

**Decision needed before:** Task 5.1 (Inngest client and workflow)

## Decision Review Process

- Each decision is recorded with rationale, alternatives, and status
- Unresolved decisions block dependent implementation tasks; unrelated tasks proceed
- Decisions can be revisited with new evidence, but require updating this document
- No architecture decision is final until it is implemented and verified
