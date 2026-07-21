# Admin Application — Implementation Plan

## Overview

Create a new Next.js application `apps/admin` for platform administrators. This replaces the deprecated `adminpanel` module in `apps/web` and adds extensive new system management capabilities.

---

## Phase 1: Scaffold + Removal

### 1.1 Deprecated adminpanel cleanup (web app)

| Action | Details |
|---|---|
| Delete `apps/web/src/app/adminpanel/` | 22 files across 7 subdirectories |
| Update `apps/web/src/proxy.ts:4` | Remove `"/adminpanel"` from `protectedRoutes` |
| Update `package/components/header.tsx:74` | Remove admin link (re-add pointing to new admin app) |

### 1.2 Create `apps/admin` application

Initialize matching the exact structure of `apps/tutor/`:

| Artifact | Source | Notes |
|---|---|---|
| `package.json` | Copy from `apps/tutor/` | Rename to `@coursehunt/admin`, port `3002` |
| `tsconfig.json` | Copy from `apps/tutor/` | Identical path mappings |
| `next.config.ts` | Copy from `apps/tutor/` | — |
| `postcss.config.mjs` | Copy from `apps/tutor/` | — |
| `tailwind.config.ts` | Copy from `apps/tutor/` | — |
| Root `layout.tsx` | Copy from `apps/tutor/` | Provider chain: QueryProvider → SessionProvider → ThemeProvider |
| `api/auth/[...all]/route.ts` | Copy from `apps/tutor/` | Better-auth API handler |
| `stores/session-store.ts` | Copy from `apps/tutor/` | Zustand session store |
| `components/session-provider.tsx` | Copy from `apps/tutor/` | Session hydration provider |
| `components/app-sidebar.tsx` | Copy from `apps/tutor/` | Generic sidebar (navigation built dynamically) |
| `proxy.ts` | Copy from `apps/tutor/` | Protected routes: all except auth pages |
| `public/` directory | Create empty | — |

The pnpm workspace (`apps/*`) auto-includes it. Run `pnpm install`.

---

## Phase 2: Core Layout Structure

### 2.1 Route Groups

```
apps/admin/src/app/
├── layout.tsx                              # Root: QueryProvider → SessionProvider → ThemeProvider
├── (dashboard)/                            # Authenticated route group (sidebar layout)
│   ├── layout.tsx                          # SidebarProvider + AppSidebar + main
│   ├── page.tsx                            # Dashboard home (/)
│   ├── users/
│   │   └── page.tsx
│   ├── tutors/
│   │   └── page.tsx
│   ├── courses/
│   │   ├── page.tsx
│   │   ├── overview/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── edit/
│   │       └── [id]/
│   │           ├── page.tsx
│   │           ├── basic-step.tsx
│   │           ├── details-step.tsx
│   │           ├── chapter-lesson-step.tsx
│   │           ├── faq-step.tsx
│   │           ├── resources-step.tsx
│   │           └── settings-step.tsx
│   ├── categories/
│   │   └── page.tsx
│   ├── transactions/
│   │   └── page.tsx
│   ├── coupons/
│   │   ├── page.tsx
│   │   ├── coupon-layout.tsx
│   │   ├── coupon-card.tsx
│   │   ├── coupon-form.tsx
│   │   └── coupon-modal.tsx
│   ├── feedback/
│   │   └── page.tsx
│   ├── updates/
│   │   └── page.tsx
│   ├── roles/
│   │   └── page.tsx
│   ├── security/
│   │   └── page.tsx
│   ├── monitoring/
│   │   └── page.tsx
│   ├── system-config/
│   │   └── page.tsx
│   ├── logs/
│   │   └── page.tsx
│   └── maintenance/
│       └── page.tsx
├── auth/
│   ├── login/
│   │   └── page.tsx
│   └── waiting/
│       └── page.tsx
├── not-found.tsx
└── api/
    └── auth/
        └── [...all]/
            └── route.ts
```

### 2.2 Sidebar Navigation

Built dynamically in `(dashboard)/layout.tsx` based on user role, grouped into sections:

**Main Navigation:**
| Page | Route | Icon | Description |
|---|---|---|---|
| Dashboard | `/` | `IconLayoutDashboard` | Overview stats & charts |
| Users | `/users` | `IconUsers` | Manage all users, ban/unban |
| Tutors | `/tutors` | `IconChalkboardTeacher` | Tutor approvals & management |

**Content Management:**
| Page | Route | Icon | Description |
|---|---|---|---|
| Courses | `/courses` | `IconBook` | Course list, analytics, editing |
| Categories | `/categories` | `IconCategory` | Create/edit categories & subcategories |
| Feedback | `/feedback` | `IconStar` | Manage reviews & ratings |

