# Backend Architecture Blueprint

A provider-agnostic blueprint of the code-organization and code-writing
patterns used by this repo's Go backend (`apps/server`). This is written so
another project — in Go or any similarly-structured language/framework —
can follow the same shape. It describes **patterns**, not this app's
specific business logic; nothing here should be copy-pasted verbatim into a
new project.

Reference implementation for every pattern below: `apps/server/internal/`.

---

## 1. Top-level layout

```
cmd/
  server/main.go      # process entrypoint: wire deps, mount routes, listen, shut down
  seed/main.go         # one-off/dev-only command, same dependency wiring style as server
internal/
  config/              # env -> typed Config, fail fast at boot
  db/
    migrations/        # plain numbered SQL, up+down pairs
    sqlc/
      queries/         # hand-written SQL, one file per schema area
      generated/       # generated typed query code (gitignored, not committed)
  features/<name>/     # one folder per vertical feature — see §3
  middlewares/         # generic, stateless, cross-feature HTTP middleware
  generic/             # tiny shared vocabulary types (e.g. a Role enum) with no logic
  jobs/                # background/periodic tasks, not tied to any one request
  pkg/                 # infra clients: postgres pool, redis, object storage, mailer, jwt, etc.
  router/              # composition root: builds every feature's App and mounts its routes
  utils/               # cross-cutting HTTP plumbing: bind+validate, typed errors, response envelope
```

Rule of thumb for where new code goes: if it's "a resource with HTTP
endpoints," it's a new folder under `features/`. If it's "a way to talk to
some piece of infrastructure" (a DB, cache, object store, external API), it's
under `pkg/`. If it's generic HTTP behavior with no domain knowledge
(auth, request id, rate limit), it's under `middlewares/`. Nothing else gets
top-level folders — resist creating `handlers/`, `services/`,
`models/`-across-the-whole-app folders; those live *inside* each feature
instead (see §3).

---

## 2. `cmd/server/main.go` — composition root

`main.go` does exactly these things, in this order, and nothing else:

1. Load config (fail fast with every missing variable listed at once, not
   one at a time).
2. Set up a cancellation context tied to OS signals (`SIGINT`/`SIGTERM`).
3. Connect every infra dependency the app needs (DB pool, cache, object
   storage, mail client, auth-token verifier). Each connector is a small
   `pkg/<thing>.Connect(ctx, cfg)` function that fails fast and is called
   here, not lazily inside a handler.
4. Initialize any package-level singletons that must exist before routes
   are built (e.g. an auth verifier used by a middleware package).
5. Build the HTTP framework instance with a **central error handler**
   wired in at construction time (see §6) — handlers never write their own
   error-response bodies.
6. Attach global middleware in a fixed, deliberate order: panic recovery
   first, then rate limiting, then request-id, then logging, then CORS.
   Recovery must be outermost so a panic anywhere downstream still gets a
   clean response instead of a dropped connection.
7. Hand the framework instance and every infra client to a single
   `router.New(...)` call that builds and wires up every feature (§4), then
   call `.SetUp()` to mount routes.
8. Start any background/periodic jobs as supervised goroutines (§8),
   started *after* routing is wired so they can call into feature `App`s.
9. Start listening in a goroutine, block on the cancellation context, then
   shut down the HTTP server with a bounded timeout.

Nothing feature-specific belongs in `main.go` — no business logic, no raw
SQL, no per-feature route registration calls beyond the one composed call
into the router package. A second `cmd/<name>/main.go` (a seed script, a
one-off migration helper, a CLI) reuses the exact same config-load +
infra-connect pattern as `cmd/server`, just without the HTTP server part.

---

## 3. Feature package shape ("package by feature")

Every feature is one folder under `internal/features/<name>/`, as a single
Go package, with files split **by role, not by resource**, using a
`<feature>.<role>.go` naming convention:

| File                        | Contents |
|-----------------------------|----------|
| `<feature>.app.go`          | The `App` struct (feature's public handle) + constructor `New(...)` |
| `<feature>.routes.go`       | `RegisterRoutes(router)` — URL paths, HTTP verbs, middleware chain |
| `<feature>.controllers.go`  | `handleX` methods: parse request, call a service method, shape the HTTP response |
| `<feature>.services.go`     | Exported business-logic methods on `App` — validation, orchestration, transactions |
| `<feature>.repository.go`   | Thin exported methods on `App` that call the generated query layer, optionally tx-scoped |
| `<feature>.entity.go`       | Request/response DTOs (validation tags on request structs, `json` tags on both) |
| `<feature>.middleware.go`   | *(only if the feature owns a stateful auth scheme)* — see §5 |
| `<feature>.<x>.go`          | Any extra concern too big to fit the above (a renderer, a CSV parser, a classifier) gets its own file, still inside the feature package — see `cards.render.go`, `cards.fetchimage.go`, `attendance.classify.test.go` |

**One struct — `App` — is the receiver for all three layers**
(controllers, services, repository) inside a feature. There is no separate
`Handler`/`Service`/`Repository` struct trio; the split is by *file* and by
*naming convention* (`handleX` = HTTP layer, capitalized verb = business
logic, capitalized-but-thin verb backed directly by a generated query =
repository layer), not by *type*. This keeps a feature's internal call
graph flat (`a.Create(...)` inside a service can call `a.CreateEvent(...)`
in the same package without an interface or DI boundary) while still
keeping the three concerns visually and physically separated.

```
// <feature>.app.go
type App struct {
    pool    *pgxpool.Pool      // only if this feature needs multi-statement transactions
    queries *dbgen.Queries
    // + a typed dependency per other feature this one legitimately needs (see below)
}

func New(pool *pgxpool.Pool, queries *dbgen.Queries, ...other *otherfeature.App) *App {
    return &App{ ... }
}
```

```
// <feature>.routes.go
func (a *App) RegisterRoutes(router fiber.Router) {
    manage := middlewares.RequireRole(generic.RoleAdmin, generic.RoleMember)
    g := router.Group("/things", middlewares.RequireAuth, middlewares.RequireOrganization)
    g.Post("/", manage, a.handleCreate)
    g.Get("/", a.handleList)
    ...
}
```

```
// <feature>.controllers.go
func (a *App) handleCreate(c *fiber.Ctx) error {
    var req CreateThingRequest
    if err := utils.BindAndValidate(c, &req); err != nil { return err }
    resp, err := a.Create(c.Context(), middlewares.Claims(c).OrganizationID, req)
    if err != nil { return err }
    return utils.OK(c, fiber.StatusCreated, resp)
}
```

```
// <feature>.services.go
func (a *App) Create(ctx context.Context, orgID uuid.UUID, req CreateThingRequest) (ThingResponse, error) {
    // validate business rules, call repository methods (possibly inside a WithTx),
    // translate low-level errors into utils.APIError, map DB rows -> response DTO
}
```

```
// <feature>.repository.go
func (a *App) CreateThing(ctx context.Context, tx pgx.Tx, orgID uuid.UUID, ...) (dbgen.Thing, error) {
    q := a.queries
    if tx != nil { q = q.WithTx(tx) }
    return q.CreateThing(ctx, dbgen.CreateThingParams{...})
}
```

**Rules that keep this from turning into a tangle:**

- Controllers only bind/validate input and shape output. All decisions live
  in the service layer.
- Repository methods are the *only* place that reference the generated
  query layer. They optionally accept a `tx pgx.Tx` (nilable) so the same
  method works standalone or inside a multi-step transaction — the
  `if tx != nil { q = q.WithTx(tx) }` idiom is the standard way to make a
  repository method dual-purpose without duplicating it.
- A DTO's validation lives entirely on its own struct tags
  (`json:"..." validate:"..."`), decoded and checked by one shared
  bind-and-validate helper (§6) — never hand-rolled per handler.
- Tenant-scoped tables always carry an owning-tenant id (here,
  `organization_id`), and every repository/service method that touches them
  takes that id as an explicit parameter rather than trusting a global
  context value. Multi-tenancy is enforced by every query's `WHERE`, not by
  a shared middleware that filters after the fact.

### Cross-feature dependencies

- A feature that needs another feature's data takes that feature's `*App`
  as a constructor dependency and calls its **exported service methods** —
  never reaches into another feature's repository layer directly. This
  keeps invariants (e.g. "what does 'expected' mean for this resource")
  defined in exactly one place, callable by everyone else.
- A write that must be atomic across two features' tables is the one
  exception to "only call through the other feature's service": it opens a
  transaction with a `WithTx` helper (§7) and constructs short-lived,
  tx-scoped repository calls directly, on both features' `App`s, inside
  that single transaction function.
- A sub-resource that only ever makes sense nested under a parent (e.g. a
  child list under a specific parent record) gets its **own** feature
  package, takes the parent's `App` as a dependency, and reads the parent's
  state through one deliberate "context" method the parent exposes (e.g.
  `parent.GetContext(ctx, ...)` returning a small struct of exactly the
  fields nested features need — status, type, valid dates/ids). Its routes
  are mounted nested too: `/parents/:parentId/<child>/...`. This avoids
  every child feature re-deriving "is the parent still editable" logic
  independently.
- If feature A needs a callback into feature B, but B already depends on A
  (so B importing A back would cycle), A declares a **small interface** for
  just the method it needs (e.g. `type Sender interface { SendX(...) }`)
  and takes that instead of B's concrete type. Only the composition root
  (`router`) imports both concrete packages and wires the concrete instance
  into A via a setter (`a.SetSender(concreteB)`) after both are
  constructed. The two feature packages themselves never import each other.
- Two features can each own one route on the very same URL group without
  either importing the other: one feature's `RegisterXRoutes` mounts the
  group and returns the router group handle; the composition root passes
  that returned handle into the other feature's own `RegisterYRoute`. Only
  the composition root ties them together.
- A feature with no owned table of its own — a pure aggregator/reporting
  feature — has no `repository.go` at all. Its `App` just holds typed
  references to the other features' `App`s and its services call *their*
  exported methods and roll the results up. This guarantees the aggregator
  can never drift from the definitions those owning features already
  enforce.

### Public (unauthenticated) sub-routes

A route that must work with **no** authenticated session (a public
sign-up/submission link, a scanner device pairing step) is registered by
its owning feature's own `RegisterPublicRoutes(router)`, mounted at the
composition root *outside* every auth-required group. Access control for
that route is whatever narrow token/secret it validates instead of a user
identity — never an accidental side door reachable because it happened to
share a route group with authenticated ones.

### Non-JSON responses

A response body that isn't a JSON envelope (a CSV export, a binary
download, a generated file) is a deliberate, narrow exception: the handler
sets `Content-Type`/`Content-Disposition` directly and returns raw bytes,
skipping the standard response helper. This stays the exception, not a
precedent — everything else goes through the typed envelope (§6).

