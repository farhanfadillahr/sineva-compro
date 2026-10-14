CREATE TABLE "auth_lockout" (
	"user_id" text PRIMARY KEY NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	CONSTRAINT "auth_lockout_attempts_range" CHECK ("auth_lockout"."failed_attempts" between 0 and 5)
);
--> statement-breakpoint
ALTER TABLE "auth_lockout" ADD CONSTRAINT "auth_lockout_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;