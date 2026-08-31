# CourseHunt Code Audit

Read-only audit across four backend/frontend layers, scoped to four angles:
**(1)** better approaches for existing code, **(2)** generic-method
opportunities, **(3)** redundant hand-rolled code that a library already
solves, **(4)** better organization of the system/API/DB-query layers.
Every finding cites `file:line`. Nothing in this document has been applied —
it's a punch list, ordered by impact within each section.

Scope covered: `apps/server/internals/features/*` (21 features),
`apps/server/internals/{pkg,utils,generic,middlewares,router}` + `cmd/*`,
`apps/web/src/{react-query,query-hooks,schema,store,hooks,lib}`,
`apps/web/src/{app,components,config}`. Two of the highest-severity findings
below (auth cache-bypass, fail-soft JWKS/MinIO startup) were re-verified
directly against source before inclusion.

---

## Priority 0 — fix first (correctness/security, cheap to fix, high blast radius)

1. **Auth middleware never uses its own cache — a DB round trip on every single authenticated request.**
   `apps/server/internals/middlewares/auth.go:35` — `BaseAuthMiddleware(cfg, cch *cache.Cache, usersRepo UsersLookup)`
   accepts a `*cache.Cache` and never references it; `cch` doesn't appear
   anywhere else in the file (verified by grep). Every protected request
   calls `usersRepo.GetRolesAndPermissions(ctx, userID)` straight against
   Postgres. This is the single hottest path in the app. **Fix:** cache
   `roles+permissions` per user with a short TTL (30–60s), invalidate on
   role/permission mutation using the existing `InvalidateRoles` pattern in
   `internals/pkg/cache/invalidator.go`.

2. **Two critical boot dependencies fail soft instead of fail-fast — auth silently 500s in production instead of the process refusing to start.**
   `apps/server/cmd/server/main.go:33-41` — both MinIO connect and JWKS
   verifier init log a warning and continue on error (verified). A nil
   `verifier` means every authenticated request hits `utils.ErrInternal("Auth
   verifier not initialized", nil)` at runtime (`auth.go:43`) instead of the
   deploy failing where a health check would catch it immediately. This
   contradicts this repo's own stated "fail fast at boot" rule. **Fix:**
   `log.Fatalf` on JWKS init failure — auth is not optional. Keep MinIO
   soft-fail only if degraded-mode upload is a real product decision, and
   say so in a comment if so.

3. **Ungraceful shutdown has no deadline.**
   `apps/server/cmd/server/main.go:86` (verified) — `app.Shutdown()` with no
   timeout; a stuck connection blocks shutdown indefinitely. **Fix:**
   `app.ShutdownWithContext(ctx)` with `context.WithTimeout`.

4. **Two N+1 query hotspots in quiz submission/editing, contradicting this repo's own one-round-trip CTE convention.**
   `apps/server/internals/features/quiz/quiz.repository.taking.go` (~line
   190-240, `SaveQuizAttemptRepository`) does one `tx.Exec` per answer, and
   for multi-select answers a **nested** loop does one more `tx.Exec` per
   selected option per answer — 30-50+ sequential round trips per quiz
   submission. `quiz.repository.management.go` (~line 160-180,
   `UpdateQuestionRepository`) does the same across three loops (options,
   arrange-items, fill-answers) when creating the same rows
   (`CreateQuestionRepository`, ~line 84) already proves the array-param +
   single-`UNNEST`-query approach works in this codebase. **Fix:** make the
   update/submission paths match the create path's batched-array-param
   shape.

5. **Fire-and-forget goroutine per request with no concurrency bound.**
   `apps/server/internals/middlewares/logger.go:79` — `writeAuditRow` spawns
   an unbounded `go func()` doing a raw `db.Exec` on every non-2xx (and
   every non-GET) request. Under a traffic spike or DB slowdown this
   amplifies the outage instead of shedding load. **Fix:** bounded worker
   pool or buffered channel + single consumer.

6. **`useAdminProfilesQuery` silently drops its own filter params.**
   `apps/web/src/query-hooks/users.api.ts:87-91` — signature accepts
   `params?: Record<string, string|number>` but `apiRequest` is called
   without them and `queryKeys.profilesAdmin()` also ignores them. Any
   caller passing filters silently gets an unfiltered list with no error.

---

## Backend — DB query & repository layer

### Generic-method opportunities (point 2)

