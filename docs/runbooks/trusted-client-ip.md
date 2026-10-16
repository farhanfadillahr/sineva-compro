# Trusted client IP (CPR-68)

Local implementation is verified separately from production ingress. **Production
acceptance remains pending** until the VPS, domain, Cloudflare zone, and Coolify
routes exist and the checks below have evidence. An environment variable is an
operator attestation, not a firewall or proof of the request's sender.

## Configuration and shared helper

The default is `CLIENT_IP_MODE=direct`. Leave
`CLOUDFLARE_ORIGIN_LOCKED` unset (or `false`). Direct mode ignores
`CF-Connecting-IP`, `CF-Connecting-IPv6`, `X-Forwarded-For`, `X-Real-IP`,
`Forwarded`, and inbound `x-sineva-client-ip`. This also applies to previews
without a verified Cloudflare ingress. Never enable Cloudflare mode merely to
get separate buckets in a public preview.

After completing and verifying the network restrictions below, set both:

```dotenv
CLIENT_IP_MODE=cloudflare
CLOUDFLARE_ORIGIN_LOCKED=true
```

Missing, mistyped, contradictory, or partial trust settings fail configuration
validation. Only one bare IPv4 or IPv6 value in `CF-Connecting-IP` is accepted.
Missing, empty, malformed, duplicate, or comma-separated values return `null`;
there is no fallback to another inbound header. Configure Cloudflare Pseudo IPv4
to **Off** or **Add Header**, not **Overwrite Headers**. The latter replaces the
real IPv6 address with a synthetic IPv4 address; this implementation deliberately
does not trust `CF-Connecting-IPv6` as an alternative. Review Workers and Managed
Transforms that can change or remove visitor IP headers before enabling this mode.

Canonical server-side helper for CPR-49:

```ts
import { getClientIp } from '@/lib/http/client-ip'

const ip = getClientIp(headers) // string | null; validates the IP env settings
const bucket = ip ?? 'no-trusted-ip'
```

An explicit validated `ClientIpConfig` can be passed as the second argument. Both
auth and this helper use Better Auth 1.7.7 normalization: IPv4-mapped IPv6 becomes
IPv4; IPv6 addresses share a /64 bucket. Do not use the raw CF header for a second
limiter or generate a random fallback key. CPR-49 must still rate limit a null IP
in a shared bucket; it must not silently allow it.

Auth replaces the inbound internal header with the helper's result before calling
Better Auth. Both `.handler` and `.fetch` do this. `advanced.ipAddress` reads only
that internal header. A plugin `onRequest` hook is too late: in installed 1.7.7,
the limiter runs first. Server-only `auth.api` calls are trusted programmatic
operations and do not provide the HTTP rate-limit boundary; dispatch public
requests through the wrapped handler.

## Missing IP is a deliberate availability tradeoff

The helper returns `null` in direct mode and when trusted CF data is unavailable.
The Web Request/Headers API does not expose an authenticated socket peer, so this
code cannot recover a genuine per-client IP from a direct connection.

In production Better Auth uses `no-trusted-ip|<path>`: all such requests share a
per-path bucket. In development/test its built-in fallback is
`127.0.0.1|<path>`. Both remain throttled. Five requests to `/sign-in/email` in
60 seconds consume that shared allowance, including successful sign-ins; attempt
six returns 429. Direct-mode public deployments can therefore suffer shared
denial of service. Keep that fallback until a verifiable ingress exists instead
of trusting attacker-controlled headers. A missing trusted IP in Cloudflare
production is an operational failure to investigate, not a reason to disable
tracking or limits. The library emits a one-time warning per process; the existing
redacting logger writes `Authentication warning.` rather than raw library text.

Limits remain 60 requests/60 seconds globally, 5 sign-ins/60 seconds; the account
lockout policy is unchanged. Different clients behind one public IPv4 or IPv6
/64 still share the same IP allowance.

