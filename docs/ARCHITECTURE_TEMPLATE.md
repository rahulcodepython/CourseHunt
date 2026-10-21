# Full-Stack Architecture Template
### Derived from CourseHunt (Next.js 16 + React Query + Zustand + Zod / Go + Fiber + sqlx + Redis)

This document distills the architectural patterns actually implemented in CourseHunt into a **reusable template** for future projects. Every section states the generic rule first, then shows the concrete CourseHunt pattern as a worked example. Use this as a checklist when scaffolding a new project, not as a description of CourseHunt for its own sake.

---

## 0. Guiding principles (apply to every layer, both stacks)

1. **DRY through parameterization, not inheritance.** One generic component/function that takes props/generics beats five near-identical ones. If you're about to copy-paste a file and change three lines, stop and extract a parameter instead.
2. **Minimize the call graph.** Fewer network round trips, fewer nested function calls, fewer component layers. A wrapper component that is instantiated once, forwards all its props unchanged, and adds no behavior should not exist — inline it.
3. **Single source of truth per concept.** One schema per entity (frontend), one sentinel error per failure mode (backend), one query-key factory, one response envelope. Never let two files define the shape of the same thing.
4. **Business logic only where it exists.** Don't add a service layer, a repository interface, or an abstraction "for consistency" if the concrete case is a straight pass-through. Add it the moment real logic (cross-entity orchestration, computed pricing, multi-step validation) appears.
5. **Colocate what varies together, centralize what's reused.** A component/schema/query used by exactly one route lives next to that route. A component/schema/query used by ≥2 places moves to the shared layer.
6. **Trust boundaries validate; internals don't.** Validate at the edges (HTTP body → struct, API response → Zod schema, form input → schema). Don't re-validate data that already passed through a trusted internal boundary.

---

# Part 1 — Frontend (Next.js / React)

## 1.1 Project structure

**Rule:** App Router segments are organized **by audience/role first, by resource second** — not by technical layer. Route groups `(name)` group screens that share a layout without adding a URL segment. Anything used by only one route lives beside that route's `page.tsx`; anything reused across routes graduates to a top-level shared folder.

```
src/
  app/
    <role-a>/                     # e.g. admin — protected dashboard
      <resource>/
        page.tsx                  # the whole screen (client component)
        columns.tsx                # table column defs for this screen only
        <resource>-modal.tsx       # create/edit modal, specific to this screen
        <resource>-form.tsx        # form body, specific to this screen
        [id]/                     # nested detail/sub-resource routes mirror the domain tree
    <role-b>/                     # duplicate shape of role-a, different permission gates
    (public)/                     # route group: marketing/public pages, own layout+header/footer
    <shell-role>/(shell)/         # route group: shared dashboard chrome (sidebar+header)
    <shell-role>/<fullbleed>/     # sibling OUTSIDE the group — own layout, no dashboard chrome
    auth/                         # login etc, no shell
    api/<provider>/[...all]/route.ts   # auth catch-all route handler
    layout.tsx                    # root layout: fonts, providers only
  components/
    ui/                           # shadcn primitives, near-unmodified
    *.tsx                         # app's own generic components built on ui/
  hooks/                          # generic client hooks (dialog state, debounce, cursor feed)
  lib/
    actions/                      # server actions ("use server") for privileged mutations
    utils.ts, constants.ts, format.ts, auth.ts
  query-hooks/                    # one *.api.ts per backend resource — the data layer
  react-query/                    # generic React Query infra: client, hook factories, key registry
  schema/                         # one *.types.ts per resource — Zod schemas + inferred types
  store/                          # Zustand — global client state only (session, breadcrumb, ...)
  config/                         # static nav/config JSON per role
```

**Why route-groups matter:** a route group (`(public)`, `(shell)`) shares layout without adding a path segment. Use it whenever multiple sibling routes need the same chrome, and pull a route **out** of the group the moment it needs a fundamentally different layout (e.g. a full-screen player vs. a sidebar dashboard) rather than adding conditional rendering inside one shared layout.

**Colocation rule:** `page.tsx` + its `columns.tsx` + its resource-specific modal/form live together. Only promote a component to `src/components/` when a second route needs it unchanged.