---

## 4. Composition root (`internal/router`)

One package owns constructing every feature's `App` and mounting every
feature's routes — nothing else builds a feature `App` anywhere else in the
codebase.

- A single `Router` struct holds every feature `App` as a typed, exported
  field (not `interface{}`, not a map) so other bootstrap code (background
  jobs, seed scripts sharing the process) can reference them directly.
- `New(...)` takes every infra client (`pool`, `cache`, `objectStore`,
  `mailer`, `queries`, ...) as parameters and constructs feature `App`s
  **in dependency order** — a feature that depends on another is
  constructed after it, passing the already-built `*App` in. Any
  back-reference needed to break a cycle (§3) is wired via a setter call
  right after both sides exist, before returning the `Router`.
- `SetUp()` mounts a health-check route, then calls each feature's
  `RegisterRoutes`, `RegisterPublicRoutes`, `RegisterScannerRoutes`/etc. in
  the same dependency order used to construct them. This method is the one
  place in the whole codebase where every feature's routing is visible at
  a glance.

---

## 5. Middleware: generic vs. feature-owned

- **Generic, stateless middleware** (`internal/middlewares/`): auth-token
  verification, role checks, tenant-required checks. These have no
  database dependency at request time — a token-verification middleware
  fetches its keyset once at boot (with background refresh) and never
  makes a DB round-trip per request; role/claims are read straight off
  already-verified token claims.
  - `RequireAuth` verifies the credential and stores parsed claims on the
    request context under an unexported key, exposing a package-level
    `Claims(c)` accessor — handlers never read the raw context key
    themselves.
  - `RequireRole(roles...)` and `RequireOrganization` (or equivalent
    tenant-scoping check) are small composable middlewares that run *after*
    `RequireAuth` and read from `Claims(c)`.
- **Feature-owned middleware** (`<feature>.middleware.go`): only exists
  when validating the credential *requires* a DB/cache lookup specific to
  that feature (e.g. an API-key/device-key scheme backed by a hashed
  secret in a table). This lives as a method on that feature's `App`
  (`a.RequireDevice()`) rather than in the generic package, because it
  needs the feature's own service/repository to authenticate. It follows
  the same "verify, stash on locals, expose a typed getter" shape as the
  generic auth middleware.
- Route-group composition always lists middleware in the same left-to-right
  order: authenticate → require-tenant → require-role → handler. Public
  routes skip straight to whatever narrow check replaces "authenticate" for
  that route.

---

## 6. Cross-cutting HTTP plumbing (`internal/utils`)

Three small, framework-level pieces every feature's controllers rely on —
written once, never duplicated per feature:

1. **Bind + validate** — one function wraps "parse body into a typed DTO"
   and "run struct-tag validation" together, and is the *only* sanctioned
   way to read a request body. Validation error field names are remapped
   to match the wire format's tag (e.g. JSON field names), not the Go
   struct field names, so frontend and backend error keys agree.
2. **Typed error type** — a single `APIError{Status, Code, Message,
   Fields}` type is the only error type any handler/service returns up the
   stack. Small constructor helpers (`ErrValidation`, `ErrUnauthorized`,
   `ErrForbidden`, `ErrNotFound`, `ErrConflict`, `ErrInternal`,
   `NewError(status, code, message)`) keep call sites terse and consistent.
   Nothing below the HTTP layer ever writes an HTTP status code directly —
   it returns one of these.
3. **Central error handler + response envelope** — installed once on the
   framework instance at construction (§2 step 5). Success responses go
   through one `OK(c, status, data)` helper that wraps `data` in a fixed
   envelope shape (e.g. `{"data": ...}`); the central handler recognizes
   the typed error above and renders `{"error": {...}}` with the right
   status, falls back to translating framework-level errors, and treats
   anything else as an unexpected 500 (logged, never leaking internal
   detail to the client). This means **every** handler body ends with
   either `return utils.OK(...)` or `return err` — never a raw
   `c.JSON(...)` of an ad hoc shape.

No handler or service ever returns/serializes a bare map or an untyped
`interface{}` as a response — every response is a named DTO struct.

---

## 7. Database layer

