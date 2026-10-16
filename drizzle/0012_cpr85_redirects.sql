CREATE TABLE "redirect" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_path" text NOT NULL,
	"to_path" text NOT NULL,
	"status" integer DEFAULT 301 NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "redirect_status_check" CHECK ("redirect"."status" IN (301, 308)),
	CONSTRAINT "redirect_source_check" CHECK ("redirect"."source" IN ('manual', 'auto')),
	CONSTRAINT "redirect_paths_check" CHECK ("redirect"."from_path" ~ '^/[^/]' AND "redirect"."to_path" ~ '^/' AND "redirect"."from_path" <> "redirect"."to_path" AND length("redirect"."from_path") <= 300 AND length("redirect"."to_path") <= 300)
);
--> statement-breakpoint
ALTER TABLE "redirect" ADD CONSTRAINT "redirect_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "redirect_from_path_unique" ON "redirect" USING btree ("from_path");