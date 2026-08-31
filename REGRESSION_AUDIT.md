# Regression Audit: `a9cb1d5` (last tested-good) → current working tree

You asked whether anything broke between `a9cb1d5` (thoroughly tested, no further manual
testing since) and the current state. That range has two distinct parts, reviewed separately:

- **`a9cb1d5` → `c03b9b3`** (your two commits: `2e2a176` "add transactional safety guards and
  input validation constraints", `c03b9b3` "modularize backend into domain features and
  standardize repository layer") — verified by diffing the exact commits, feature by feature,
  against the pre-refactor package-by-role layout.
- **`c03b9b3` → current working tree** — this is *my* work from earlier in this session (the
  `AUDIT_REPORT.md` fix-everything pass). I have direct knowledge of every change here; no
  separate review was needed, just an honest accounting.

**Bottom line up front:** your belief that the two commits were "pure organization, no feature
modification" doesn't fully hold — `2e2a176` genuinely adds new validation/guards by its own
stated purpose, and the reorg itself introduced two real bugs. Neither is catastrophic, both are
narrow and fixable. Separately, my own session's work (which you already know included behavior
changes, not just reorganization) is summarized at the end so you have one complete picture.

---

## Real bugs found (not present at `a9cb1d5`)

### 1. [Critical] Certificate QR verification now 500s instead of returning `{valid: false}`

`apps/server/internals/features/certificates/certificates.controllers.go` documents its own
contract in a comment: *"handleVerify is public and unauthenticated... Always 200s; legitimacy
is carried in the `valid` field of the response body, not the HTTP status."* This is the
endpoint reached by scanning a certificate's QR code.

At `a9cb1d5`, the query was written as `SELECT EXISTS(...) AS cert_exists, (subquery) AS
data_json` — structurally guaranteed to return exactly one row, with `data_json = NULL` for a
nonexistent certificate. The Go code checked for that NULL and returned `{Valid: false}`.

During the reorg, `certificates.queries.go`'s `VerifyCertificateJSON` was rewritten as a plain
`SELECT jsonb_build_object(...) FROM certificates c ... WHERE c.id = $1` — which returns **zero
rows**, not one row with NULL, for a nonexistent ID. `VerifyRepository` now goes through
`postgres.QueryJSON[T]`, whose zero-row case surfaces as `pgx.ErrNoRows` →
`postgres.ErrNotFound` — a real error, not `nil`. `certificates.services.go`'s `Verify()` then
wraps *any* non-nil error as `utils.ErrInternal(...)`, a 500.

**Net effect:** scanning a fake, expired, or mistyped certificate ID — exactly the case this
endpoint exists to handle gracefully — now returns a 500 instead of a normal `{valid: false}`
response.

**Fix (not yet applied):** either restore the always-one-row query shape (wrap in `SELECT
EXISTS(...) AS exists, (...) AS data`), or handle `postgres.ErrNotFound` explicitly in
`VerifyRepository`/`Verify` and return `{Valid: false}, nil` instead of propagating the error.

### 2. [Medium] Auth rejects a banned-then-unbanned user until they get a new token

`internals/middlewares/auth.go` has two banned checks: an early one using the JWT's baked-in
`claims.Banned` (from token-issue time), and a second one using the fresh value from the
DB/cache lookup. At `a9cb1d5`, `claims.Banned` was only ever a *starting value* for a local
variable that got overwritten by the fresh lookup before being checked — so only the current DB
state mattered.

