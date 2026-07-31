# CourseHunt Web App (Student Application) - Complete Page Specification

## Overview

| Property | Value |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 6 |
| **UI Component Library** | shadcn/ui (powered by @base-ui/react + @radix-ui primitives) |
| **Form Handling** | react-hook-form + zod (planned, currently using plain useState) |
| **Icons** | @tabler/icons-react (via `<Icon name="..." />` wrapper) |
| **Styling** | Tailwind CSS v4 (no config file, `@import "tailwindcss"` in globals.css) |
| **State Management** | Zustand v5 (session), TanStack React Query v5 (server state) |
| **Validation** | Zod v4 (schemas in `package/schema/`) |
| **HTTP Client** | Axios (with Zod validation on responses) |
| **Authentication** | JWT (cookie-based), middleware proxy |
| **Payments** | Razorpay (dynamic script loading) |
| **Toasts** | Sonner |
| **Font** | Montserrat (next/font/google) |
| **Web Port** | 3000 |

---

## Layout Architecture

### Root Layout (`apps/web/src/app/layout.tsx`)
```
QueryProvider
└── SessionProvider
    └── ThemeProvider (next-themes, class-based)
        └── Toaster (sonner)
            └── {children}
```
- Global CSS imported: `@package/styles/globals.css`
- Montserrat font via CSS variable `--font-sans`
- `suppressHydrationWarning` on `<html>` for next-themes
- **Note**: `SessionProvider` redirects to `/auth/change-password` when `passwordChangedAt` is null, but **no change-password page exists in this app**.

### Public Layout - `(home)` Route Group (`apps/web/src/app/(home)/layout.tsx`)
```
<main class="flex flex-col">
├── Header (sticky, shared @package/components/header)
└── <section class="flex-1 flex flex-col mt-20 min-h-screen">
    └── {children}
</main>
Footer (shared @package/components/footer)
```
- Header includes: logo, Home/Courses links, wishlist heart (when authed), avatar dropdown (Dashboard, Profile, Log out) or "Sign In" link
- Applies to: `/`, `/courses`, `/courses/[id]`, `/wishlist`

### Student Dashboard Layout - `dashboard/(home)` Route Group (`apps/web/src/app/dashboard/(home)/layout.tsx`)
```
SidebarProvider
├── AppSidebar (nav groups, branding IconMountain/CourseHunt, profileHref="/dashboard/profile")
└── <main>
    ├── <header> (SidebarTrigger + BreadcrumbComponent)
    └── <div class="p-6">{children}</div>
```
- Nav config "Platform": Overview (`/dashboard`), Feedback (`/dashboard/feedback` - **dead link, no page exists**), Transactions (`/dashboard/transactions`)
- **Applies ONLY to `/dashboard`** — profile, transactions, and study pages bypass this layout

### Study Layout - `dashboard/study/[id]` (`apps/web/src/app/dashboard/study/[_id]/layout.tsx`)
```
<div class="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-5rem)]">
├── <main class="flex-1 min-w-0">{children}</main>
└── CourseSidebar (sticky, course title + progress + chapter accordion)
</div>
```
- Auto-redirects to first lesson (`?lessonId=...`) when none selected
- Auto-expands the chapter containing the active lesson
- Guards: `Loading` while pending, "Course not found or not enrolled." fallback

### Middleware (`apps/web/src/proxy.ts`)
- **Protected prefixes**: `/dashboard`, `/checkout`, `/wishlist`
- No `access_token` cookie → protected routes redirect to `/auth/login`
- `payload.banned === true` → redirect to `/auth/restricted`
- On `/auth/restricted` but NOT banned → redirect to `/`
- Authenticated user on `/auth/login` → redirect to `/`
- API proxied via rewrites in `next.config.ts`: `/api/v1/*` → Go backend on port 8080

---

## Color Schema

The web app uses the **same global CSS variables** as the admin/tutor apps (shared via `@package/styles/globals.css`). See the admin-dashboard-spec.md for the complete CSS variable table.

**App-specific accent patterns:**
- Purchase/payment CTAs: `bg-green-600 hover:bg-green-700` (green money buttons)
- Primary brand green: `--primary` (used for hero text span, buttons, links)
- Tinted stat cards: `bg-{color}-500/5 border-{color}-500/20`
- Stars: `fill-yellow-400 text-yellow-400`
- Prose content: `prose dark:prose-invert`
- Auth pages: dark zinc glassmorphism with blue/purple blobs

---

## Routing Structure: Public vs Protected