- **Schema migrations are plain, numbered, hand-written SQL** — one
  sequential pair per change (`NNN_description.up.sql` /
  `NNN_description.down.sql`), applied by a standard migration CLI, never
  an ORM's auto-generated diff. A Makefile target scaffolds a new numbered
  pair (`migrate-new name=...`) and another applies/rolls back
  (`migrate-up`/`migrate-down`).
- **Query code is generated, not hand-written.** SQL lives in
  `internal/db/sqlc/queries/*.sql`, one file per schema area (roughly
  matching feature boundaries, though a shared/generic table like an
  external-auth-library's own schema gets its own file too). Each query is
  annotated with a name and result-cardinality comment
  (`-- name: GetThing :one`) that a generator turns into a typed Go
  function + typed params/result struct. The generated package
  (`internal/db/sqlc/generated`, aliased `dbgen` at import sites) is
  **gitignored** — it's a build artifact, regenerated by a Makefile target
  after any query change, never hand-edited or committed.
- **Non-trivial queries carry a one-line comment** explaining *why* they're
  shaped the way they are when that's not obvious from the SQL alone (an
  unconditional delete meant only for a background sweep, a join whose
  purpose is a specific cleanup rule) — the same "comment the why, not the
  what" bar as application code.
- **Transactions crossing repository calls** go through one small
  `WithTx(ctx, pool, func(tx) error)` helper: begins a transaction, defers
  a rollback (a no-op once committed), runs the callback, commits on nil
  error. Every repository method that might run inside a transaction
  accepts an optional `tx` parameter and falls back to the ambient
  non-transactional query handle when `tx` is nil (§3) — so the same
  method serves both single-statement and multi-statement-atomic call
  sites without duplication.
- **DB-specific error translation** (e.g. recognizing a unique-constraint
  violation by its driver-level error code, optionally narrowed to one
  named constraint) lives in one small helper in the DB package, so
  services translate a raw driver error into a typed `APIError` (conflict,
  etc.) in one line instead of re-deriving the error code check per
  feature.
