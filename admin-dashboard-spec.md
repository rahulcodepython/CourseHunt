# CourseHunt Admin Dashboard - Complete Page Specification

## Overview

| Property | Value |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 7 |
| **UI Component Library** | shadcn/ui (powered by @base-ui/react + @radix-ui primitives) |
| **Form Handling** | react-hook-form + zod (planned, currently using plain useState) |
| **Icons** | @tabler/icons-react (via `<Icon name="..." />` wrapper) |
| **Styling** | Tailwind CSS v4 (no config file, `@import "tailwindcss"` in globals.css) |
| **State Management** | Zustand v5 (session), TanStack React Query v5 (server state) |
| **Charts** | Recharts |
| **Validation** | Zod v4 (schemas in `package/schema/`) |
| **HTTP Client** | Axios (with Zod validation on responses) |
| **Authentication** | JWT (cookie-based), middleware proxy |
| **Toasts** | Sonner |
| **Font** | Montserrat (next/font/google) |
| **Admin Port** | 3002 |

---

## Layout Architecture

### Root Layout (`apps/admin/src/app/layout.tsx`)
```
QueryProvider
└── SessionProvider
    └── ThemeProvider (next-themes, class-based)
        └── Toaster (sonner)
            └── {children}
```
- Global CSS imported: `@package/styles/globals.css`
- Montserrat font loaded globally
- `suppressHydrationWarning` on `<html>` for next-themes

### Auth Pages Layout (login, change-password)
- Full-screen centered layout
- No sidebar, no header
- Dark gradient background: `bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950`
- Glowing decorative blobs (`bg-emerald-500/10` / `bg-teal-500/10` with blur + animate-pulse)

### Dashboard Layout (`apps/admin/src/app/(dashboard)/layout.tsx`)
```
SidebarProvider
├── AppSidebar (left, collapsible)
└── <main> (min-h-screen, w-full)
    ├── <header> (fixed top bar)
    │   ├── SidebarTrigger (hamburger toggle)
    │   └── BreadcrumbComponent (auto breadcrumb)
    └── <section class="p-8">
        └── {children} (page content)
```
- Sidebar width controlled by shadcn sidebar
- Max content width depends on children; pages self-contain max-w or fluid layouts
- Header: `flex items-center justify-start gap-4 p-2`

---

## Color Schema & Styling System

### CSS Variables (oklch color space)

| Variable | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` | Page background |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Text color |
| `--primary` | `oklch(0.527 0.154 150.069)` | `oklch(0.448 0.119 151.328)` | Primary accent (green) |
| `--primary-foreground` | `oklch(0.982 0.018 155.826)` | `oklch(0.982 0.018 155.826)` | Text on primary |
| `--secondary` | `oklch(0.967 0.001 286.375)` | `oklch(0.274 0.006 286.033)` | Secondary/surface |
| `--muted` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` | Secondary text |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Error/danger |
| `--border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | Borders |
| `--ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` | Focus rings |
| `--sidebar` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` | Sidebar background |
| `--sidebar-primary` | `oklch(0.627 0.194 149.214)` | `oklch(0.723 0.219 149.579)` | Sidebar accent |
| `--chart-1` through `--chart-5` | Green tones | Green tones | Chart colors |

### Shared Tailwind Patterns