| Zone | Routes | Layout |
|---|---|---|
| Public | `/`, `/courses`, `/courses/[id]` | `(home)` Header/Footer |
| Hybrid (protected, public layout) | `/wishlist` | `(home)` Header/Footer |
| Auth | `/auth/login`, `/auth/restricted` | None (standalone) |
| Checkout | `/checkout/[id]`, `/checkout/confirmation/[tx]` | None (standalone) |
| Dashboard (sidebar) | `/dashboard` | `dashboard/(home)` Sidebar |
| Dashboard (no shell) | `/dashboard/profile`, `/dashboard/transactions` | None |
| Study | `/dashboard/study/[id]` | `study/[id]` CourseSidebar |

---

## Page-by-Page Breakdown

---

### 1. Landing Page (`/`)

**Route:** `apps/web/src/app/(home)/page.tsx`

**Description:** Marketing landing page with hero, about, features, featured courses, testimonials, brand logos, and contact form.

**Layout:** Full-page scroll with `bg-background`, sequential sections, each using `container mx-auto px-4` and alternating `bg-muted/50` bands.

**Component Breakdown (9 sections):**
1. **Hero Section** (`py-20 bg-linear-to-br from-primary/10 via-background to-secondary/10`):
   - `grid lg:grid-cols-2 gap-12 items-center`
   - Left: H1 "Master New Skills with CourseHunt" (text-4xl md:text-6xl, primary span), subtitle, green CTA button "Start Learning Today" (IconArrowRight), stats row (50K+ Students / 200+ Courses / 4.8★ Rating)
   - Right: Hero illustration (placeholder Image, rounded-2xl shadow-2xl)
2. **About Section** (`py-20`): Centered heading, 2-col grid — story text with 4 checkmark bullet points (IconCircleCheck green) + about image
3. **Goals Section** (`py-20 bg-muted/50`): 3 centered Cards (Accessibility/IconUsers, Excellence/IconAward, Innovation/IconBook) with 12x12 primary icons
4. **Key Features** (`py-20`): 4-col grid — circular icon badges (`bg-primary/10 w-16 h-16 rounded-full`) + title + description (HD Video, Offline Access, Certificates, Community)
5. **Featured Courses** (`py-20 bg-muted/50`):
   - Loading: skeleton course cards (image + title + meta + rating + price skeletons)
   - Empty: "No courses found"
   - Loaded: `grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8` of CourseCard
   - "View All Courses" button → `/courses`
6. **Testimonials** (`py-20`): `grid md:grid-cols-3 gap-8` of feedback Cards (avatar, name, course, star rating, quote)
7. **Brand Collaboration** (`py-20 bg-muted/50`): "Trusted by Industry Leaders" - flex row of 5 grayscale brand logos (`grayscale hover:grayscale-0`)
8. **Contact Form** (`py-20`): max-w-2xl Card with Name/Email grid + Subject + Message Textarea + "Send Message" button (**non-functional**)
9. **Footer** (via `(home)` layout)

**Data:**
- `useCoursesQuery({ limit: 6 })` → `CoursePublicResponse[]`
- `usePinnedFeedbacksQuery()` → `Feedback[]`
- Contact form has no state or handler

---

### 2. Courses Browse (`/courses`)

**Route:** `apps/web/src/app/(home)/courses/page.tsx`

**Description:** Searchable, filterable course listing with pagination.

**Layout:**
- `max-w-6xl mx-auto p-4 space-y-6`
- Centered title + subtitle
- Filter toolbar
- DataTable (PAGE_SIZE = 10)

**Component Breakdown:**
1. **Page Header**: "Available Courses" (text-3xl, centered) + subtitle
2. **Filter Toolbar** (`flex flex-wrap gap-4 items-center`):
   - Search Input (max-w-xs, debounced 300ms)
   - Category Select (w-[180px], from categories query)
   - Level Select (w-[180px], beginner/intermediate/advanced)
   - Changing any filter resets page to 1
3. **DataTable** with 8 columns:
   - "Image": thumbnail (w-16 h-10 rounded bg-muted)
   - "Title": font-medium, max-w-[200px], truncate
   - "Instructor": name
   - "Category": name or "-"
   - "Level": capitalize Badge
   - "Price": ₹ final_price + strikethrough actual_price (if discounted)
   - "Rating": `rating_avg.toFixed(1)` + `(feedback_count)`
   - "Action": "View" outline Button → `/courses/[id]`