**Anti-pattern to avoid (seen in CourseHunt, worth naming so you don't repeat it):** near-duplicate route trees per role (e.g. `admin/courses/...` and `tutor/courses/...` mirrored 1:1) instead of one parameterized route. Acceptable when permission/URL differences are real; if the only difference is a permission check, prefer one route + a permission gate over duplicating the whole tree.

## 1.2 State management — three layers, never mixed

| Layer | Tool | Lives in | Rule |
|---|---|---|---|
| Server state | React Query | `query-hooks/*.api.ts` | Every piece of data that came from an API call. Never duplicated into Zustand/Context. |
| Global client state | Zustand | `store/*.store.ts` | Only for state genuinely global and cross-cutting (auth session, breadcrumb). Keep the store count small — if you're reaching for a third store, ask whether it's actually local state. |
| Local/ephemeral UI state | `useState`/small custom hooks | inline or `hooks/use-*.ts` | Dialog open/editing flags, form step, debounce buffers. Wrap a repeated `useState` cluster in a hook once it appears in ≥2 places (e.g. a generic `useCrudDialogState<T>()` returning `openCreate/openEdit/requestDelete/confirmDelete`), don't wrap it on first use. |

**No Context for state.** Reserve Context for what it's designed for — theme providers, UI-library internals (tooltip/sidebar providers). Reaching for Context for app state is a sign you want Zustand or React Query instead.

**Access state outside React with `getState()`.** A Zustand store's `.getState()`/`.setState()` (not the hook) is how non-component code (an axios interceptor, a route guard) reads/writes global state without needing to be inside a component tree.

```ts
// axios interceptor reading auth state outside React
const token = useSessionStore.getState().token;
if (token) config.headers.Authorization = `Bearer ${token}`;
```

## 1.3 Component organization

- `components/ui/` — shadcn primitives, effectively vendor code. Don't hand-edit business logic into these; wrap them instead.
- `components/*.tsx` (flat, top-level) — the app's own generic components built on top of `ui/`: data table, form dialog, confirm dialog, status badge, row actions, page header, loading button, icon registry. These are the pieces reused across ≥2 routes.
- Route-local components (forms, modals, columns) stay inside the route folder.

**Naming convention:** kebab-case filename matching the default export (`confirm-delete-dialog.tsx` → `ConfirmDeleteDialog`), `*.api.ts` for query-hook files, `*.types.ts` for schema files, `use-*.ts` for hooks.

## 1.4 shadcn/ui usage

- `components.json` defines the base style, icon library, and path aliases once at project init.
- Treat `ui/*` as generated/vendor output — customize by **composing**, not editing: build `LoadingButton`, `FormDialog`, `ConfirmDeleteDialog`, `StatusBadge` as thin, prop-driven wrappers around the raw primitives (`Button`, `Dialog`, `AlertDialog`, `Badge`) rather than forking the primitive itself.
- Use `cn()` (`clsx` + `tailwind-merge`) everywhere className composition happens — never string-concatenate classNames conditionally.
- Wrap the icon library behind a single registry component so call sites never import the vendor icon package directly:

```ts
// components/icon.tsx
const iconRegistry: Record<IconName, React.ComponentType<...>> = { pencil: IconPencil, trash: IconTrash, ... };
export function Icon({ name, ...props }: { name: IconName }) {
  const Cmp = iconRegistry[name];
  return <Cmp {...props} />;
}
// usage: <Icon name="pencil" />  — never `import { IconPencil } from "@tabler/icons-react"` at call sites
```
This means swapping icon libraries later touches one file, not every component.

## 1.5 Data-table component design

**One generic `DataTable<TData>`** built on TanStack Table (`useReactTable` + `getCoreRowModel`/`getSortedRowModel`/`getFilteredRowModel`/`getPaginationRowModel`/`getExpandedRowModel`). No per-resource table components — every screen supplies `columns` + `data` + a handful of behavior flags.

```ts
export interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  searchPlaceholder?: string;
  searchColumnKey?: string;              // per-column filter vs. global filter
  showColumnToggle?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  emptyIcon?: IconName;
  emptyText?: string;
  isLoading?: boolean;
  toolbarActions?: React.ReactNode;      // slot for page-specific buttons ("New Coupon" etc.)
  exportFilename?: string;
  getSubRows?: (row: TData) => TData[] | undefined;   // opt-in tree/expand support
}
```

- **Columns** are defined per-route with `createColumnHelper<T>()` in a sibling `columns.tsx`, exported as a function that takes the row-action callbacks as parameters:
  ```ts
  export function getColumns(onEdit: (row: T) => void, onDelete: (id: string) => void): ColumnDef<T, any>[] { ... }
  ```
  This keeps the table itself free of any resource-specific mutation logic — the page owns the callbacks, the columns just wire them to a row.
- **Sorting** — one shared `SortableColumnHeader` component plugged into any column's `header` render function; not reimplemented per column.
- **Search/filter** — one debounced `Input` in the table's toolbar (300ms), targeting either one column or a global filter.
- **Pagination** — decide once per project: classic page-switch, or cumulative "load more" against a growing slice. Whichever you pick, implement it once in the shared `DataTablePagination` component.
- **Row actions** — one generic `RowActions`/`RowActionButton` (icon + tooltip, optional `href` vs `onClick`, `destructive` flag) used by every table's action column.
- **Cell affordances that should be automatic, not per-column boilerplate** — e.g. click-to-copy on cells, truncation tooltips — wrap them once (`CopyableCell`) and apply at the table level, not per column definition.

**Generic template rule:** if you ever find yourself writing a second `<ResourceTable>` component instead of `<DataTable columns={resourceColumns} data={resourceData} />`, that's the anti-pattern this whole document is warning about — stop and go back to props.

## 1.6 Generic/shared components — the "don't build one-off wrappers" rule

Concrete instances worth replicating in any project:

- **`FormDialog`** — generic dialog shell (`open`, `onOpenChange`, `title`, `description`, `children`). Every create/edit modal in the app is `FormDialog` + a form component, never a bespoke `<Dialog>` tree.
- **`ConfirmDeleteDialog`** — one destructive-confirmation component, parameterized by title/description/confirmText/loading.
- **`StatusBadge`** — data-driven: takes a `status` string + a `map: Record<string, {label, variant, className}>` + a `fallback`. Replaces N hand-rolled `if/else` badge components (one per entity's status enum) with one lookup-driven component.
- **`useCrudDialogState<T>()`** — the create/edit/delete dialog-state triplet, extracted once it was copy-pasted across pages, returning `openCreate/openEdit/requestDelete/confirmDelete`.
- **One layout component parameterized by nav config**, reused by every role's dashboard:
  ```ts
  // components/generic-dashboard-layout.tsx
  export function GenericDashboardLayout({ rawNavGroups }: { rawNavGroups: NavGroup[] }) { ... }
  // app/admin/layout.tsx:   <GenericDashboardLayout rawNavGroups={adminNav} />
  // app/tutor/layout.tsx:   <GenericDashboardLayout rawNavGroups={tutorNav} />
  ```
  This is the clearest example of "one component, N roles via props" — the template to reach for whenever multiple screens need the *same shell* with *different data*.
- **Permission filtering as pure functions, not hardcoded per role** — `filterNavGroups(nav, permissions)`, `isRouteAllowed(path, permissions)` take the nav config and the user's permissions as arguments; no route/permission pairs are hardcoded in the function itself, so a new role can reuse the same functions against its own nav config.

**The rule this whole section encodes:** before writing a new component, ask "does this differ from an existing one only by data, not by behavior?" If yes, add a prop. Only create a new component when the *behavior* — not just the content — actually differs. And never create a component that is imported and rendered in exactly one place with no prop variation — inline it into the caller instead.

## 1.7 API calls via generic React Query hook factories

**Structure:** a thin per-resource hooks file (`query-hooks/<resource>.api.ts`) sits on top of two generic factories that live once, in `react-query/`.

**Query factory** (`react-query/query.ts`):
```ts
export function useAppQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">,
) {
  return useQuery<TData, TError>({ queryKey, queryFn, ...options });
}
```

**Mutation factory family** (`react-query/mutation.ts`) — this is the single most important generic piece in the frontend. A small set of variants share one internal core, differing only in how they write into the cache:

| Hook | Cache shape it targets | Use for |
|---|---|---|
| `useSimpleMutation` | none (or `invalidateKeys` only) | Actions with no convenient response→cache mapping (role assign, ban/unban) |
| `useObjectMutation` | single object at one key | Profile-style "there is exactly one of these" resources |
| `useArrayMutation` | `TItem[]` | Lists without server-side pagination |
| `usePaginatedMutation` | `PaginatedResponse<TItem>` | Paginated lists (the common case for admin tables) |

Every resource's mutation hook is then just: pick the factory, supply `mutationFn`, `queryKey`, and an `updater`:
```ts
export function useDeleteCouponMutation() {
  return usePaginatedMutation({
    mutationFn: (id: string) => apiRequest({ url: `${API_ENDPOINTS.COUPONS}/${id}`, method: "DELETE" }, DeleteResponseZod),
    queryKey: queryKeys.coupons(),
    updater: (res) => removeFromPaginated(res.id),
    optimistic: (id) => removeFromPaginated(id),
    showToast: true,
  });
}
```
Adding a new resource never means writing new mutation plumbing — it means picking the right factory and supplying five lines of config.

**Generic `execute()` wrapper** — every hook also exposes `.execute(vars)` (built once via a shared `useWithExecute`), which wraps `mutateAsync`, swallows the rejection, and returns `null` on failure, so every call site is `await mutation.execute(data)` with no repeated try/catch.

## 1.8 Data caching

Configure the `QueryClient` **once**, in a single provider:
```ts
new QueryClient({
  queryCache: new QueryCache({ onError: showErrorToast }),   // one global toast for query errors
  defaultOptions: {
    queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
  },
});
```
Rules:
- Pick one `staleTime` default for the whole app; override per-query only when a specific resource genuinely needs fresher/staler data.
- Don't set a global `MutationCache.onError` if your mutation factory already toasts errors per-mutation — you'll get double toasts. Pick exactly one layer that owns error-toasting.
- `gcTime` — leave at the library default unless you have a measured reason to change it.

## 1.9 & 1.10 — Mutations & the generic functions behind them

Every mutation's `onSuccess` runs through one shared `handleResponse(response, showToast)` — this checks the **backend's own success envelope**, not just HTTP status (a 200 with `{success:false}` must still be treated as a failure). `onError` (network/thrown errors) runs through one shared `handleError`. This means:
- No component ever writes its own try/catch around a mutation.
- No component ever manually calls `toast.success(...)` after a mutation — the factory does it, gated by a `showToast` flag.

**Cache-updater helper library** (small, pure functions, reused everywhere):
```ts
export const appendToArray  = <T>(item: T) => (old: T[]) => [...old, item];
export const prependToArray = <T>(item: T) => (old: T[]) => [item, ...old];
export const replaceInArray = <T extends Identifiable>(item: T) => (old: T[]) => old.map(i => i.id === item.id ? item : i);
export const removeFromArray = <T extends Identifiable>(id: string) => (old: T[]) => old.filter(i => i.id !== id);
// + Paginated equivalents operating on PaginatedResponse<T>.data
```
These are the generic building blocks every resource's `updater`/`optimistic` option is composed from — a new resource never writes its own array-splicing logic.

## 1.11 Schema validation (Zod) — single source of truth per entity

- One file per resource, `schema/<resource>.types.ts`: `export const <Entity>Zod = z.object({...}); export type <Entity> = z.infer<typeof <Entity>Zod>;`. Request schemas (`Create<Entity>RequestZod`), response schemas, and the inferred TS type all live together — the type is *derived from* the schema, never hand-written separately (avoids drift).
- `schema/common.types.ts` holds generic, parameterized envelope schemas reused by every resource:
  ```ts
  export const ApiResponseZod = <T extends z.ZodTypeAny>(data: T) =>
    z.object({ success: z.boolean(), message: z.string(), data: data.optional(), error: z.string().optional() });
  export const PaginatedResponseZod = <T extends z.ZodTypeAny>(item: T) =>
    z.object({ data: z.array(item), total: z.number(), page: z.number(), limit: z.number() });
  ```
- **Enforcement point:** one generic `apiRequest<T>(config, schema)` function is the *only* place network calls happen. It runs `ApiResponseZod(schema).parse(response.data)` on every response — so bad/drifted API responses fail loudly at the network boundary, never silently propagate wrong shapes into components.
- **Forms are a separate concern.** A form's Zod schema (paired with `react-hook-form` + `@hookform/resolvers/zod`) is shaped for the *UI* (may include UI-only sentinel values, split/combined fields) and is translated into the API request shape at submit time. Don't force forms and API requests to share one schema when their natural shapes diverge — but do keep exactly one schema per side (one form schema, one API schema), never duplicate either.

## 1.12 "React modular query" — the query-key registry

One central file, `react-query/query-keys.ts`, exports a single object with one function per resource:
```ts
export const queryKeys = {
  coupons: () => ["coupons"] as const,
  courses: (params?: CourseListParams) => params ? (["courses", params] as const) : (["courses"] as const),
  chapters: (courseId: string) => ["chapters", courseId] as const,
};
```
Every `useQuery`/`useMutation` in the app references `queryKeys.X(...)` — never a hand-written array literal (except for genuinely one-off, deeply-nested sub-resource keys where a registry entry would be overkill). This is what makes cache writes/invalidation reliable: the key used to write and the key used to read are structurally guaranteed to match because they come from the same function.

## 1.13 Optimistic updates

Built into the mutation factory core via one `optimistic` option, with automatic snapshot/rollback:
```ts
onMutate: async (vars) => {
  if (!opts.optimistic) return undefined;
  await queryClient.cancelQueries({ queryKey: opts.queryKey });
  const snapshot = { queryKey: opts.queryKey, data: queryClient.getQueryData(opts.queryKey) };
  applyUpdater(queryClient, opts.queryKey, opts.optimistic(vars));
  return snapshot;
},
onError: (error, _vars, snapshot) => {
  handleError(error);
  if (snapshot) queryClient.setQueryData(snapshot.queryKey, snapshot.data);   // automatic rollback
},
```
Resource hooks opt in with one line (`optimistic: (id) => removeFromPaginated(id)`). For creates where the server assigns the real ID, use a temp-ID reconciliation pattern: insert a `temp-${Date.now()}` row optimistically, then on success find-and-replace the temp row with the server-confirmed one (don't just append — you'd get a duplicate).

## 1.14 Cache overwrite vs. invalidation — decision rule

**Default to direct cache overwrite** (`setQueryData` via `updater`) whenever the mutation response contains the full updated/created entity — this avoids a redundant refetch entirely.

**Fall back to `invalidateQueries`** only when:
- the response doesn't carry the affected row (e.g. an action endpoint that returns `{success:true}` with no body), or
- the affected cache entry can't be located deterministically from the response alone.

**Combine both as a safety net** when a direct write might legitimately no-op (e.g. writing into an array that happens to not be in the cache yet because it's the first item) — do the direct write for the common case, add `invalidateKeys` for the edge case, with a comment explaining why both exist. Don't reach for `invalidateQueries` by default "to be safe" — it costs a network round trip every time; overwrite is strictly cheaper when the data is already in hand.

## 1.15 Pages organization — no page/client split

**Rule:** Next.js `page.tsx` files are client components (`"use client"`) that own data-fetching (`useXQuery`), local UI state, and rendering together — one file per screen, not split into a server `page.tsx` + a `*-client.tsx`. The split adds an indirection layer that pays for itself only when a page genuinely benefits from server rendering (SEO-critical public pages, or pages that must not ship a data-fetching waterfall to the client).

**The one legitimate exception:** a page that is public, doesn't need auth/interactivity on load, and benefits from SSR (e.g. a shareable verification/detail page) — that one page can be a real `async function` Server Component doing a direct server-side `fetch()` + schema `.safeParse()`. Don't generalize this exception into a project-wide split; apply it only where SSR is actually load-bearing.

**Typical page composition:**
```
<PageHeader title actions />
<DataTable columns={getColumns(...)} data={query.data} isLoading={query.isPending} toolbarActions={<Button>New</Button>} />
<ResourceModal ... />              {/* built on FormDialog */}
<ConfirmDeleteDialog ... />
```
driven by one `useCrudDialogState<T>()` call plus the resource's query/mutation hooks. This composition should look almost identical across every CRUD screen in the app — if a new screen's `page.tsx` looks structurally different, that's worth a second look.

## 1.16 Component-tree minimization — the hard rule

**Never create a component that is imported and rendered in exactly one place and adds no behavior of its own** (no new props logic, no conditional rendering, no state) — that's pure indirection and it should be inlined into its single caller.

Before extracting a new component, ask:
1. Will this be used in ≥2 places? → extract, parameterize with props.
2. Is it used once but the surrounding function is genuinely too large/unreadable without splitting? → extract, but keep it in the same file if it's not reused, rather than a new file + import.
3. Otherwise → don't extract. Keep it inline.

This is why CourseHunt's shared layer is a flat `~35`-file `components/` directory of *genuinely reused, prop-driven* components (`DataTable`, `FormDialog`, `StatusBadge`, `RowActions`, `GenericDashboardLayout`, ...) rather than a deep tree of single-use wrapper components. Apply the same discipline in a new project: every file in the shared component layer should be pointable-to from ≥2 call sites, or it doesn't belong there.

---

# Part 2 — Backend (Go / Fiber, generalizes to any typed backend)

## 2.1 Modular structure — layered-by-type, one file per domain per layer

**Rule:** organize by architectural concern first (`routes/`, `controllers/`, `services/`, `repositories/`, `entities/`), and within each concern, one file per domain (`courses.controller.go`, `courses.repository.go`, `courses.entity.go`, ...). This keeps cross-cutting conventions (how every controller validates, how every repository shapes errors) trivially greppable across the whole codebase, at the cost of a domain's logic being spread across several files instead of one folder. (The alternative — vertical per-feature folders each containing their own routes/controllers/repos — is equally valid; pick one per project and apply it consistently. Don't mix both in the same codebase.)

```
cmd/server/main.go                 — entrypoint, wiring only
internal/
  config/                          — env-based config struct, no globals
  database/                        — connection setup
  routes/routes.go                 — single Router struct: constructs every dependency, registers every route
  controllers/<domain>.controller.go
  services/<domain>.service.go     — ONLY for domains with real cross-cutting business logic
  repositories/<domain>.repository[.<subarea>].go
  entities/<domain>.entity.go      — request DTOs + response/DB-row structs
  generic/                         — shared types, sentinel errors, RBAC scope constants
  middlewares/
  pkg/<vendor>/                    — one wrapper package per third-party SDK
  utils/                           — response helpers, validator, pagination params, error handler
```

Use Go's `internal/` (or your language's equivalent module-privacy mechanism) to physically prevent other modules from importing your implementation details.

## 2.2 Routes → Controller → (Service) → Repository → Entities

**Rule: service layer is opt-in, not boilerplate.** Most domains go straight from controller to repository. Add a service layer only when there's real orchestration: pricing computation, multi-step payment flow, cross-repository coordination, anything that isn't "validate, call one query, shape the response."

**Simple domain (no service needed):**
```go
// routes.go
protected.Patch("/courses/:id", middlewares.PermissionGuard(perm.CoursesManage), r.Courses.UpdateController)

// controllers/courses.controller.go
func (ctrl *CoursesController) UpdateController(c *fiber.Ctx) error {
    var req entities.UpdateCourseRequest
    if ok, err := utils.Validate(c, &req); !ok { return err }
    course, cleanup, err := ctrl.Repo.UpdateRepository(c.Params("id"), utils.GetUserID(c), req)
    if err != nil {
        if errors.Is(err, generic.ErrCourseNotFound) { return utils.NotFound(c, "Course not found.", err) }
        if errors.Is(err, generic.ErrAccessDenied)    { return utils.Forbidden(c, "Access denied.", err) }
        return utils.InternalError(c, "Failed to update course.", err)
    }
    // side effects (e.g. orphaned-file cleanup, cache invalidation) live in the controller, not buried in the repo
    return utils.OK(c, "Course updated.", course)
}
```

**Domain with a real service layer (business logic justifies it):**
```go
// controller delegates computation/orchestration to a service
func (ctrl *TransactionsController) CreateController(c *fiber.Ctx) error {
    var req entities.InitiateTransactionRequest
    if ok, err := utils.Validate(c, &req); !ok { return err }
    resp, err := ctrl.Svc.InitiateService(utils.GetUserID(c), req)
    ...
}

// services/transactions.service.go — pricing math, coupon validation, payment-gateway call, then persistence
func (s *TransactionsService) InitiateService(userID string, req entities.InitiateTransactionRequest) (*entities.InitiateTransactionResponse, error) {
    pricing, err := s.Repo.GetCoursePricingRepository(req.CourseID)
    ...
    coupon, err := s.Coupons.ValidateAndFetchCouponService(req.CouponCode, req.CourseID)
    ...
    order, err := s.Gateway.CreateOrder(...)          // via the isolated pkg/ wrapper, §2.10
    ...
    return s.Repo.CreateRepository(userID, req, order)
}
```

**Wiring is manual constructor injection, no DI framework:** one `NewRouter` function builds every repository (injecting shared deps like the DB handle and cache client, and sibling repos where one domain's repo needs another's, e.g. courses needing enrollments), builds every service on top of the repos it needs, then builds every controller on top of its repo/service + config. This stays readable up to dozens of domains; reach for a DI container only if this file becomes unmanageable.

## 2.3 Generic functions — used narrowly and deliberately

Go generics (or your language's generics/templates) are best applied to **response shaping and infrastructure**, not to the domain query layer — hand-written, domain-specific SQL is easier to optimize (see §2.14) than a generic query builder would allow.

```go
// A generic response envelope — the ONE place response shape is defined
type Response[T any] struct {
    Success bool   `json:"success"`
    Message string `json:"message"`
    Data    T      `json:"data,omitempty"`
    Error   string `json:"error,omitempty"`
}
func OK[T any](c *fiber.Ctx, message string, data T) error { return json(c, 200, true, message, data, nil) }

// A generic pagination envelope
type PaginatedResponse[T any] struct {
    Data  T   `json:"data"`
    Total int `json:"total"`
    Page  int `json:"page"`
    Limit int `json:"limit"`
}

// A generic cache accessor
func Get[T any](c *Cache, ctx context.Context, key string, dest *T) (bool, error) { ... }
```

**Explicitly do NOT build a generic `Repository[T]`** that tries to cover every domain's CRUD with reflection/interfaces — it fights against the CTE/JSON-aggregation query style (§2.14), which needs hand-written SQL per domain to minimize round trips. Generics belong at the edges (response/cache/pagination), not in the query layer.

## 2.4 What belongs in `main.go`

**Rule: `main.go` is bootstrap-only — config, connections, app construction, graceful shutdown. All route/middleware registration and dependency wiring is delegated.**

```go
func main() {
    cfg := config.Load()
    db := database.Connect(cfg); defer db.Close()
    rdb := redis.Connect(cfg); defer rdb.Close()
    _ = externalsvc.Setup(cfg)   // non-fatal: log and continue if a non-critical external dep fails

    app := fiber.New(fiber.Config{
        ErrorHandler: utils.GlobalErrorHandler,   // wired at construction time
        BodyLimit:    100 * 1024 * 1024,
    })
    utils.ServeAPIDocs(app)

    router := routes.NewRouter(app, db, rdb, cfg)  // builds every repo/service/controller, registers middleware+routes
    router.SetUp()

    // SIGINT/SIGTERM → app.Shutdown() in a goroutine, then block on app.Listen
    ...
    app.Listen(":" + cfg.Port)
}
```
Anything longer than ~70 lines in `main.go` is a sign that wiring logic leaked out of `routes.NewRouter`.

## 2.5 Global error handling

**Sentinel errors, not custom error types.** Declare plain `errors.New(...)` values per domain, grouped in one `var (...)` block per domain inside a shared `generic`/`errors` package:
```go
var (
    ErrCourseNotFound = errors.New("course not found")
    ErrNotEnrolled    = errors.New("not enrolled in this course")
    ErrAccessDenied   = errors.New("access denied")
)
```
Wrap with context where useful: `fmt.Errorf("initiate transaction: %w", ErrPaymentFailed)` — `errors.Is` still matches through the wrap.

**One global Fiber (or framework) error handler**, registered once at app construction, as the last-resort catch-all (panics recovered by a `recover` middleware, unmatched routes, any handler that returns a bare error):
```go
func GlobalErrorHandler(c *fiber.Ctx, err error) error {
    code := fiber.StatusInternalServerError
    if e, ok := err.(*fiber.Error); ok { code = e.Code }
    c.Locals("handler_error", err)   // so audit-logging middleware can record it
    return json[any](c, code, false, "An unexpected error occurred.", nil, err)
}
```

**Per-handler `errors.Is` chains, not a bespoke error→status dispatcher.** Each controller inline-maps the sentinel errors it can actually receive from its own repository/service call:
```go
if err != nil {
    if errors.Is(err, generic.ErrCourseNotFound) { return utils.NotFound(c, "Course not found.", err) }
    if errors.Is(err, generic.ErrAccessDenied)    { return utils.Forbidden(c, "Access denied.", err) }
    return utils.InternalError(c, "Failed to fetch course.", err)
}
```
**Why not centralize this into one big switch/dispatcher:** a shared error→status mapping table becomes a global god-object that every domain's errors have to route through, and it obscures which errors a given handler can actually produce. A few lines of repeated `errors.Is` per handler is more local, more readable, and easier to modify per-endpoint (e.g. one endpoint might want a 404 for "not found" while another wants a softer 200 with an empty result) — this is a deliberate DRY trade-off in favor of locality.

## 2.6 Request validation

- Library: a struct-tag validator (`go-playground/validator` or equivalent). One shared instance.
- DTOs live in `entities/<domain>.entity.go` with `validate:"..."` tags:
  ```go
  type CreateCourseRequest struct {
      Title       string  `json:"title" validate:"required,min=3,max=200"`
      FinalPrice  float64 `json:"final_price" validate:"omitempty,min=0,ltefield=ActualPrice"`
  }
  ```
- One generic validation helper, called at the top of every write handler:
  ```go
  func Validate(c *fiber.Ctx, dst interface{}) (bool, error) {
      if err := c.BodyParser(dst); err != nil { return false, BadRequest(c, "Invalid request body.", err) }
      if err := validate.Struct(dst); err != nil {
          // format field:tag pairs into one readable message
          return false, UnprocessableEntity(c, "Validation failed.", err)
      }
      return true, nil
  }
  // every write handler: if ok, err := utils.Validate(c, &req); !ok { return err }
  ```
- Validation failures return 422 with a single readable message (or a structured field-array if the frontend needs per-field errors — decide once, apply everywhere).

## 2.7 Response structuring

**One envelope, one set of constructor helpers, used by every handler — no handler calls the framework's raw JSON writer directly.**
```go
type Response[T any] struct {
    Success bool   `json:"success"`
    Message string `json:"message"`
    Data    T      `json:"data,omitempty"`
    Error   string `json:"error,omitempty"`
}
func OK(c, msg, data) error           { ... }
func Created(c, msg, data) error      { ... }
func BadRequest(c, msg, err) error    { ... }
func NotFound(c, msg, err) error      { ... }
func Forbidden(c, msg, err) error     { ... }
func InternalError(c, msg, err) error { ... }
```
Centralizing this is what lets the frontend's `ApiResponseZod` wrapper (§1.12) assume one fixed shape for literally every endpoint.

## 2.8 Pagination response structuring

**One generic pagination envelope, two population strategies depending on access pattern:**
```go
type PaginatedResponse[T any] struct {
    Data  T   `json:"data"`
    Total int `json:"total"`
    Page  int `json:"page"`
    Limit int `json:"limit"`
}
```
- **Offset pagination** (`page`/`limit` query params, clamped server-side) for admin-style tables where jumping to a specific page matters. Fetch `total` and the page's rows in **one query** (see §2.14 Pattern B), not two separate round trips.
- **Cursor pagination** (`after_id`/`before_id`/`limit`) for feed-style, high-churn, append-only lists (notifications, activity logs) where "give me everything newer than X" is the natural access pattern and offset pagination would drift under concurrent inserts.

Pick per-endpoint based on access pattern, not project-wide — but keep exactly these two named strategies rather than inventing a third.

## 2.9 API documentation

Wire up an OpenAPI-spec-driven doc UI (Scalar, Swagger UI, Redoc — any renders a spec file) from day one, even before every route is documented — an empty-but-wired `/docs` route is easy to fill in incrementally; retrofitting docs onto a finished API is not. Prefer annotation-driven generation (e.g. `swaggo`/`swag` for Go) over a hand-maintained JSON spec once the API stabilizes, so the spec can't drift from the actual handlers.

## 2.10 External package isolation

**Rule: every third-party SDK gets its own wrapper package; nothing outside that package imports the vendor SDK's types directly.**
```
internal/pkg/
  redis/    — wraps go-redis, exposes Connect() only
  cache/    — wraps the redis client behind Get/Set/Delete/DeleteByPattern/AcquireLock — THIS is what the rest of the app sees
  storage/  — wraps the object-storage SDK (S3/MinIO) behind GetSignedURL/DeleteObject
  payments/ — wraps the payment gateway (or is hand-written HTTP + signature verification if no good SDK exists)
```
Controllers/services/repositories only ever import `internal/pkg/cache`, never `github.com/redis/go-redis`. This means swapping Redis for another cache backend, or one payment gateway for another, touches one package instead of every call site — and it keeps vendor-specific error types/response shapes from leaking into your domain code.

## 2.11 Middlewares

**Register global middleware in one place, in a fixed, deliberate order:**
```go
app.Use(middlewares.Logger(db))          // 1. audit/access logging — first, so it wraps everything below
app.Use(middlewares.RateLimiter())       // 2. reject abusive traffic before it does real work
app.Use(recover.New())                   // 3. panic recovery — must wrap all handler logic
app.Use(cors.New(corsConfig))            // 4. CORS
```
Then apply **auth and permission middleware per-route-group, not globally** — mount `AuthMiddleware` once on a `/v1` protected group, and layer `PermissionGuard(perm)`/`RoleGuard(role)` on top of individual routes/subgroups within it. Public routes (health check, public listings, webhooks) must be registered on the app/router **before** the protected group is created if your framework uses stack-based route matching (Fiber does) — otherwise a route registered later, even outside the protected group variable, still matches after the auth middleware in the stack.

**Minimum middleware set for a production API:** structured request/audit logging, rate limiting, panic recovery, CORS, auth (token/session verification), and fine-grained permission/role guards per route. Logging middleware should redact sensitive fields (password/secret/token/card fields) from any body it persists, and should write its audit record **asynchronously** (background goroutine / non-blocking) so observability never adds latency to the response path.

## 2.12 Config management

**One `Config` struct, loaded once, explicitly, no global singleton, no `init()` magic:**
```go
type Config struct {
    Port, DatabaseURL string
    RedisHost, RedisPort, RedisPassword string
    // ...
}
func Load() *Config {
    _ = godotenv.Load()   // best-effort local .env
    cfg := &Config{}
    if err := env.Parse(cfg); err != nil { log.Fatalf("config: %v", err) }
    return cfg
}
```
`Load()` is called exactly once in `main.go`; the resulting `*Config` pointer is passed down explicitly through every constructor (`database.Connect(cfg)`, `routes.NewRouter(app, db, rdb, cfg)`, `NewCoursesController(repo, cfg)`, ...). This is deliberate dependency injection over a global config var — it makes every function's config dependency visible in its signature and makes the whole app trivially testable with a fake config. The one acceptable exception to "no globals" is a package-level singleton for a stateless SDK client that genuinely has no per-request state (e.g. an object-storage client) — document that exception explicitly where it lives.

## 2.13 Redis as an isolated external package

Three legitimate roles for Redis in a typical API, all mediated through the one `pkg/cache` wrapper (§2.10), never called directly elsewhere:

1. **Response/query caching** — cache expensive read endpoints with a short TTL, keyed by a composite string encoding all the params that affect the result (`"courses:list:p:%d:l:%d:cat:%s:q:%s"`).
2. **Cache invalidation on write** — one `Invalidate<Domain>` method per domain (pattern-delete on write paths), called from the controller right after a successful create/update/delete.
3. **Auth/session support** — caching verification keys (JWKS) with a tiered lookup (in-process → Redis → live fetch), and short-lived distributed locks (`SETNX` + TTL) for race protection around token rotation or any "only one instance should do this" operation.

**Fail open, not closed:** if Redis is unreachable, log a warning and let the app continue serving requests without caching, rather than failing startup or every request. Every cache method should be nil-safe (no-op / return `false` on a `nil` client) rather than panicking.

## 2.14 DB query structuring — minimize round trips with CTEs + JSON aggregation

**This is the single highest-leverage backend pattern in this template.** Instead of issuing separate queries for "does this exist," "do I have permission," "update it," "fetch related rows for the response," compose all of it into **one parameterized SQL statement** using CTEs and `json_build_object`/`json_agg`/`row_to_json`, then unmarshal the single JSON column into a Go struct.

**Pattern A — nested read in one query** (avoid N+1 by nesting `json_agg` for related collections):
```sql
SELECT json_build_object(
  'id', c.id, 'title', c.title,
  'is_enrolled', EXISTS(SELECT 1 FROM enrollments e WHERE e.course_id = c.id AND e.user_id = $2),
  'chapters', (
    SELECT COALESCE(json_agg(t ORDER BY t.chapter_no), '[]'::json) FROM (
      SELECT ch.id, ch.title,
        (SELECT COALESCE(json_agg(l ORDER BY l.lesson_no), '[]'::json)
         FROM (SELECT id, title FROM lessons WHERE chapter_id = ch.id) l) AS lessons
      FROM chapters ch WHERE ch.course_id = c.id
    ) t
  )
) FROM courses c WHERE c.slug = $1;
```

**Pattern B — paginated list + total count in one round trip:**
```sql
WITH count_cte AS (SELECT COUNT(*) AS total FROM courses WHERE <filters>),
     data_cte  AS (SELECT c.*, json_build_object('id', u.id, 'name', u.name) AS instructor
                    FROM courses c LEFT JOIN users u ON u.id = c.tutor_id
                    WHERE <filters> ORDER BY c.created_at DESC LIMIT $n OFFSET $n)
SELECT COALESCE((SELECT total FROM count_cte), 0) AS total,
       COALESCE((SELECT json_agg(data_cte) FROM data_cte), '[]'::json) AS data;
```

**Pattern C — permission-gated mutation with enough state to distinguish 404 vs 403 vs success, in one query:**
```sql
WITH target AS (SELECT tutor_id FROM courses WHERE id = :id),
     updated AS (UPDATE courses SET title = :title WHERE id = :id AND tutor_id = :user_id RETURNING *)
SELECT (SELECT tutor_id FROM target) AS db_tutor_id,
       (SELECT row_to_json(u) FROM updated u) AS updated_data;
```
```go
switch {
case result.DBTutorID == nil:   return nil, ErrNotFound       // row never existed
case result.UpdatedData == nil: return nil, ErrAccessDenied   // existed, but WHERE tutor_id didn't match
default: return result.UpdatedData, nil                       // success
}
```
The ownership/permission check is baked directly into the `UPDATE ... WHERE` clause — there's no separate "check permission" query before the mutation.

**When to reach for this pattern vs. plain queries:** any endpoint that would otherwise need ≥2 sequential DB round trips where the second depends on the first (existence check → then update; fetch parent → then fetch children in a loop) is a candidate. Don't apply it to genuinely single-table, single-query reads — the added SQL complexity isn't worth it there. This trades query readability for materially fewer round trips and lower latency under load; treat it as the default for write endpoints and nested-read endpoints, and leave flat single-table CRUD as plain queries.

---

# Part 3 — New-project checklist

When scaffolding a new project from this template:

**Frontend**
- [ ] App Router segments organized by audience/role, route groups for shared layouts
- [ ] Three state layers set up: React Query (server), Zustand (global client — start with just an auth/session store), local `useState`/hooks (everything else)
- [ ] `components/ui/` (shadcn) + flat `components/*` (your generic layer) — don't create a component with exactly one call site
- [ ] One generic `DataTable<T>` on TanStack Table before writing any resource-specific table
- [ ] `react-query/` generic layer built first: `client.ts` (axios + interceptors + `apiRequest<T>` schema-validated wrapper), `query.ts` (`useAppQuery`), `mutation.ts` (mutation factory family + cache-updater helpers), `query-keys.ts` (central registry)
- [ ] `schema/` — one Zod file per resource, request+response+type together, before writing the first query hook against that resource
- [ ] Decide once: cache-overwrite-by-default, invalidate only when the response lacks the updated row
- [ ] `page.tsx` files are client components, no server/client split unless a specific page needs SSR

**Backend**
- [ ] Pick layered-by-type or per-feature-vertical folder structure — once, consistently
- [ ] Service layer only where real orchestration logic exists; everything else controller → repository
- [ ] Generic response envelope + pagination envelope + validation helper written before the first domain
- [ ] Sentinel errors per domain in one shared package; `errors.Is` chains inline per handler
- [ ] One `pkg/<vendor>/` wrapper per third-party SDK from the start — never import a vendor SDK type outside its wrapper
- [ ] Middleware order decided once: logger → rate limiter → recover → CORS → (per-group) auth → permission guards
- [ ] Config as one explicitly-loaded, explicitly-passed struct — no global config var
- [ ] Redis wrapped behind one cache package; fail-open on connection failure
- [ ] For every write endpoint and every nested/paginated read: ask "can this be one query with a CTE instead of N queries?" before writing the naive version

---

*This document should be updated whenever a pattern in the reference codebase changes meaningfully — treat it as a living template, not a snapshot.*