- Page title: `text-2xl font-bold`
- Page subtitle: `text-muted-foreground text-sm`
- Page wrapper: `space-y-6`
- Card grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`
- Two-column grid: `grid grid-cols-1 lg:grid-cols-2 gap-6`
- Stat cards: `flex flex-row items-center justify-between pb-2` header
- Stat values: `text-2xl font-bold`
- Icon color: `text-muted-foreground` inside stat cards
- DataTables: `p-0` on CardContent for edge-to-edge tables
- Search inputs: `pl-10` with absolute-positioned search icon
- Badge variants: `default` (primary), `secondary`, `destructive`, `outline`

### Radius System
```
--radius-sm: calc(0.875rem * 0.6)   // ~8.4px
--radius-md: calc(0.875rem * 0.8)   // ~11.2px
--radius-lg: 0.875rem                // ~14px
--radius-xl: calc(0.875rem * 1.4)   // ~19.6px
--radius-2xl: calc(0.875rem * 1.8)  // ~25.2px
--radius-3xl: calc(0.875rem * 2.2)  // ~30.8px
--radius-4xl: calc(0.875rem * 2.6)  // ~36.4px
```

### Shared Components (from `package/components/`)

| Component | Description |
|---|---|
| `<DataTable>` | Generic table with columns, pagination, loading state |
| `<Icon name="..." />` | Wrapper for Tabler icons |
| `<Loading />` | Full-page spinner |
| `<LoadingButton>` | Button with loading spinner |
| `<BreadcrumbComponent>` | Auto-breadcrumb from path |
| `<ConfirmDeleteDialog>` | Confirmation dialog for deletions |
| `<AppSidebar>` | Reusable sidebar with NavGroups |
| `<SessionProvider>` | Auth session context |
| `<ThemeProvider>` | Dark/light mode provider |
| `<QueryProvider>` | TanStack Query provider |
| `<FileUpload>` | File upload with preview |

### Shared shadcn/ui Components (from `package/ui/`)

`Card`, `Button`, `Input`, `Label`, `Badge`, `Table`, `Dialog`, `Select`, `Switch`, `Tabs`, `Textarea`, `Avatar`, `Separator`, `Progress`, `Skeleton`, `DropdownMenu`, `Breadcrumb`, `Sidebar`, `Sheet`, `Tooltip`, `Collapsible`, `Accordion`, `RadioGroup`, `Sonner` (toast)

---

## Page-by-Page Breakdown

---

### 1. Login Page (`/auth/login`)

**Route:** `apps/admin/src/app/auth/login/page.tsx`

**Description:** Full-screen admin login with email/password and Google SSO button.

**Layout:**
- Full viewport: `min-h-screen w-full flex items-center justify-center`
- Centered card: `w-full max-w-md`
- Decorated background: dark gradient + 2 large animated blurred blobs

**Component Breakdown:**
1. **Decorative background divs** (absolute positioned, animated blurs)
2. **Card** (`Card > CardHeader + CardContent`)
   - `CardHeader`: Title "Admin Portal", subtitle "Sign in to manage the platform"
   - `CardContent`:
     - **Email form** (onSubmit handler)
       - Email Input (type="email", placeholder="admin@example.com", dark styled)
       - Password Input (type="password", dark styled)
       - Submit Button "Sign in with Email" (shows spinner when loading)
     - **Divider** ("Or continue with")
     - **Google SSO Button** (IconBrandGoogle + "Sign in with Google", shows spinner)
     - **Footer divider** ("Admin Access Only")
     - **Footer text** ("Contact super administrator")

**Styling:**
- Auth-specific dark theme: `bg-zinc-800`, `border-zinc-700` on inputs
- Card: `bg-zinc-900/50 backdrop-blur-xl shadow-2xl border-zinc-800`
- Title: `text-white` (always light)
- Decorative blobs: `bg-emerald-500/10 blur-[120px] animate-pulse`
- Hover effect on Google button: `hover:scale-[1.02] active:scale-[0.98]`

**Data:**
- State: `email`, `password` (controlled inputs)
- Mutation: `useLoginWithEmailMutation`, `useLoginWithGoogleMutation`
- Redirect: router.push("/") on success

---

### 2. Change Password Page (`/auth/change-password`)

**Route:** `apps/admin/src/app/auth/change-password/page.tsx`

**Description:** Forces password change on first login (when `passwordChangedAt` is null).

**Layout:** Same auth layout as login - full-screen centered card.

**Component Breakdown:**
1. **Card** (same dark theme as login)
   - `CardHeader`: Title "Change Password", subtitle "You must change your password before continuing"
   - `CardContent`:
     - **Form** (onSubmit handler)
       - Current Password Input
       - New Password Input
       - Confirm Password Input
       - Submit Button "Change Password"

**Styling:** Same auth theme (dark glassmorphism card)

**Data:**
- State: `currentPassword`, `newPassword`, `confirmPassword`
- Validation: passwords must match, min 8 chars
- Mutation: `useChangePasswordMutation`
- Redirect: router.push("/") on success, toast.error on failure

---

### 3. Dashboard Home (`/`)

**Route:** `apps/admin/src/app/(dashboard)/page.tsx`

**Description:** Main analytics overview with key metrics and tables.

**Layout:**
- `space-y-6` wrapper
- Header section (title + subtitle)
- 4 stat cards in responsive grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`
- 2-column section below: `grid grid-cols-1 lg:grid-cols-2 gap-6`

**Component Breakdown:**
1. **Page Header**: "Admin Dashboard" (h1) + subtitle
2. **4 Stat Cards** (shadcn Card):
   - Total Students (IconUsers)
   - Active Courses (IconBook)
   - Total Enrollments (IconShoppingCart)
   - Total Revenue in ₹ (IconCurrencyRupee)
3. **Top Courses Card** (Card > Table):
   - Columns: Course (name), Students (right-aligned), Revenue (right-aligned)
   - Empty state: "No course data yet"
4. **User Growth Card** (Card > Table):
   - Columns: Month, New Users (right-aligned)
   - Empty state: "No growth data yet"

**Styling:**
- Standard card style with icon + value pattern
- Table columns for data presentation
- Revenue displayed with ₹ prefix and `toLocaleString()`

**Data:**
- Query: `useAdminDashboardQuery()` → `AdminDashboard`
- Types: `{ total_users, total_courses, total_enrollments, total_revenue, top_courses: AdminTopCourse[], user_growth: UserGrowth[] }`
- `AdminTopCourse`: `{ title, students, revenue }`
- `UserGrowth`: `{ month, count }`