- **Pagination offset math (`(page-1)*limit`) hand-rolled 15×** across
  `updates/updates.repository.go:85,110`, `users/users.repository.profile.go:44`,
  `users/users.repository.go:64`, `wishlist/wishlist.repository.go:34`,
  `courses/courses.repository.tutor.go:16`, `courses/courses.repository.enrollment.go:57`,
  `feedbacks/feedbacks.repository.go:39`, `coupons/coupons.repository.go:36`,
  `categories/categories.repository.go:16`, `enrollments/enrollments.repository.go:25`,
  `certificates/certificates.repository.go:19`, `courses/courses.repository.public.go:27`,
  `discussions/discussions.repository.go:15`, `transactions/transactions.repository.go:56`.
  Extract into `postgres.QueryFilter` itself as `filter.Paginate(page, limit int) (limitIdx int)` —
  folds the offset math *and* the current two-step `filter.NextIdx()` +
  `filter.AddArgs(limit, offset)` into one call at every site.

- **Required-query-param validation repeated ~16×**, e.g.
  `quiz/quiz.controllers.go:18,32,47,66,107,125,139`,
  `lessons/lessons.controllers.go:15,35`, `faqs/faqs.controllers.go:14`.
  Extract `utils.RequireQuery(c *fiber.Ctx, key, label string) (string, error)`.

- **Cache-key string building hand-rolled per feature (10 files)**, each
  inventing its own key-part order/format (`courses.services.go`,
  `roles.services.go`, `chapters.services.go`, `coupons.services.go`,
  `notes.services.go`, `lessons.services.go`, `updates.services.go`,
  `feedbacks.services.go`). Inconsistent empty-string guarding between
  features risks silent key collisions. Extract `cache.Key(feature string,
  parts ...any) string`.

- **Cache read→work→set triplet duplicated in every services.go that
  caches** (roles, categories, wishlist, courses, +6 more). Extract
  `cache.Fetch[T](ctx, cache, key, ttl, func() (T, error)) (T, error)` — this
  repo already uses this exact generics shape (`postgres.QueryJSON[T]`), so
  it's a consistent idiom, not a new one.

- **12 near-identical cache-invalidation methods** —
  `internals/pkg/cache/invalidator.go:9-87` (`InvalidateCategories`,
  `InvalidateCourses`, `InvalidateChapters`, …) are all
  `log.Printf(...) + DeleteByPattern(ctx, "<domain>:*")`. Collapse to
  `func (c *Cache) Invalidate(ctx context.Context, patterns ...string)`,
  called as `cch.Invalidate(ctx, "chapters:*", "courses:*")`. Removes ~70
  lines and turns "add a new invalidation domain" into a one-line call.

### Redundant code → replace with a package (point 3)

- **Hand-rolled retry loops, inconsistent across three infra connectors.**
  `internals/pkg/postgres/postgres.go:44-62` (5 attempts/2s) and
  `internals/pkg/minio/client.go:61-72` (5 attempts/1s) each reimplement
  retry-with-backoff independently; Redis (`internals/pkg/redis/redis.go:27`)
  has no retry at all — three different reliability postures for three peer
  dependencies. Adopt `github.com/cenkalti/backoff/v4` (or
  `github.com/avast/retry-go`) as one shared `pkg/retry.Connect(...)` used
  uniformly by all three.

- **Hand-rolled slug generation with no Unicode transliteration.**
  `internals/utils/strings.go:9-23` — `Slugify` strips every non-ASCII rune,
  so any non-Latin course title collapses to just a 19-digit nanosecond
  timestamp with zero content, and that timestamp suffix is longer and less
  deterministic than needed. Replace with `github.com/gosimple/slug` +
  an 8-hex-char collision suffix (or a DB `ON CONFLICT` retry).

- **Validation errors hand-formatted instead of using the translator already pulled in.**
  `internals/utils/bind.go:23-28` turns `validator.ValidationErrors` into
  `"Title: required"` manually, while `go-playground/universal-translator`
  is already an indirect dependency of `go-playground/validator/v10` and
  gives humanized messages (`"Title is a required field"`) for near-zero
  extra code.

- **Unstructured `log.Printf`/emoji-banner logging (63 call sites) instead of a structured logger.**
  `internals/middlewares/logger.go:184-211` builds a 15-line
  string-concatenated banner per error; nothing app-wide has consistent
  fields, levels, or machine-parseable output. Adopt `log/slog` (stdlib,
  zero new dependency on `go 1.25`) or `zerolog`, with fields like `method`,
  `path`, `status`, `user_id`, `latency_ms`, `error`.

