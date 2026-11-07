# AGENTS.md — Blueprint AI Backend

## Project

Blueprint AI backend (Next.js 16 App Router) that turns software ideas into researched, validated, implementation-ready documentation.

- Durable workflow orchestrated by Inngest; powered by Mastra AI agents; research via swappable providers.
- PostgreSQL via Drizzle (Neon); file storage via Vercel Blob; deployed on Vercel.
- Backend only — no frontend pages or separate frontend app (see `docs/backend/DECISIONS.md` → D9).

Current state: **scaffold + design docs only.** The backend is not implemented. `src/app/` contains a minimal App Router shell; `src/app/api/**` does not exist yet.

Requires Node `>=22.13.0` (Next 16 needs `>=20.9.0`; `@mastra/core` needs `>=22.13.0`).

## Commands

- `npm run dev` — Next.js dev server
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — `eslint .` (flat config; `next lint` was removed in Next 16)
- `npm run typecheck` — `tsc --noEmit` (strict mode + `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `isolatedModules` enabled)
- `npm run test` / `npm run test:watch` — Vitest
- `npm run db:generate` / `db:migrate` / `db:studio` — Drizzle Kit

`npm run db:generate` fails until `src/drizzle/schema.ts` exists — that is expected until Phase 1 of the implementation plan.

## Architecture essentials

- Thin API route handlers (`src/app/api/**` — App Router only routes files inside `app/`) → service layer → Inngest durable workflow → research/AI provider → PostgreSQL.
- Long-running work runs via Inngest; handlers return immediately with a `blueprintId`.
- Zod v4 validation at boundaries (input + LLM output); standardized error envelope; per-project ownership checks; `?cursor=&limit=` pagination (max 100); UUIDs; ISO-8601.
- API base path is `/api` (no version segment) — see `docs/backend/DECISIONS.md` → D12.
- Route Handlers live under `src/app/api/**`, not `src/api/**` — see `docs/backend/DECISIONS.md` → D13.
- Duplicate approvals and duplicate document versions are prevented by database constraints, not application-level checks.
- Research sources, approvals, and review results are never fabricated.

## Environment

- Required vars (see `.env.example`): `DATABASE_URL`, `INNGEST_EVENT_KEY`, `INNGEST_API_URL`, `VERCEL_BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_BASE_URL` (`/api`). Server-only secrets — never commit `.env`.
- Optional vars (also in `.env.example`): `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `AUTH_SECRET`.

## Docs

- Design docs: `docs/backend/ARCHITECTURE.md`, `API-PLAN.md`, `DATA-MODEL.md`, `DECISIONS.md`, `IMPLEMENTATION-PLAN.md`, `SECURITY.md`.
- Five decisions still block implementation tasks (U1–U5 in `DECISIONS.md`): authentication provider, research provider, LLM provider, approval notification channel, Inngest deployment mode. Tasks not blocked by them may proceed.
- Dependency versions are pinned to current stable releases — see `DECISIONS.md` → D11 and the pin table in `IMPLEMENTATION-PLAN.md`. Do not upgrade a pin without re-checking its peer ranges.
