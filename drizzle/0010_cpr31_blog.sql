CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"sort_order" integer NOT NULL,
	"data" jsonb NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "category_key_check" CHECK ("category"."key" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("category"."key") <= 80),
	CONSTRAINT "category_data_object" CHECK (jsonb_typeof("category"."data") = 'object')
);
--> statement-breakpoint
CREATE TABLE "category_translation" (
	"item_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "category_translation_item_id_locale_pk" PRIMARY KEY("item_id","locale"),
	CONSTRAINT "category_translation_locale" CHECK ("category_translation"."locale" ~ '^[a-z]{2}(-[A-Z]{2})?$'),
	CONSTRAINT "category_translation_object" CHECK (jsonb_typeof("category_translation"."data") = 'object')
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "post_translation" (
	"item_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"draft_slug" text NOT NULL,
	"draft" jsonb NOT NULL,
	"draft_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_slug" text,
	"published" jsonb,
	"first_published_at" timestamp with time zone,
	"last_published_at" timestamp with time zone,
	CONSTRAINT "post_translation_item_id_locale_pk" PRIMARY KEY("item_id","locale"),
	CONSTRAINT "post_translation_locale" CHECK ("post_translation"."locale" ~ '^[a-z]{2}(-[A-Z]{2})?$'),
	CONSTRAINT "post_translation_slugs" CHECK ("post_translation"."draft_slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("post_translation"."draft_slug") <= 100 AND ("post_translation"."published_slug" IS NULL OR "post_translation"."published_slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$')),
	CONSTRAINT "post_translation_snapshot" CHECK (("post_translation"."published" IS NULL) = ("post_translation"."published_slug" IS NULL) AND ("post_translation"."published" IS NULL OR jsonb_typeof("post_translation"."published") = 'object') AND jsonb_typeof("post_translation"."draft") = 'object')
);
--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_translation" ADD CONSTRAINT "category_translation_item_id_category_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_translation" ADD CONSTRAINT "post_translation_item_id_post_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "category_key_unique" ON "category" USING btree ("key");--> statement-breakpoint
CREATE INDEX "category_order_idx" ON "category" USING btree ("sort_order","id");--> statement-breakpoint
CREATE INDEX "post_order_idx" ON "post" USING btree ("sort_order","id");--> statement-breakpoint
CREATE UNIQUE INDEX "post_translation_draft_slug_unique" ON "post_translation" USING btree ("locale","draft_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "post_translation_published_slug_unique" ON "post_translation" USING btree ("locale","published_slug");--> statement-breakpoint
CREATE INDEX "post_translation_published_idx" ON "post_translation" USING btree ("locale","first_published_at");