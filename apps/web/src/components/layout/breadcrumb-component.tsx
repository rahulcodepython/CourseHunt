"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useBreadcrumbStore, type BreadcrumbItemData } from "@/store/breadcrumb.store";
import { ROUTES } from "@/lib/constants/const";
import { useManageCourseQuery } from "@/query-hooks/courses.api";
import { useChapterQuery } from "@/query-hooks/chapters.api";
import { useLessonQuery } from "@/query-hooks/lessons.api";

export default function BreadcrumbComponent() {
  const pathname = usePathname();
  const customOverride = useBreadcrumbStore((s) => s.customOverride);

  const role = pathname.startsWith(ROUTES.TUTOR_DASHBOARD)
    ? "tutor"
    : pathname.startsWith(ROUTES.STUDENT_DASHBOARD)
    ? "student"
    : "admin";

  const rootHref =
    role === "tutor"
      ? ROUTES.TUTOR_DASHBOARD
      : role === "student"
      ? ROUTES.STUDENT_DASHBOARD
      : ROUTES.ADMIN_DASHBOARD;

  const isTutor = role === "tutor";

  // Extract potential course, chapter, and lesson IDs from pathname
  const courseMatch = pathname.match(/^\/(admin|tutor)\/courses\/([^\/]+)/);
  const courseId =
    courseMatch && !["create", "overview"].includes(courseMatch[2]) ? courseMatch[2] : null;

  const chapterMatch = pathname.match(/^\/(admin|tutor)\/courses\/[^\/]+\/chapters\/([^\/]+)/);
  const chapterId = chapterMatch ? chapterMatch[2] : null;

  const lessonMatch = pathname.match(
    /^\/(admin|tutor)\/courses\/[^\/]+\/chapters\/[^\/]+\/lessons\/([^\/]+)/,
  );
  const lessonId = lessonMatch ? lessonMatch[2] : null;

  const scope = role === "admin" ? "admin" : "tutor";

  const { data: rawCourse } = useManageCourseQuery(courseId ?? "", scope, {
    enabled: !!courseId,
  });
  const { data: rawChapter } = useChapterQuery(chapterId ?? "", scope, {
    enabled: !!chapterId,
  });
  const { data: rawLesson } = useLessonQuery(lessonId ?? "", scope, {
    enabled: !!lessonId,
  });

  const courseTitle = rawCourse?.title || "Course";
  const chapterTitle = rawChapter?.title || "Chapter";
  const lessonTitle = rawLesson?.title || "Lesson";

  const items = React.useMemo<BreadcrumbItemData[]>(() => {
    // If an explicit override matches the current pathname, prioritize it
    if (customOverride && customOverride.pathname === pathname) {
      return customOverride.items;
    }

    const cleanPath = pathname.replace(/\/+$/, "");

    // Check if exactly dashboard root
    if (cleanPath === `/${role}`) {
      return [];
    }

    // 1. Lesson deep subtab: .../lessons/[lessonId]/(feedback|discussions|quiz|resources)
    const lessonSubtabMatch = cleanPath.match(
      /^\/(admin|tutor)\/courses\/([^\/]+)\/chapters\/([^\/]+)\/lessons\/([^\/]+)\/(feedback|discussions|quiz|resources)$/,
    );
    if (lessonSubtabMatch) {
      const [, r, cId, chId, lId, subtab] = lessonSubtabMatch;
      const subtabLabel =
        subtab === "feedback"
          ? "Feedback"
          : subtab === "discussions"
          ? "Discussions"
          : subtab === "quiz"
          ? "Quiz"
          : subtab === "resources"
          ? "Resources"
          : subtab.charAt(0).toUpperCase() + subtab.slice(1);

      return [
        { label: isTutor ? "My Courses" : "Courses", href: `/${r}/courses` },
        { label: courseTitle, href: `/${r}/courses/${cId}` },
        { label: "Chapters", href: `/${r}/courses/${cId}/chapters` },
        { label: chapterTitle, href: `/${r}/courses/${cId}/chapters/${chId}/lessons` },
        { label: "Lessons", href: `/${r}/courses/${cId}/chapters/${chId}/lessons` },
        { label: lessonTitle, href: `/${r}/courses/${cId}/chapters/${chId}/lessons/${lId}/discussions` },
        { label: subtabLabel },
      ];
    }

    // 2. Lesson root: .../lessons/[lessonId]
    const singleLessonMatch = cleanPath.match(
      /^\/(admin|tutor)\/courses\/([^\/]+)\/chapters\/([^\/]+)\/lessons\/([^\/]+)$/,
    );
    if (singleLessonMatch) {
      const [, r, cId, chId] = singleLessonMatch;
      return [
        { label: isTutor ? "My Courses" : "Courses", href: `/${r}/courses` },
        { label: courseTitle, href: `/${r}/courses/${cId}` },
        { label: "Chapters", href: `/${r}/courses/${cId}/chapters` },
        { label: chapterTitle, href: `/${r}/courses/${cId}/chapters/${chId}/lessons` },
        { label: "Lessons", href: `/${r}/courses/${cId}/chapters/${chId}/lessons` },
        { label: lessonTitle },
      ];
    }

    // 3. Chapter lessons: .../chapters/[chapterId]/lessons
    const chapterLessonsMatch = cleanPath.match(
      /^\/(admin|tutor)\/courses\/([^\/]+)\/chapters\/([^\/]+)\/lessons$/,
    );
    if (chapterLessonsMatch) {
      const [, r, cId, chId] = chapterLessonsMatch;
      return [
        { label: isTutor ? "My Courses" : "Courses", href: `/${r}/courses` },
        { label: courseTitle, href: `/${r}/courses/${cId}` },
        { label: "Chapters", href: `/${r}/courses/${cId}/chapters` },
        { label: chapterTitle, href: `/${r}/courses/${cId}/chapters/${chId}/lessons` },
        { label: "Lessons" },
      ];
    }

    // 4. Course sub-tab: .../courses/[courseId]/(about|chapters|enrollments|faqs)
    const courseTabMatch = cleanPath.match(
      /^\/(admin|tutor)\/courses\/([^\/]+)\/(about|chapters|enrollments|faqs)$/,
    );
    if (courseTabMatch) {
      const [, r, cId, tab] = courseTabMatch;
      const tabLabel =
        tab === "about"
          ? "About"
          : tab === "chapters"
          ? "Chapters"
          : tab === "enrollments"
          ? "Enrollments"
          : tab === "faqs"
          ? "FAQs"
          : tab.charAt(0).toUpperCase() + tab.slice(1);

      return [
        { label: isTutor ? "My Courses" : "Courses", href: `/${r}/courses` },
        { label: courseTitle, href: `/${r}/courses/${cId}` },
        { label: tabLabel },
      ];
    }

    // 5. Course overview: .../courses/[courseId]
    const singleCourseMatch = cleanPath.match(/^\/(admin|tutor)\/courses\/([^\/]+)$/);
    if (singleCourseMatch) {
      const [, r] = singleCourseMatch;
      return [
        { label: isTutor ? "My Courses" : "Courses", href: `/${r}/courses` },
        { label: courseTitle },
      ];
    }

    // 6. Courses list: .../courses
    if (cleanPath === `/${role}/courses`) {
      return [{ label: isTutor ? "My Courses" : "Courses" }];
    }

    // 7. Admin user courses: /admin/users/[userId]/courses
    const userCoursesMatch = cleanPath.match(/^\/admin\/users\/([^\/]+)\/courses$/);
    if (userCoursesMatch) {
      return [
        { label: "Users", href: "/admin/users" },
        { label: "Purchased Courses" },
      ];
    }

    // 8. Static & standard dashboard paths mapping
    const staticLabels: Record<string, string> = {
      users: "Users",
      admins: "Admins",
      roles: "Roles",
      categories: "Categories",
      coupons: "Coupons",
      transactions: "Transactions",
      logs: "Logs",
      monitoring: "Monitoring",
      security: "Security",
      updates: "Updates",
      notifications: "Notifications",
      profile: "Profile",
      learn: "My Learning",
      wishlist: "Wishlist",
      certificates: "Certificates",
    };

    // Generic segment splitter for any other route
    const segments = cleanPath.split("/").filter(Boolean);
    if (segments.length > 0 && ["admin", "tutor", "student"].includes(segments[0])) {
      segments.shift(); // remove role prefix
    }

    let runningHref = `/${role}`;
    return segments.map((seg, idx) => {
      runningHref += `/${seg}`;
      const isLast = idx === segments.length - 1;
      const label =
        staticLabels[seg] ||
        seg
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

      return {
        label,
        href: isLast ? undefined : runningHref,
      };
    });
  }, [customOverride, pathname, role, isTutor, courseTitle, chapterTitle, lessonTitle]);

  // Split items for Desktop: collapse intermediate steps if trail is deep
  const shouldCollapse = items.length > 2;
  const collapsedItems = shouldCollapse ? items.slice(0, items.length - 2) : [];
  const visibleItems = shouldCollapse
    ? [items[items.length - 2], items[items.length - 1]]
    : items;

  // Mobile parent and current item
  const mobileParent =
    items.length >= 2 ? items[items.length - 2] : { label: "Dashboard", href: rootHref };
  const mobileCurrent = items.length > 0 ? items[items.length - 1] : null;

  return (
    <div className="flex items-center min-w-0">
      {/* Mobile Breadcrumb (Back to parent + truncated active item) */}
      <div className="flex sm:hidden items-center gap-1.5 min-w-0 text-xs text-muted-foreground">
        {mobileCurrent ? (
          <>
            <Link
              href={mobileParent.href || rootHref}
              className="inline-flex items-center gap-1 hover:text-foreground shrink-0 max-w-32.5 font-medium"
              title={`Back to ${mobileParent.label}`}
            >
              <ChevronLeft className="size-3.5 shrink-0" />
              <span className="truncate">Back to {mobileParent.label}</span>
            </Link>
            <span className="shrink-0 text-muted-foreground/60">/</span>
            <span
              className="truncate min-w-0 max-w-37.5 font-semibold text-foreground"
              title={mobileCurrent.label}
            >
              {mobileCurrent.label}
            </span>
          </>
        ) : (
          <span className="font-semibold text-foreground">Dashboard</span>
        )}
      </div>

      {/* Desktop Breadcrumb (Fluid flexbox + smart truncation + collapsible intermediate dropdown) */}
      <Breadcrumb className="hidden sm:flex min-w-0">
        <BreadcrumbList className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-nowrap">
          {/* Root: Dashboard */}
          <BreadcrumbItem className="shrink-0">
            {items.length === 0 ? (
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link href={rootHref} className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>

          {/* Intermediate collapsed dropdown */}
          {shouldCollapse && (
            <>
              <BreadcrumbSeparator className="shrink-0" />
              <BreadcrumbItem className="shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="flex size-7 items-center justify-center rounded-md hover:bg-accent hover:text-foreground text-muted-foreground transition-colors focus:outline-none"
                    aria-label="More breadcrumbs"
                  >
                    <BreadcrumbEllipsis className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-44 max-w-72">
                    {collapsedItems.map((collapsed, idx) => (
                      <DropdownMenuItem key={idx} asChild>
                        {collapsed.href ? (
                          <Link href={collapsed.href} className="w-full truncate block">
                            {collapsed.label}
                          </Link>
                        ) : (
                          <span className="w-full truncate block text-muted-foreground">
                            {collapsed.label}
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
            </>
          )}

          {/* Visible ancestors and leaf node */}
          {visibleItems.map((item, index) => {
            const isLast = index === visibleItems.length - 1;
            return (
              <React.Fragment key={index}>
                <BreadcrumbSeparator className="shrink-0" />
                <BreadcrumbItem className={isLast ? "min-w-0" : "shrink-0"}>
                  {isLast || !item.href ? (
                    <BreadcrumbPage
                      className="truncate block min-w-0 max-w-[200px] md:max-w-[280px] lg:max-w-[380px] font-medium"
                      title={item.label}
                    >
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        href={item.href}
                        className="truncate block max-w-[130px] md:max-w-[180px]"
                        title={item.label}
                      >
                        {item.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

