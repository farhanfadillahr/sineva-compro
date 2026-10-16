CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"segment" text,
	"locale" text NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_email_normalised" CHECK ("waitlist"."email" = lower(btrim("waitlist"."email")) AND length("waitlist"."email") <= 254),
	CONSTRAINT "waitlist_segment_check" CHECK ("waitlist"."segment" IS NULL OR "waitlist"."segment" IN ('Small business','Company','Startup','Other'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_email_unique" ON "waitlist" USING btree ("email");--> statement-breakpoint
CREATE INDEX "waitlist_created_idx" ON "waitlist" USING btree ("created_at" DESC NULLS LAST,"id" DESC NULLS LAST);