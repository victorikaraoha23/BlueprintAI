CREATE TABLE "blueprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"research_summary" jsonb,
	"clarification_questions" jsonb,
	"clarification_answers" jsonb,
	"decisions" jsonb,
	"generated_content" jsonb,
	"review_results" jsonb,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blueprints_project_id_version_unique" UNIQUE("project_id","version")
);
--> statement-breakpoint
ALTER TABLE "blueprints" ADD CONSTRAINT "blueprints_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blueprints" ADD CONSTRAINT "blueprints_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blueprints_project_id_idx" ON "blueprints" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "blueprints_status_idx" ON "blueprints" USING btree ("status");