**Commerce:**
| Page | Route | Icon | Description |
|---|---|---|---|
| Transactions | `/transactions` | `IconReceipt` | All payments, refunds |
| Coupons | `/coupons` | `IconTicket` | Discount coupon management |
| Updates | `/updates` | `IconBroadcast` | Platform announcements |

**System:**
| Page | Route | Icon | Description |
|---|---|---|---|
| Roles & Permissions | `/roles` | `IconShield` | Create/assign/revoke roles |
| Security | `/security` | `IconLock` | Security monitoring, access logs |
| Monitoring | `/monitoring` | `IconActivity` | Resources, performance, DB health |
| Logs | `/logs` | `IconFileText` | Error logs, service logs |
| System Config | `/system-config` | `IconSettings` | Service toggles, config |
| Maintenance | `/maintenance` | `IconTool` | Maintenance mode, schedules |

---

## Phase 3: Pages & Components

### 3.1 Dashboard — `/ (dashboard)/page.tsx` **[API READY]**

- **Stat cards:** Total Users, Total Tutors, Total Courses, Total Revenue, Active Enrollments
- **Charts:** User growth line chart, Revenue bar chart (daily/weekly/monthly)
- **Recent activity:** Latest transactions, new users, new enrollments
- **Quick actions:** Create course, create coupon
- **API:** `useAdminDashboardQuery` from `@package/query-hooks/dashboard.api`

### 3.2 Users — `/users/page.tsx` **[API READY]**

- **DataTable** with: Avatar, Name, Email, Role badges (Admin/Tutor/Student), Status (Active/Banned), Joined date, Enrolled count
- **Search** by name/email via `useDebounce`
- **Action dropdown per row:** Ban/Unban user, Revoke access, Change role
- **Bulk actions:** Multi-select → Ban/Unban, Assign role
- **API:** `useUsersQuery` from `@package/query-hooks/users.api`

### 3.3 Tutors — `/tutors/page.tsx` **[PARTIAL API]**

- **Two tabs:** "All Tutors" | "Pending Approvals"
- **Tutor table:** Name, Email, Courses count, Students count, Rating, Status (Active/Pending/Rejected)
- **Actions per row:** Approve tutor role, Reject (with reason dialog), Revoke tutor access, View tutor's courses
- **Pending tab badge** shows count of unapproved tutors
- **Empty states:** "No tutors found" / "No pending tutor applications"
- **API:** `useUsersQuery` with role filter + existing role management

### 3.4 Courses — `/courses/page.tsx`, sub-routes **[API READY]**

#### `/courses` — Course grid
- Responsive grid of `CourseCard` components
- Each card: Title, Instructor, Category, Price, Status badge (Published/Draft/Archived), Enrolled count, Revenue
- **Actions per card:** Edit → `/courses/edit/{id}`, View Analytics → `/courses/overview/{id}`, Delete (with confirmation)
- **Top bar:** "Create Course" button (dialog with title input)
- **Search/filter:** By title, status, category
- **API:** `useManageCoursesQuery`, `useDeleteCourseMutation`, `useCreateCourseMutation` from `@package/query-hooks/courses.api`

#### `/courses/overview/[id]` — Course analytics **[STATIC DEMO DATA]**
- Course header: Title, Instructor, Status badge
- **Stat cards:** Total Enrolled, Total Revenue, Average Rating, Completion Rate
- **Tabbed charts:**
  - Daily Revenue (BarChart)
  - Monthly Revenue (BarChart)
  - Yearly Revenue (BarChart)
  - Enrollment Trend (LineChart)
- Uses recharts; currently hardcoded demo data

#### `/courses/edit/[id]` — Multi-step course editor **[MIGRATE FROM OLD ADMINPANEL]**

Six-step wizard with Previous/Next navigation:
1. **Basic Step** — Title, Category, Description, Language, Level, Image
2. **Details Step** — Long description, What you'll learn, Requirements
3. **Chapters & Lessons** — Accordion chapter editor with lesson types (Video/Reading)
4. **FAQ Step** — Dynamic Q&A list
5. **Resources Step** — Title + file upload per resource
6. **Settings Step** — Publish/Unpublish toggle

**API:** `useCourseLandingQuery`, `useUpdateCourseMutation`, `useCategoriesQuery`

### 3.5 Categories — `/categories/page.tsx` **[PARTIAL API]**

Two-column split layout:
- **Left panel (60%):** Category tree view
- **Right panel (40%):** Create/Edit form