The reorg (`c03b9b3`) added the early check as a separate `if claims.Banned { return
Unauthorized }` **before** the fresh lookup ever runs. This code is still exactly this way in
the current working tree (I extended this function with caching earlier in this session but
didn't touch this ordering).

**Net effect:** a user who was banned, then unbanned, while holding a JWT issued *during* the
ban, is permanently rejected on that token — the function returns before it ever reaches the
fresh-lookup code that would show they're no longer banned. Given this app's session model
(JWT fetched once on page load, kept in memory), this isn't a one-request blip; it lasts the
rest of that session. They'd need to log out and back in for a new token.

**Fix (not yet applied):** drop the early `claims.Banned` check (or move it after the fresh
lookup) — the second check already covers it correctly using current data.

### 3. [Low/Medium] Wishlist's 100-item cap returns a misleading 500

`wishlist.repository.go`'s `CreateRepository`: `return nil, fmt.Errorf("wishlist limit reached
(max 100 items)")` — a plain, unwrapped error, not one of this feature's `generic.ErrWishlistX`
sentinels. `wishlist.services.go`'s `Create()` falls through to its generic `else` branch and
returns `utils.ErrInternal("Failed to add to wishlist.", err)` — a 500 whose message hides the
real, entirely legitimate reason (the cap was hit) from the client.

This one is *not* from the reorg — it was introduced in `2e2a176` itself (a genuinely new
business rule, confirmed via `git diff a9cb1d5 2e2a176`) and just carried forward unchanged.

**Fix (not yet applied):** add a `generic.ErrWishlistLimitReached` sentinel, map it to
`utils.ErrBadRequest` or `utils.ErrConflict` in the service layer.

---

## Everything else in `a9cb1d5` → `c03b9b3`: verified clean

Reviewed via direct commit-to-commit diffs (`git show`/`git diff` at the exact commits, not the
working tree), split across 5 parallel passes covering all 21 features plus the foundational
layer:

- **Every route** (~90 total) — path, HTTP method, and every `PermissionGuard`/`RoleGuard`/
  `ScopeGuard` — matches exactly between the old central `routes.go` and the new per-feature
  `<name>.routes.go` files. Nothing lost its auth or permission guard; asymmetric rules (e.g.
  feedbacks `PATCH` admin-only vs `DELETE` admin+tutor) survived correctly.
- **Roles/permissions core** (`GetRolesAndPermissions` — the function every authenticated
  request runs through) — byte-level-equivalent translation.
- **Pricing/coupon/discount arithmetic, quiz scoring (all 4 question types), lesson
  access-control, dashboard aggregate queries, chapter/FAQ ordering** — all faithful
  translations of the same logic into the new query/repository shape.
- One flagged-then-cleared item: `/profile/user` and `/profile/tutor` collapsing onto the same
  handler looked suspicious but both old handlers were already trivial pass-throughs to the
  same shared function — not a lost distinction.
- One small, likely-intentional behavior change: `feedbacks.Delete` now returns 404 for a
  missing/inaccessible feedback instead of the old blanket 500 — matches the pattern `Update`
  already had; looks like a deliberate consistency fix, not damage.

**Infrastructure changed more than "reorganization" implies, worth knowing even though both
sides build/vet clean:** the DB driver was swapped from `sqlx`+`lib/pq` to `pgx/v5`+`pgxpool`,
and the JWT/JWKS verification was swapped from a ~150-line hand-rolled implementation to
`MicahParks/keyfunc` + `golang-jwt/jwt/v5`. Both are legitimate, standard choices, and neither
is something a code review alone can fully certify — they're exactly the kind of change that
needs a live-traffic smoke test (a real login, a real DB round trip with array-typed columns)
before you trust them as equivalent to the old behavior, not just "compiles and the logic reads
the same."

## Intentional new behavior in `2e2a176` — real changes, not bugs, but real

Your belief that nothing was modified doesn't hold for this commit — it does what its message
says. All of the following are additive, defensible, and survived the reorg intact:

- **Commerce guards** (transactions): rejects re-purchase of an already-enrolled course, rejects
  pushing a free course through the paid flow, reuses a pending (<30 min old) Razorpay order on
  retry instead of creating a new one every time, adds a 64KB webhook body-size cap.
- **Validation tightening** across courses, discussions, quiz, lessons, faqs, feedbacks, users,
  roles: max-length caps on previously-unbounded text fields, `uuid`-format checks on ID fields
  that previously accepted any string, `url`-format checks on URL fields, numeric range checks
  (discount 1–100%, coupon code 3–50 chars). A request that previously succeeded with an
  out-of-range or malformed value will now get a 422 where it didn't before.
- **Discussion threading restriction**: `CreateRepository`'s `parent_info` CTE gained `AND
  parent_id IS NULL` — a reply can now only target a top-level discussion. If nested
  (reply-to-a-reply) threads were ever actually used, this is a real functional restriction,
  not a side effect — worth a deliberate look if that mattered.
- **Frontend**: every mutation gained a double-submit guard (`useWithExecute`'s new
  `inProgressRef`); checkout gained matching guards plus a `finally`→`catch` fix that now keeps
  the "paying" UI state active for the full duration the Razorpay modal is open, instead of
  clearing it the instant the modal opens.
- **Coupon-check cache**: keys now URL-escaped (fixes a real potential collision for codes
  containing `:`) and TTL dropped from 3 minutes to 30 seconds (an invalidated coupon now takes
  effect faster).

None of this reads as accidental — it's coherent with the commit's stated purpose.

---

## `c03b9b3` → current working tree: my session's changes

This is the `AUDIT_REPORT.md` fix-everything pass from earlier in this conversation. You already
know this touched a lot of files; here's the accounting of what's *behavior-changing* versus
*mechanical*, since that's what matters for your testing-scope question.

**Genuinely new behavior (needs your own verification before you'd call it "tested"):**
- Auth now caches roles/permissions for 60s (new caching layer on the hottest path in the app).
- Both quiz N+1 fixes (`UpdateQuestionRepository`, `SaveQuizAttemptRepository`) were rewritten
  as single-round-trip SQL — same intended behavior, but this is new SQL, not the old SQL moved,
  and I flagged at the time that it needs a real run against a live DB.
- JWKS init failure now crashes the process at boot instead of continuing degraded.
- Slug generation changed format (Unicode-aware + short random suffix, replacing the old
  ASCII-strip + nanosecond-timestamp scheme) — existing slugs in your DB are untouched, but any
  code that assumed the old slug shape (length, always-numeric suffix) would need a look.
- Retry/backoff behavior changed on all three infra connectors (unified via one helper).
- The coupon admin/tutor route tree was merged into one shared component.
- Frontend: axios `params` standardization, a couple of query-key fixes, an `InstructorInfoZod`
  merge, a `replaceInArray` extension.

**Mechanical / behavior-preserving (low risk):**
- Structured logging swap (`log/slog`), cache-invalidator collapse, pagination/query-param
  helper extraction, validator error-message humanization, Prettier reformat of the whole
  frontend, dead-code/dependency removal (unused OpenAPI stub, unused import), JWT verifier
  dependency-injection cleanup.

None of my session's changes touch the same code paths as the 3 bugs found above, so they don't
mask or interact with them.

---

## What I'd suggest

The 3 bugs above are small, well-understood, and I can fix all of them now if you want — none
require an architecture decision, just a corrected query/error-mapping. Given you said your
testing scope is closed as of `a9cb1d5`, I'd treat this whole `a9cb1d5`→current range (both your
commits and my session's work) as needing a fresh pass of manual/smoke testing before you trust
it the way you trusted `a9cb1d5` — the driver swap and JWT-library swap especially, since those
aren't fully certifiable by reading code alone.