4. **Loading State**: `Loading` component
5. **Empty State**: dashed border, "No courses found" + "Try adjusting your search or filter criteria."

**Data:**
- `useCategoriesQuery()` → `Category[]`
- `useCoursesQuery({ page, limit, search, category_id, level })` → paginated `CoursePublicResponse[]`

---

### 3. Course Detail (`/courses/[id]`)

**Route:** `apps/web/src/app/(home)/courses/[_id]/page.tsx`

**Description:** Full course landing page with enrollment and wishlist actions.

**Layout:**
- `min-h-screen bg-background`
- Top: gradient banner section (`bg-linear-to-br primary/10 via-background to-secondary/10`)
- Bottom: content sections with `container mx-auto px-4 py-12`

**Component Breakdown:**
1. **Hero Section** (`grid lg:grid-cols-3 gap-8`):
   - **Left (col-span-2)**:
     - Badge row: level (secondary) + category (outline)
     - Course title (text-4xl font-bold)
     - Short description (text-xl muted)
     - Stats row: star rating + review count, lecture count, language
     - Instructor block: avatar (w-12 h-12, fallback initial) + "Instructor" label + name + headline
   - **Right (col-span-1)**:
     - Sticky Card (sticky top-24):
       - Course image
       - Price: final price (text-3xl bold) + strikethrough actual
       - EnrollButton (shared component — unauthenticated → `/login`, else → `/checkout/[id]`)
       - "Add to Wishlist" button (only if session exists)
       - Details list: lectures count, duration (Xh Ym), certificate
2. **Below the fold** (`lg:col-span-2`):
   - "About This Course" (long_description, whitespace-pre-line)
   - "What You'll Learn" (benefits as checkmark grid, 2-col)
   - "Requirements" (list with IconCircle)
   - "Course Content": chapter Cards with title, lecture count + duration, nested lesson list with durations (`border-l-2 border-muted pl-4`)

**Data:**
- `useCourseLandingQuery(_id)` → `CourseLandingResponse` (`{ id, title, short_description, long_description, image_url, level, language, category, rating_avg, feedback_count, total_lectures, total_duration_seconds, actual_price, final_price, instructor, benefits, requirements, chapters }`)
- `useAddCourseToWishlistMutation()`
- Session: `useSessionStore`

---

### 4. Wishlist Page (`/wishlist`)

**Route:** `apps/web/src/app/(home)/wishlist/page.tsx`

**Description:** Protected wishlist with remove and clear-all actions.

**Layout:**
- `max-w-4xl mx-auto p-4 space-y-6`
- Lives inside `(home)` layout (Header/Footer) but protected by middleware

**Component Breakdown:**
1. **Page Header**: "My Wishlist" (text-3xl) + "Clear All" destructive button (only when items exist)
2. **Empty State** (Card): IconHeartOff + "Your wishlist is empty" + "Browse Courses" button → `/courses`
3. **Items Table** (Card):
   - Header: "{count} courses"
   - Table columns: Image (w-16 h-10), Course (title link → `/courses/[id]`, hover:text-primary), Action (X ghost button)
   - Table edges: `p-0` on CardContent

**Data:**
- `useWishlistQuery()` → `WishlistItem[]`
- `useRemoveCourseFromWishlistMutation()`
- `useClearWishlistMutation()`
- Types: `WishlistItem{ id, course: { id, title, thumbnail } }`

---

### 5. Login Page (`/auth/login`)

**Route:** `apps/web/src/app/auth/login/page.tsx`

**Description:** Google SSO-only login page (no email/password form).

**Layout:** Full-screen centered auth card (same dark glassmorphism style as admin/tutor).

**Component Breakdown:**
1. **Background**: dark zinc gradient + blue/purple animated blobs
2. **Card**: "Welcome back" title + "Login to your account to continue your learning journey"
3. **Google Sign-in Button**: IconBrandGoogle, hover scale animation, loader state

**Data:**
- `useLoginWithGoogleMutation()` imported but **not used** — button always shows toast "Google SSO client logic needs ID token to proceed"
- **No email/password login for students**

---

### 6. Restricted Page (`/auth/restricted`)

**Route:** `apps/web/src/app/auth/restricted/page.tsx`

**Description:** Account-suspended screen for banned users.

**Layout:** Full-screen centered (`min-h-screen flex flex-col items-center justify-center bg-background`).

**Component Breakdown:**
1. IconShieldExclamation (w-24 h-24, destructive color)
2. "Account Suspended" (text-4xl bold)
3. Restriction description
4. "Contact Support" button (mailto:support@coursehunt.com)