---

### 4. Profile Page (`/profile`)

**Route:** `apps/admin/src/app/(dashboard)/profile/page.tsx`

**Description:** Edit admin profile with avatar upload and personal info.

**Layout:**
- `max-w-5xl mx-auto space-y-6` centered content
- Two-column on md+: `flex flex-col md:flex-row gap-6`
  - Left: Avatar card (w-80)
  - Right: Edit form (flex-1)

**Component Breakdown:**
1. **Profile Card** (left column):
   - Gradient header (h-24, `bg-linear-to-r from-primary to-primary/60`)
   - Avatar circle (24x24, border-4, clickable for upload)
     - Image or initial letter fallback
     - Upload overlay on hover
   - Hidden file input
   - Name display + Badge (role)
2. **Edit Profile Card** (right column):
   - Header: "Edit Profile" + "Update your admin profile information"
   - Sections:
     - **Basic Information** (IconUser):
       - Display Name (Input)
       - Email Address (Input, disabled, with IconMail)
       - Headline (Input)
       - Website (Input)
       - Biography (Textarea, min-h-[120px])
     - **Action Buttons**:
       - "Update Profile" (green bg, loading button)
       - "Cancel" (outline button)

**Styling:**
- Card gradient header: `bg-linear-to-r from-primary to-primary/60`
- Avatar: `h-24 w-24 rounded-full border-4 border-background`
- Upload overlay: `bg-black/50 opacity-0 group-hover:opacity-100`
- Section header: `flex items-center gap-2 text-primary font-semibold`
- Inputs: `bg-muted/30 focus-visible:ring-primary`
- Save button: `bg-green-600 hover:bg-green-700`

**Data:**
- Session: `useSessionStore` → `{ name, email, image, role }`
- Profile query: `useUserProfileQuery()` → `{ headline, bio, website }`
- Mutations:
  - `useUpdateUserMutation()` (name + image)
  - `useCreateUserProfileMutation()` (headline + bio + website)
  - `useUploadMediaMutation()` (avatar upload via ImageKit)

---

### 5. Users Page (`/users`)

**Route:** `apps/admin/src/app/(dashboard)/users/page.tsx`

**Description:** List all platform users, search, create admin/tutor users.

**Layout:**
- `space-y-6` wrapper
- Single Card with toolbar + DataTable

**Component Breakdown:**
1. **Page Header**: "Users" + subtitle
2. **Card**:
   - `CardHeader` with:
     - Title "All Users ({count})"
     - Toolbar row:
       - Search Input with IconSearch icon (w-64, debounced 300ms)
       - "Create User" Button (opens Dialog)
   - `CardContent` with `p-0`:
     - **DataTable** with 5 columns:
       - "User": Avatar + name
       - "Email": text-muted-foreground
       - "Role": Badge list (admin=default, tutor=secondary, student=outline)
       - "Status": Badge (Active=green, Banned=destructive)
       - "Joined": localized date
3. **Create User Dialog** (Dialog):
   - Name Input
   - Email Input
   - Password Input
   - Role Select (admin/tutor)
   - "Create User" Button (full width)
   - On success: downloads CSV with credentials

**Styling:**
- Search icon: `absolute left-3 top-1/2 -translate-y-1/2`
- Active badge: `bg-green-100 text-green-800 hover:bg-green-100`
- Role badges: flex wrap

**Data:**
- Query: `useUsersQuery()` → `UserListResponse[]`
- Types: `{ id, name, email, image, roles: { id, name }[], banned, createdAt }`
- Mutation: `useCreateUserMutation()`
- Filtering: client-side by name/email with debounce

---

### 6. Admins Page (`/admins`)

**Route:** `apps/admin/src/app/(dashboard)/admins/page.tsx`

**Description:** Manage admin users - view filtered list, assign/revoke custom roles.

**Layout:** Single Card with DataTable + inline assign dialog per row.

**Component Breakdown:**
1. **Page Header**: "Admins" + subtitle
2. **Card**:
   - `CardHeader`: "All Admins ({count})"
   - `CardContent p-0`:
     - **DataTable** with 5 columns:
       - "Name": Avatar + name
       - "Email": muted text
       - "Roles": Badge list
       - "Joined": date
       - "Actions": Button with IconUsers (opens manage dialog)
3. **Manage Roles Dialog** (Dialog per user):
   - Select dropdown for custom roles (non-system roles only)
   - "Assign" button
   - List of current custom roles with revoke (X) button each

**Styling:** Same table/pagination pattern as Users

**Data:**
- Query: `useUsersQuery()` → filter `roles.some(r => r.name === "admin")`
- Types: `UserListResponse` (same as Users)
- Mutations: `useAssignRoleMutation()`, `useRevokeRoleMutation()`
- Roles query: `useRolesQuery()`

---

### 7. Tutors Page (`/tutors`)

**Route:** `apps/admin/src/app/(dashboard)/tutors/page.tsx`

