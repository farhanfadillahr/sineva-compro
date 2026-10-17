-- CPR-104: the site now applies the SEO title template ("{title} | Sineva") to every page, so
-- meta titles hold the topic only. Remove the brand suffix written before the template applied.
-- Only an exact trailing " | Sineva" is removed, so running this again changes nothing.
UPDATE "page_content"
SET "data" = jsonb_set("data", '{seo,metaTitle}', to_jsonb(regexp_replace("data"->'seo'->>'metaTitle', ' \| Sineva$', '')))
WHERE "data"->'seo'->>'metaTitle' ~ ' \| Sineva$';
--> statement-breakpoint
UPDATE "service_translation"
SET "data" = jsonb_set("data", '{seo,metaTitle}', to_jsonb(regexp_replace("data"->'seo'->>'metaTitle', ' \| Sineva$', '')))
WHERE "data"->'seo'->>'metaTitle' ~ ' \| Sineva$';
--> statement-breakpoint
UPDATE "post_translation"
SET "draft" = jsonb_set("draft", '{seo,metaTitle}', to_jsonb(regexp_replace("draft"->'seo'->>'metaTitle', ' \| Sineva$', '')))
WHERE "draft"->'seo'->>'metaTitle' ~ ' \| Sineva$';
--> statement-breakpoint
UPDATE "post_translation"
SET "published" = jsonb_set("published", '{seo,metaTitle}', to_jsonb(regexp_replace("published"->'seo'->>'metaTitle', ' \| Sineva$', '')))
WHERE "published"->'seo'->>'metaTitle' ~ ' \| Sineva$';
--> statement-breakpoint
UPDATE "portfolio_translation"
SET "draft" = jsonb_set("draft", '{seo,metaTitle}', to_jsonb(regexp_replace("draft"->'seo'->>'metaTitle', ' \| Sineva$', '')))
WHERE "draft"->'seo'->>'metaTitle' ~ ' \| Sineva$';
--> statement-breakpoint
UPDATE "portfolio_translation"
SET "published" = jsonb_set("published", '{seo,metaTitle}', to_jsonb(regexp_replace("published"->'seo'->>'metaTitle', ' \| Sineva$', '')))
WHERE "published"->'seo'->>'metaTitle' ~ ' \| Sineva$';
