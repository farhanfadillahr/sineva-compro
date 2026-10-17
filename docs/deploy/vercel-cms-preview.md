# CMS on the development Preview

The `sineva` project keeps `main` as its Production branch. The `development` branch uses Preview,
with its own Neon database and a private Vercel Blob store. No production environment variables
need to change. Keep indexing disabled and email delivery in mock mode for this preview.

## Preview variables (Git branch: development)

- `ADMIN_ENABLED=true`, `CONTENT_SOURCE=database`.
- `DATABASE_URL`: pooled Neon URL, with only `sslmode=verify-full` in its query.
- `BETTER_AUTH_URL` and `SITE_URL`: the stable development branch alias.
- `BETTER_AUTH_SECRET` and `SETTINGS_ENCRYPTION_KEY`: separate preview secrets.
- `MEDIA_PROVIDER=vercel-blob`, `MEDIA_PREFIX=preview-development`.
- `BLOB_READ_WRITE_TOKEN`: the private store's token, marked sensitive.
- `MEDIA_BLOB_ORIGIN`: the exact HTTPS private Blob hostname reported by the store. This permits
  redirects to short-lived signed image/video previews in the browser's CSP.
- Leave `MEDIA_PUBLIC_ORIGIN` unset (relative URLs), or use the application origin. Published
  media is served by `/api/media/public/<delivery-id>.<extension>`, not by a bucket URL.
- `SITE_INDEXABLE=false`, `EMAIL_DELIVERY=mock`, `CLIENT_IP_MODE=direct`.
- Turnstile keys: real keys for unprotected/public sites; official test keys only for the
  protected development preview.

Run the versioned migrations and base seed against the preview database, then use the guarded
bootstrap script to create its first Admin. Never print connection strings or passwords.

## Media lifecycle

`BlobMediaStore` implements the existing `MediaStore` interface. A single **private** Blob store
contains `private/<environment>/<key>` and `public/<environment>/<key>` namespaces. A draft upload
is not public. Publishing creates a separate immutable copy; only registered deliveries can be
read through the public media route. File replacement preserves old published deliveries.

Admin previews use GET URLs scoped to one file and capped at five minutes. The store token is
never sent to a browser. Upload validation, image sanitization, authorization, usage tracking,
metadata and audit transactions stay in the existing media service.

The S3 provider remains the default for local SeaweedFS. Switching providers does not migrate
existing file bytes; provision a fresh environment or migrate files before switching a populated
media environment. `preview` alone is not a valid prefix; use `preview-development`.

## Vercel limits

The existing upload routes proxy file bytes through a Function. Vercel's request body limit
applies (4.5 MB), even though the CMS's general media validation accepts larger images/videos.
Use small files for this preview. Supporting larger uploads needs a separate direct-upload and
server validation flow; raising the CMS's upload limit cannot bypass the platform limit.

Verify login, upload, private preview, assigning media to a published page, public delivery and
removal of the test media. Do not disable Vercel Deployment Protection for automated testing.
