# want-to-go backend

Express + TypeScript API for the want-to-go app, backed by Postgres (Drizzle ORM), Redis (caching and rate limiting), and S3-compatible object storage.

## Architecture

- `src/app.ts` - Express app factory (`createApp()`). Wires `helmet`, CORS, cookie parsing, a `100kb` JSON body limit, the general rate limiter, all routers, and a centralized JSON error handler.
- `src/index.ts` - process entrypoint: checks the DB is reachable and migrated, then starts listening.
- `src/routes/` - one router per resource:
  - `auth.ts` - OIDC (Authentik) login/callback and `/auth/me`. Public.
  - `geocode.ts` (mounted at `/geo`) - search/reverse geocoding proxy. Public, rate-limited.
  - `places.ts`, `lists.ts`, `visits.ts`, `uploads.ts` - all require a bearer token (`requireAuth`).
  - `stats.ts` - public aggregate counts (users/places), 60s in-memory cache.
- `src/middleware/` - `requireAuth` (JWT bearer auth), `validate` (zod request validation), `rate-limit` (Redis-backed sliding window limiters).
- `src/lib/` - domain logic: `list-access.ts` (authorization), `s3.ts` (uploads/presigning/ownership), `geocode-providers.ts` (Nominatim/Photon/Geoapify with fallback), `geocode-cache.ts`, `auth.ts` (JWT sign/verify), `tags.ts`, `visits.ts`, `images.ts`.
- `src/db/schema.ts` - Drizzle schema; migrations in `drizzle/`.

## Auth model

Login is OIDC-only (Authentik), using PKCE + a `state` cookie for CSRF protection. On a successful callback the backend issues its own JWT (`HS256`, 7-day expiry, `{ userId, username }`), which the frontend stores and sends as `Authorization: Bearer <token>`. `requireAuth` verifies the token (pinned to `HS256`) and attaches `authUser` to the request. There is no server-side revocation list - a leaked token is valid until it expires.

## Authorization model

Places and visits are not gated by simple row ownership; access flows through **list membership roles**, resolved by `lib/list-access.ts`:

| Role            | Read | Create | Update/Delete |
| --------------- | ---- | ------ | ------------- |
| `owner`         | ✅   | ✅     | ✅            |
| `edit`          | ✅   | ✅     | ✅            |
| `add`           | ✅   | ✅     | ❌            |
| `view`          | ✅   | ❌     | ❌            |
| no relationship | 404  | 404    | 404           |

Every unauthorized attempt returns `404` rather than `403` so the existence of a place/list isn't leaked to someone with no access to it. Visit updates/deletes additionally require `visit.userId === authUser.userId` - any list member can log their own visit to a shared place, but only the visit's own author can edit or delete it.

## Environment variables

| Variable                                                                                                                          | Purpose                                                |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`                                                                                                                    | Postgres connection string                             |
| `REDIS_URL`                                                                                                                       | Redis connection string (rate limiting, geocode cache) |
| `JWT_SECRET`                                                                                                                      | HMAC secret for auth tokens                            |
| `FRONTEND_URL`                                                                                                                    | Allowed CORS origin + OAuth redirect target            |
| `AUTHENTIK_ISSUER_URL`, `AUTHENTIK_CLIENT_ID`, `AUTHENTIK_CLIENT_SECRET`, `AUTHENTIK_REDIRECT_URI`                                | OIDC login flow                                        |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_ENDPOINT` (optional, for S3-compatible storage) | Image uploads                                          |
| `GEOAPIFY_API_KEY`                                                                                                                | Geoapify geocoding fallback provider                   |

Loaded from `backend/.env` if present, otherwise the repo-root `.env` (see `src/env.ts`).

## Running locally

```bash
npm run dev:backend     # from the repo root
npm run build --workspace backend
npm run check --workspace backend   # typecheck
```

## Testing

```bash
npm run test --workspace backend
```

Requires Docker. The suite (`vitest` + `supertest`) spins up throwaway Postgres and Redis containers on free ports (`test/global-setup.ts`), runs the Drizzle migrations against them, and tears them down afterward - it never touches your normal dev containers or database. Tests cover:

- `test/auth.test.ts` - token verification: missing/malformed/expired/wrong-secret/`alg:none` tokens are rejected; a valid token is accepted; `/geo/*` and `/stats/all` stay reachable without a token.
- `test/authorization-places.test.ts` - the full list-role matrix against real DB-backed authorization logic, including cross-list moves.
- `test/authorization-lists-visits.test.ts` - list ownership/share-link management and visit-owner-only mutation.
- `test/s3-ownership.test.ts` - a user cannot reference another user's private image key or presigned-style URL.
- `test/validation.test.ts` - malformed/out-of-range input is rejected with `400` across routes.
- `test/rate-limit.test.ts` - the geocode rate limiter actually returns `429` once exceeded (against a mocked geocode provider, so it doesn't depend on network access).

## Security notes

- **Input validation**: every route body/params/query is validated with `zod` (`src/middleware/validate.ts`, `src/lib/validation-schemas.ts`) - coordinate ranges, string/array length caps, UUID-shaped path params, and enum checks. Invalid input is rejected with `400`, never silently coerced or dropped.
- **Rate limiting**: Redis-backed sliding-window limits apply per-IP and per-user (`src/middleware/rate-limit.ts`), with a stricter limiter on `/geo/*` plus a shared cross-process throttle and a daily quota on the metered Geoapify provider (`src/lib/geocode-providers.ts`, `src/lib/throttle.ts`, `src/lib/daily-limit.ts`).
- **Uploads**: images are capped at 1MB and 50-per-user, and the actual file content is sniffed (magic bytes, `file-type`) and checked against an allowlist - the client-supplied `Content-Type` header alone is never trusted.
- **Object storage**: the bucket is private; every read goes through a short-lived (1h) presigned URL. Object keys are always server-generated (`places/<userId>/<uuid>.<ext>`), so there's no path-traversal surface from user input. A user can only ever reference their _own_ previously uploaded image key - pasting another user's key or presigned-style URL into a place's `imageUrls` is silently dropped (`normalizeImageUrls` in `routes/places.ts`, backed by an `images` table ownership check).
- **JWT**: verification pins the algorithm to `HS256` to prevent algorithm-confusion attacks.
- **Known, accepted tradeoffs** (not fixed, by design): JWTs have no revocation list, so a leaked token is valid until its 7-day expiry. `trust proxy` is left unset - only enable it if the API is actually deployed behind a reverse proxy that sets `X-Forwarded-For`, otherwise it would let a client spoof its own rate-limit bucket.