- A **prototype/pre-launch project drops and recreates tables freely**
  when a redesign calls for it, rather than writing data-preserving
  migrations or dual-write shims — that constraint only starts applying
  once real production data exists (see this repo's own `CLAUDE.md`).

---

## 8. Background jobs

- A tiny generic `jobs` package defines a `Task func(ctx) error` type and
  one `Run(ctx, interval, tasks...)` loop: run every task once immediately,
  then again on a fixed tick, until the context is canceled. Each task's
  panic and error are recovered/logged **independently** so one bad task
  never kills the loop or the others.
- Feature-specific task logic (what a given sweep actually does) lives in
  its own file in the `jobs` package, built from a small constructor
  (`NewXTasks(...featureApps) []Task`) that closes over the feature `App`s
  it needs — jobs call into feature services exactly like an HTTP handler
  would, never touching a repository directly.
- Started from `main.go` as a supervised goroutine, after routing is fully
  wired, so job code can depend on the same constructed `App`s the router
  uses.
- Fire-and-forget async work triggered *by* a request (e.g. "send
  notifications after this action succeeds, but don't make the client wait
  for it") uses the same discipline inline in the handler: a `go func()`
  with its own `recover()` and its own logging, never assumed to be covered
  by the framework's request-scoped panic recovery.

---

## 9. Config

- One `Config` struct, one `Load()` function, called once at process start
  in every `cmd/*/main.go`. Loads a local `.env` file if present (for dev),
  then reads real environment variables.
- Every required variable is checked with a small `require(key)` helper
  that *collects* missing-variable names instead of returning on the first
  one; `Load()` returns a single error listing everything missing at once.
- Optional variables go through `getOr`/`getInt`/`getBool` helpers with an
  explicit default — no bare `os.Getenv` calls scattered through the
  codebase outside this one file.
- Secrets that are conceptually independent are kept as separate config
  fields even if they could share one value today (e.g. a session-signing
  secret vs. a domain-specific token-signing secret), specifically so
  rotating one never forces rotating the other.

---

## 10. Naming and file conventions recap

- Package name = feature name, singular-or-plural matching the resource
  (`events`, `people`, `plans`) — one package per folder, no nested
  sub-packages inside a feature.
- File names are `<package>.<role>.go` — never bare `handler.go`/
  `service.go` inside a multi-file-per-role feature, since the package
  name alone doesn't disambiguate which file you're in when several
  feature folders are open at once.
- Exported DTO types are named `<Verb><Noun>Request` /
  `<Noun>Response` / `<Noun>Summary` and live only in `<feature>.entity.go`.
- Every constructor is `New(...)` returning `*App`; every route
  registrar is `RegisterRoutes` (+ `RegisterPublicRoutes` /
  `Register<Special>Routes` where applicable).
- Comments across the codebase explain **why**, not what — a non-obvious
  invariant, a deliberate trade-off, a workaround, or a cross-file
  relationship the reader can't see from the code alone. Code that doesn't
  need that explanation carries no comment at all.

---

## 11. Applying this blueprint to a new project

1. Pick the HTTP framework/ORM-or-query-generator/migration-tool
   equivalents for the new project's language — the pattern doesn't
   require this repo's specific choices (Fiber/sqlc/golang-migrate), only
   the same *shape*: a thin router, generated/typed query code, plain
   numbered SQL migrations.
2. Start with `cmd/<entry>/main.go` doing steps 1–9 from §2, even before
   any feature exists — config, infra connect, framework instance with a
   central error handler and ordered middleware, empty router composition.
3. Add cross-cutting `utils` (bind+validate, typed error, response
   envelope) and generic `middlewares` (auth, role/tenant checks) before
   the first feature — every feature depends on these from its first line
   of code.
4. For each resource, create one `internal/features/<name>/` folder with
   the six-file split from §3, wire its `App` into the composition root in
   dependency order, and mount its routes.
5. Only reach for the cross-feature patterns in §3 (interface-for-callback,
   shared-route-group, parent-context-read) when an actual second feature
   needs them — don't pre-build the abstraction before there are two
   features to justify it.

---

## 12. Key packages used (and what each slot is *for*)

None of these choices are load-bearing for the pattern — swap in whatever
your language/ecosystem's equivalent is. What matters is that each *slot*
below is filled by exactly one library, used only behind the one `pkg/`
wrapper that owns it (§1) — feature code never imports these directly.

| Concern | Package (this repo) | Why this slot exists |
|---|---|---|
| HTTP router/framework | `github.com/gofiber/fiber/v2` | Route groups, middleware chaining, a central error handler hook |
| Recovery / rate-limit / request-id / logging / CORS | `fiber/middleware/{recover,limiter,logger,requestid,cors}` | Off-the-shelf generic middleware — never hand-rolled |
| Postgres driver + pool | `github.com/jackc/pgx/v5`, `.../pgxpool` | Connection pooling, native types (`pgtype.Date`, `pgtype.Text`, ...), transactions |
| Typed SQL codegen | `sqlc` (build-time tool, not a runtime import) | Generates `dbgen.Queries` from hand-written SQL — no ORM, no reflection-based query building at runtime |
| Schema migrations | `github.com/golang-migrate/migrate/v4` (+ its `postgres` and `file` source drivers) | Plain numbered SQL up/down pairs, applied by CLI |
| Cache / ephemeral state | `github.com/redis/go-redis/v9` | Session-adjacent bookkeeping, rate limiting, short-lived pairing codes |
| Object storage | `github.com/minio/minio-go/v7` | S3-compatible client — same code path against local MinIO and real S3/R2/etc. in production |
| Request validation | `github.com/go-playground/validator/v10` | Struct-tag validation driven off request DTOs, remapped to `json` tag names (§6) |
| JWT parsing | `github.com/golang-jwt/jwt/v5` | Signature/expiry verification of externally-issued bearer tokens |
| JWKS keyset fetch/refresh | `github.com/MicahParks/keyfunc/v3` | Turns a JWKS URL into a `jwt.Keyfunc`, refreshed in the background — no per-request network call |
| Config loading | `github.com/joho/godotenv` | Loads a local `.env` in dev only; real env vars always win in prod |
| Outbound email | `gopkg.in/gomail.v2` | Thin SMTP client behind `pkg/mailer` |
| IDs | `github.com/google/uuid` | Every entity/tenant id is a UUID, never an auto-increment integer exposed over the API |
| Domain-specific leaf packages | `go-pdf/fpdf`, `skip2/go-qrcode` | Kept as leaf dependencies used only inside the one feature that needs them (e.g. a card-rendering feature) — never imported by `pkg/` or by unrelated features |

General rule: **one wrapper package per infrastructure concern in `pkg/`,
one well-known library per wrapper, never the same third-party import
appearing in two different `pkg/` packages or reached for directly from a
feature.**

---

## 13. Demo: `cmd/server/main.go`

Illustrative version of the composition root described in §2 — every piece
below is generic infrastructure wiring, no business logic:

```go
package main

import (
    "context"
    "log"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"
    "github.com/gofiber/fiber/v2/middleware/limiter"
    "github.com/gofiber/fiber/v2/middleware/logger"
    "github.com/gofiber/fiber/v2/middleware/recover"
    "github.com/gofiber/fiber/v2/middleware/requestid"
    _ "github.com/golang-migrate/migrate/v4/database/postgres"
    _ "github.com/golang-migrate/migrate/v4/source/file"

    "myapp-server/internal/config"
    dbgen "myapp-server/internal/db/sqlc/generated"
    "myapp-server/internal/jobs"
    "myapp-server/internal/middlewares"
    "myapp-server/internal/pkg/jwt"
    "myapp-server/internal/pkg/mailer"
    "myapp-server/internal/pkg/postgres"
    "myapp-server/internal/pkg/redis"
    "myapp-server/internal/pkg/storage"
    "myapp-server/internal/router"
    "myapp-server/internal/utils"
)

func main() {
    // 1. Config — fails fast, lists every missing env var at once.
    cfg, err := config.Load()
    if err != nil {
        log.Fatalf("config: %v", err)
    }

    // 2. Cancellation context tied to process signals.
    ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
    defer stop()

    // 3. Connect every infra dependency up front — nothing lazy-connects
    //    inside a request handler.
    pool, err := postgres.Connect(ctx, cfg.DatabaseURL)
    if err != nil {
        log.Fatalf("database: %v", err)
    }
    defer pool.Close()

    rdb, err := redis.Connect(ctx, cfg.RedisURL)
    if err != nil {
        log.Fatalf("redis: %v", err)
    }
    defer rdb.Close()

    objectStore, err := storage.Connect(ctx, cfg)
    if err != nil {
        log.Fatalf("storage: %v", err)
    }

    verifier, err := jwt.NewVerifier(ctx, cfg.AuthJWKSURL)
    if err != nil {
        log.Fatalf("jwt: fetch JWKS: %v", err)
    }

    // 4. Package-level singletons that must exist before routes are built.
    middlewares.InitAuth(verifier)

    queries := dbgen.New(pool)
    mail := mailer.New(cfg)

    // 5. Framework instance with the central error handler wired in at
    //    construction — handlers never build their own error bodies.
    app := fiber.New(fiber.Config{
        ErrorHandler:   utils.ErrorHandler,
        ReadBufferSize: 16384,
    })

    // 6. Global middleware in a fixed, deliberate order.
    app.Use(recover.New())
    app.Use(limiter.New(limiter.Config{Max: 100, Expiration: time.Minute}))
    app.Use(requestid.New())
    app.Use(logger.New(logger.Config{Format: "${time} ${status} ${method} ${path} (${latency})\n"}))
    app.Use(cors.New(cors.Config{
        AllowOrigins: cfg.WebOrigin,
        AllowHeaders: "Content-Type,Authorization",
        AllowMethods: "GET,POST,PATCH,DELETE,OPTIONS",
    }))

    // 7. Composition root: build every feature App, then mount routes.
    r := router.New(app, cfg, pool, rdb, objectStore, mail, queries)
    r.SetUp()

    // 8. Background jobs, started after routing so they can call feature Apps.
    tasks := jobs.NewDailyTasks(r.Billing, r.Resources)
    go jobs.Run(ctx, 24*time.Hour, tasks...)

    // 9. Listen, then shut down cleanly on cancellation.
    go func() {
        if err := app.Listen(":" + cfg.Port); err != nil {
            log.Fatalf("server: %v", err)
        }
    }()
    log.Printf("myapp-server listening on :%s (%s)", cfg.Port, cfg.Env)

    <-ctx.Done()
    log.Println("shutting down...")

    shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    if err := app.ShutdownWithContext(shutdownCtx); err != nil {
        log.Printf("shutdown: %v", err)
    }
}
```

---

## 14. Demo: the Postgres handler (`internal/pkg/postgres`)

Three small files, each with one job: connect, run a transaction,
translate a driver-level error. Nothing else in the codebase imports
`pgxpool` or `pgconn` directly.

```go
// db.go — connection pool lifecycle
package postgres

import (
    "context"
    "fmt"
    "time"

    "github.com/jackc/pgx/v5/pgxpool"
)

func Connect(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
    poolCfg, err := pgxpool.ParseConfig(databaseURL)
    if err != nil {
        return nil, fmt.Errorf("db: parse config: %w", err)
    }
    poolCfg.MaxConnLifetime = time.Hour
    poolCfg.MaxConnIdleTime = 30 * time.Minute

    pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
    if err != nil {
        return nil, fmt.Errorf("db: create pool: %w", err)
    }

    pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()
    if err := pool.Ping(pingCtx); err != nil {
        pool.Close()
        return nil, fmt.Errorf("db: ping: %w", err)
    }
    return pool, nil
}
```

```go
// tx.go — the one place a cross-repository transaction is opened
package postgres

import (
    "context"

    "github.com/jackc/pgx/v5"
    "github.com/jackc/pgx/v5/pgxpool"
)

// WithTx runs fn inside a transaction, committing on success and rolling
// back otherwise (including on panic). Used only for writes that span
// more than one feature's repository (§3/§7) — a single-feature write
// just uses the ambient (non-transactional) query handle.
func WithTx(ctx context.Context, pool *pgxpool.Pool, fn func(pgx.Tx) error) error {
    tx, err := pool.Begin(ctx)
    if err != nil {
        return err
    }
    defer tx.Rollback(ctx) //nolint:errcheck // no-op once committed

    if err := fn(tx); err != nil {
        return err
    }
    return tx.Commit(ctx)
}
```

```go
// pgerr.go — translate driver errors instead of leaking them as 500s
package postgres

import (
    "errors"

    "github.com/jackc/pgx/v5/pgconn"
)

const uniqueViolationCode = "23505"

// IsUniqueViolation reports whether err is a Postgres unique-constraint
// violation, optionally narrowed to one named constraint (pass "" to match
// any). A service turns this into utils.ErrConflict(...) instead of
// letting a raw driver error surface as an internal_error.
func IsUniqueViolation(err error, constraint string) bool {
    var pgErr *pgconn.PgError
    if !errors.As(err, &pgErr) || pgErr.Code != uniqueViolationCode {
        return false
    }
    return constraint == "" || pgErr.ConstraintName == constraint
}
```

Usage from a service (§3), turning the driver error into a typed API error:

```go
func (a *App) Create(ctx context.Context, orgID uuid.UUID, req CreateThingRequest) (ThingResponse, error) {
    row, err := a.CreateThing(ctx, nil, orgID, req.Slug)
    if err != nil {
        if postgres.IsUniqueViolation(err, "things_org_id_slug_key") {
            return ThingResponse{}, utils.ErrConflict("a thing with this slug already exists")
        }
        return ThingResponse{}, utils.ErrInternal()
    }
    return toThingResponse(row), nil
}
```

---

## 15. Demo: the Redis handler (`internal/pkg/redis`)

```go
package redis

import (
    "context"
    "fmt"
    "time"

    "github.com/redis/go-redis/v9"
)

// Connect returns a ready, ping-verified client. Every feature that needs
// Redis (rate limiting, short-lived pairing codes, cached lookups) takes
// *redis.Client as a constructor dependency and calls it directly — this
// package's only job is producing a verified connection, not wrapping
// every possible Redis command.
func Connect(ctx context.Context, redisURL string) (*redis.Client, error) {
    opts, err := redis.ParseURL(redisURL)
    if err != nil {
        return nil, fmt.Errorf("redis: parse url: %w", err)
    }
    client := redis.NewClient(opts)

    pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()
    if err := client.Ping(pingCtx).Err(); err != nil {
        _ = client.Close()
        return nil, fmt.Errorf("redis: ping: %w", err)
    }
    return client, nil
}
```

A feature that owns a Redis-backed concern (e.g. a short-lived pairing
code) still gets its own thin helper methods living in *that feature's*
files, not in `pkg/redis` — e.g. `devices.putPairingCode(ctx, code, ttl)`
inside `devices.repository.go`-equivalent, using the shared client. `pkg/`
owns the connection; each feature owns the keys/shapes it stores under it.

---

## 16. Demo: the object storage handler (`internal/pkg/storage`)

```go
package storage

import (
    "context"
    "fmt"
    "io"

    "github.com/minio/minio-go/v7"
    "github.com/minio/minio-go/v7/pkg/credentials"

    "myapp-server/internal/config"
)

type Storage struct {
    client *minio.Client
    bucket string
}

// Connect works identically against local MinIO and a real S3-compatible
// service in production — only cfg.S3Endpoint/UseSSL differ between them.
// It also ensures the bucket exists, so a fresh dev environment needs no
// manual bucket-creation step.
func Connect(ctx context.Context, cfg *config.Config) (*Storage, error) {
    client, err := minio.New(cfg.S3Endpoint, &minio.Options{
        Creds:  credentials.NewStaticV4(cfg.S3AccessKey, cfg.S3SecretKey, ""),
        Secure: cfg.S3UseSSL,
    })
    if err != nil {
        return nil, fmt.Errorf("storage: create client: %w", err)
    }

    exists, err := client.BucketExists(ctx, cfg.S3Bucket)
    if err != nil {
        return nil, fmt.Errorf("storage: check bucket: %w", err)
    }
    if !exists {
        if err := client.MakeBucket(ctx, cfg.S3Bucket, minio.MakeBucketOptions{}); err != nil {
            return nil, fmt.Errorf("storage: create bucket: %w", err)
        }
    }
    return &Storage{client: client, bucket: cfg.S3Bucket}, nil
}

func (s *Storage) Put(ctx context.Context, key string, r io.Reader, size int64, contentType string) error {
    _, err := s.client.PutObject(ctx, s.bucket, key, r, size, minio.PutObjectOptions{ContentType: contentType})
    return err
}

// Get returns the full object bytes rather than a stream — the pattern
// this project follows only ever stores small objects (logos, signatures)
// that every caller needs whole anyway, to embed in a PDF or serve with a
// known Content-Length. A project storing large objects would return
// io.ReadCloser instead — pick whichever matches your actual call sites.
func (s *Storage) Get(ctx context.Context, key string) ([]byte, string, error) {
    obj, err := s.client.GetObject(ctx, s.bucket, key, minio.GetObjectOptions{})
    if err != nil {
        return nil, "", err
    }
    defer obj.Close()

    info, err := obj.Stat()
    if err != nil {
        return nil, "", err
    }
    data, err := io.ReadAll(obj)
    if err != nil {
        return nil, "", err
    }
    return data, info.ContentType, nil
}

func (s *Storage) Delete(ctx context.Context, key string) error {
    return s.client.RemoveObject(ctx, s.bucket, key, minio.RemoveObjectOptions{})
}
```

Object keys are namespaced by feature and entity id at the call site
(`fmt.Sprintf("%s/%s.%s", prefix, entityID, ext)`), never inside `Storage`
itself — the storage package doesn't know what a "logo" or a "signature"
is, it just moves bytes under a key.

---

## 17. Permission checks, layer by layer

Authorization is never a single check — it's four independent layers, each
catching what the one before it can't:

1. **Authentication** (`RequireAuth`) — is there a valid, unexpired bearer
   credential at all? Runs first on every non-public route. Stores parsed
   claims on the request context; nothing downstream re-parses the token.
2. **Tenant scoping** (`RequireOrganization`) — does the caller's token
   carry a tenant (organization) id? A signed-in user mid-onboarding with
   no tenant yet fails here with a distinct error code (`organization_required`)
   so the frontend can route them to "finish setup" instead of a generic 403.
3. **Role check** (`RequireRole(roles...)`) — does the caller's role (baked
   into the token at issue time — no DB round-trip) match one of the roles
   this route allows? Applied **per route, not per feature** — list/read
   endpoints are frequently left open to every tenant role, while
   create/update/delete endpoints require an elevated role, and a small
   number of destructive/tenant-wide actions (deleting the tenant itself)
   require the single most-privileged role specifically.
4. **Query-level tenant isolation** (defense in depth, §3/§7) — even if
   every middleware above were somehow bypassed, every repository method
   on a tenant-owned table takes `organizationID` as an explicit parameter
   and every generated query's `WHERE` clause filters on it. A cross-tenant
   ID guess returns "not found," never another tenant's row.
5. **Resource-state / business-rule checks** (in the service layer, not
   middleware) — a role check answers "can this kind of user call this
   endpoint at all," not "is this specific resource in a state where this
   action makes sense." Those checks live where the business rule is
   defined: e.g. "only a resource still in draft status can be edited,"
   "this action is blocked while the tenant's billing is past due." These
   return the same typed `APIError` (`ErrConflict`, a custom `NewError`
   with its own code) as any other service-layer failure — middleware
   never tries to encode business state.

Two credential schemes sit **outside** this ladder entirely, each replacing
step 1–2 with something narrower:

- **Feature-owned alternate credential** (§5) — a non-human caller (a
  scanner device, a webhook sender) authenticates with its own scheme
  (e.g. an opaque per-device key hashed at rest, sent as a custom header)
  validated by a middleware method the *feature* owns
  (`devices.App.RequireDevice()`), because validating it requires that
  feature's own repository. No JWT, no organization claim, no role — the
  device record itself carries whatever scope it needs.
- **Public/token-only routes** (§3) — no identity at all; possession of an
  opaque, unguessable token embedded in the URL (a public form link) or a
  one-time pairing code *is* the access control. These are registered via
  the feature's own `RegisterPublicRoutes`, mounted outside every
  `RequireAuth` group, so they can never accidentally inherit a stricter
  check meant for authenticated routes — and never accidentally lose one
  either, since they're visually separate in the composition root (§4).

### Worked example — the permission tier of every route on one resource

This is the actual shape used across every feature in this codebase (route
paths/resource names below are illustrative):

```go
func (a *App) RegisterRoutes(router fiber.Router) {
    manage := middlewares.RequireRole(generic.RoleAdmin, generic.RoleMember)

    g := router.Group("/things", middlewares.RequireAuth, middlewares.RequireOrganization)
    g.Post("/", manage, a.handleCreate)   // write -> elevated role required
    g.Get("/", a.handleList)              // read  -> any authenticated tenant member
    g.Get("/:id", a.handleGet)            // read  -> any authenticated tenant member
    g.Patch("/:id", manage, a.handleUpdate) // write -> elevated role required
    g.Delete("/:id", manage, a.handleDelete) // write -> elevated role required
}
```

The route group applies steps 1–2 (`RequireAuth`, `RequireOrganization`) to
every route in it up front; step 3 (`manage`) is then layered on
individually per route, only where a write actually needs it. This keeps
the permission tier of every single endpoint visible in one place —
`RegisterRoutes` — instead of scattered as `if` checks inside each handler.

### Permission tiers actually used across this codebase's features

| Tier | Middleware chain | Used for |
|---|---|---|
| Public | *(none — a narrow token/key check inside the handler itself)* | Public form submission by link, device pairing by one-time code |
| Alternate credential | `RequireDevice()` (feature-owned) | Scanner-bot endpoints — no human session at all |
| Authenticated, tenant, any role | `RequireAuth, RequireOrganization` | Every list/get endpoint; a tenant's public plan catalog needs only `RequireAuth`+`RequireOrganization` (or nothing, if it's pre-tenant) |
| Authenticated, tenant, elevated role | `RequireAuth, RequireOrganization, RequireRole(Admin, Member)` | Create/update/delete on tenant-owned resources; a resource's file/image upload; billing purchase/renew/upgrade/cancel actions |
| Authenticated, tenant, most-privileged role only | `RequireAuth, RequireOrganization, RequireRole(Admin)` | Deleting the tenant itself, and any other action whose blast radius is the whole tenant, not one resource in it |

When designing a new feature's routes, decide the tier for **each route
individually** (not for the feature as a whole) by asking: does this leak
or mutate data broader than "one resource a tenant member should be able
to see/manage," and if it mutates, is the blast radius the resource or the
whole tenant? That answer picks the row in the table above.
