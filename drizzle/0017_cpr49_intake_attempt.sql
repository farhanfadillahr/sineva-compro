CREATE TABLE "intake_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"client_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "intake_attempt_kind" CHECK ("intake_attempt"."kind" IN ('contact', 'waitlist'))
);
--> statement-breakpoint
CREATE INDEX "intake_attempt_client_idx" ON "intake_attempt" USING btree ("client_hash","created_at" DESC NULLS LAST);