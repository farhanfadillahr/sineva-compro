CREATE TABLE "site_settings" (
	"id" text PRIMARY KEY DEFAULT 'site' NOT NULL,
	"data" jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_singleton" CHECK ("site_settings"."id" = 'site'),
	CONSTRAINT "site_settings_data_object" CHECK (jsonb_typeof("site_settings"."data") = 'object')
);
--> statement-breakpoint
CREATE TABLE "site_settings_translation" (
	"locale" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_translation_locale" CHECK ("site_settings_translation"."locale" ~ '^[a-z]{2}(-[A-Z]{2})?$'),
	CONSTRAINT "site_settings_translation_object" CHECK (jsonb_typeof("site_settings_translation"."data") = 'object')
);
--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings_translation" ADD CONSTRAINT "site_settings_translation_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;