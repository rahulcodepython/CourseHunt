# CourseHunt Master Engineering Implementation Plan
## Phased Blueprint for 100/100 Production Hostability & Enterprise LMS Transformation

**Target Branch:** `feature/production-hardening-and-audit-remediation`  
**Reference Document:** [`FINAL_AUDIT_REPORT.md`](file:///home/rahulcodepython/Workspace/CourseHunt/FINAL_AUDIT_REPORT.md)  
**Target Environment:** Production (`coursehunt.com`)  
**Target Hostability Score:** Upgraded from **42/100 (Critical Failure)** to **100/100 (Production Ready)**

---

## Executive Overview & Phased Roadmap

This master implementation plan establishes an actionable, phase-by-phase execution breakdown of every architectural remediation, security fix, database optimization, observability integration, and enterprise LMS capability specified in [`FINAL_AUDIT_REPORT.md`](file:///home/rahulcodepython/Workspace/CourseHunt/FINAL_AUDIT_REPORT.md).

```
                      IMPLEMENTATION SEQUENCE & DEPENDENCY GRAPH
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Critical Security, Access Control & Storage Isolation                         │
│ (MinIO Dual Buckets, Upload IDOR, Notification Leak, XSS Sanitization, Role Guards)   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Phase 2: Database Integrity, Critical SQL Bug Fixes & Resilient Queue Workers          │
│ (Cartesian Revenue Fix, Student Crash Fix, DB Outbox Refunds, Category 500s)           │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Phase 3: High-Performance Caching & Penetration Hardening                              │
│ (FetchOrNegative Sentinel, UUID Guard, Granular Invalidation, Redis Rate Limiting)     │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Phase 4: Frontend Reliability, Edge Proxy & Network Optimization                       │
│ (React Query ApiError Throwing, Next.js 16 proxy.ts, Zustand Session Persistence)      │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Phase 5: Distributed Observability, Logging Pipeline & In-App APM                      │
│ (Grafana Loki Infra, Async Batch Push Client, JSON Schema, /admin/logs Console)        │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Phase 6: Enterprise LMS Features & Database Schema Evolution                           │
│ (Migration 000011, Playback Tracking, Drip Content, Tutor Payouts, Assignments, Email) │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Phase 7: Production Infrastructure, Domain Configuration & Deployment Verification     │
│ (Traefik SSL, Resource Quotas, Production .env, Smoke & Load Verification)             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Critical Security, Access Control & Storage Isolation

### Job 1.1: MinIO S3 Dual-Bucket Architecture & Presigned Streaming URLs
- **Audit Reference:** Section 6, 13.1; Table 5
- **Files Affected:**
  - [`apps/server/internals/pkg/minio/client.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/pkg/minio/client.go)
  - [`apps/server/internals/features/lessons/lessons.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/lessons/lessons.services.go)
  - [`apps/server/internals/config/config.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/config/config.go)
- **Problem:** MinIO bucket policy currently sets public read (`s3:GetObject` on `*`), allowing unauthorized scraping of paid video content and downloadable course resources without active enrollment.
- **Tasks to Complete:**
  1. Update MinIO configuration to support two discrete buckets:
     - `MINIO_PUBLIC_BUCKET` (`coursehunt-public`) for user avatars, course promotional thumbnails, and marketing banners.
     - `MINIO_BUCKET` (`coursehunt-private`) strictly private, zero public read access.
  2. Implement `GeneratePresignedStreamingURL(ctx context.Context, objectKey string, expires time.Duration) (string, error)` in `apps/server/internals/pkg/minio/client.go`.
     - Inject `response-content-disposition: inline` for byte-range seeking in HTML5/HLS video players.
     - Enforce a 15-minute expiration window on all generated streaming URLs.
  3. Update `lessons.services.go` (`StudentReadContent`) to verify active student enrollment before issuing presigned video URLs.
- **Verification & Acceptance Criteria:**
  - Direct HTTP `GET` to raw MinIO S3 URL on private assets returns `403 Forbidden`.
  - Authorized enrolled student receives a signed URL valid for 15 minutes supporting `Range` headers.

---

### Job 1.2: File Upload IDOR Prevention & Cryptographic Namespacing
- **Audit Reference:** Section 6, 13.2; Section 5 (Upload Matrix)
- **Files Affected:**
  - [`apps/server/internals/features/upload/upload.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/upload/upload.services.go)
  - [`apps/server/internals/features/upload/upload.routes.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/upload/upload.routes.go)
- **Problem:** Files are stored using user-provided raw filenames (e.g. `intro.mp4`), permitting overwriting of existing tutor assets and IDOR collisions.
- **Tasks to Complete:**
  1. Add strict RBAC role check in `upload.services.go` and `upload.routes.go`: restrict signed upload URL issuance strictly to `tutor` and `admin` roles.
  2. Implement filename sanitization using `filepath.Base` and extension allowlisting (`.mp4`, `.mov`, `.pdf`, `.zip`, `.png`, `.jpg`, `.jpeg`, `.webp`).
  3. Enforce cryptographic path namespacing:
     ```
     {userRole}/{userID}/{uuidv4}{extension}
     ```
  4. Ensure upload URLs are restricted to `PUT` method with 15-minute expiration and max size validation constraints.
- **Verification & Acceptance Criteria:**
  - Student accounts attempting to call `/v1/upload/signed/url` receive `403 Forbidden`.
  - Tutors uploading files cannot overwrite existing files, and asset paths are isolated by UUID.

---

### Job 1.3: Global Notification Data Leak Resolution
- **Audit Reference:** Section 13.3; Section 5
- **Files Affected:**
  - [`apps/server/internals/features/notifications/notifications.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/notifications/notifications.services.go)
  - [`apps/server/internals/features/notifications/notifications.queries.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/notifications/notifications.queries.go)
- **Problem:** Notification querying or publishing without explicit user recipient checks leaks private administrative or system alerts across user boundaries.
- **Tasks to Complete:**
  1. Verify all queries in `notifications.queries.go` enforce `WHERE user_id = $1` or explicit recipient filters.
  2. Add authorization assertion in `notifications.services.go` ensuring caller can only read or mark read their own notifications.
  3. Ensure role-targeted notifications (e.g. broadcast to tutors) resolve via recipient joins rather than unindexed table scans.
- **Verification & Acceptance Criteria:**
  - Requesting notifications as User A never returns entries designated for User B or Admin.

---

### Job 1.4: Discussion Stored XSS Mitigation & Input Sanitization
- **Audit Reference:** Section 5, 6
- **Files Affected:**
  - [`apps/server/internals/features/discussions/discussions.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/discussions/discussions.services.go)
  - `go.mod` (add `github.com/microcosm-cc/bluemonday`)
- **Problem:** Raw markdown and HTML content submitted to course discussions are stored verbatim, allowing execution of arbitrary JavaScript via stored XSS.
- **Tasks to Complete:**
  1. Add `bluemonday` dependency: `go get github.com/microcosm-cc/bluemonday`.
  2. Create an HTML sanitizer policy helper (`bluemonday.UGCPolicy()`).
  3. Sanitize all discussion threads and reply message bodies prior to persistence.
  4. Enforce author/admin ownership validation in `discussions.services.go` on `DELETE` and `UPDATE` endpoints.
- **Verification & Acceptance Criteria:**
  - Injected `<script>` tags, `onload` attributes, and malicious `javascript:` URIs are stripped clean before database insert.

---

## Phase 2: Database Integrity, Critical SQL Bug Fixes & Resilient Queue Workers

### Job 2.1: Admin Dashboard Cartesian Product Bug (Revenue & Enrollment Inflation)
- **Audit Reference:** Section 14.1
- **Files Affected:**
  - [`apps/server/internals/features/dashboard/dashboard.queries.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/dashboard/dashboard.queries.go)
- **Problem:** `AdminDashboardJSON` query joins `courses` simultaneously with `enrollments` AND `transactions`. This produces an $N \times M$ Cartesian explosion, multiplying course revenue metrics by total student counts.
- **Tasks to Complete:**
  1. Refactor `AdminDashboardJSON` to decouple aggregations into independent Common Table Expressions (CTEs):
     - `course_enrollment_counts` grouping by `course_id` where `revoked = false`.
     - `course_revenue_totals` grouping by `course_id` where `status = 'success'`.
  2. Re-aggregate inside the primary JSON builder using `LEFT JOIN` on pre-aggregated CTEs.
  3. Optimize `revenue_this_month` and `total_revenue` calculations with explicit status index predicates.
- **Verification & Acceptance Criteria:**
  - When a course has 10 enrollments and 2 transactions of $50, reported revenue is exactly $100 (not $1,000).

---

### Job 2.2: Student Dashboard Runtime Crash Patch (`in_progress_courses_count`)
- **Audit Reference:** Section 15.1
- **Files Affected:**
  - [`apps/server/internals/features/dashboard/dashboard.queries.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/dashboard/dashboard.queries.go)
  - [`apps/web/src/app/(dashboard)/student/page.tsx`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/web/src/app/\(dashboard\)/student/page.tsx) (or relevant student dashboard component)
- **Problem:** `UserDashboardJSON` omits `in_progress_courses_count`. The frontend calls `.toLocaleString()` on `undefined`, triggering an unhandled client-side runtime exception.
- **Tasks to Complete:**
  1. Update `UserDashboardJSON` in `dashboard.queries.go` to explicitly compute:
     ```sql
     'in_progress_courses_count', (SELECT COUNT(*) FROM enrollments WHERE user_id = $1 AND revoked = false AND completed = false)
     ```
  2. Add defensive null-coalescing (`data?.in_progress_courses_count ?? 0`) in the web client dashboard view.
- **Verification & Acceptance Criteria:**
  - Student dashboard loads with 0 errors for fresh student accounts with active or incomplete enrollments.

---

### Job 2.3: Persistent Auto-Refund Queue Engine (PostgreSQL Outbox with `SKIP LOCKED`)
- **Audit Reference:** Section 15.2
- **Files Affected:**
  - [`apps/server/internals/features/transactions/transactions.refund.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/transactions/transactions.refund.go)
  - [`apps/server/internals/features/transactions/transactions.webhook.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/transactions/transactions.webhook.go)
- **Problem:** Auto-refunds for duplicate or failed payments rely on an ephemeral in-memory Go channel. Server restarts or channel saturation lead to dropped refund jobs and financial disputes.
- **Tasks to Complete:**
  1. Replace the in-memory refund channel with an outbox polling background cron in `transactions.refund.go`.
  2. Implement worker query using PostgreSQL concurrency-safe locking:
     ```sql
     SELECT id, payment_id FROM transaction_refunds
     WHERE refund_status = 'pending'
     ORDER BY created_at ASC
     LIMIT 10
     FOR UPDATE SKIP LOCKED;
     ```
  3. Execute refund gateway call, update status to `completed` or `failed` with exponential backoff on retries.
  4. Ensure Razorpay webhook handler persists duplicate payment events into `transaction_refunds` in the same transaction.
- **Verification & Acceptance Criteria:**
  - Server process killed during refund processing resumes processing pending records upon reboot without duplicate payouts.

---

### Job 2.4: Category Update/Delete HTTP 500 Fix on Missing Resource
- **Audit Reference:** Section 15.3, Section 5
- **Files Affected:**
  - [`apps/server/internals/features/categories/categories.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/categories/categories.services.go)
  - [`apps/server/internals/features/categories/categories.repositories.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/categories/categories.repositories.go)
- **Problem:** Invoking update or delete on a non-existent category returns HTTP 500 instead of HTTP 404 due to unchecked `RowsAffected()`.
- **Tasks to Complete:**
  1. Check `tag.RowsAffected()` in repository mutations; if `0`, return `postgres.ErrNotFound`.
  2. Ensure services layer translates `postgres.ErrNotFound` to `utils.ErrNotFound("Category not found", nil)`.
  3. Only trigger cache invalidation if `RowsAffected() > 0`.
- **Verification & Acceptance Criteria:**
  - `PATCH /api/v1/categories/00000000-0000-0000-0000-000000000000` returns `404 Not Found` with clean JSON response.

---

### Job 2.5: User Login Write Amplification Mitigation & Session Token Pruning
- **Audit Reference:** Section 14.2
- **Files Affected:**
  - [`apps/server/internals/features/users/users.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/users/users.services.go)
  - [`apps/server/internals/features/security/security.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/security/security.services.go)
- **Problem:** Every authentication event executes synchronous redundant updates to `users.last_login_at` and unpruned session table records, saturating DB IOPS under load.
- **Tasks to Complete:**
  1. Throttle login timestamp updates using Redis debounce (only write `last_login_at` if older than 15 minutes).
  2. Implement asynchronous cleanup of expired refresh tokens during login rather than blocking the main authentication request.
- **Verification & Acceptance Criteria:**
  - Rapid successive logins do not trigger repetitive disk writes for `last_login_at`.

---

## Phase 3: High-Performance Caching & Penetration Hardening

### Job 3.1: Universal Negative Caching (`FetchOrNegative`) Implementation
- **Audit Reference:** Section 1.1, 1.4; Table 1 (All 22 Modules)
- **Files Affected:**
  - [`apps/server/internals/pkg/cache/operations.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/pkg/cache/operations.go)
  - [`apps/server/internals/features/courses/courses.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/courses/courses.services.go)
  - [`apps/server/internals/features/lessons/lessons.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/lessons/lessons.services.go)
  - [`apps/server/internals/features/chapters/chapters.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/chapters/chapters.services.go)
  - [`apps/server/internals/features/quiz/quiz.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/quiz/quiz.services.go)
  - [`apps/server/internals/features/categories/categories.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/categories/categories.services.go)
  - [`apps/server/internals/features/coupons/coupons.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/coupons/coupons.services.go)
  - [`apps/server/internals/features/updates/updates.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/updates/updates.services.go)
  - [`apps/server/internals/features/roles/roles.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/roles/roles.services.go)
  - [`apps/server/internals/features/wishlist/wishlist.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/wishlist/wishlist.services.go)
- **Problem:** `Fetch[T]` skips Redis caching on error. Non-existent entities bypass Redis completely, hammering PostgreSQL with index and sequence scans.
- **Tasks to Complete:**
  1. Add `FetchOrNegative[T]` to `apps/server/internals/pkg/cache/operations.go`:
     - Define `NullSentinel = "__REDIS_NULL_SENTINEL__"`.
     - Set `NegativeCacheTTL = 60 * time.Second`.
     - On cache hit matching `NullSentinel`, return immediately with `postgres.ErrNotFound`.
     - On cache miss, execute loader; if error matches `isNotFound`, set `NullSentinel` with 60s TTL.
  2. Refactor all 22 feature read endpoints listed in the audit table to use `FetchOrNegative`.
- **Verification & Acceptance Criteria:**
  - Querying `/api/v1/courses/slug/does-not-exist` hits DB once, subsequent requests for 60 seconds return 404 from Redis in $<1\text{ms}$.

---

### Job 3.2: Fiber UUID Parameter Guard Middleware
- **Audit Reference:** Section 1.4, Section 6
- **Files Affected:**
  - Create [`apps/server/internals/middlewares/uuid_validator.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/middlewares/uuid_validator.go)
  - Apply in route definitions across `courses`, `lessons`, `chapters`, `quiz`, `users`, `categories`.
- **Problem:** Passing invalid UUID strings (e.g. `/api/v1/courses/abc-123`) causes PostgreSQL driver errors (`SQLSTATE 22P02: invalid input syntax for type uuid`), resulting in HTTP 500 errors.
- **Tasks to Complete:**
  1. Create `ValidateUUIDParams(paramNames ...string) fiber.Handler` that checks `uuid.Parse(val)`.
  2. Return clean `utils.ErrNotFound("Requested resource not found.", err)` or `utils.ErrBadRequest` on invalid UUID format.
  3. Mount middleware on all routes containing `:id`, `:course_id`, `:lesson_id`, `:chapter_id`.
- **Verification & Acceptance Criteria:**
  - `GET /api/v1/courses/invalid-uuid` returns HTTP 404 immediately without executing any database query.

---

### Job 3.3: Granular Cache Invalidation Engine (Eradicate Broad Wildcard Wipes)
- **Audit Reference:** Section 1.3
- **Files Affected:**
  - [`apps/server/internals/features/lessons/lessons.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/lessons/lessons.services.go)
  - [`apps/server/internals/features/notes/notes.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/notes/notes.services.go)
  - [`apps/server/internals/features/faqs/faqs.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/faqs/faqs.services.go)
  - [`apps/server/internals/features/chapters/chapters.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/chapters/chapters.services.go)
- **Problem:** Updating a lesson in Course A invalidates `lessons:*`, `chapters:*`, and `courses:*`, dropping cached pages and course cards across the entire platform. Updating notes wipes all users' notes. FAQs execute `SCAN` for uncached entries.
- **Tasks to Complete:**
  1. Replace blanket wildcards with targeted keys:
     - Lesson update: invalidate `lessons:admin:content:%s`, `lessons:student:content:%s:*`, and specific chapter/course study keys.
     - Notes update: invalidate only `notes:user:%s:lesson:%s`.
     - Remove unnecessary Redis `SCAN` operations in `faqs.services.go`.
  2. Implement an asynchronous batch invalidator to avoid blocking Fiber request cycles during large course updates.
- **Verification & Acceptance Criteria:**
  - Editing Lesson 1 of Course A does NOT purge cached content of Course B.

---

### Job 3.4: Uncached High-Frequency Endpoints Caching
- **Audit Reference:** Section 1.2, Section 5
- **Files Affected:**
  - [`apps/server/internals/features/certificates/certificates.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/certificates/certificates.services.go)
  - [`apps/server/internals/features/courses/courses.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/courses/courses.services.go)
  - [`apps/server/internals/features/dashboard/dashboard.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/dashboard/dashboard.services.go)
  - [`apps/server/internals/features/discussions/discussions.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/discussions/discussions.services.go)
  - [`apps/server/internals/features/faqs/faqs.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/faqs/faqs.services.go)
- **Problem:** Mission-critical read paths execute expensive relational queries repeatedly without caching.
- **Tasks to Complete:**
  1. Certificate QR Verification (`GET /v1/certificates/verify/:id`): cache with 2-hour TTL.
  2. Student Course Study Page (`GET /v1/courses/:id/study`): cache curriculum tree with 5-minute TTL per user.
  3. Dashboards (`UserDashboard`, `TutorDashboard`, `AdminDashboard`): cache with 60–120s TTL.
  4. FAQ and Discussion list queries: cache with 10-minute and 30-second TTLs respectively.
- **Verification & Acceptance Criteria:**
  - Second invocation of `/api/v1/certificates/verify/:id` returns from Redis cache in $<2\text{ms}$.

---

### Job 3.5: Redis-Backed Distributed Token Bucket Rate Limiting
- **Audit Reference:** Section 5, 6
- **Files Affected:**
  - [`apps/server/internals/middlewares/rate_limiter.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/middlewares/rate_limiter.go) (or relevant limiter configuration)
  - Route files for `auth`, `coupons`, `certificates`
- **Problem:** In-memory rate limiting fails across multi-container instances and allows IP brute forcing on restarts.
- **Tasks to Complete:**
  1. Configure Fiber `limiter.New` with Redis Storage (`fiber/v2/middleware/limiter` with `storage/redis`).
  2. Apply strict tiers:
     - `/api/auth/*`: 5 req/min per IP.
     - `/api/v1/coupons/validate`: 10 req/min per user.
     - `/api/v1/certificates/verify/*`: 60 req/min per IP.
- **Verification & Acceptance Criteria:**
  - Hitting `/api/auth/login` 6 times in a minute from the same IP returns `429 Too Many Requests`.

---

## Phase 4: Frontend Reliability, Edge Proxy & Network Optimization

### Job 4.1: React Query Error-Swallowing Bug Patch (`ApiError` Rejection)
- **Audit Reference:** Section 2.1
- **Files Affected:**
  - [`apps/web/src/react-query/client.ts`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/web/src/react-query/client.ts)
  - All dependent query hooks in `apps/web/src/query-hooks/`
- **Problem:** `apiRequest` catches all Axios/Zod errors and returns `{ success: false, data: null }` as a resolved Promise. React Query never enters `isError`, retries never trigger, poisoned error states are cached, and UI throws unhandled null pointer exceptions.
- **Tasks to Complete:**
  1. Define and export `ApiError` class in `apps/web/src/react-query/client.ts`:
     ```ts
     export class ApiError extends Error {
       constructor(public message: string, public statusCode: number, public rawError?: unknown) {
         super(message);
         this.name = "ApiError";
       }
     }
     ```
  2. Update `apiRequest`: on HTTP 4xx/5xx or Zod parsing failure, extract status and message and **`throw new ApiError(...)`**.
  3. Ensure TanStack Query components and hooks receive `isError`, `error`, and activate retry logic.
- **Verification & Acceptance Criteria:**
  - Mocking an API 500 error causes React Query hook `isError` to be `true`, `isSuccess` to be `false`, and triggers automatic retries.

---

### Job 4.2: Next.js 16 Edge Architecture: The `proxy.ts` Routing Standard
- **Audit Reference:** Section 12, 13
- **Files Affected:**
  - [`apps/web/src/proxy.ts`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/web/src/proxy.ts)
- **Problem:** Ensure compatibility with Next.js 16 Edge Proxy architecture, standardizing cookie checks, route protection, and callback redirection.
- **Tasks to Complete:**
  1. Update `apps/web/src/proxy.ts` to implement the specification from Section 12.2:
     - Fast pass-through for `/_next`, `/api`, `/static`, and files with extensions.
     - Protected route redirect to `/auth/login?callbackUrl=...` for unauthenticated visitors.
     - Authenticated visitor redirect from `/auth/login` directly to `/student/dashboard`.
     - Explicit matcher configuration excluding static assets and favicon.
- **Verification & Acceptance Criteria:**
  - Direct navigation to `/student` without session cookie redirects cleanly to `/auth/login?callbackUrl=%2Fstudent`.
  - Logged-in user visiting `/auth/login` redirects to student dashboard.

---

### Job 4.3: Redundant `getSession` Roundtrip Eradication & Session Persistence
- **Audit Reference:** Section 2.2
- **Files Affected:**
  - [`apps/web/src/store/session.store.ts`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/web/src/store/session.store.ts)
  - [`apps/web/src/hooks/use-session.ts`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/web/src/hooks/use-session.ts)
- **Problem:** On hard browser refresh, session in Zustand memory vanishes, forcing blocking roundtrip `authClient.getSession()` before any protected query can load, causing UI flash and network waterfalls.
- **Tasks to Complete:**
  1. Configure Zustand `persist` middleware on `session.store.ts` using `sessionStorage` or `localStorage`.
  2. Hydrate session instantly from local storage upon mount.
  3. Trigger non-blocking background validation against the backend session endpoint to refresh permissions.
- **Verification & Acceptance Criteria:**
  - Hard refresh on dashboard renders authenticated skeleton instantly without waiting for initial `getSession` roundtrip.

---

## Phase 5: Distributed Observability, Logging Pipeline & In-App APM

### Job 5.1: Grafana Loki Container Setup & Configuration
- **Audit Reference:** Section 9, 10
- **Files Affected:**
  - [`docker-compose.yml`](file:///home/rahulcodepython/Workspace/CourseHunt/docker-compose.yml) (or `infra/docker-compose.yml`)
  - Create [`infra/loki/loki-config.yaml`](file:///home/rahulcodepython/Workspace/CourseHunt/infra/loki/loki-config.yaml)
- **Problem:** Production environment lacks centralized distributed log ingestion, relying on local ephemeral stdout.
- **Tasks to Complete:**
  1. Create `infra/loki/loki-config.yaml` with TSDB schema, filesystem chunk storage, 30-day retention period.
  2. Add `grafana/loki:3.0.0` service to `docker-compose.yml` with port `3100`, healthcheck, and persistent volume `loki-data`.
- **Verification & Acceptance Criteria:**
  - `curl http://localhost:3100/ready` returns HTTP 200 OK.

---

### Job 5.2: Asynchronous High-Throughput Loki Push Client in Go Fiber
- **Audit Reference:** Section 9.3, 10
- **Files Affected:**
  - [`apps/server/internals/middlewares/logger.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/middlewares/logger.go)
- **Problem:** Synchronous logging stalls HTTP request threads; unformatted logs prevent automated LogQL querying.
- **Tasks to Complete:**
  1. Implement `LokiLoggerMiddleware()` in `apps/server/internals/middlewares/logger.go`:
     - Buffered channel queue of capacity 2048 entries.
     - Background batch flush worker ticking every 1 second or upon reaching 100 entries.
     - Non-blocking push to channel; drop gracefully under saturation to preserve API responsiveness.
  2. Structure payload matching Section 10 JSON Schema:
     - `timestamp`, `level`, `message`, `service` (`name`, `version`, `environment`).
     - `http` (`method`, `path`, `route`, `status_code`, `latency_ms`, `client_ip`, `user_agent`).
     - `trace` (`request_id`, `user_id`, `session_id`).
     - `error` (`kind`, `stack_trace`, `root_cause`).
- **Verification & Acceptance Criteria:**
  - Backend emits JSON telemetry batches to Loki without adding latency to Fiber request cycles.

---

### Job 5.3: Backend Loki Log Query API Endpoint
- **Audit Reference:** Section 11, 12
- **Files Affected:**
  - Create or update [`apps/server/internals/features/monitoring/monitoring.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/monitoring/monitoring.services.go)
  - Create or update [`apps/server/internals/features/monitoring/monitoring.routes.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/monitoring/monitoring.routes.go)
- **Problem:** Web admin dashboard needs a secure, authorized backend proxy endpoint to query Loki logs via LogQL without exposing raw Loki ports to the internet.
- **Tasks to Complete:**
  1. Create `GET /api/v1/admin/logs/loki/query` restricted to `admin` role.
  2. Support query parameters `limit`, `level`, `search`, `start`, `end`.
  3. Query Loki HTTP API `http://loki:3100/loki/api/v1/query_range` and parse log streams into structured JSON array.
- **Verification & Acceptance Criteria:**
  - Admin request to `/api/v1/admin/logs/loki/query?limit=50&level=error` returns structured log entries.

---

### Job 5.4: Live APM Console & Observability UI (`/admin/logs`)
- **Audit Reference:** Section 11
- **Files Affected:**
  - [`apps/web/src/app/admin/logs/page.tsx`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/web/src/app/admin/logs/page.tsx)
- **Problem:** Existing logs page is a static, plain table with no live tailing, latency graphs, or structured trace inspection.
- **Tasks to Complete:**
  1. Implement modern APM console in `apps/web/src/app/admin/logs/page.tsx`:
     - Real-time telemetry metric cards: Live Ingestion Rate, P95 Latency, 5xx Error Rate, Active Workers.
     - Latency & Throughput Area Chart using Recharts.
     - Live tailing toggle (polling backend Loki proxy every 3 seconds).
     - Filter bar by log level (`ALL`, `INFO`, `WARN`, `ERROR`) and text search (path, message, request ID).
     - Log stream list with expandable JSON inspection drawer.
- **Verification & Acceptance Criteria:**
  - Visiting `/admin/logs` displays interactive latency charts and real-time streaming logs with collapsible JSON traces.

---

## Phase 6: Enterprise LMS Core Features & Database Schema Evolution

### Job 6.1: Database Migration `000011_enterprise_lms_features`
- **Audit Reference:** Section 17, 18
- **Files Affected:**
  - Create [`apps/server/internals/migrations/000011_enterprise_lms_features.up.sql`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/migrations/000011_enterprise_lms_features.up.sql)
  - Create [`apps/server/internals/migrations/000011_enterprise_lms_features.down.sql`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/migrations/000011_enterprise_lms_features.down.sql)
- **Tasks to Complete:**
  1. Add columns to `lesson_progress`: `playback_seconds`, `total_watch_time_seconds`, `last_watched_at`.
  2. Create `user_learning_streaks` table (`user_id`, `current_streak_days`, `longest_streak_days`, `last_active_date`, `total_study_minutes`).
  3. Add columns to `chapters`: `unlock_days_after_enrollment`, `unlock_at`, `prerequisite_chapter_id`.
  4. Create `tutor_payout_profiles` table (`user_id`, `commission_percentage`, `bank_account_number`, `bank_ifsc_code`, `upi_id`, `payout_mode`).
  5. Create `tutor_payout_transactions` table (`id`, `tutor_id`, `amount`, `platform_fee`, `status`, `reference_id`, `processed_at`, `created_at`).
  6. Create `assignments` table (`id`, `lesson_id`, `title`, `instructions`, `max_score`, `created_at`).
  7. Create `assignment_submissions` table (`id`, `assignment_id`, `user_id`, `file_url`, `score`, `feedback_notes`, `graded_by`, `submitted_at`, `graded_at`).
  8. Write clean rollback logic in `000011_enterprise_lms_features.down.sql`.
- **Verification & Acceptance Criteria:**
  - Migration runs up and down cleanly without foreign key conflicts or data loss.

---

### Job 6.2: Video Playback Resumption & Student Learning Analytics
- **Audit Reference:** Section 16.4
- **Files Affected:**
  - [`apps/server/internals/features/lessons/lessons.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/lessons/lessons.services.go)
  - [`apps/server/internals/features/lessons/lessons.repositories.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/lessons/lessons.repositories.go)
  - [`apps/server/internals/features/lessons/lessons.routes.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/lessons/lessons.routes.go)
  - Web video player component (`apps/web/src/components/video-player/` or similar)
- **Problem:** Students cannot resume video lessons where they left off; tutors and admins lack granular watch time heatmaps and engagement metrics.
- **Tasks to Complete:**
  1. Add endpoint `POST /api/v1/lessons/:id/progress/heartbeat` receiving `{ playback_seconds: number, session_seconds: number }`.
  2. Persist `playback_seconds` and increment `total_watch_time_seconds` with throttle/debouncing.
  3. Update `user_learning_streaks`: check if `last_active_date == CURRENT_DATE - 1` to increment streak or reset if missed.
  4. Return saved `playback_seconds` in `StudentReadContent` so the web video player can seek to the exact timestamp on load.
- **Verification & Acceptance Criteria:**
  - Student watching to 04:32 and refreshing the browser resumes playback at 04:32.

---

### Job 6.3: Drip Content Scheduling & Prerequisite Enforcement Engine
- **Audit Reference:** Section 16.5
- **Files Affected:**
  - [`apps/server/internals/features/chapters/chapters.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/chapters/chapters.services.go)
  - [`apps/server/internals/features/courses/courses.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/courses/courses.services.go)
- **Problem:** All course chapters are unlocked immediately upon purchase, preventing cohort-based learning, scheduled drip drops, and prerequisite mastery workflows.
- **Tasks to Complete:**
  1. In `courses.services.go` (`StudyPage`) and `chapters.services.go`, evaluate unlock criteria:
     - Date-based: if `unlock_at` is set, verify `CURRENT_TIMESTAMP >= unlock_at`.
     - Enrollment delay: if `unlock_days_after_enrollment > 0`, verify `CURRENT_DATE >= enrollment_date + unlock_days`.
     - Prerequisite: if `prerequisite_chapter_id` is set, verify all lessons in prerequisite chapter are completed.
  2. Mark chapters in response payload as `locked: true` with `unlock_reason` and `unlock_estimated_date`.
  3. Prevent lesson content streaming if parent chapter is locked.
- **Verification & Acceptance Criteria:**
  - Chapter with `unlock_days_after_enrollment: 7` returns `locked: true` on day 1 of enrollment, and lesson content URLs are withheld.

---

### Job 6.4: Tutor Revenue Sharing, Commission Splits & Automated Payout Ledger
- **Audit Reference:** Section 16.2
- **Files Affected:**
  - Create or update [`apps/server/internals/features/transactions/tutor_payouts.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/transactions/)
  - Routes and endpoints for tutor payout management
- **Problem:** Platform lacks tutor revenue sharing calculations, manual/automated withdrawal requests, and commission split ledgers.
- **Tasks to Complete:**
  1. Upon successful course transaction webhook:
     - Fetch tutor payout profile (default 80% tutor / 20% platform fee).
     - Calculate tutor gross earnings and platform fee.
     - Record ledger entry in `tutor_payout_transactions` as `pending`.
  2. Implement tutor payout request endpoint `POST /api/v1/tutor/payouts/request`.
  3. Implement admin payout settlement endpoint `POST /api/v1/admin/payouts/:id/settle` with reference ID recording.
- **Verification & Acceptance Criteria:**
  - A $100 course purchase records an $80 pending credit for the instructor and $20 platform fee.

---

### Job 6.5: Student Project Assignment Submissions & Manual Grading System
- **Audit Reference:** Section 16.6
- **Files Affected:**
  - Create feature package `apps/server/internals/features/assignments/` (routes, services, repositories)
  - Web UI for assignment submission and instructor grading
- **Problem:** Tutors cannot assign real-world projects, download student submissions, or provide rubrics and grades.
- **Tasks to Complete:**
  1. Implement CRUD for assignments under lesson items (`POST /api/v1/lessons/:id/assignments`).
  2. Implement student submission endpoint `POST /api/v1/assignments/:id/submit` (storing submission file URL in private S3 bucket).
  3. Implement instructor grading endpoint `POST /api/v1/assignments/submissions/:id/grade` (`score`, `feedback_notes`).
  4. Integrate assignment completion into overall course completion calculations.
- **Verification & Acceptance Criteria:**
  - Enrolled student submits project; tutor grades submission with feedback; student sees grade in curriculum view.

---

### Job 6.6: Transactional Email Engine & Template Customizer
- **Audit Reference:** Section 16.1, Section 4.2
- **Files Affected:**
  - Create [`apps/server/internals/pkg/mailer/mailer.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/pkg/mailer/mailer.go)
  - Create HTML/MJML email templates (Welcome, Order Confirmation, Certificate Issued, Password Reset)
- **Problem:** System lacks reliable transactional email delivery for user registration, checkout receipts, and certificate generation.
- **Tasks to Complete:**
  1. Implement asynchronous SMTP mailer client in `apps/server/internals/pkg/mailer/mailer.go` using `net/smtp`.
  2. Support dynamic HTML template rendering with variables.
  3. Hook into events:
     - User signup -> Welcome & Email Verification.
     - Successful checkout -> Order Receipt & Course Access Instructions.
     - Certificate claimed -> Certificate PDF link and verification QR code.
- **Verification & Acceptance Criteria:**
  - Initiating test checkout sends formatted HTML receipt email asynchronously without blocking HTTP response.

---

### Job 6.7: Marketing Attribution, Ad Pixels & UTM Tracking
- **Audit Reference:** Section 16.3
- **Files Affected:**
  - [`apps/server/internals/features/transactions/transactions.services.go`](file:///home/rahulcodepython/Workspace/CourseHunt/apps/server/internals/features/transactions/transactions.services.go)
  - Web checkout flow and analytics provider
- **Problem:** No tracking for marketing campaigns, ad conversions (Meta Pixel, Google Ads, GA4), or UTM attribution on course purchases.
- **Tasks to Complete:**
  1. Capture `utm_source`, `utm_medium`, `utm_campaign` in frontend checkout session.
  2. Transmit UTM parameters in transaction initiation payload and store in database transactions table metadata.
  3. Emit server-side conversion webhook / event on successful payment.
- **Verification & Acceptance Criteria:**
  - Purchase initiated with `?utm_source=meta&utm_campaign=blackfriday` preserves attribution in transaction records.

---

## Phase 7: Production Infrastructure, Domain Configuration & Deployment Verification

### Job 7.1: Production Environment Manifest & Traefik Edge Reverse Proxy
- **Audit Reference:** Section 4.1, 4.2, 4.3, 8
- **Files Affected:**
  - `.env.example` / Production `.env`
  - [`docker-compose.prod.yml`](file:///home/rahulcodepython/Workspace/CourseHunt/docker-compose.prod.yml) (or `infra/docker-compose.prod.yml`)
  - Traefik dynamic configuration
- **Tasks to Complete:**
  1. Validate complete production `.env` manifest matching Section 4.2:
     - Domain names (`coursehunt.com`, `api.coursehunt.com`, `admin.coursehunt.com`, `tutor.coursehunt.com`).
     - PostgreSQL pool sizing (`DB_MAX_OPEN_CONNS=50`, `DB_MAX_IDLE_CONNS=20`, `DB_STATEMENT_TIMEOUT_SEC=15`).
     - S3 credentials, Razorpay live keys, Loki endpoints, SMTP mailer settings.
  2. Configure Traefik edge reverse proxy with Let's Encrypt automated TLS certificate issuance and HTTP to HTTPS redirection.
  3. Enforce container resource quotas (CPU/RAM limits) in Docker Compose per Section 8 specification.
- **Verification & Acceptance Criteria:**
  - Containers start up within specified RAM/CPU envelopes and Traefik correctly routes SSL traffic to services.

---

### Job 7.2: End-to-End Regression Verification & Hostability 100/100 Certification
- **Audit Reference:** Section 3 (Hostability Scorecard)
- **Tasks to Complete:**
  1. Run complete test suites across backend and frontend:
     - Go backend tests: `go test ./...`
     - Web frontend build: `pnpm build`
  2. Execute penetration tests on Redis cache with randomized non-existent UUIDs to verify negative caching.
  3. Verify S3 private media protection by attempting unauthenticated streaming.
  4. Verify Admin Dashboard metrics accuracy against manual SQL counts.
  5. Run high-throughput load test targeting 10,000+ RPS read capacity.
- **Verification & Acceptance Criteria:**
  - Zero critical vulnerabilities detected.
  - System passes all 10 evaluation areas in Section 3 Scorecard with a verified **100/100 Hostability Score**.

---

## Execution Checklist & Progress Tracker

| Job ID | Description | Phase | Target Module | Status |
|:---:|:---|:---:|:---|:---:|
| **1.1** | Dual-bucket MinIO S3 & presigned video streaming | Phase 1 | `minio`, `lessons` | **Completed** |
| **1.2** | File upload IDOR patch & UUID namespacing | Phase 1 | `upload` | **Completed** |
| **1.3** | Global notification data leak patch | Phase 1 | `notifications` | **Completed** |
| **1.4** | Discussion XSS sanitization (bluemonday) | Phase 1 | `discussions` | **Completed** |
| **2.1** | Admin dashboard Cartesian product query patch | Phase 2 | `dashboard` | Pending |
| **2.2** | Student dashboard `in_progress_courses_count` crash patch | Phase 2 | `dashboard`, `web` | Pending |
| **2.3** | PostgreSQL refund outbox queue with `SKIP LOCKED` | Phase 2 | `transactions` | Pending |
| **2.4** | Category 404/500 `RowsAffected` fix | Phase 2 | `categories` | Pending |
| **2.5** | User login write amplification mitigation | Phase 2 | `users`, `security` | Pending |
| **3.1** | Universal negative caching (`FetchOrNegative`) | Phase 3 | `cache`, All 22 Modules | Pending |
| **3.2** | Fiber UUID parameter validation middleware | Phase 3 | `middlewares` | Pending |
| **3.3** | Granular cache invalidation (eliminate broad `*` purges) | Phase 3 | `lessons`, `notes`, `faqs` | Pending |
| **3.4** | High-frequency endpoints caching (Cert QR, CTE study) | Phase 3 | `certificates`, `courses` | Pending |
| **3.5** | Redis-backed distributed token bucket rate limiter | Phase 3 | `middlewares`, `routes` | Pending |
| **4.1** | React Query error swallowing patch (`ApiError` throw) | Phase 4 | `web/react-query` | Pending |
| **4.2** | Next.js 16 Edge `proxy.ts` routing convention | Phase 4 | `web/proxy.ts` | Pending |
| **4.3** | Zustand session persistence & `getSession` optimization | Phase 4 | `web/store`, `web/hooks` | Pending |
| **5.1** | Grafana Loki container & config deployment | Phase 5 | `infra/loki`, `docker` | Pending |
| **5.2** | Asynchronous batch Loki push client in Fiber | Phase 5 | `server/logger` | Pending |
| **5.3** | Backend Loki log query API endpoint | Phase 5 | `monitoring` | Pending |
| **5.4** | Live APM console at `/admin/logs` | Phase 5 | `web/admin/logs` | Pending |
| **6.1** | Database migration `000011_enterprise_lms_features` | Phase 6 | `migrations` | Pending |
| **6.2** | Video playback resumption & learning streaks | Phase 6 | `lessons`, `progress` | Pending |
| **6.3** | Drip content scheduling & prerequisite engine | Phase 6 | `chapters`, `courses` | Pending |
| **6.4** | Tutor commission splits & payout transactions | Phase 6 | `transactions` | Pending |
| **6.5** | Project assignments & manual grading system | Phase 6 | `assignments` | Pending |
| **6.6** | Transactional email engine with dynamic templates | Phase 6 | `mailer` | Pending |
| **6.7** | Marketing attribution & UTM parameter tracking | Phase 6 | `transactions`, `web` | Pending |
| **7.1** | Production `.env`, Traefik reverse proxy & resource quotas | Phase 7 | `infra`, `docker` | Pending |
| **7.2** | Full regression testing, load testing & 100/100 sign-off | Phase 7 | E2E Platform | Pending |
