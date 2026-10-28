# Blueprint AI Backend — Architectural Decisions

## Overview

Records key architectural decisions, trade-offs considered, rejected alternatives, and unresolved items. This is a living document updated as decisions are made or reversed.

## Decisions

### D1: Monorepo — Single TypeScript codebase on Vercel

**Decision:** One TypeScript codebase deployable to Vercel via Next.js App Router Route Handlers.

**Rationale:**
- Meets requirement #1 (one codebase deployable to Vercel)
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
- Meets requirement #4 (workflow state and approvals in PostgreSQL)
- Meets requirement for versioned migrations
- Neon's serverless architecture fits Vercel deployment
- Drizzle is TypeScript-native, type-safe, and lightweight
- No ORM magic — SQL is explicit and visible

**Alternatives considered:**
- Prisma (rejected — heavier runtime, less SQL transparency)
- TypeORM (rejected — decorator-heavy, less aligned with strict TypeScript)
- Supabase (rejected — adds features not needed; vendor lock-in concerns)

### D5: Validation — Zod

**Decision:** Zod for validation of all external and internal data boundaries.

**Rationale:**
- Meets requirement #8 (validate all external input and structured model output)
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
- Meets requirement for Vercel Blob
- Native Vercel integration, no separate infrastructure
- Signed URLs for secure, time-limited access
- Simple API for upload/download/delete

**Alternatives considered:**
- AWS S3 (rejected — additional infrastructure, credentials management)
- Cloudflare R2 (rejected — not native to Vercel ecosystem)
- Local filesystem (rejected — not possible on serverless Vercel)

### D9: No frontend — Backend only

**Decision:** Backend is the only deliverable in this phase. No frontend pages, UI components, or separate frontend application.

**Rationale:**
- Meets product requirement (backend is the only deliverable)
- Route Handlers provide complete REST API
- Frontend can be added later as separate concern
- API-first design enables any frontend (web, mobile, CLI)

**Status:** DECIDED

### D10: No mock substitutions

**Decision:** Never silently substitute mock implementations for real integrations.

**Rationale:**
- Meets requirement #15
- All integrations (LLM, research, Blob, Inngest) use real providers
- Tests use test doubles only at boundaries, never in production code paths
- Feature flags or config switches can disable integrations for local dev, but never silently

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
- Model quality for research, clarification, generation, review tasks
- Cost
- Rate limits
- Feature support (function calling, JSON mode, etc.)

**Decision needed before:** Task 4.1 (Mastra agents)

### U4: Email delivery for approval notifications

**Options:** Resend, SendGrid, AWS SES, or none (polling only)

**Factors to consider:**
- User experience (email vs polling for approval status)
- Cost
- Deliverability
- Implementation complexity

**Decision needed before:** Task 6.2 (Blueprint Route Handlers with notifications)

### U5: Inngest deployment

**Options:** Inngest Cloud (managed) or self-hosted

**Factors to consider:**
- Operational overhead
- Cost
- Data residency requirements

**Decision needed before:** Task 5.1 (Inngest client and workflow)

## Decision Review Process

- Each decision recorded with rationale, alternatives, and status
- Unresolved decisions block dependent implementation tasks
- Decisions can be revisited with new evidence, but require updating this document
- No architecture decision is final until implemented and verified

**Status:** DECIDED

### D7: Testing — Vitest

**Decision:** Vitest for unit and integration tests.

**Rationale:**
- Meets requirement for Vitest
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
- Meets requirement for OpenAPI documentation
- Zod schemas serve as single source of truth for validation and API docs
- Auto-generated spec stays in sync with implementation
- Interactive docs available for developers

**Alternatives considered:**
- Swagger 2.0 (rejected — deprecated in favor of OpenAPI 3.0)
- Manual OpenAPI YAML (rejected — drifts from implementation; Zod is source of truth)
- GraphQL (rejected — not requested; REST is simpler for this use case)

**Status:** DECIDED
- MongoDB (rejected — relational data model fits workflow state better)

**Status:** DECIDED

### D3: Background execution — Inngest

**Decision:** Inngest for durable background execution, retries, and resumable workflows.

**Rationale:**
- Meets requirement #5 (never depend on HTTP request remaining open)
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

**Decision:** Mastra for AI agents and workflow orchestration, with LLM provider adapter pattern.

**Rationale:**
- Meets requirement #6 (LLM providers configurable through adapters)
- Mastra provides agent framework with built-in workflow capabilities
- Adapter pattern allows swapping OpenAI, Anthropic, or other providers
- TypeScript-native, designed for production AI applications

**Alternatives considered:**
- LangChain (rejected — heavier, more abstraction layers than needed)
- LlamaIndex (rejected — more focused on RAG; agent framework is secondary)
- Custom agent framework (rejected — reinventing wheel; Mastra is established)
- Vercel AI SDK only (rejected — good for generation, lacks workflow/orchestration)

**Status:** DECIDED