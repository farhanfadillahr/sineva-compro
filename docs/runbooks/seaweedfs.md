# SeaweedFS local storage (CPR-67)

Status, 16 October 2026: **local implementation only**. VPS and domain are unavailable. The real S3 matrix below passed against the official native SeaweedFS **4.48** darwin_arm64 binary in the first session and was re-run against **Docker SeaweedFS 4.48** on 16 October. All four containers are healthy. The local container recreation check retains the exact object payload across `down` and `up` with named volumes retained. This does not prove VPS reboot or full volume restore behavior. No production acceptance is claimed.

## Setup and commands

Use Node 24 in this worktree. Dependencies are locked; do not reinstall an entire dependency tree just to run these commands.

```sh
export PATH=/Users/farhanfadillahr/.nvm/versions/node/v24.21.0/bin:$PATH
npm run storage:setup
```

Setup generates `.storage/secrets/{bootstrap,app,backup}.json` and `s3.json`, plus `.storage/compose.env` containing only host UID/GID. The directory is 0700, credential files are 0600 and all are gitignored. Keys use cryptographic randomness; commands never print credentials or signed URLs. Re-running setup preserves existing keys. Missing, malformed, symlinked or broadly readable credentials, and gateway identities that differ from the exact generated scoped role configuration, fail closed instead of being silently replaced. Run as the normal developer user, not root.

With a working Docker daemon:

```sh
docker compose --env-file .storage/compose.env -f compose.storage.yaml config --quiet
docker compose --env-file .storage/compose.env -f compose.storage.yaml up -d --wait
npm run storage:bootstrap
npm run storage:bootstrap
npm run storage:check
npm run test:storage
docker compose --env-file .storage/compose.env -f compose.storage.yaml down
```

The second bootstrap reports `exists` for all three buckets. Bootstrap only creates missing buckets, never deletes objects/buckets or changes ACLs/policies. It does not treat authentication errors as missing buckets. `down` retains named volumes; do not add `-v`. Set a distinct `COMPOSE_PROJECT_NAME` before the commands when sharing a Docker host across worktrees or CI jobs.

Every component uses `chrislusf/seaweedfs:4.48`, `unless-stopped`, health checks and the private `storage` Docker network. S3 also joins a separate `gateway` bridge to support the published host port; backend components stay exclusively on the internal network. Only `127.0.0.1:8333:8333` is published. Master, volume, filer and gRPC ports have no host publication. Iceberg, Lance and the embedded IAM management API are disabled. S3 runs with the generated host UID/GID to read 0600 credentials; its entrypoint bypasses the image's UID 1000 switch. The other services mount the image-owned `/data` root so its normal ownership initialization works. Filer explicitly mounts our TOML configuration so metadata cannot fall back to an unpersisted directory.

## Native fallback without Docker

