"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {items.length === 0 ? (
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link href={rootHref}>Dashboard</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={index}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage className="max-w-37.5 truncate sm:max-w-75">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href} className="max-w-37.5 truncate sm:max-w-75">
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
  );
}