**Description:** Paginated tutor list with stats and manage actions.

**Layout:** Single Card with DataTable.

**Component Breakdown:**
1. **Page Header**: "Tutors" + subtitle
2. **Card**:
   - `CardHeader`: "All Tutors ({total})"
   - `CardContent p-0`:
     - **DataTable** with pagination (10 per page) and 6 columns:
       - "Tutor": name
       - "Email": muted
       - "Headline": truncated max-w-48
       - "Students": count
       - "Rating": star icon + number
       - "Actions": View (eye) + Ban (destructive) buttons

**Styling:** Standard DataTable with pagination

**Data:**
- Query: `useAdminProfilesQuery()` → paginated `AdminProfileItem[]`
- Types: `{ id, name, email, headline, total_students, rating_avg }`

---

### 8. Courses Page (`/courses`)

**Route:** `apps/admin/src/app/(dashboard)/courses/page.tsx`

**Description:** Searchable, filterable course list with action links.

**Layout:**
- `space-y-6`
- Toolbar (above Card)
- Single Card with DataTable

**Component Breakdown:**
1. **Page Header**: "Courses" + subtitle
2. **CoursesToolbar** (separate component):
   - Search Input with IconSearch (flex-1, max-w-xs)
   - Status Select (All/Draft/Published/Archived)
   - Level Select (All/Beginner/Intermediate/Advanced)
3. **Card**:
   - `CardHeader`: "All Courses"
   - `CardContent p-0`:
     - **CoursesTable** (DataTable) with 6 columns:
       - "Course": thumbnail (10x10) + title + lecture count
       - "Status": Badge (published=default, else secondary)
       - "Price": ₹ formatted
       - "Rating": star icon + number
       - "Students": user icon + count
       - "" (actions): Chapters button (IconHierarchy) + Analytics button (IconChartBar)

**Styling:**
- Thumbnail: `w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted`
- Toolbar: `flex flex-col sm:flex-row items-start sm:items-center gap-3`
- Selects: `w-[140px]`

**Data:**
- Query: `useManageCoursesQuery({ page, limit, search, status, level })` → paginated `Course[]`
- Types: `{ id, title, image_url, status, final_price, rating_avg, student_count, total_lectures }`
- Server-side filtering/pagination

---

### 9. Course Overview (Analytics) (`/courses/overview/[id]`)

**Route:** `apps/admin/src/app/(dashboard)/courses/overview/[id]/page.tsx`

**Description:** Per-course analytics with stat cards and Recharts charts.

**Layout:**
- `space-y-6`
- Header with course title + status badge
- 4 stats in responsive grid
- Single Card with tabbed charts

**Component Breakdown:**
1. **Page Header**: Course title + status Badge + instructor name
2. **4 Stat Cards**:
   - Total Enrolled (IconUsers)
   - Total Revenue (IconCurrencyRupee)
   - Average Rating (IconStar)
   - Completion Rate (IconPercentage)
   *(Currently hardcoded demo values)*
3. **Analytics Card**:
   - "Analytics" title
   - **Tabs** (Daily / Monthly / Enrollment):
     - Daily: BarChart (revenue by day of week, Mon-Sun)
     - Monthly: BarChart (revenue by month, Jan-Jun)
     - Enrollment: LineChart (enrollments by month)

**Styling:**
- Charts: `ResponsiveContainer width="100%" height={300}`
- Bars: `fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}`
- Lines: `stroke="hsl(var(--primary))" strokeWidth={2}`

**Data:**
- Query: `useCourseLandingQuery(courseId)` → Course
- Charts: **hardcoded demo data** (`dailyRevenue`, `monthlyRevenue`)
- Stats: **hardcoded demo values** ("142", "₹1,85,000", "4.6", "68%")
- Course info from API: `{ title, instructor, status }`

---

### 10. Course Chapters (`/courses/[courseId]/chapters`)

**Route:** `apps/admin/src/app/(dashboard)/courses/[courseId]/chapters/page.tsx`

**Description:** View chapters and their lessons for a specific course.

**Layout:**
- `space-y-6`
- Back to Courses link
- Vertical stack of chapter cards (accordion-style)

**Component Breakdown:**
1. **Page Header**: "Back to Courses" link (IconArrowLeft) + "Course Chapters" + subtitle
2. **Chapter Cards** (vertical list, `space-y-4`):
   - Each `ChapterCard`:
     - Chapter number in circle (primary/10 bg)
     - Title + lesson count
     - "Show Lessons" / "Hide Lessons" toggle button
     - Expanded: shows `LessonsTable` in bordered background
3. **Empty State** (when no chapters): dashed border, IconHierarchy, "No chapters yet."

**Styling:**
- Chapter number circle: `w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary`
- Expandable content: `border-t bg-muted/5`
- Empty state: `border-2 border-dashed rounded-xl`