### Organization (point 4)

- **`LoggerMiddleware` does three unrelated jobs in one 227-line file**
  (`internals/middlewares/logger.go`): HTTP access logging, audit-trail DB
  persistence (`writeAuditRow`, lines 75-106), and security-event
  classification with inline raw SQL against tables that `logs`, `security`,
  and `notifications` are each supposed to own per this repo's own
  package-by-feature rule. Split into a pure `LoggerMiddleware` +
  a narrow `AuditRecorder` interface each owning feature implements.

- **`monitoring.controllers.go:14` is the only controller across all 21
  features that bypasses the central error envelope** — builds
  `generic.Response[any]{...}` and calls `c.Status(...).JSON(...)` directly
  instead of returning a `utils.APIError` like everywhere else (confirmed
  via grep — no other match). Breaks the "controllers never write a
  response body directly" rule.

- **Global mutable package-level state for the JWT verifier, inconsistent with the rest of the same function's DI.**
  `internals/middlewares/auth.go:16,21` — `var verifier` set via
  package-level `InitAuth(v)`, while `cfg`/`cch`/`usersRepo` are passed as
  proper constructor params in the same file. Makes the middleware harder
  to unit test and creates an init-order footgun. Add `verifier` as a
  fourth constructor param like the others.

- **`/docs` OpenAPI endpoint is a non-functional stub.**
  `internals/utils/scalar.go:24-38` — `minimalSpec()` hardcodes
  `"paths": {}`; the docs UI renders with zero actual endpoints. Either wire
  real generation (`github.com/swaggo/swag` annotations) or remove the
  endpoint.

- **Outbound Razorpay HTTP call has no context propagation.**
  `internals/pkg/razorpay/client.go:39,46` — `http.NewRequest` instead of
  `http.NewRequestWithContext(ctx, ...)`; a caller's cancelled/timed-out
  context never cancels the outbound call, only a fixed 30s client timeout
  applies.

- **Rate limiter is in-memory/per-instance** —
  `internals/middlewares/rate_limiter.go:13-33` — silently becomes
  ineffective (each instance gets its own budget) the moment this scales
  horizontally. Fine today; needs a Redis-backed `Storage` config or an
  explicit comment noting the single-instance assumption before scaling.

- **`router.New` hand-wires 21 near-identical feature constructor calls
  across 4 touch points** (`internals/router/router.go:80-102,110-132,161-183`).
  Idiomatic and matches this repo's stated pattern — low priority, but if
  feature count keeps growing, a `type Feature interface{ RegisterRoutes(...) }`
  + slice would cut the `SetUp()` wiring from 21 lines to a loop (at the
  cost of the typed field accessors some features rely on for
  inter-feature calls, e.g. `transactions.New(..., enrollmentsApp, couponsApp)`).

No SQL-injection risk was found — every dynamic-SQL site outside
`*.queries.go` goes through `postgres.QueryFilter`, confirmed by grepping
for `fmt.Sprintf` building SQL verbs anywhere else. Feature-layer
file/layer conformance to the app/controllers/entity/queries/repository/
routes/services convention is otherwise clean across all 21 features.

---

## Frontend — data layer (`react-query/`, `query-hooks/`, `schema/`, `store/`, `hooks/`, `lib/`)

### Redundant code → replace with a library (point 3)

- **Hand-rolled cursor pagination reimplements `useInfiniteQuery`.**
  `apps/web/src/hooks/use-cursor-feed.ts:1-80` + `lib/merge-list-page.ts` —
  bidirectional cursor accumulation, manual `items`/`hasMore`/`loadingMore`
  state, manual merge-and-sort, entirely hand-built on top of
  `@tanstack/react-query`, which already ships `useInfiniteQuery` for
  exactly this. This one hook drives every feed in the app (notifications,
  logs, security events per its own comment), so replacing it removes
  ~100 lines in one shot.

- **URLSearchParams building hand-duplicated in 7 files** instead of
  axios's built-in `params` option: `query-hooks/courses.api.ts`
  (`useCoursesQuery` and `useManageCoursesQuery`), `logs.api.ts`,
  `notifications.api.ts`, `security.api.ts`, `enrollments.api.ts`,
  `transactions.api.ts`, `updates.api.ts`. Meanwhile
  `query-hooks/users.api.ts:22-24` (`useUsersQuery`) already does it
  correctly — passes `params` straight into axios's `config.params`.
  Standardize on that and delete the 7 hand-rolled builders.

