import { pgTable, text, timestamp, uuid, index, integer, jsonb, unique, numeric, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  imageUrl: text("image_url"),
  provider: text("provider").notNull(),
  providerId: text("provider_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projects = pgTable(
  "projects",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index("projects_user_id_idx").on(table.userId),
  }),
);

export const blueprints = pgTable(
  "blueprints",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    status: text("status").notNull().default("pending"),
    researchSummary: jsonb("research_summary"),
    clarificationQuestions: jsonb("clarification_questions"),
    clarificationAnswers: jsonb("clarification_answers"),
    decisions: jsonb("decisions"),
    generatedContent: jsonb("generated_content"),
    reviewResults: jsonb("review_results"),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectIdIdx: index("blueprints_project_id_idx").on(table.projectId),
    statusIdx: index("blueprints_status_idx").on(table.status),
    projectVersionUnique: unique("blueprints_project_id_version_unique").on(
      table.projectId,
      table.version,
    ),
  }),
);

export const researchSteps = pgTable(
  "research_steps",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    blueprintId: uuid("blueprint_id")
      .notNull()
      .references(() => blueprints.id, { onDelete: "cascade" }),
    query: text("query").notNull(),
    provider: text("provider").notNull(),
    sources: jsonb("sources").notNull(),
    findings: text("findings"),
    confidence: numeric("confidence"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    blueprintIdIdx: index("research_steps_blueprint_id_idx").on(table.blueprintId),
  }),
);

export const approvals = pgTable(
  "approvals",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    blueprintId: uuid("blueprint_id")
      .notNull()
      .references(() => blueprints.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    status: text("status").notNull().default("pending"),
    payload: jsonb("payload"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    blueprintIdIdx: index("approvals_blueprint_id_idx").on(table.blueprintId),
    statusIdx: index("approvals_status_idx").on(table.status),
    pendingUnique: uniqueIndex("approvals_blueprint_id_type_pending_unique")
      .on(table.blueprintId, table.type)
      .where(sql`status = 'pending'`),
  }),
);

export const documentVersions = pgTable(
  "document_versions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    blueprintId: uuid("blueprint_id")
      .notNull()
      .references(() => blueprints.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    content: jsonb("content").notNull(),
    blobUrl: text("blob_url"),
    blobToken: text("blob_token"),
    changeSummary: text("change_summary"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    blueprintIdIdx: index("document_versions_blueprint_id_idx").on(table.blueprintId),
    blueprintVersionUnique: unique("document_versions_blueprint_id_version_unique").on(
      table.blueprintId,
      table.version,
    ),
  }),
);

export const schema = { users, projects, blueprints, researchSteps, approvals, documentVersions };

export default schema;