## Real network boundary: Cloudflare to origin to app

1. Inventory every public ingress: IPv4 and IPv6 addresses, ports 80/443, alternate
   app/container ports, direct IP routes, Coolify dashboard routes, health checks,
   preview routes, internal networks, and any tunnel. Record how each reaches the
   app. The app port and database must not be publicly published. Docker-published
   ports can bypass host firewall expectations: verify the actual forwarding
   rules/provider firewall, not just UFW's summary.
2. Restrict origin web ingress to current Cloudflare IPv4 **and** IPv6 ranges,
   with default-deny for other sources on both 80 and 443. Keep SSH restricted to
   approved operator networks with a separate rule and an out-of-band recovery
   path. Do not put Cloudflare ranges into Better Auth `trustedProxies` and assume
   this authenticates the sender: it only parses a header chain.
3. Authenticate the expected zone/hostname where possible with zone-level or
   per-hostname Authenticated Origin Pulls using your own certificate, or a
   Cloudflare Tunnel with no public origin listener. Cloudflare's shared AOP
   certificate and CIDR allowlisting identify the Cloudflare network, not your
   zone. Other Cloudflare tenants and Worker subrequests are part of the threat
   model. Do not allow foreign zone/Worker paths to supply an arbitrary visitor
   header. Record the actual enforcement and test it before attesting origin lock.
4. Use Full (strict) TLS. If using AOP, configure the TLS terminator to **require**
   the expected client certificate, not merely install it. Prevent plaintext
   port 80, alternate listeners, and alternate hostnames from forwarding to the
   app without the same trust boundary. HTTP may redirect at ingress but must not
   provide an unauthenticated app path.
5. Restrict the final Coolify/reverse-proxy-to-app hop to that ingress only.
   Preserve the edge's single CF header; do not synthesize it from user XFF or
   overwrite it with the reverse proxy address. Host checks, `CF-Ray`, and the
   mere presence of a CF header are not sender authentication. Review access from
   sibling containers and local networks as well as the internet.
6. Test the restrictions before setting the two Cloudflare env values. Re-test
   on proxy, network, Worker, or container changes. Roll back to direct mode if
   ingress becomes publicly reachable, accepting the documented shared bucket.

No firewall changes are applied by this repository or by local tests. Never run
VPS firewall procedures against a developer Mac.

## Refresh the Cloudflare allowlist

Fetch the current official lists when generating or refreshing rules. Do not
commit a static list as the source of truth:

```sh
curl --fail --show-error --silent --proto '=https' --tlsv1.2 \
  https://www.cloudflare.com/ips-v4 > /tmp/cloudflare-ips-v4.new
curl --fail --show-error --silent --proto '=https' --tlsv1.2 \
  https://www.cloudflare.com/ips-v6 > /tmp/cloudflare-ips-v6.new
```

On the deployment operator's machine, require both downloads to succeed; validate
every nonblank line as a network CIDR of the expected address family (for example,
Python `ipaddress.ip_network(line, strict=True)`), and reject an empty list,
HTML/error content, mixed families, or default routes. Record fetch time and
checksums, compare to the active lists, then generate the provider/nftables/proxy
rules for review. Never interpolate unvalidated fetched text into shell commands.

Have the deployment owner schedule a weekly refresh and subscribe to Cloudflare
IP-change announcements. Fetch again before each deployment/network change. Apply
new rules atomically on the VPS with console recovery available; keep the last
known good rules on download or validation failure and alert the operator. Remove
obsolete ranges as part of the same reviewed update. Confirm that no earlier
allow-all rule, IPv6 listener, Docker forward rule, or alternate port bypasses the
allowlist. Test public site, admin login, external uptime monitors, Coolify
dashboard, and media after changes. Monitors must use the proxied domain; an
unrestricted monitor bypass to the app would invalidate header trust.

## Deployment acceptance evidence (still pending)