**LessonsTable (nested component):**
- Each lesson row: `rounded-lg bg-background border`
  - Lesson number in muted box
  - Title + type badge (video=blue, document=green, amber for other)
  - Short description (line-clamp-1)
  - "Discussions" button (links to `/discussions/{lessonId}`)
- Empty state: dashed border, "No lessons in this chapter."

**Data:**
- Query: `useChaptersQuery(courseId)` → `Chapter[]`
- Nested query: `useLessonsQuery(chapterId)` → `Lesson[]`
- Types: `Chapter{ id, chapter_no, title, total_lectures }`, `Lesson{ id, lesson_no, title, lesson_type, short_description }`

---

### 11. Categories Page (`/categories`)

**Route:** `apps/admin/src/app/(dashboard)/categories/page.tsx`

**Description:** CRUD for course categories with tree view and quick stats.

**Layout:**
- `space-y-6`
- Header with title + "Create Category" button
- Two-column grid: `grid grid-cols-1 lg:grid-cols-5 gap-6`
  - Left: category tree (col-span-3)
  - Right: quick stats (col-span-2)

**Component Breakdown:**
1. **Page Header**: "Categories" + "Create Category" button
2. **Tree Card** (col-span-3):
   - Header: "All Categories ({count})" + Search Input (w-48)
   - Category list as a tree:
     - **CategoryTreeItem** (recursive):
       - Expand/collapse button (if has children)
       - IconFolder icon
       - Name
       - Course count badge
       - Edit pencil (visible on hover)
       - Delete trash (visible on hover, destructive color)
       - Children recursively rendered with increased depth padding
   - Empty state: IconFolder icon + "No categories yet..."
3. **Stats Card** (col-span-2):
   - "Quick Stats" title
   - Row: Total Categories
   - Row: Top-Level count
   - Row: Subcategories count
4. **Create/Edit Dialog** (Dialog):
   - Name Input
   - Parent Category Select (when creating)
   - Save + Cancel buttons
5. **Delete Confirmation** (ConfirmDeleteDialog)

**Styling:**
- Tree items: `py-2 px-2 rounded-lg hover:bg-muted/50 group cursor-pointer`
- Indentation: `style={{ paddingLeft: depth * 20 + 8 }}`
- Hover actions: `opacity-0 group-hover:opacity-100`
- Stats: `flex justify-between text-sm`

**Data:**
- Query: `useCategoriesQuery()` → flat `Category[]` (parent_id for hierarchy)
- Mutations: `useCreateCategoryMutation()`, `useUpdateCategoryMutation()`, `useDeleteCategoryMutation()`
- Types: `Category{ id, name, parent_id, course_count, ... }`
- Client-side tree building: filter root categories, getChildren by parent_id

---

### 12. Transactions Page (`/transactions`)

**Route:** `apps/admin/src/app/(dashboard)/transactions/page.tsx`

**Description:** Revenue overview and full transaction history.

**Layout:**
- `space-y-6`
- 3 stat cards in grid: `grid grid-cols-1 md:grid-cols-3 gap-4`
- Single Card with DataTable

**Component Breakdown:**
1. **Page Header**: "Transactions" + subtitle
2. **3 Stat Cards**:
   - Total Net Revenue (green, IconCurrencyRupee): sum of confirmed amounts
   - Total Refunded (red, IconArrowBackUp): sum of refunded amounts
   - Refund Requests (IconReceiptRefund): count of refunded transactions
3. **DataTable Card**:
   - Header: "Transaction History"
   - 6 columns:
     - "Transaction ID": truncated, font-mono
     - "Date": localized
     - "User": user name
     - "Course": course title or "—"
     - "Amount": ₹ with locale
     - "Status": Badge (confirmed=green, refunded=destructive, else outline)

**Styling:**
- Revenue: `text-green-600`
- Refunded: `text-red-600`
- Confirmed badge: `bg-green-100 text-green-800`
- Transaction ID: `font-mono text-xs`

**Data:**
- Query: `useTransactionsQuery()` → `Transaction[]`
- Types: `{ id, created_at, amount, status, user: { name }, course: { title } }`
- Client-side computation: totalRevenue, totalRefunds, refundsCount

---

### 13. Coupons Page (`/coupons`)

**Route:** `apps/admin/src/app/(dashboard)/coupons/page.tsx`

**Description:** CRUD discount coupons with toggle active/inactive.

**Layout:**
- `space-y-6`
- Header with "Create Coupon" button
- Card with Table

**Component Breakdown:**
1. **Page Header**: "Coupons" + subtitle + "Create Coupon" button
2. **Coupon Table Card**:
   - Header: "All Coupons"
   - Table with 6 columns:
     - "Code": font-mono bold tracking-wider
     - "Discount": primary color, "X% OFF"
     - "Usage": `usage_count / max_usage` or `∞`
     - "Expires": date or "—" (red if expired)
     - "Status": Badge (Expired=destructive, Active=green, Inactive=outline)
     - "Actions": Edit (pencil) + Toggle active (play/pause) + Delete (trash)
   - Empty state: IconTicket + "No coupons available..."
