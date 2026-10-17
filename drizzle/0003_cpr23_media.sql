CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"environment" text NOT NULL,
	"filename" text NOT NULL,
	"kind" text NOT NULL,
	"content_type" text NOT NULL,
	"extension" text NOT NULL,
	"size" integer NOT NULL,
	"private_key" text NOT NULL,
	"content_hash" text NOT NULL,
	"width" integer,
	"height" integer,
	"dominant_color" text,
	"focal_x" double precision DEFAULT 0.5 NOT NULL,
	"focal_y" double precision DEFAULT 0.5 NOT NULL,
	"credit" text DEFAULT '' NOT NULL,
	"public_asset_id" uuid,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"cleanup_pending" boolean DEFAULT false NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "media_size_check" CHECK ("media"."size" > 0 AND "media"."size" <= 20971520),
	CONSTRAINT "media_kind_check" CHECK ("media"."kind" IN ('image','video','document')),
	CONSTRAINT "media_hash_check" CHECK ("media"."content_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "media_focal_check" CHECK ("media"."focal_x" BETWEEN 0 AND 1 AND "media"."focal_y" BETWEEN 0 AND 1),
	CONSTRAINT "media_dimensions_check" CHECK (("media"."kind" = 'image' AND "media"."width" IS NOT NULL AND "media"."height" IS NOT NULL AND "media"."width" BETWEEN 1 AND 6000 AND "media"."height" BETWEEN 1 AND 6000) OR ("media"."kind" <> 'image' AND "media"."width" IS NULL AND "media"."height" IS NULL)),
	CONSTRAINT "media_credit_check" CHECK (length("media"."credit") <= 160)
);
--> statement-breakpoint
CREATE TABLE "media_delivery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_id" uuid NOT NULL,
	"content_hash" text NOT NULL,
	"object_key" text NOT NULL,
	"content_type" text NOT NULL,
	"extension" text NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_translation" (
	"media_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	CONSTRAINT "media_translation_media_id_locale_pk" PRIMARY KEY("media_id","locale"),
	CONSTRAINT "media_translation_lengths" CHECK (length("media_translation"."alt") <= 200 AND length("media_translation"."caption") <= 1000),
	CONSTRAINT "media_locale_check" CHECK ("media_translation"."locale" ~ '^[a-z]{2}(-[A-Z]{2})?$')
);
--> statement-breakpoint
CREATE TABLE "media_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_id" uuid NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"field" text NOT NULL,
	"label" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	CONSTRAINT "media_usage_owner_check" CHECK ("media_usage"."entity" IN ('pages','services','posts','portfolio','team','settings','product')),
	CONSTRAINT "media_usage_label_check" CHECK (length("media_usage"."label") BETWEEN 1 AND 160)
);
--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_public_asset_id_media_delivery_id_fk" FOREIGN KEY ("public_asset_id") REFERENCES "public"."media_delivery"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_delivery" ADD CONSTRAINT "media_delivery_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_translation" ADD CONSTRAINT "media_translation_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_usage" ADD CONSTRAINT "media_usage_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_environment_created_idx" ON "media" USING btree ("environment","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "media_kind_idx" ON "media" USING btree ("environment","kind");--> statement-breakpoint
CREATE INDEX "media_creator_idx" ON "media" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "media_public_asset_idx" ON "media" USING btree ("public_asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_private_key_unique" ON "media" USING btree ("private_key");--> statement-breakpoint
CREATE UNIQUE INDEX "media_delivery_hash_unique" ON "media_delivery" USING btree ("media_id","content_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "media_delivery_key_unique" ON "media_delivery" USING btree ("object_key");--> statement-breakpoint
CREATE UNIQUE INDEX "media_usage_owner_field_unique" ON "media_usage" USING btree ("entity","entity_id","field");--> statement-breakpoint
CREATE INDEX "media_usage_media_idx" ON "media_usage" USING btree ("media_id");