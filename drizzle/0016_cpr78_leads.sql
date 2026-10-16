CREATE TABLE "lead" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"company" text,
	"segment" text NOT NULL,
	"interest" text NOT NULL,
	"budget" text,
	"message" text NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"locale" text NOT NULL,
	"source_page" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "lead_status_check" CHECK ("lead"."status" IN ('new','contacted','qualified','won','lost')),
	CONSTRAINT "lead_phone_check" CHECK ("lead"."phone" ~ '^[1-9][0-9]{7,14}$'),
	CONSTRAINT "lead_lengths" CHECK (length("lead"."name") <= 80 AND length("lead"."email") <= 254 AND length("lead"."message") <= 1000 AND length("lead"."notes") <= 5000)
);
--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_created_idx" ON "lead" USING btree ("created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "lead_status_idx" ON "lead" USING btree ("status","created_at" DESC NULLS LAST);