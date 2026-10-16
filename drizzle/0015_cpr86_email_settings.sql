CREATE TABLE "email_settings" (
	"id" text PRIMARY KEY DEFAULT 'email' NOT NULL,
	"mode" text NOT NULL,
	"smtp_host" text,
	"smtp_port" integer,
	"smtp_security" text,
	"smtp_username" text,
	"secret" text,
	"from_name" text NOT NULL,
	"from_email" text NOT NULL,
	"reply_to" text,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_settings_singleton" CHECK ("email_settings"."id" = 'email'),
	CONSTRAINT "email_settings_mode" CHECK ("email_settings"."mode" IN ('resend-api', 'smtp')),
	CONSTRAINT "email_settings_security" CHECK ("email_settings"."smtp_security" IS NULL OR "email_settings"."smtp_security" IN ('starttls', 'tls')),
	CONSTRAINT "email_settings_port" CHECK ("email_settings"."smtp_port" IS NULL OR "email_settings"."smtp_port" BETWEEN 1 AND 65535),
	CONSTRAINT "email_settings_secret_format" CHECK ("email_settings"."secret" IS NULL OR "email_settings"."secret" LIKE 'v1:%')
);
--> statement-breakpoint
CREATE TABLE "email_template" (
	"key" text NOT NULL,
	"locale" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_template_key_locale_pk" PRIMARY KEY("key","locale"),
	CONSTRAINT "email_template_key" CHECK ("email_template"."key" IN ('lead-notification', 'lead-auto-reply', 'waitlist-confirmation')),
	CONSTRAINT "email_template_lengths" CHECK (length("email_template"."subject") <= 200 AND length("email_template"."body") <= 5000)
);
--> statement-breakpoint
ALTER TABLE "email_settings" ADD CONSTRAINT "email_settings_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_template" ADD CONSTRAINT "email_template_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;