**Logic:**
- Reads session; if not pending and user not banned → redirects to `/`

---

### 7. Checkout Page (`/checkout/[id]`)

**Route:** `apps/web/src/app/checkout/[_id]/page.tsx`

**Description:** Razorpay-powered payment flow with order summary and coupon input.

**Layout:**
- `min-h-screen bg-background py-12`
- `container mx-auto px-4 max-w-5xl`
- `grid lg:grid-cols-3 gap-8`

**Component Breakdown:**
1. **Left (col-span-2)**:
   - "Checkout" title (text-3xl) + subtitle
   - **Order Summary Card**: course image (80x60 rounded) + title + instructor name, Separator, price breakdown (Course Price / Original Price strikethrough)
   - **Coupon Card**: "Have a Coupon?" + Input + "Apply" button (disabled without code, **non-functional**)
2. **Right (col-span-1)**:
   - **Payment Details Card** (sticky top-24): Subtotal / Discount (₹0) / Total breakdown, green "Pay ₹X" button (IconLock, loading state with IconLoader2), "Secure payment processed by Razorpay" note

**Payment Flow (`handlePayment`):**
1. `loadRazorpayScript()` — dynamically injects `https://checkout.razorpay.com/v1/checkout.js`
2. `useInitiateTransactionMutation()` → `{ course_id, coupon_code }` → `{ transaction_id, razorpay_order_id, amount, currency, razorpay_key }`
3. Opens Razorpay modal (prefilled name/email from session)
4. Success handler → `/checkout/confirmation/[transactionId]`
5. `payment.failed` event → toast error
6. Modal dismiss → "Payment cancelled." toast

**Data:**
- `useCheckoutCourseQuery(_id)` → checkout course data
- `useInitiateTransactionMutation()`
- Session: `useSessionStore`

---

### 8. Payment Confirmation (`/checkout/confirmation/[transactionId]`)

**Route:** `apps/web/src/app/checkout/confirmation/[transactionId]/page.tsx`

**Description:** Payment status verification with polling. Four-state machine.

**Page States:** `"polling" | "success" | "failed" | "exhausted"`

**Polling Logic:**
- `useTransactionStatusQuery(txId, { enabled: polling, refetchInterval: 1000 })`
- Tracks attempts in `sessionStorage` key `payment_attempts_<txId>`
- Exhausts after 7 attempts → "exhausted" state
- Adds `beforeunload` guard while polling

**Component Breakdown (4 views):**
1. **Polling**: Spinning IconLoader2 (h-16 w-16, primary) + "Confirming your payment..." + warning to not close page
2. **Success**: Green circle check (bg-green-100) + "Payment Successful!" (green) + "Go to Dashboard" button
3. **Failed**: Red circle X (bg-red-100) + "Payment Failed" + error_description in red box + "Try Again" button → `/courses`
4. **Exhausted**: Yellow clock (bg-yellow-100) + "Payment Processing" + "Go to Dashboard" button

---

### 9. Student Dashboard (`/dashboard`)

**Route:** `apps/web/src/app/dashboard/(home)/page.tsx`

**Description:** Student overview with stats, enrolled courses, and recent updates.

**Layout:**
- `space-y-8 w-full`
- Header with date pill
- Stats grid
- 3-col layout: courses (2 cols) + updates (1 col)

**Component Breakdown:**
1. **Page Header**: "Welcome back! 👋" (text-3xl tracking-tight, **white text**) + subtitle + date pill (IconCalendar, `bg-muted/50 px-3 py-1 rounded-full w-fit`)
2. **Stats** (DashboardStatsSlot): 4 tinted stat cards:
   - Courses Enrolled (IconBook, `bg-primary/5 border-primary/20`) + IconTrendingUp "Keep learning!"
   - Completed (IconSchool, `bg-green-500/5 border-green-500/20`) + "Keep going!"
   - Certificates (IconAward, `bg-blue-500/5 border-blue-500/20`) + "Ready to earn"
   - In Progress (IconStar, `bg-amber-500/5 border-amber-500/20`) + "Keep pushing!"
3. **My Courses** (DashboardCoursesSlot, lg:col-span-2): Card with Table (Course thumbnail + title + "In progress" clock, Progress bar (h-2) + % complete, Status badge (Completed=green when 100%), Resume/Review button → `/dashboard/study/[id]`). Empty state: dashed border + "Explore Courses" button
4. **Recent Updates** (DashboardUpdatesSlot): Card with DataTable (5 per page): Course (truncated), Message (line-clamp-2), Date, "New" badge when is_unseen. Empty state: dashed border

