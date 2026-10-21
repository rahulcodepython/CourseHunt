# CourseHunt Production Hosting Guide

Step-by-step instructions for deploying CourseHunt.

| Piece | Where | Status |
| :--- | :--- | :--- |
| Frontend (Next.js 16, `apps/web`) | **Vercel** | deploy now |
| Backend (Go Fiber, `apps/server`) | **Voroa** web service (Docker) | deploy now |
| PostgreSQL | **Voroa** managed Postgres | deploy now |
| Redis | **Voroa** Key Value | deploy now (the backend also runs without it) |
| File storage | **Cloudflare R2** | **later** — uploads are disabled until it is connected |
| Login | **Google OAuth** | keys created; consent screen **in Testing** — publish later |

| Hostname | Points to |
| :--- | :--- |
| `coursehunt.rahulcodepython.in` | Vercel (frontend) |
| `api.coursehunt.rahulcodepython.in` | Voroa (backend) |

Environment variables:

- [`.env.example`](../.env.example) — development (copy to `.env`).
- Production values: §7.2 (Voroa backend) and §8 (Vercel frontend). Keep real values in a local, git-ignored `.env.production`.

---

## Contents

1. [How it fits together](#1-how-it-fits-together)
2. [Before you start](#2-before-you-start)
3. [Google OAuth (testing mode)](#3-google-oauth-testing-mode)
4. [Voroa: Postgres](#4-voroa-postgres)
5. [Voroa: Redis](#5-voroa-redis)
6. [Database schema and first admin](#6-database-schema-and-first-admin)
7. [Voroa: Backend](#7-voroa-backend)
8. [Vercel: Frontend](#8-vercel-frontend)
9. [DNS (Cloudflare)](#9-dns-cloudflare)
10. [Razorpay webhook](#10-razorpay-webhook)
11. [Smoke test](#11-smoke-test)
12. [Later: Cloudflare R2](#12-later-cloudflare-r2)
13. [Later: publish Google OAuth](#13-later-publish-google-oauth)
14. [Operations](#14-operations)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. How it fits together

```
                         Browser
            ┌───────────────┴────────────────┐
            │ pages, /api/auth               │ /api/v1/*  (Authorization: Bearer <jwt>)
            ▼                                ▼
 coursehunt.rahulcodepython.in     api.coursehunt.rahulcodepython.in
 Vercel · Next.js + Better Auth    Voroa · Go Fiber
            │   ▲                            │
            │   └── GET /api/auth/jwks ──────┤  (verifies the JWT signature)
            ▼                                ▼
       Voroa Postgres  ◄─────────────────────┤
                                       Voroa Redis
```

- **Login**: the user signs in with Google (or an email code) on the frontend. Better Auth stores the session in Postgres and issues a JWT. The frontend sends it to the API as `Authorization: Bearer <jwt>`; the backend verifies it against `JWKS_URL`.
- **One database, one URL**: both apps use the same `DATABASE_URL`. The frontend applies libpq SSL semantics (`sslmode=require` = encrypted, certificate not verified), so Voroa's self-signed certificate works for both.
- **Optional services**: the backend runs without Redis (`REDIS_URL` empty → no cache, in-memory rate limits) and without storage (`MINIO_ENDPOINT` empty → uploads return "File uploads are not available yet."). `/api/v1/health` reports them as `disabled`, not down.

---

## 2. Before you start

- [ ] GitHub repo pushed (Voroa and Vercel deploy from it).
- [ ] Accounts: Voroa, Vercel, Google Cloud, Razorpay, Resend. `rahulcodepython.in` is already on Cloudflare DNS.
- [ ] `BETTER_AUTH_SECRET` generated: `openssl rand -hex 32`. Changing it later logs everyone out.
- [ ] `migrate` (golang-migrate) installed, for §6:
  ```bash
  go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
  migrate -version
  ```
  On this machine the `migrate` mise shim currently fails with `No version is set for shim` — run `mise use -g go@1.27.1` (or install `migrate` another way) first.

---

## 3. Google OAuth (testing mode)

You already have a client ID and secret. While the consent screen is **in Testing**, only Google accounts listed as test users can sign in.

1. Google Cloud Console → **APIs & Services → OAuth consent screen** (or **Google Auth Platform**) → **Audience → Test users → Add users**: add every Google account that should be able to log in (up to 100).
2. **Clients** → your web client:
   - **Authorised JavaScript origins**: `https://coursehunt.rahulcodepython.in` and `http://localhost:3000`
   - **Authorised redirect URIs**: `https://coursehunt.rahulcodepython.in/api/auth/callback/google` and `http://localhost:3000/api/auth/callback/google`
3. Put the ID and secret in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (Vercel only — the backend does not need them).

Publishing is in §13.

---

## 4. Voroa: Postgres

1. Voroa → **New → PostgreSQL** (Mumbai). Use a paid size for real data: free databases have no backups.
2. Database → **Connect** → **External access** on (Vercel and your laptop connect from outside Voroa).
3. **Get connection details** → copy the URL (shown once). It looks like:
   ```
   postgres://postgres:<PASSWORD>@<HOST>:<PORT>/<DB>?sslmode=require
   ```
4. Leave the trusted-sources (IP allow-list) empty — Vercel has no fixed IPs.
5. Use this exact URL as `DATABASE_URL` for **both** the backend and Vercel. Make sure it ends in `?sslmode=require`.

---

## 5. Voroa: Redis

1. **New → Key Value** (smallest plan is enough).
2. Copy the connection URL (shown once):
   - **Internal** URL (`redis://...`) — preferred; the backend runs inside Voroa.
   - The **external** URL (`rediss://...`, TLS) also works; the backend supports both.
3. Set it as `REDIS_URL` on the backend. Vercel does not need Redis.

To run without Redis, leave `REDIS_URL` empty.

---

## 6. Database schema and first admin

### 6.1 Run migrations

Migrations do not run on deploy. Run them from your machine before the first backend deploy and after any release that adds one:

```bash
cd apps/server
export DATABASE_URL='<the Voroa URL>'
migrate -path internals/migrations -database "$DATABASE_URL" up
migrate -path internals/migrations -database "$DATABASE_URL" version   # latest version, not "dirty"
```

If a migration fails halfway, `version` shows `dirty`: fix the cause, `migrate ... force <last-good-version>`, then `up` again.

### 6.2 Seed data

`bun run seed` (`go run ./cmd/seed`) **truncates every table**, then loads the permission catalog, roles and demo data (12 users with password `password123`, courses, enrollments). `flush` truncates everything.

- For a **demo deployment** on a fresh database, running the seeder once is acceptable:
  ```bash
  DATABASE_URL='<the Voroa URL>' bun --filter @coursehunt/server seed
  ```
  Then change the demo passwords, or remove the demo accounts you don't need.
- **Never run it again** once real users or payments exist — it deletes everything.

### 6.3 First admin without demo data — not yet automated

Migrations create tables but not the permission catalog or the `Super Admin` / `Tutor` roles; only the seeder writes them. A clean production database therefore needs a non-destructive bootstrap command (upsert permissions and roles, promote one email to admin). Until it exists, use §6.2 on a fresh database.

---

## 7. Voroa: Backend

### 7.1 Create the service

1. **New → Web service** → repo `CourseHunt`, branch `master`.
2. **Root directory**: `/` (repo root — the Dockerfile copies `apps/server/...`).
3. **Runtime**: **Docker (Dockerfile)**. **Dockerfile path**: `/apps/server/Dockerfile` (cannot be changed after creation).
4. Region: Mumbai.
5. Port: Voroa always sets `PORT=3000` and the server reads it. Do **not** set `PORT`.

### 7.2 Environment

Add these as **runtime** variables (not build-time):

`ENVIRONMENT`, `ALLOWED_ORIGINS`, `DATABASE_URL`, `REDIS_URL`, `JWKS_URL`, the `MINIO_*` keys (leave `MINIO_ENDPOINT` empty for now), `RAZORPAY_*`, `TAX_PERCENT`, `RESEND_API_KEY`, `EMAIL_FROM`.

`JWKS_URL` points at the frontend, so deploy the frontend (§8) first, or expect the backend to fail its JWKS check until the frontend is up.

### 7.3 Deploy and check

1. Deploy. The runtime log should show `connected to redis`, `file storage disabled (MINIO_ENDPOINT not set)`, then `CourseHunt API listening`.
2. Open `https://<service>.getvoroa.com/api/v1/health` → `200`, `postgres: up`, `redis: up`, `minio: disabled`.

### 7.4 Custom domain

Service → **Settings → Custom Domains** → `api.coursehunt.rahulcodepython.in` → **Add domain** → **View DNS** → add the shown `CNAME` in Cloudflare (§9) → wait for **Verified** and **Certificate issued**.

---

## 8. Vercel: Frontend

1. **Add New → Project** → `CourseHunt` → **Root Directory** `apps/web` → framework Next.js (defaults for build and output).
   If install fails because of the repo-root workspace, set **Install Command** to `pnpm install`.
2. **Environment Variables (Production)**:
   `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `ALLOWED_ORIGINS`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `RESEND_API_KEY`, `EMAIL_FROM`.
   `NEXT_PUBLIC_*` are baked in at build time — redeploy after changing them.
3. **Settings → Functions → Function Region**: **Mumbai (bom1)**, next to the database.
4. Deploy, then **Settings → Domains** → add `coursehunt.rahulcodepython.in` → add the shown record in Cloudflare (§9).

Without `RESEND_API_KEY`, email login codes are only written to the Vercel function log, not sent — use Google sign-in or set up Resend.

---

## 9. DNS (Cloudflare)

Cloudflare → `rahulcodepython.in` → **DNS → Records**:

| Type | Name | Target | Proxy |
| :--- | :--- | :--- | :--- |
| CNAME | `coursehunt` | value shown by Vercel | **DNS only** |
| CNAME | `api.coursehunt` | value shown by Voroa (**View DNS**) | **DNS only** |

- `api.coursehunt` is two levels below the zone. Cloudflare's free certificate covers only one level (`*.rahulcodepython.in`), so it **must** stay DNS-only; Voroa issues its own certificate.
- `coursehunt` (one level) could be proxied, but Vercel recommends DNS-only and issues its own certificate.
- Remove old `A`/`AAAA` records for these names. If you ever proxy a record, set SSL/TLS mode to **Full (strict)** — **Flexible** causes redirect loops.

---

## 10. Razorpay webhook

1. Razorpay → **Account & Settings → Webhooks → Add New Webhook**.
2. URL: `https://api.coursehunt.rahulcodepython.in/api/v1/transactions/webhook`
3. Secret: `openssl rand -hex 24` → same value in `RAZORPAY_WEBHOOK_SECRET`.
4. Events: `payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`.
5. **API Keys** → copy into `RAZORPAY_KEY_ID` / `RAZORPAY_SECRET`. Use test-mode keys until you take real payments.

---

## 11. Smoke test

Order: Google (§3) → Postgres (§4) → Redis (§5) → migrations/seed (§6) → Vercel (§8) → backend (§7) → DNS (§9) → Razorpay (§10).

| Check | Expected |
| :--- | :--- |
| `https://api.coursehunt.rahulcodepython.in/api/v1/health` | `200`; postgres/redis `up`, minio `disabled` |
| `https://coursehunt.rahulcodepython.in/api/auth/jwks` | JSON with `keys` |
| `https://coursehunt.rahulcodepython.in` | landing page with courses |
| Google sign-in with a **test user** | logged in, dashboard loads (no 401s in Network tab) |
| Tutor: try an upload | fails; the API returns `503` "File uploads are not available yet." (expected until §12) |
| Razorpay test payment | enrollment appears; webhook delivery `200` |

---

## 12. Later: Cloudflare R2

When you are ready for uploads (one public bucket, demo setup):

1. Cloudflare → **R2** → **Create bucket** `coursehunt`.
2. Bucket → **Settings → Public access**: enable the **r2.dev** URL (fine for a demo), or connect a custom domain such as `media-coursehunt.rahulcodepython.in` (one level, so the free certificate covers it).
3. Bucket → **Settings → CORS policy**:
   ```json
   [
     {
       "AllowedOrigins": ["https://coursehunt.rahulcodepython.in", "http://localhost:3000"],
       "AllowedMethods": ["GET", "HEAD", "PUT"],
       "AllowedHeaders": ["Content-Type", "Range"],
       "ExposeHeaders": ["ETag", "Content-Length", "Content-Range", "Accept-Ranges"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
4. **Manage R2 API Tokens → Create API token** → *Object Read & Write*, bucket `coursehunt` → copy the access key ID and secret.
5. Set on the backend and redeploy:
   ```ini
   MINIO_ENDPOINT=<ACCOUNT_ID>.r2.cloudflarestorage.com
   MINIO_SECURE=true
   MINIO_ACCESS_KEY=<access key id>
   MINIO_SECRET_KEY=<secret access key>
   MINIO_BUCKET=coursehunt
   MINIO_BASE_URL=https://<ACCOUNT_ID>.r2.cloudflarestorage.com/coursehunt
   MINIO_PUBLIC_BUCKET=coursehunt
   MINIO_PUBLIC_BASE_URL=https://pub-<id>.r2.dev
   ```
   (`MINIO_PUBLIC_BASE_URL` = the r2.dev URL or your custom domain, without the bucket name.)
6. Health now shows `minio: up`. The boot warning `failed to set public-read policy` is harmless on R2.

All files then live in one public bucket: anyone with a file's link can open it (names are random UUIDs, so links can't be guessed). For paid content later, use a second, private bucket by setting `MINIO_BUCKET` and `MINIO_PUBLIC_BUCKET` to different buckets.

---

## 13. Later: publish Google OAuth

1. Consent screen → **Branding**: home page `https://coursehunt.rahulcodepython.in`, privacy policy `https://coursehunt.rahulcodepython.in/privacy-policy`, terms `https://coursehunt.rahulcodepython.in/terms-and-conditions`, authorised domain `rahulcodepython.in`.
2. Scopes: only `openid`, `email`, `profile` (non-sensitive — no Google review needed).
3. **Audience → Publish app**. Any Google account can then sign in.

---

## 14. Operations

- **Releases**: push to `master` → Vercel and Voroa redeploy. Roll back from each platform's deployment history.
- **Migrations first**: run `migrate ... up` before pushing code that needs a new schema.
- **Backups**: Voroa backs up paid databases daily (7 days). Extra copies: `pg_dump "$DATABASE_URL" | gzip > db_$(date +%F).sql.gz`.
- **Secrets**: Postgres password rotation (**Get connection details**) → update both Vercel and Voroa. Changing `BETTER_AUTH_SECRET` logs everyone out.
- **Scaling**: the backend is stateless; with Redis on, cache and rate limits are shared across instances.

---

## 15. Troubleshooting

| Symptom | Likely cause |
| :--- | :--- |
| Vercel log: `self-signed certificate` | `DATABASE_URL` lacks `?sslmode=require` (or says `verify-full`) |
| Backend log: `invalid REDIS_URL` | Malformed URL — must start with `redis://` or `rediss://` |
| `/api/v1/health` → `503` | Body lists which service is `down` (`disabled` is fine) |
| Every API call returns 401 | `JWKS_URL` wrong/unreachable, or frontend and backend use different databases |
| CORS error calling the API | `ALLOWED_ORIGINS` (backend) lacks `https://coursehunt.rahulcodepython.in` |
| Google `access_denied` / "app not verified" | Account not in **Test users** (§3) |
| Google `redirect_uri_mismatch` | Redirect URI ≠ `GOOGLE_CALLBACK_URL` |
| Email login code never arrives | `RESEND_API_KEY` not set — the code is only in the Vercel log |
| Uploads fail with `503` "File uploads are not available yet." | Expected until R2 is connected (§12) |
| Voroa domain stuck on "Waiting for DNS" | `api.coursehunt` record proxied (orange cloud) or an old `A` record exists |
| Payment taken, enrollment missing | Webhook URL or secret wrong — check Razorpay delivery log |