Obtain the official archive from the [4.48 release](https://github.com/seaweedfs/seaweedfs/releases/tag/4.48), verify its SHA256 against the release asset metadata, and extract `weed` outside the repository. The darwin_arm64 archive used here had SHA256:

```text
faa194e72a346755dc4404288b0561eb3c260351702901d8363024d5099bdd7d
```

The original native verification used `/private/tmp/sineva-seaweedfs-4.48/weed`; temporary files may be removed between sessions. The supervisor also checks the binary version. Reuse a verified binary when available; otherwise obtain and verify the archive again.

Terminal 1:

```sh
export STORAGE_ENDPOINT=http://127.0.0.1:18333
npm run storage:native -- /private/tmp/sineva-seaweedfs-4.48/weed
```

Terminal 2, same worktree:

```sh
export STORAGE_ENDPOINT=http://127.0.0.1:18333
npm run storage:bootstrap
npm run storage:bootstrap
npm run storage:check
npm run test:storage
```

Ctrl-C in terminal 1 stops only its four child processes. The supervisor refuses occupied ports, uses a new 0700 `/private/tmp/sineva-storage-*` directory (system temp directory on Linux) on every run, stores logs and a process manifest there with mode 0600, and retains data after exit. It never uses an existing developer volume. Explicit local filer configuration takes precedence over user/global backend configuration. Native data is disposable test data; a new invocation starts with new storage.

| Native component | HTTP | gRPC | Binding |
| --- | --- | --- | --- |
| Master | 19333 | 29333 | 127.0.0.1 |
| Volume | 18080 | 28080 | 127.0.0.1 |
| Filer | 18888 | 28888 | 127.0.0.1 |
| S3, using the example endpoint | 18333 | 28333 | 127.0.0.1 |

The S3 Unix socket is inside that run's private directory. A short temporary root avoids macOS's Unix socket path limit in deeply nested worktrees. Native tests prove API behavior, not Docker network isolation or restart persistence. Raw server logs are private operational files; do not paste them into tickets without checking for sensitive information.

## Credentials and mutation guards

| Identity | Allowed scope | Intended consumer |
| --- | --- | --- |
| bootstrap | `Admin:media-public`, `Admin:media-private`, `Admin:backups` | Operator bootstrap and test cleanup only |
| app | `Read`, `Write`, `List` on the two media buckets only | Future CPR-23 server adapter |
| backup | `Write:backups` only | Future CPR-13 backup writer |

There is no anonymous identity, unrestricted root identity, or public ACL/policy. Even `media-public` uses signed local access. Private/backups must never receive anonymous S3 read. SeaweedFS's coarse legacy `Write` action includes deletion; this backup credential is not an append-only/WORM policy and has no read/list permission. Production append-only retention and a separate restore identity require a reviewed policy and further negative tests.

`readStorageConfig` defaults to loopback, region `us-east-1`, path-style addressing and the three fixed bucket names. Every CLI command validates its target before reading credentials, writing files or making network requests. `STORAGE_ENDPOINT` must be a plain HTTP(S) origin: credentials, path, query and fragment are rejected without echoing the input. Non-loopback origins, `NODE_ENV=production`, and any `STORAGE_ENV` other than `local`/`test` require `STORAGE_CONFIRM_ORIGIN` to equal the canonical origin **exactly**, with no trailing slash. A boolean or hostname prefix is insufficient; remote transport also requires HTTPS. This guard is not production deployment authorization. `STORAGE_CREDENTIALS_DIR` optionally selects a different owner-only credential directory.

SDK calls have bounded connection/request timeouts and one attempt; unexpected bootstrap errors are not retried as bucket creation. Browser-style fetch checks disable redirects. Compatibility logs contain only the validated origin, random run prefix and PASS/FAIL records.

## Compatibility evidence

Executed 16 October 2026 against native 4.48 and independently re-run against Compose 4.48 with AWS SDK `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`, both **3.1152.0**. The runner performs real network calls, not mocked SDK assertions. Exit code 1 indicates any failed check.

| Operation | media-public | media-private | What was verified |
| --- | --- | --- | --- |
| PutObject | PASS | PASS | App writes a unique object |
| GetObject | PASS | PASS | Exact payload and Cache-Control round-trip |
| HeadObject | PASS | PASS | Length and content type |
| ListObjectsV2 | PASS | PASS | Expected object under only this run's prefix |
| Presigned GET | PASS | PASS | HTTP 200 and exact payload |
| Presigned PUT | PASS | PASS | HTTP 200 and signed upload retrieved intact |
| Multipart upload, 6 MiB | PASS | PASS | Create, upload 5 MiB + 1 MiB, complete, SHA256 round-trip |
| DeleteObject | PASS | PASS | Head subsequently returns 404 |

| Isolation / cleanup check | Result |
| --- | --- |
| Anonymous GET of an existing private object | PASS, denied |
| Anonymous GET of an existing backup object | PASS, denied |
| App Put/Get/Head/Delete/List against backups | PASS, HTTP 403 |
| Backup Put/Get/Head/Delete/List against both media buckets | PASS, HTTP 403 |
| Backup writes backups; Get/List remain denied | PASS |
| Cleanup removes only registered objects in this run's prefix | PASS |
| Object outside the run prefix remains intact | PASS |
| Final cleanup, with all bucket containers retained | PASS |

Recorded output: **24/24 PASS**, integration **1/1 PASS**. The runner uses `compat/<UUID>/` and an independently named sentinel it owns, tracks exact object keys and multipart IDs in memory, and cleans those in `finally`. It never deletes a bucket, enumerates arbitrary objects for deletion, or removes another run's prefix. A forcibly killed runner may leave its own objects; inspect that exact recorded prefix and ownership before any manual cleanup.

A real SDK behavior was caught during RED/GREEN: presigning `PutObjectCommand` with no Body produces a checksum for an empty payload under the SDK's default `WHEN_SUPPORTED` behavior. Uploading non-empty data returned `400 BadDigest`. The fixture now signs the same body it uploads, retaining default checksum validation. CPR-23 must explicitly design the checksum contract for browser uploads instead of assuming an empty-body signature permits arbitrary content.

## Data, health and operations

Compose named volumes are `<project>_master-data` (master state), `<project>_volume-data` (object chunks/indexes), and `<project>_filer-data` (LevelDB2 namespace/metadata). Each is mounted at `/data` in its own service; filer metadata is `/data/filerldb2`. The S3 gateway is stateless. Preserve **all three** volumes and the separately protected identity configuration. Copying chunk files without filer metadata is not a complete restore.

Health checks query master `/cluster/status`, volume `/healthz`, filer `/`, and require the S3 gateway to reject an unauthenticated root request with 403. The local master uses replication `000`: one copy, no failure-domain redundancy. The 128 MiB Compose / 32 MiB native volume size limits are local growth units, not storage quotas. Volume servers allow 32 volumes with no requested preallocation. Reassess limits against real disk capacity before production.

For local key rotation, stop this stack, preserve the existing secrets in a separate owner-only directory outside Git, move `.storage/secrets` aside, and run setup to generate a replacement set. Recreate the S3 gateway (a mounted config file is not assumed to hot-reload), update only the consuming server-side app/backup credentials, and run the matrix. Validate access with the new keys and refusal of the retired keys before securely retiring the old configuration. The generator intentionally has no automatic overwrite/rotation switch. Production rotation should add replacement keys for a controlled overlap, update consumers, verify, revoke old keys and test revocation under a reviewed operational change.

For disk growth, inspect free space and inode usage on the exact volume host first. Grow its filesystem or provision an additional explicitly owned volume path, then review SeaweedFS placement and maximum volume settings; do not move live chunk files by hand. For a local recovery rehearsal: stop writers and all storage components, take consistent snapshots/copies of all three owned data volumes plus protected config, restore into a **new isolated Compose project**, start master/volume/filer/S3 in order, bootstrap idempotently, and verify known object hashes and the matrix. Do not overwrite a live/shared volume. Container recreation with retained named volumes passed locally; neither disk growth nor full backup recovery has been executed here.

## Production acceptance still open

- VPS/Coolify deployment and persistence/health after a VPS reboot.
- CDN mapping only for `media-public`, anonymous media-host HTTP 200, immutable Cache-Control and content-hash keys; negative mapping tests for private/backups. Signed local GET is not CDN acceptance.
- External verification that only 22/80/443 are public and no storage/internal ports are reachable.
- Protected Coolify secrets, production rotation/revocation and capacity sizing.
- Active and tested disk usage/inode alerts plus external media-host uptime monitoring (CPR-14).
- Off-host database/media copies, agreed Q8 target, retention and successful restore from that target (CPR-13). Backups on this single host alone are insufficient.
- VPS reboot, full backup recovery rehearsal and production ACL/CORS/CDN policy contract. Local Docker health and retained-volume container recreation passed.

CPR-23 owns the MediaStore adapter and upload UI. This ticket does not implement it, the backup scheduler, DB migrations, auth, UI or external deployment.

## Verified sources and licenses

SeaweedFS 4.48 is **Apache-2.0**, verified from its [tagged LICENSE](https://github.com/seaweedfs/seaweedfs/blob/4.48/LICENSE). Both pinned AWS SDK packages declare **Apache-2.0** in their installed/npm package metadata; see the [SDK license](https://github.com/aws/aws-sdk-js-v3/blob/main/LICENSE).

- [Pinned S3 command options and default listeners](https://github.com/seaweedfs/seaweedfs/blob/4.48/weed/command/s3.go), [filer configuration](https://github.com/seaweedfs/seaweedfs/blob/4.48/weed/command/filer.go).
- [Pinned bucket-scoped authorization implementation](https://github.com/seaweedfs/seaweedfs/blob/4.48/weed/s3api/auth_credentials.go), especially `Identity.CanDo`.
- [Pinned image entrypoint and privilege switching](https://github.com/seaweedfs/seaweedfs/blob/4.48/docker/entrypoint.sh), [image layout](https://github.com/seaweedfs/seaweedfs/blob/4.48/docker/Dockerfile.local).
- [Official S3 API overview](https://github.com/seaweedfs/seaweedfs/wiki/Amazon-S3-API); supported-API claims still require the matrix for this exact version.
- [AWS SDK presigner contract](https://github.com/aws/aws-sdk-js-v3/tree/main/packages/s3-request-presigner), [SDK constructor/checksum options](https://github.com/aws/aws-sdk-js-v3/blob/main/supplemental-docs/CLIENTS.md), checked through Context7.

## Integration verification after main synchronization

Synced with main through PR #26. Storage tooling stays isolated from public pages. The Founder confirmed that editable content through the custom Next.js admin remains required; the current static content source is temporary until the database query adapters are ready. The Docker verification project is `sineva-cpr67-verify`; no user-owned volumes were changed. A regression test exposed gateway configuration drift, and setup now refuses extra identities or altered permissions rather than accepting arbitrary valid JSON. A second regression test captures the separate gateway network needed for host SDK access while backend networking stays internal.
