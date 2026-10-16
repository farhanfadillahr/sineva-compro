CREATE TABLE "faq_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"sort_order" integer NOT NULL,
	"data" jsonb NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "faq_item_key_check" CHECK ("faq_item"."key" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("faq_item"."key") <= 80),
	CONSTRAINT "faq_item_data_object" CHECK (jsonb_typeof("faq_item"."data") = 'object')
);
--> statement-breakpoint
CREATE TABLE "faq_item_translation" (
	"item_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "faq_item_translation_item_id_locale_pk" PRIMARY KEY("item_id","locale"),
	CONSTRAINT "faq_item_translation_locale" CHECK ("faq_item_translation"."locale" ~ '^[a-z]{2}(-[A-Z]{2})?$'),
	CONSTRAINT "faq_item_translation_object" CHECK (jsonb_typeof("faq_item_translation"."data") = 'object')
);
--> statement-breakpoint
ALTER TABLE "faq_item" ADD CONSTRAINT "faq_item_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq_item_translation" ADD CONSTRAINT "faq_item_translation_item_id_faq_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."faq_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "faq_item_key_unique" ON "faq_item" USING btree ("key");--> statement-breakpoint
CREATE INDEX "faq_item_order_idx" ON "faq_item" USING btree ("sort_order","id");