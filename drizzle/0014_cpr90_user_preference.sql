CREATE TABLE "user_preference" (
	"user_id" text PRIMARY KEY NOT NULL,
	"density" text DEFAULT 'comfortable' NOT NULL,
	"sidebar_collapsed" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_preference_density" CHECK ("user_preference"."density" IN ('comfortable', 'compact'))
);
--> statement-breakpoint
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;