- **Hand-rolled CSV escaping reinvents what `exceljs` (already a dependency) emits directly.**
  `apps/web/src/lib/csv.ts` — `downloadCredentialsCSV` (~13-32) and
  `exportToCSV` (~34-42) each independently implement quote-escaping via
  regex, and neither handles embedded newlines correctly.
  `workbook.csv.writeBuffer()` (exceljs) produces correct CSV and would let
  CSV/XLSX export share one code path.

### Generic-method opportunities (point 2)

- **List-query hook pairs copy-pasted per feature instead of a shared factory.**
  `useCoursesQuery`/`useManageCoursesQuery` and the equivalent pairs in
  roles, users, coupons, faqs, updates all repeat the same
  `useAppQuery(queryKeys.x(params), () => apiRequest({url, method:"GET",
  params}, PaginatedResponseZod(XZod)))` shape. A
  `createListQuery(endpoint, queryKeyFn, itemSchema)` factory would collapse
  ~10 near-identical 5-line hooks into one call per feature.

- **Optimistic temp-id reconciliation hand-written instead of extending the existing cache-updater helpers.**
  `apps/web/src/query-hooks/lessons.api.ts` (~93-112,
  `useAddResourceMutation`) hand-writes a splice-based updater to reconcile
  a temp-id optimistic item with the server-confirmed one, instead of
  extending the already-imported `replaceInArray` with an optional
  match-by-temp-id fallback. This reconciliation logic exists nowhere else
  in the codebase, so the next create-with-temp-id feature will reinvent it
  again.

### Pattern deviations (point 1) / correctness

- **Raw array query keys bypass the centralized `queryKeys` factory** —
  `query-hooks/lessons.api.ts:98,110,123,126,133` (inline
  `["lessons", id, "resources"]`), `discussions.api.ts:28,37,46`,
  `enrollments.api.ts:43,55`. A typo in one of the duplicated literals
  silently breaks cache invalidation with no type error — exactly what
  `query-keys.ts` exists to prevent.

- **Dead import in the auth-critical client file.**
  `apps/web/src/react-query/client.ts:6` imports `useSession` but never
  uses it — the interceptor correctly reads
  `useSessionStore.getState().token` directly. Harmless but signals
  unreviewed drift in a file that gates every API call's auth header.

- **`UserInfoZod`/`InstructorInfoZod` are byte-for-byte identical schemas**
  (`schema/common.types.ts`), used interchangeably in `certificate.types.ts`,
  `transactions.types.ts`, `courses.types.ts`. Collapse to one
  `PersonInfoZod` before the two names drift when only one gets a new
  field.

### Organization (point 4)

- **`lib/` has no boundary between server-only and pure client code.**
  `lib/razorpay.ts`, `lib/mailer.ts`, `lib/auth-db.ts` (server-only) sit
  flat alongside `lib/format.ts`, `lib/user-status.ts` (pure client) with no
  `lib/server/`-style split — a real bundling foot-gun if a server-only
  module is ever imported from a client component. `lib/const.ts` (169
  lines) also mixes `API_ENDPOINTS`, `ROUTES`, `LOCALE_CONFIG`,
  `CSV_CONFIG`, `ERROR_MESSAGES` in one file with no thematic split.

---

## Frontend — UI layer (`app/`, `components/`, `config/`)

### Redundant code (point 3) — duplicated route trees

- **admin/tutor coupon route tree is a near-byte-identical fork.**
  `app/admin/coupons/{page,columns,coupon-form,coupon-modal}.tsx` vs.
  `app/tutor/coupons/{page,columns,coupon-form,coupon-modal}.tsx` —
  `columns.tsx` is functionally identical (only indentation differs);
  `page.tsx` differs only in title text and a variable name;
  `coupon-form.tsx` differs only in one Zod rule
  (`z.string()` vs `.min(1, ...)`) plus an unused `toast` import in the
  admin copy. This is the exact anti-pattern already named (but not fixed
  here) in this repo's own `ARCHITECTURE_TEMPLATE.md`. Collapse into one
  component parameterized by `scope: "admin" | "tutor"`.

