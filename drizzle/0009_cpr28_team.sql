CREATE TABLE "team_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"sort_order" integer NOT NULL,
	"data" jsonb NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "team_member_key_check" CHECK ("team_member"."key" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("team_member"."key") <= 80),
	CONSTRAINT "team_member_data_object" CHECK (jsonb_typeof("team_member"."data") = 'object')
);
--> statement-breakpoint
CREATE TABLE "team_member_translation" (
	"item_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "team_member_translation_item_id_locale_pk" PRIMARY KEY("item_id","locale"),
	CONSTRAINT "team_member_translation_locale" CHECK ("team_member_translation"."locale" ~ '^[a-z]{2}(-[A-Z]{2})?$'),
	CONSTRAINT "team_member_translation_object" CHECK (jsonb_typeof("team_member_translation"."data") = 'object')
);
--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_translation" ADD CONSTRAINT "team_member_translation_item_id_team_member_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."team_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "team_member_key_unique" ON "team_member" USING btree ("key");--> statement-breakpoint
CREATE INDEX "team_member_order_idx" ON "team_member" USING btree ("sort_order","id");