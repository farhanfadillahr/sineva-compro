CREATE TABLE "service" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sort_order" integer NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"data" jsonb NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "service_data_object" CHECK (jsonb_typeof("service"."data") = 'object')
);
--> statement-breakpoint
CREATE TABLE "service_translation" (
	"service_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"slug" text NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "service_translation_service_id_locale_pk" PRIMARY KEY("service_id","locale"),
	CONSTRAINT "service_translation_locale" CHECK ("service_translation"."locale" ~ '^[a-z]{2}(-[A-Z]{2})?$'),
	CONSTRAINT "service_translation_slug" CHECK ("service_translation"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("service_translation"."slug") <= 80),
	CONSTRAINT "service_translation_object" CHECK (jsonb_typeof("service_translation"."data") = 'object')
);
--> statement-breakpoint
ALTER TABLE "service" ADD CONSTRAINT "service_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_translation" ADD CONSTRAINT "service_translation_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_order_idx" ON "service" USING btree ("sort_order","id");--> statement-breakpoint
CREATE UNIQUE INDEX "service_translation_locale_slug_unique" ON "service_translation" USING btree ("locale","slug");