**Category tree:**
```
📁 Development (12 courses)
  📁 Web Development (8 courses)
  📁 Mobile Development (4 courses)
📁 Design (6 courses)
  📁 UI/UX Design (3 courses)
  📁 Graphic Design (3 courses)
```
- Each item: Name, course count badge, expand/collapse children
- Hover reveals: Edit icon, Delete icon
- Visual hierarchy with indentation

**Create/Edit form:**
- Name (required), Slug (auto-generated, editable)
- Parent Category select ("None" for top-level)
- Description (optional textarea)
- Image URL (optional)
- Save / Cancel buttons

**Delete dialog:** Warning with course/subcategory dependency info

**Search/filter:** Search by name

**API:** `useCategoriesQuery` exists; may need new hooks for create/update/delete

### 3.6 Transactions — `/transactions/page.tsx` **[API READY]**

- **Stat cards:** Total Net Revenue, Total Refunded Amount, Refund Requests Processed
- **DataTable:** Transaction ID, Date, Course, User, Amount (₹), Status (confirmed/refunded/pending with color-coded badges), Actions (Invoice download)
- **API:** `useTransactionsQuery` from `@package/query-hooks/transactions.api`

### 3.7 Coupons — `/coupons/page.tsx` **[API READY] [MIGRATE FROM OLD ADMINPANEL]**

- **Coupon grid:** Card per coupon with: Code (monospace), Discount %, Expiry date, Usage progress bar, Status badge (Active/Inactive/Expired)
- **Actions per card:** Edit, Toggle Active/Inactive, Delete
- **Create button** → Modal with CouponForm
- **Empty state:** "No coupons available. Create a new coupon."

**CouponForm fields:** Code, Discount %, Expiry Date, Current Usage (read-only), Max Usage, Active toggle
**Validation:** Code required (min 3 chars), Expiry required, Discount 1-100, Max usage > 0

**API:** `useCouponsQuery`, `useCreateCouponMutation`, `useUpdateCouponMutation`, `useDeleteCouponMutation`

### 3.8 Feedback — `/feedback/page.tsx` **[API READY] [MIGRATE FROM OLD ADMINPANEL]**

- **Feedback cards:** User avatar + name, Rating stars, Course title, Date, Content
- **Actions:** Pin/Unpin feedback (toggle), Delete feedback (with confirmation)
- **Star rating** rendered dynamically
- **Empty state:** "No feedback yet"
- **API:** `useInspectFeedbacksQuery`, `useUpdateFeedbackMutation`, `useDeleteFeedbackMutation`

### 3.9 Updates — `/updates/page.tsx` **[API READY] [MIGRATE FROM OLD ADMINPANEL]**

- **DataTable:** Announcement Date, Title, Description, Actions (Edit, Delete)
- **Create/Edit dialog:** Title, Announcement Date (date picker), Description (textarea)
- **Empty state:** "No updates yet"
- **API:** `useUpdatesQuery`, `useCreateUpdateMutation`, `useUpdateUpdateMutation`, `useDeleteUpdateMutation`

### 3.10 Roles & Permissions — `/roles/page.tsx` **[NEW - PLACEHOLDER UI]**

- **Role list table:** Role name, Description, Users count, Actions
- **Create role dialog:** Name, Description inputs
- **Role detail panel** (shown on role click):
  - Users assigned to this role
  - Permissions grid (checkboxes grouped by category)
  - "Assign to User" form: search user → select → assign
  - "Revoke from User" per user in assigned list
- **Delete role:** Confirmation dialog
- **API:** New endpoints needed for role CRUD and permission management

### 3.11 Security — `/security/page.tsx` **[NEW - PLACEHOLDER UI]**

- **Overview stat cards:**
  - Active sessions
  - Failed login attempts (24h)
  - Banned users
  - Suspicious activity alerts
- **Access logs table:** Timestamp, User, Action (login/logout/failed/role change), IP, Status
- **Recently banned users section**
- **API:** New endpoints needed

### 3.12 Monitoring — `/monitoring/page.tsx` **[NEW - PLACEHOLDER UI]**

- **Resource gauges:** CPU, Memory, Disk usage (progress bars)
- **Database metrics:** Active connections, Query latency
- **Service health cards** per service:
  - API (Go backend) — Status dot, Response time, Last checked
  - Web app — Status, Uptime
  - Tutor app — Status
  - Database — Connection pool, Query latency
  - Image CDN, Payment gateway — Status
- **Performance charts:** Response time history, Request rate
- **API:** New endpoints needed

### 3.13 Logs — `/logs/page.tsx` **[NEW - PLACEHOLDER UI]**