- From a machine outside the origin network, target the origin IPv4 and IPv6
  directly using the real Host/SNI (for example `curl --resolve
  '<domain>:443:<origin-ip>' 'https://<domain>/api/auth/sign-in/email'`) and forged
  CF/XFF headers. Require connection/TLS rejection before the app, or prove the
  header is ignored in direct mode. Also test HTTP, alternate ports and hostnames.
- Through the real proxied domain, use two controlled public clients. For one
  client, five successful sign-ins within 60 seconds must be allowed and attempt
  six return 429; the other client must still sign in. Use successful credentials
  to keep the separate account-lockout policy out of this check.
- Correlate ingress requests and redacted app logs for the test interval. Verify
  the genuine edge CF address was preserved and neither a shared-fallback warning
  nor unexpected `Authentication warning.` occurred. Keep evidence without
  passwords, session cookies, secrets, or unnecessary visitor IP retention.
- Record domain, origin enforcement, IPv4/IPv6 results, rule generation time,
  TLS/AOP or tunnel details, proxy configuration, monitor checks, and the operator
  approving `CLOUDFLARE_ORIGIN_LOCKED=true`.

## Local verification

Use Node 24. Tests require the explicit loopback application test DB. The native
local PostgreSQL defaults to Asia/Jakarta; the existing raw-SQL session-expiry
fixture assumes UTC. Use a connection-only UTC setting for the full gates:

```sh
npm test
PGOPTIONS='-c timezone=UTC' npm run test:prepare
PGOPTIONS='-c timezone=UTC' npm run test:database
npm run lint
npm run typecheck
```

Production-mode database subprocess tests verify separate CF buckets, the sixth
request rejection, session IPs, no warning for valid CF, and shared fallback for
direct/missing/malformed IPs. This proves local behavior, not VPS access control.

`TEST_AUTH_URL` optionally selects another loopback HTTP origin; the default
remains `http://127.0.0.1:3001`. Only `127.0.0.1` and `localhost`, without credentials,
path, query, or fragment, are accepted. Check the port is unused before starting
your own test server; never terminate another app. For an isolated simulated CF
HTTP gate, use the same values in both shells:

```sh
TEST_AUTH_URL=http://127.0.0.1:3068 CLIENT_IP_MODE=cloudflare \
  CLOUDFLARE_ORIGIN_LOCKED=true PGOPTIONS='-c timezone=UTC' npm run test:server
```

```sh
TEST_AUTH_URL=http://127.0.0.1:3068 CLIENT_IP_MODE=cloudflare \
  CLOUDFLARE_ORIGIN_LOCKED=true PGOPTIONS='-c timezone=UTC' npm run test:integration
```

The CF HTTP test runs only with Cloudflare mode explicitly enabled. These loopback
fixtures simulate trusted ingress and are not production network evidence.

## Sources and installed-version notes

- [Better Auth security](https://better-auth.com/docs/reference/security) and
  [options](https://better-auth.com/docs/reference/options).
- Exact installed 1.7.7: `@better-auth/core/dist/types/init-options.d.mts` documents
  that `trustedProxies` cannot authenticate the direct sender;
  `@better-auth/core/dist/utils/ip.mjs` defaults to single-value XFF and uses /64;
  `better-auth/dist/api/rate-limiter/index.mjs` supplies the shared fallback;
  `better-auth/dist/api/index.mjs` runs the limiter before plugin request hooks.
- [Cloudflare headers and Worker/Pseudo IPv4 behavior](https://developers.cloudflare.com/fundamentals/reference/http-headers/).
- [Cloudflare origin allowlisting](https://developers.cloudflare.com/fundamentals/concepts/cloudflare-ip-addresses/)
  and [official range lists](https://www.cloudflare.com/ips/).
- [Authenticated Origin Pulls](https://developers.cloudflare.com/ssl/origin-configuration/authenticated-origin-pull/).
