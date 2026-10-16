CREATE TABLE "business_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"sort_order" integer NOT NULL,
	"data" jsonb NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "business_type_key_check" CHECK ("business_type"."key" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("business_type"."key") <= 80),
	CONSTRAINT "business_type_data_object" CHECK (jsonb_typeof("business_type"."data") = 'object')
);
--> statement-breakpoint
CREATE TABLE "business_type_translation" (
	"item_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "business_type_translation_item_id_locale_pk" PRIMARY KEY("item_id","locale"),
	CONSTRAINT "business_type_translation_locale" CHECK ("business_type_translation"."locale" ~ '^[a-z]{2}(-[A-Z]{2})?$'),
	CONSTRAINT "business_type_translation_object" CHECK (jsonb_typeof("business_type_translation"."data") = 'object')
);
--> statement-breakpoint
CREATE TABLE "product_capability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"sort_order" integer NOT NULL,
	"data" jsonb NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "product_capability_key_check" CHECK ("product_capability"."key" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("product_capability"."key") <= 80),
	CONSTRAINT "product_capability_data_object" CHECK (jsonb_typeof("product_capability"."data") = 'object')
);
--> statement-breakpoint
CREATE TABLE "product_capability_translation" (
	"item_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "product_capability_translation_item_id_locale_pk" PRIMARY KEY("item_id","locale"),
	CONSTRAINT "product_capability_translation_locale" CHECK ("product_capability_translation"."locale" ~ '^[a-z]{2}(-[A-Z]{2})?$'),
	CONSTRAINT "product_capability_translation_object" CHECK (jsonb_typeof("product_capability_translation"."data") = 'object')
);
--> statement-breakpoint
ALTER TABLE "business_type" ADD CONSTRAINT "business_type_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_type_translation" ADD CONSTRAINT "business_type_translation_item_id_business_type_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."business_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_capability" ADD CONSTRAINT "product_capability_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_capability_translation" ADD CONSTRAINT "product_capability_translation_item_id_product_capability_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."product_capability"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "business_type_key_unique" ON "business_type" USING btree ("key");--> statement-breakpoint
CREATE INDEX "business_type_order_idx" ON "business_type" USING btree ("sort_order","id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_capability_key_unique" ON "product_capability" USING btree ("key");--> statement-breakpoint
CREATE INDEX "product_capability_order_idx" ON "product_capability" USING btree ("sort_order","id");