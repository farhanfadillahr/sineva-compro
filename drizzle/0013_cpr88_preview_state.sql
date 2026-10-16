CREATE TABLE "preview_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"target" text NOT NULL,
	"locale" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "preview_state_kind_check" CHECK ("preview_state"."kind" IN ('page', 'service')),
	CONSTRAINT "preview_state_object" CHECK (jsonb_typeof("preview_state"."data") = 'object')
);
--> statement-breakpoint
ALTER TABLE "preview_state" ADD CONSTRAINT "preview_state_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "preview_state_expires_idx" ON "preview_state" USING btree ("expires_at");