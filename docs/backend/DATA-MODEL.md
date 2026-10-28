# Blueprint AI Backend Data Model

## Overview

All workflow state, approvals, research records, and document versions are persisted in Neon PostgreSQL using Drizzle ORM with versioned migrations. No state is kept in memory or ephemeral storage.

## Entity Relationship Diagram (text)

```
users 1─< projects 1─< blueprints 1─< document_versions

## Tables

### users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | User identifier |
| email | text | UNIQUE, NOT NULL | User email address |
| name | text | NULLABLE | Display name |
| image_url | text | NULLABLE | Profile image URL |
| provider | text | NOT NULL | Auth provider (clerk, nextauth, custom) |
| provider_id | text | NOT NULL | External provider subject ID |
| created_at | timestamptz | NOT NULL, default now() | Record creation timestamp |
| updated_at | timestamptz | NOT NULL, default now() | Last update timestamp |

### projects

### blueprints

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Blueprint identifier |
| project_id | uuid | FK → projects.id, NOT NULL, indexed | Owning project |
| version | integer | NOT NULL, default 1 | Blueprint version number |
| status | text | NOT NULL, default 'pending' | pending, research_complete, clarification_complete, decisions_approved, generating, review_complete, approved, rejected |
| research_summary | jsonb | NULLABLE | Aggregated research findings with sources |
| clarification_questions | jsonb | NULLABLE | Questions asked to user |
| clarification_answers | jsonb | NULLABLE | User-provided answers |
| decisions | jsonb | NULLABLE | Consequential decisions awaiting or approved |
| generated_content | jsonb | NULLABLE | Generated document sections |
| review_results | jsonb | NULLABLE | Independent review agent output |
| approved_by | uuid | FK → users.id, NULLABLE | User who gave final approval |
| approved_at | timestamptz | NULLABLE | Final approval timestamp |

### research_steps

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Research step identifier |
| blueprint_id | uuid | FK → blueprints.id, NOT NULL, indexed | Owning blueprint |
| query | text | NOT NULL | Research query executed |
| provider | text | NOT NULL | Research provider used |
| sources | jsonb | NOT NULL | Array of {url, title, snippet, fetched_at} |
| findings | text | NULLABLE | Summarized findings |
| confidence | numeric | NULLABLE, 0-1 | Confidence score |
| created_at | timestamptz | NOT NULL, default now() | Record creation timestamp |

### approvals

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|

### document_versions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Document version identifier |
| blueprint_id | uuid | FK → blueprints.id, NOT NULL, indexed | Owning blueprint |
| version | integer | NOT NULL | Version number |
| content | jsonb | NOT NULL | Full document content |
| blob_url | text | NULLABLE | Vercel Blob signed URL |
| blob_token | text | NULLABLE | Blob access token |
| change_summary | text | NULLABLE | Human-readable change description |
| created_by | uuid | FK → users.id, NOT NULL | User who created this version |
| created_at | timestamptz | NOT NULL, default now() | Record creation timestamp |

## Indexes

- `projects(user_id)` — ownership queries

## Constraints

- `blueprints.version` — unique per project (prevents duplicate versions)
- `approvals` — unique (blueprint_id, type, status='pending') — prevents duplicate pending approvals of same type
- `document_versions(blueprint_id, version)` — unique version per blueprint
- Foreign keys with `ON DELETE CASCADE` for user-owned resources

## Migration Strategy

- Versioned SQL migrations in `drizzle/migrations/`
- Each migration is additive and backward-compatible where possible
- Migrations run via Drizzle Kit on deployment
- No destructive migrations without explicit authorization and rollback plan

## Workflow State Values

### Project Status

- `draft` — Initial state, idea submitted
- `researching` — Research steps in progress
- `clarifying` — Clarification questions awaiting user answers
- `deciding` — Consequential decisions awaiting approval
- `generating` — Document generation in progress
- `reviewing` — Independent review in progress
- `approved` — Final blueprint approved
- `archived` — Project archived by user

### Blueprint Status

- `pending` — Initial state
- `research_complete` — All research steps finished
- `clarification_complete` — All user answers received
- `decisions_approved` — All consequential decisions signed off
- `generating` — Document generation active
- `review_complete` — Independent review finished
- `approved` — Final approval given
- `rejected` — Blueprint rejected at some stage

### Approval Types

- `clarification` — User answers to clarification questions
- `decision` — Consequential architecture/design decisions
- `generation` — Generated document content
- `review` — Independent review results
- `final` — Final blueprint sign-off

## PromptForge Integration Considerations

- `blueprints.generated_content` uses `jsonb` to allow flexible document structure
- `research_steps.sources` stores citation data for future PromptForge citation API
- `document_versions.content` is versioned to support PromptForge document comparison
- All tables include `created_at`/`updated_at` for audit trails
- `blueprints(project_id)` — project → blueprints lookup
- `blueprints(status)` — workflow status queries
- `research_steps(blueprint_id)` — blueprint research steps
- `approvals(blueprint_id)` — blueprint approvals
- `approvals(status)` — pending approval queries
- `document_versions(blueprint_id)` — version history
- `users(email)` — auth lookup
- `users(provider, provider_id)` — auth lookup
| id | uuid | PK, default gen_random_uuid() | Approval record identifier |
| blueprint_id | uuid | FK → blueprints.id, NOT NULL, indexed | Owning blueprint |
| user_id | uuid | FK → users.id, NOT NULL | Approving user |
| type | text | NOT NULL | clarification, decision, generation, review, final |
| status | text | NOT NULL, default 'pending' | pending, approved, rejected |
| payload | jsonb | NULLABLE | The item being approved (questions, decisions, content, etc.) |
| decided_at | timestamptz | NULLABLE | When decision was made |
| created_at | timestamptz | NOT NULL, default now() | Record creation timestamp |
| updated_at | timestamptz | NOT NULL, default now() | Last update timestamp |
| created_at | timestamptz | NOT NULL, default now() | Record creation timestamp |
| updated_at | timestamptz | NOT NULL, default now() | Last update timestamp |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Project identifier |
| user_id | uuid | FK → users.id, NOT NULL, indexed | Owning user |
| title | text | NOT NULL | Project title |
| description | text | NOT NULL | Rough software idea / description |
| status | text | NOT NULL, default 'draft' | draft, researching, clarifying, deciding, generating, reviewing, approved, archived |
| created_at | timestamptz | NOT NULL, default now() | Record creation timestamp |
| updated_at | timestamptz | NOT NULL, default now() | Last update timestamp |
users 1─< approvals
projects 1─< research_steps
blueprints 1─< research_steps
blueprints 1─< approvals
blueprints 1─< document_versions
```