- **Tabbed interface:** Application Logs | Error Logs | API Access Logs | Auth Logs
- **Log viewer table:** Timestamp, Level (INFO/WARN/ERROR with colored badges), Source, Message, Details (expandable row)
- **Filters:** Severity pills, Date range picker, Search input
- **Actions:** Export CSV, Clear logs (with confirmation)
- **Empty state:** "No logs to display"
- **API:** New endpoints needed

### 3.14 System Config — `/system-config/page.tsx` **[NEW - PLACEHOLDER UI]**

- **Service toggle cards (Switch per service):**
  - User Registration, Course Creation, Payment Processing
  - Feedback System, Discussion System, Google OAuth
- **Platform settings:** Site name, Description, Contact email, Support email
- **Payment settings:** Currency, Tax rate, Min/Max price
- **Session settings:** Timeout duration
- **Rate limiting settings**
- **API:** New endpoints needed

### 3.15 Maintenance — `/maintenance/page.tsx` **[NEW - PLACEHOLDER UI]**

- **Current status banner:** All services operational / maintenance active
- **Global maintenance toggle:** Big switch with confirmation dialog explaining impact
- **Selective maintenance:** Per-service toggles (Web, Tutor, API, Payments, Database)
- **Schedule maintenance form:** Service selection, Start date/time, End date/time, Reason/message
- **Scheduled maintenance table:** Date range, Services, Reason, Status (Upcoming/Active/Completed), Actions (Cancel, Edit)
- **Maintenance banner preview:** What users will see
- **API:** New endpoints needed

---

## Phase 4: Cross-Cutting Work

### 4.1 Update references after removal from web app

| File | Change |
|---|---|
| `apps/web/src/proxy.ts` | Remove `"/adminpanel"` from `protectedRoutes` |
| `package/components/header.tsx` | Replace admin link from `/adminpanel` → `http://localhost:3002` |

### 4.2 Admin app proxy/middleware (`apps/admin/src/proxy.ts`)

- `protectedRoutes: ["/"]` (protect all except auth pages)
- Same JWT decoding logic as web/tutor
- Non-admin role → redirect to `/auth/waiting`
- Banned users → redirect to `/restricted` (or admin version)

### 4.3 Shared components (all from `@package/`)

```
@package/components: breadcrumb, confirm-delete-dialog, course-card, data-table,
                     file-upload, icon, loading, loading-button, theme-provider,
                     query-provider

@package/ui:       accordion, avatar, badge, breadcrumb, button, card, chart,
                   collapsible, dialog, dropdown-menu, input, label, progress,
                   radio-group, select, separator, sheet, sidebar, skeleton,
                   switch, table, tabs, textarea, tooltip

@package/hooks:    use-debounce, use-mobile
@package/lib:      utils
@package/styles:   globals.css
```

### 4.4 Query hooks and schemas (from `@package/`)

All existing hooks and types are reusable directly. New API hooks needed for:
- Category CRUD (create/update/delete mutations)
- Role & permission management
- Security/logs/monitoring endpoints
- Maintenance mode endpoints
- System configuration endpoints

---

## Phase 5: Implementation Order

| # | Step | Files | Status |
|---|---|---|---|
| 1 | Write plan to context/ | 1 | ✅ |
| 2 | Remove `apps/web/src/app/adminpanel/` + update web proxy + header | 23 del + 2 mod | ⬜ |
| 3 | Scaffold `apps/admin` (configs, layout, stores, providers, proxy) | 12 | ⬜ |
| 4 | Build auth pages (login, waiting) | 2 | ⬜ |
| 5 | Build dashboard layout + sidebar | 3 | ⬜ |
| 6 | Build Dashboard page (stats, charts) | 1 | ⬜ |
| 7 | Build Users page | 1 | ⬜ |
| 8 | Build Tutors page | 1 | ⬜ |
| 9 | Build Courses pages (grid + overview + 6-step editor) | 12 | ⬜ |
| 10 | Build Categories page (tree + form) | 1 | ⬜ |
| 11 | Build Transactions page | 1 | ⬜ |
| 12 | Build Coupons pages (card, form, modal, layout) | 5 | ⬜ |
| 13 | Build Feedback page | 1 | ⬜ |
| 14 | Build Updates page | 1 | ⬜ |
| 15 | Build Roles page [placeholder] | 1 | ⬜ |
| 16 | Build Security page [placeholder] | 1 | ⬜ |
| 17 | Build Monitoring page [placeholder] | 1 | ⬜ |
| 18 | Build Logs page [placeholder] | 1 | ⬜ |
| 19 | Build System Config page [placeholder] | 1 | ⬜ |
| 20 | Build Maintenance page [placeholder] | 1 | ⬜ |
| 21 | Update web header link → new admin app | 1 | ⬜ |
| 22 | Typecheck + build verification | — | ⬜ |
