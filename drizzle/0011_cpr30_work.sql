CREATE TABLE "portfolio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "portfolio_translation" (
	"item_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"draft_slug" text NOT NULL,
	"draft" jsonb NOT NULL,
	"draft_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_slug" text,
	"published" jsonb,
	"first_published_at" timestamp with time zone,
	"last_published_at" timestamp with time zone,
	CONSTRAINT "portfolio_translation_item_id_locale_pk" PRIMARY KEY("item_id","locale"),
	CONSTRAINT "portfolio_translation_locale" CHECK ("portfolio_translation"."locale" ~ '^[a-z]{2}(-[A-Z]{2})?$'),
	CONSTRAINT "portfolio_translation_slugs" CHECK ("portfolio_translation"."draft_slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("portfolio_translation"."draft_slug") <= 100 AND ("portfolio_translation"."published_slug" IS NULL OR "portfolio_translation"."published_slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$')),
	CONSTRAINT "portfolio_translation_snapshot" CHECK (("portfolio_translation"."published" IS NULL) = ("portfolio_translation"."published_slug" IS NULL) AND ("portfolio_translation"."published" IS NULL OR jsonb_typeof("portfolio_translation"."published") = 'object') AND jsonb_typeof("portfolio_translation"."draft") = 'object')
);
--> statement-breakpoint
ALTER TABLE "portfolio" ADD CONSTRAINT "portfolio_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_translation" ADD CONSTRAINT "portfolio_translation_item_id_portfolio_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "portfolio_order_idx" ON "portfolio" USING btree ("sort_order","id");--> statement-breakpoint
CREATE UNIQUE INDEX "portfolio_translation_draft_slug_unique" ON "portfolio_translation" USING btree ("locale","draft_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "portfolio_translation_published_slug_unique" ON "portfolio_translation" USING btree ("locale","published_slug");--> statement-breakpoint
CREATE INDEX "portfolio_translation_published_idx" ON "portfolio_translation" USING btree ("locale","first_published_at");