**Data:**
- `useUserDashboardQuery()` → `UserDashboard` (`{ enrolled_courses_count, completed_courses_count, certificates_count, in_progress_courses_count }`)
- `useEnrolledCoursesQuery()` → `EnrolledCourseResponse[]` (`{ id, title, image_url, completion_percent }`)
- `useUpdateFeedQuery({ page, limit: 5 })` → `UpdateFeedItem[]` (`{ id, message, created_at, is_unseen, course }`)

---

### 10. Student Profile (`/dashboard/profile`)

**Route:** `apps/web/src/app/dashboard/profile/page.tsx`

**Description:** Edit student profile with avatar upload.

**Layout:** Same two-panel profile layout as admin/tutor (max-w-5xl, left avatar card w-80, right form flex-1). **No sidebar layout wrapper.**

**Component Breakdown:**
1. **Left Profile Card**: gradient banner, clickable avatar (upload overlay), name, role Badge, "Enrolled Courses" count
2. **Right Edit Card**: "Edit Profile" + form:
   - Display Name
   - Email (disabled)
   - Headline
   - Website/Portfolio
   - Bio Textarea
   - "Update Profile" (green) + "Cancel"

**Data:**
- `useUserProfileQuery()`, `useCreateUserProfileMutation()`
- `useUploadMediaMutation()` (avatar → downloadUrl)
- `useUpdateUserMutation()` (name + image)
- `useEnrolledCoursesQuery()` (enrolled count)
- Session store `updateUser`

---

### 11. Transactions (`/dashboard/transactions`)

**Route:** `apps/web/src/app/dashboard/transactions/page.tsx`

**Description:** Student purchase history. **No sidebar layout wrapper.**

**Layout:**
- `bg-background w-full` → `container mx-auto px-4 py-8`
- Header + single Card with DataTable (10 per page)

**Component Breakdown:**
1. **Page Header**: "Transaction History" (text-3xl) + subtitle
2. **DataTable Card**: "All Transactions" with 5 columns:
   - "Transaction ID": font-mono, truncated max-w-[120px] (`razorpay_order_id || id`)
   - "Date": IconCalendar + locale date
   - "Course": title or "Unknown"
   - "Amount": ₹ bold, right-aligned
   - "Actions": "Invoice" button (**non-functional**)
3. **Empty State**: IconReceipt + "You have not made any transactions yet."

**Data:**
- `useTransactionsQuery({ page, limit: 10 })` → paginated `Transaction[]`

---

### 12. Study Player (`/dashboard/study/[id]`)

**Route:** `apps/web/src/app/dashboard/study/[_id]/page.tsx`

**Description:** Lesson learning interface with content player and 4-tab panel.

**Layout:** `space-y-6` within the study layout (main area next to CourseSidebar).

**Component Breakdown:**
1. **No Lesson Selected** (when no `lessonId` query param): Card with IconBook + "No Lesson Selected" + hint to use sidebar
2. **LessonContentPlayer**: Card with "Lesson Content" header + "Mark Complete" button; renders by type:
   - **VideoContent**: `<video controls>` in `aspect-video bg-black` (server component)
   - **DocumentContent**: `prose dark:prose-invert whitespace-pre-wrap` text (server component)
   - **QuizTaker**: orchestrates quiz flow (start → questions one-by-one via `useGetQuestionMutation` with `fetched_question_ids` → submit via `useSubmitQuizMutation` → result view with pass/fail + "Retake Quiz")
     - `QuizIntro`: title + time limit/pass score meta + "Start Quiz"
     - `QuizQuestionView`: "Question N of M" + option buttons (selected = `border-primary bg-primary/5`) + Next/Submit
     - `QuizResultView`: green check / red alert + score % + "Retake Quiz"
3. **TabsNav** (underline tabs): Discussions / Resources / Notes / Feedback (active = `text-primary border-b-2 border-primary`)
4. **Tab Panels**:
   - **DiscussionsTab**: `NewDiscussionForm` (Textarea + "Post Thread") + recursive `DiscussionThread` list (author, date, content, reply box, "Show/Hide Replies", lazy replies with pagination via `useDiscussionRepliesQuery`)
   - **ResourcesTab**: grid of `ResourceCard`s (title, mono file-type label, Download `<a download>` link) or empty message
   - **NotesTab**: `NoteModeToggle` (Write Markdown / Preview) + Textarea (font-mono) or rendered markdown preview (`prose`, `dangerouslySetInnerHTML` from `parseMarkdown`)
   - **FeedbackTab**: `StarRating` (interactive 5 stars, yellow fill) + feedback Textarea + "Submit Review" → `useCreateFeedbackMutation`