- **admin/tutor courses→chapters/faqs/lessons route trees are structurally mirrored**, and admin's tree is a near-strict subset of tutor's (tutor additionally has quiz/resources/lesson-wizard). Verify whether the admin copies are even still used versus deep-linking into the tutor tree with a permission gate; if needed, extract shared `columns.tsx`/`page.tsx` bodies the same way as the coupons fix.

- **Two icon libraries in simultaneous use for near-zero benefit.**
  `lucide-react` is imported directly in 16 files despite the app already
  wrapping icons behind a single `Icon` registry (`components/icon.tsx`);
  `@tabler/icons-react` is imported in exactly 1 file. Either move that one
  usage onto the Lucide-backed registry and drop the Tabler dependency
  entirely, or use an inline SVG for that one icon. Separately, the 16
  direct-`lucide-react` imports defeat the point of having the registry —
  audit why they bypass it.

### Generic-method opportunities (point 2)

- **`useCrudDialogState` (the shared create/edit/delete-confirm hook) is adopted in only 6 files** while hand-rolled `useState(false)`-per-dialog triads appear repo-wide — `tutor/updates/page.tsx`, `tutor/courses/[courseId]/faqs/page.tsx`, `tutor/courses/[courseId]/chapters/page.tsx`, `tutor/courses/[courseId]/chapters/[chapterId]/lessons/page.tsx`, `lesson-wizard-dialog.tsx`, `resources/page.tsx`, quiz `page.tsx`, and others. Each is a candidate migration to the existing shared hook, and each hand-rolled version is a correctness risk (two dialogs open simultaneously, stale `editingX` after close) that the shared hook's single-state-machine design avoids.

- **`FormDialog` wrapper is adopted in only 13 files while 10 files import raw `@/components/ui/dialog` directly** for what read as standard create/edit-form dialogs — `admin/{updates,roles,categories}/page.tsx`, `tutor/updates/page.tsx`, `tutor/courses/course-status-dialog.tsx`, `tutor/courses/[courseId]/{faqs,chapters}/page.tsx`, `.../resources/page.tsx`. (`quiz-player.tsx`/`attempts-tab.tsx` may legitimately need raw `Dialog` for non-form UI — verify those two before migrating.)

### Organization (point 4)

- **No repo-wide formatter enforced — tabs vs. 2-space mixed across near-duplicate files**, e.g. `app/admin/coupons/*.tsx` (tabs) vs `app/tutor/coupons/*.tsx` (2-space); ~105 files use 2-space style against a minority using tabs, with no `.prettierrc` found. Adding one and running it repo-wide would also collapse most of the "diff noise" inflating the duplicate-tree findings above.

- **No route-level `loading.tsx`/`error.tsx` anywhere under `app/*`.** The app relies entirely on component-level React-Query `isPending` state instead of Next.js App Router boundaries — a legitimate choice, but it means a thrown render error has no route-local boundary and bubbles uncaught. At minimum, add a root `app/error.tsx` catch-all.

- **`app/admin/courses/overview/[id]/page.tsx`** is a report/detail view sitting one level under a route segment that's otherwise pure CRUD — verify it's not dead code, and if live, consider moving it under a dashboard/analytics grouping.

Not flagged as issues (checked and clean): `lib/format.ts` centralizes all
date/currency formatting with zero stray `toLocaleDateString` call sites;
`components/ui/*` primitives have no business-logic leakage.

---

## Suggested execution order

1. **P0 list above** — all six items are small, isolated fixes with
   outsized blast radius (auth perf, boot safety, data-loss-on-shutdown,
   quiz-submission latency, unbounded goroutines, a silently-broken filter).
2. **Structured logging (`log/slog`) + the `Invalidate`/`Fetch[T]`/`Key`
   cache generics** — do these together since the logging replacement
   touches the same call sites as the cache-invalidation collapse.
3. **Frontend data-layer redundancies** (`useInfiniteQuery` swap, axios
   `params` standardization, query-key factory gaps) — mechanical,
   low-risk, each file independent.
4. **Route-tree de-duplication (coupons first, as the smallest/cleanest
   case) + formatter adoption** — do the formatter pass *before* the
   dedup diffs so the dedup diffs are reviewable signal, not indentation
   noise.
5. **Remaining organization items** (lib/ server/client split, retry-lib
   adoption, slug library, OpenAPI stub) as ongoing hygiene, no urgency.
