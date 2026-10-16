CREATE TABLE "page_content" (
	"page_key" text NOT NULL,
	"locale" text NOT NULL,
	"version" integer NOT NULL,
	"data" jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "page_content_page_key_locale_pk" PRIMARY KEY("page_key","locale"),
	CONSTRAINT "page_content_key_check" CHECK ("page_content"."page_key" IN ('home','product','servicesOverview','about','contact','thankYou','notFound','privacy','blogIndex','workIndex')),
	CONSTRAINT "page_content_locale_check" CHECK ("page_content"."locale" ~ '^[a-z]{2}(-[A-Z]{2})?$'),
	CONSTRAINT "page_content_version_check" CHECK ("page_content"."version" >= 1),
	CONSTRAINT "page_content_data_object" CHECK (jsonb_typeof("page_content"."data") = 'object')
);
--> statement-breakpoint
ALTER TABLE "page_content" ADD CONSTRAINT "page_content_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;