3. **CouponModal** (Dialog wrapper):
   - **CouponForm**:
     - Coupon Code Input (auto-uppercase, font-mono)
     - Discount % Input (number, 1-100)
     - Expiry Date Input (type="date")
     - Current Usage Input (disabled, edit mode only)
     - Max Usage Input (number)
     - Active Switch toggle
     - Submit Button ("Create Coupon" / "Save Changes")
4. **Delete Confirmation** (ConfirmDeleteDialog)

**Styling:**
- Coupon code: `font-mono font-bold text-sm tracking-wider`
- Discount %: `text-primary font-semibold`
- Expired text: `text-destructive`
- Active badge: `bg-green-100 text-green-800`

**Data:**
- Query: `useCouponsQuery()` → `Coupon[]`
- Types: `{ id, code, discount_percent, expires_at, max_usage, usage_count, is_active }`
- Mutations: `useCreateCouponMutation()`, `useUpdateCouponMutation()`, `useDeleteCouponMutation()`

---

### 14. Feedback Page (`/feedback`)

**Route:** `apps/admin/src/app/(dashboard)/feedback/page.tsx`

**Description:** Manage course reviews with pin/unpin and delete.

**Layout:** Single Card with DataTable + pagination (10 per page).

**Component Breakdown:**
1. **Page Header**: "Feedback" + subtitle
2. **DataTable Card**:
   - Header: "All Feedback ({total})"
   - 7 columns:
     - "User": name
     - "Course": title or "Unknown"
     - "Rating": 5 star icons (yellow filled based on rating)
     - "Comment": line-clamp-2, max-w-62.5
     - "Status": Badge (Pinned=blue, Normal=outline)
     - "Date": localized
     - "Actions": Pin toggle (IconPin, rotates if pinned) + Delete (trash)
3. **Delete Confirmation** (ConfirmDeleteDialog)

**Styling:**
- Filled star: `text-yellow-500 fill-yellow-500`
- Empty star: `text-muted-foreground/30`
- Pinned: `bg-blue-500` badge
- Pin icon: `rotate-45 text-primary` when pinned
- Comment: `line-clamp-2 max-w-62.5`

**Data:**
- Query: `useFeedbacksQuery()` → paginated `Feedback[]`
- Types: `{ id, user: { name }, course: { title }, rating, content, is_pinned, created_at }`
- Mutations: `useUpdateFeedbackMutation()` (for pin), `useDeleteFeedbackMutation()`

---

### 15. Discussions Page (`/discussions/[lesson_id]`)

**Route:** `apps/admin/src/app/(dashboard)/discussions/[lesson_id]/page.tsx`

**Description:** Per-lesson discussion viewer with delete capability.

**Layout:** Single Card with DataTable + pagination (20 per page).

**Component Breakdown:**
1. **Page Header**:
   - "Back to Courses" link (IconArrowLeft)
   - "Lesson Discussions" + truncated lesson ID
2. **DataTable Card**:
   - Header: "All Discussions ({total})"
   - 5 columns:
     - "User": Avatar + name
     - "Content": truncated max-w-md, muted
     - "Replies": count badge
     - "Date": localized
     - "" (actions): Delete button (destructive ghost)
3. **Delete Confirmation** (ConfirmDeleteDialog)

**Data:**
- Query: `useDiscussionsQuery(lessonId, page, limit)` → paginated `Discussion[]`
- Types: `{ id, content, user: { name, image }, reply_count, created_at }`
- Mutation: `useDeleteDiscussionMutation()`

---

### 16. Roles & Permissions Page (`/roles`)

**Route:** `apps/admin/src/app/(dashboard)/roles/page.tsx`

**Description:** RBAC management - CRUD roles, assign permissions via toggle grid.

**Layout:**
- `space-y-6`
- Header with "Create Role" button
- Single Card with expandable Table rows

**Component Breakdown:**
1. **Page Header**: "Roles & Permissions" + "Create Role" button (opens Dialog)
2. **Create Role Dialog**:
   - Role Name Input (placeholder: "e.g. moderator")
   - Description Input
   - "Create Role" button
3. **Roles Table Card**:
   - Header: "All Roles"
   - Table with 4 columns:
     - "Role": Badge with font-mono
     - "Description": muted or "-"
     - "System": Badge (IconLock + "System") or "Custom"
     - "Actions": Shield icon (expand permissions) + Delete (only for non-system roles)
   - Expandable row (when Shield clicked):
     - Permissions grid: `grid grid-cols-2 md:grid-cols-3 gap-2`
     - Each permission is a toggle button:
       - Selected: `bg-primary/10 border-primary text-primary`
       - Unselected: `border-border hover:border-muted-foreground`
     - "Save Permissions" button

**Styling:**
- Permission buttons: `flex items-center gap-2 text-sm px-2 py-1 rounded border cursor-pointer transition-colors`
- System badge: `text-muted-foreground` with IconLock
- Expanded row: `bg-muted/50`