**Data:**
- `useLessonContentQuery(lessonId)` → `AggregatedLessonContentResponse` (`{ lesson_type, video_content, document_content, quiz_content }`)
- `useCompleteLessonMutation(_id)` → marks lesson complete + toast
- Tab queries: `useDiscussionsQuery`, `useDiscussionRepliesQuery`, `useCreateDiscussionMutation`, `useLessonResourcesQuery`, `useNotesQuery`, `useCreateNoteMutation`, `useCreateFeedbackMutation`
- Quiz: `useGetQuestionMutation`, `useSubmitQuizMutation`

---

### 13. Course Sidebar (Study Layout Component)

**File:** `apps/web/src/app/dashboard/study/[_id]/components/CourseSidebar.tsx`

**Description:** Sticky course navigation panel on the right of the study page.

**Component Breakdown:**
- `aside lg:w-80` sticky panel
- Course title + completion badge + Progress bar
- Scrollable chapter accordion (ChapterAccordionItem):
  - Expandable chapter header ("Ch N: title" + "x/y lectures • Zm")
  - Chevron toggle
  - LessonRow list: clickable, complete-check icon (green) vs circle, LessonTypeIcon (video→IconVideo, document→IconFileText, quiz→IconHelp), type + duration (m:ss)
- Controlled by study layout: `toggleChapter`, `expandedChapters`, `handleLessonClick`

---

## Global Grid / Layout Patterns

| Pattern | Classes | Used On |
|---|---|---|
| Public content shell | `container mx-auto px-4` | All public pages |
| Landing section band | `py-20 bg-muted/50` (alternating) | Landing page |
| 4-tint stat grid | `grid gap-6 md:grid-cols-2 lg:grid-cols-4` | Dashboard |
| 3-col content split | `grid lg:grid-cols-3 gap-8` | Course detail, Checkout |
| Study split | `flex flex-col lg:flex-row gap-6` | Study layout |
| Single card with DataTable | `Card > CardContent p-0` | Courses browse, Transactions, Updates |
| Page wrapper | `space-y-6` / `space-y-8` | Dashboard pages |
| Auth centered card | `max-w-md mx-auto` | Login |
| Profile layout | `flex flex-col md:flex-row gap-6` | Student profile |
| Page title | `text-3xl font-bold` | Public pages |
| Page subtitle | `text-muted-foreground` | Public pages |

---

## Key Shared Components Used

From `package/components/`: `Header`, `Footer`, `CourseCard`, `EnrollButton`, `DataTable`, `Loading`, `Icon`, `AppSidebar`, `BreadcrumbComponent`, `SessionProvider`, `ThemeProvider`, `QueryProvider`
From `package/ui/`: all shadcn components
From `package/store/session.store`: `useSessionStore`

---

## Current Technical Debt & Issues

1. **No form validation library**: All forms use plain `useState` and manual validation. Should migrate to `react-hook-form` + `zod`.
2. **No email/password login for students**: Login page only has Google SSO (which is itself stubbed — always shows "needs ID token" toast).
3. **Dead links**: Sidebar has `/dashboard/feedback` (no page); `SessionProvider` redirects to `/auth/change-password` (no page).
4. **Non-functional UI**: Contact form on landing, coupon "Apply" button on checkout, "Invoice" button on transactions — all have no handlers.
5. **Layout inconsistency**: `/dashboard/profile` and `/dashboard/transactions` have no sidebar layout wrapper (only `/dashboard` does). The header has `text-white` on the welcome message which is unreadable in light mode.
6. **Google login mutation imported but unused** (`useLoginWithGoogleMutation`).
7. **Wishlist page inside `(home)` layout but protected** — works but creates hybrid routing semantics.
8. **Payment confirmation polling** uses `sessionStorage` for attempt counting — could use server state instead.
9. **Coupon flow incomplete**: coupon code is sent to initiate transaction but there's no apply/validate UI.
10. **No certificate viewing UI**: Dashboard shows certificates count but no way to view/download certificates.
11. **Dashboard welcome heading has `text-white`** — hardcoded color that breaks light theme.
12. **No optimistic updates**: Mutations don't optimistically update the cache.