**Data:**
- Queries: `useRolesQuery()` → `Role[]`, `usePermissionsQuery()` → `Permission[]`, `useRolePermissionsQuery(roleId)`
- Mutations: `useCreateRoleMutation()`, `useUpdateRoleMutation()`, `useDeleteRoleMutation()`, `useUpdateRolePermissionsMutation()`
- Types: `Role{ id, name, description, is_system }`, `Permission{ id, name }`

---

### 17. Security Page (`/security`)

**Route:** `apps/admin/src/app/(dashboard)/security/page.tsx`

**Description:** Platform security monitoring with access logs.

**Layout:**
- `space-y-6`
- 4 stat cards: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`
- Card with Table

**Component Breakdown:**
1. **Page Header**: "Security" + subtitle
2. **4 Stat Cards** (hardcoded demo data):
   - Active Sessions: 47
   - Failed Logins (24h): 12
   - Banned Users: 5
   - Security Alerts: 2
3. **Access Logs Table Card**:
   - Header: "Recent Access Logs"
   - Table with 5 columns:
     - Time, User (font-mono), Action, IP Address (font-mono), Status (Badge)
   - Hardcoded demo rows (4 entries)

**Styling:** Standard table patterns

**Data:** All **hardcoded demo data** - no API queries

---

### 18. Monitoring Page (`/monitoring`)

**Route:** `apps/admin/src/app/(dashboard)/monitoring/page.tsx`

**Description:** System health monitoring with resource usage and service status.

**Layout:**
- `space-y-6`
- 3 resource cards: `grid grid-cols-1 md:grid-cols-3 gap-4`
- Card with service health list

**Component Breakdown:**
1. **Page Header**: "Monitoring" + subtitle
2. **3 Resource Cards**:
   - CPU Usage: 42% (Progress bar)
   - Memory Usage: 68% (Progress bar)
   - Disk Usage: 55% (Progress bar)
3. **Service Health Card**:
   - Header: "Service Health"
   - List of 6 services:
     - Green/red dot indicator
     - Service name + uptime
     - Response time + Operational/Down badge
   - Hardcoded services: API, Web, Tutor, Database, Image CDN, Payment Gateway

**Styling:**
- Status dot: `h-2.5 w-2.5 rounded-full bg-green-500` / `bg-red-500`
- Service row: `flex items-center justify-between p-3 rounded-lg border`
- Operational badge: `bg-green-100 text-green-800`

**Data:** All **hardcoded demo data** - no API queries

---

### 19. Logs Page (`/logs`)

**Route:** `apps/admin/src/app/(dashboard)/logs/page.tsx`

**Description:** Tabbed log viewer with search and CSV export.

**Layout:**
- `space-y-6`
- Header with "Export CSV" button
- Tabs component with 4 tab panels

**Component Breakdown:**
1. **Page Header**: "Logs" + "Export CSV" button
2. **Tabs** (Tabs component):
   - Tab list: Application / Errors / API Access / Auth
   - **Application Tab** (active by default):
     - Card with searchable table:
       - Search Input (w-64)
       - 5 columns: Timestamp (mono), Level (Badge: INFO=blue, WARN=yellow, ERROR=destructive), Source (mono), Message, Details
       - 5 hardcoded demo rows
   - **Errors Tab**: Empty state with IconCheck + "No error logs to display"
   - **API Access Tab**: Empty state with IconFileText + "Access logs will appear here"
   - **Auth Tab**: Empty state with IconFileText + "Auth logs will appear here"

**Styling:**
- Level badges: INFO=blue, WARN=yellow (custom classes), ERROR=destructive
- Timestamp/Source: `font-mono text-xs`

**Data:** Application tab uses **hardcoded demo data**. Other tabs are empty placeholders.

---

### 20. System Config Page (`/system-config`)

**Route:** `apps/admin/src/app/(dashboard)/system-config/page.tsx`

**Description:** Platform settings and service toggle switches.

**Layout:**
- `space-y-6`
- Two Cards: Service Toggles + Platform Settings

**Component Breakdown:**
1. **Page Header**: "System Configuration" + subtitle
2. **Service Toggles Card**:
   - 6 toggle rows (Switch + label + description):
     - User Registration
     - Course Creation
     - Payment Processing
     - Feedback System
     - Discussion System
     - Google OAuth Login
   - State managed with `useState` (local only, no API persistence)
3. **Platform Settings Card**:
   - 2-column grid of Input fields:
     - Site Name (default: "CourseHunt")
     - Support Email (default: "support@coursehunt.com")
     - Currency (disabled: "INR")
     - Tax Rate % (default: 18)
     - Min Course Price ₹ (default: 99)
     - Max Course Price ₹ (default: 9999)
     - Session Timeout minutes (default: 60)
   - "Save Settings" Button (no submission logic)

**Styling:**
- Toggle row: `flex items-center justify-between py-2`
- Settings grid: `grid grid-cols-2 gap-4`

**Data:** All local state (useState) - **no API integration**

---

### 21. Maintenance Page (`/maintenance`)

**Route:** `apps/admin/src/app/(dashboard)/maintenance/page.tsx`

**Description:** Maintenance mode toggle and scheduled downtime management.

**Layout:**
- `space-y-6`
- Status banner card
- Two-column grid: `grid grid-cols-1 lg:grid-cols-2 gap-6`

**Component Breakdown:**
1. **Page Header**: "Maintenance" + subtitle
2. **Status Banner Card**:
   - Dynamic border: `border-destructive` (active) / `border-green-500` (normal)
   - Green/red dot
   - Status text: "Maintenance Mode Active" / "All Services Operational"
   - Description text
   - Toggle button: "Enable Maintenance" (destructive) / "Disable Maintenance" (default)
   - Confirmation prompt before enabling
3. **Service Toggles Card** (left column):
   - 5 service toggles: Web, Tutor, API Backend, Payment, Database
   - Each: Switch + label (no functional logic)
4. **Schedule Maintenance Card** (right column):
   - Header with "Schedule" button (opens Dialog)
   - **Schedule Dialog**:
     - Service checkboxes (Switch per service)
     - Start Date/Time (datetime-local)
     - End Date/Time (datetime-local)
     - Message Textarea
     - "Schedule" button
   - Table of scheduled maintenance (hardcoded):
     - Date/Time, Services, Status (upcoming=blue, completed=outline)

**Styling:**
- Active: `border-destructive` (red)
- Normal: `border-green-500`
- Dot: `h-3 w-3 rounded-full`

**Data:** Status is local state. Schedules are **hardcoded demo data**.

---

### 22. Updates Page (`/updates`)

**Route:** `apps/admin/src/app/(dashboard)/updates/page.tsx`

**Description:** CRUD platform announcements and course updates.

**Layout:** Single Card with DataTable + Create/Edit Dialog.

**Component Breakdown:**
1. **Page Header**: "Updates" + "Create Update" button (opens Dialog)
2. **Create/Edit Dialog**:
   - Message Textarea (rows=4)
   - Course ID Input (optional, leave empty for platform-wide)
   - Save/Create Button
3. **DataTable Card**:
   - Header: "All Updates ({count})"
   - 4 columns:
     - "Date": localized
     - "Message": truncated max-w-xs muted
     - "Course": title or "Platform-wide"
     - "" (actions): Edit (pencil) + Delete (trash)
4. **Delete Confirmation** (ConfirmDeleteDialog)

**Data:**
- Query: `useUpdatesQuery()` → `CourseUpdate[]`
- Types: `{ id, message, created_at, course: { id, title } }`
- Mutations: `useCreateUpdateMutation()`, `useUpdateUpdateMutation()`, `useDeleteUpdateMutation()`

---

## Global Grid / Layout Patterns

| Pattern | Classes | Used On |
|---|---|---|
| 4-column stat grid | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4` | Dashboard, Security, Course Overview |
| 3-column stat grid | `grid grid-cols-1 md:grid-cols-3 gap-4` | Transactions, Monitoring |
| 2-column content | `grid grid-cols-1 lg:grid-cols-2 gap-6` | Dashboard (bottom), Categories, Maintenance |
| Single card content | `Card > CardContent p-0` with DataTable | Users, Coupons, Feedback, Discussions, etc. |
| Page wrapper | `space-y-6` | All pages |
| Centered form | `max-w-md mx-auto` | Auth pages |
| Profile layout | `flex flex-col md:flex-row gap-6` | Profile |
| Page title | `text-2xl font-bold` | All pages |
| Page subtitle | `text-muted-foreground text-sm` | All pages |

---

## Current Technical Debt & Issues

1. **No form validation library**: Most forms use plain `useState` and manual validation. Should migrate to `react-hook-form` + `zod`.
2. **Hardcoded demo data**: Course Overview stats, Security stats/logs, Monitoring stats/services, System Config, Maintenance schedules, Logs app tab all use hardcoded values with no API integration.
3. **No optimistic updates**: Mutations don't optimistically update the cache.
4. **Client-side pagination on some pages**: Users, Admins, Transactions, Updates use full dataset with `page={1}` and `totalPages={1}`, meaning no real pagination.
5. **Token/session handling**: Zustand store replaces session objects, but password change redirect is done via middleware/navigation rather than a protected route component.
6. **`any` types used**: Several places use `any` type assertions instead of proper types.
7. **Delete without confirmation in Roles**: Uses `confirm()` browser dialog instead of the custom `ConfirmDeleteDialog`.
8. **System Config has no persistence**: All settings are in local state only.
9. **Category tree uses `any` type**: No proper typing for the recursive component.
10. **No loading skeletons**: Uses simple text/icon spinners instead of proper skeleton loaders.
