"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useManageCourseQuery } from "@/query-hooks/courses.api";
import type { Course, AdminCourseDetail } from "@/schema/courses.types";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";
import type { BreadcrumbItemData } from "@/store/breadcrumb.store";
import { formatDate } from "@/lib/utils/format";
import { COURSE_STATUS } from "@/lib/constants/const";
import { Loading } from "@/components/common/loading";
import { Icon } from "@/components/common/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseStatCards } from "@/components/courses/manage/course-stat-cards";
import { CourseStatusDialog } from "@/app/tutor/courses/course-status-dialog";
import { cn } from "@/lib/utils/utils";

interface CourseLayoutViewProps {
  courseId: string;
  role: "admin" | "tutor";
  children: React.ReactNode;
}

export function CourseLayoutView({
  courseId,
  role,
  children,
}: CourseLayoutViewProps) {
  const pathname = usePathname();
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);

  const { data: rawCourse, isLoading: isCourseLoading } = useManageCourseQuery(
    courseId,
    role === "admin" ? "admin" : "tutor",
  );
  const course = rawCourse as (Course | AdminCourseDetail) | undefined;

  // Breadcrumbs: only set at the course level tabs; deeper routes (chapters/lessons) set their own detailed breadcrumbs
  const isDeeperRoute = pathname.includes("/chapters/");

  const breadcrumbItems = React.useMemo(() => {
    if (isDeeperRoute || !course) {
      return null;
    }

    const base: BreadcrumbItemData[] = [
      {
        label: role === "admin" ? "Courses" : "My Courses",
        href: role === "admin" ? "/admin/courses" : "/tutor/courses",
      },
      {
        label: course.title,
        href: `/${role}/courses/${courseId}`,
      },
    ];

    if (pathname.endsWith("/settings") || pathname.endsWith("/about")) {
      base.push({ label: "Settings" });
    } else if (pathname.endsWith("/chapters")) {
      base.push({ label: "Chapters" });
    } else if (pathname.endsWith("/faqs")) {
      base.push({ label: "FAQs" });
    } else if (pathname.endsWith("/enrollments")) {
      base.push({ label: "Students" });
    } else if (pathname.endsWith("/updates")) {
      base.push({ label: "Updates" });
    } else if (pathname.endsWith("/coupons")) {
      base.push({ label: "Coupons" });
    }

    return base;
  }, [course, courseId, role, pathname, isDeeperRoute]);

  useSetBreadcrumbs(breadcrumbItems, !isDeeperRoute);

  if (isCourseLoading) {
    return <Loading />;
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <Icon name="help-circle" className="size-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold">Course Not Found</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          The course you requested does not exist, has been deleted, or you lack permissions.
        </p>
        <Button asChild className="mt-4">
          <Link href={role === "admin" ? "/admin/courses" : "/tutor/courses"}>
            Back to Courses
          </Link>
        </Button>
      </div>
    );
  }

  const isPublished = course.status === COURSE_STATUS.PUBLISHED;
  const categoryName =
    "category_name" in course && typeof course.category_name === "string"
      ? course.category_name
      : null;

  const tabs = [
    { label: "Overview", href: `/${role}/courses/${courseId}`, icon: "chart-bar", exact: true },
    { label: "Chapters", href: `/${role}/courses/${courseId}/chapters`, icon: "hierarchy", exact: false },
    { label: "FAQs", href: `/${role}/courses/${courseId}/faqs`, icon: "help-circle", exact: false },
    { label: "Students", href: `/${role}/courses/${courseId}/enrollments`, icon: "users", exact: false },
    { label: "Updates", href: `/${role}/courses/${courseId}/updates`, icon: "world", exact: false },
    { label: "Coupons", href: `/${role}/courses/${courseId}/coupons`, icon: "ticket", exact: false },
    { label: "Settings", href: `/${role}/courses/${courseId}/settings`, icon: "settings", exact: false },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Header Card */}
      <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isPublished ? "default" : "secondary"} className="capitalize font-medium">
                {course.status}
              </Badge>
              {categoryName ? (
                <Badge variant="outline" className="text-muted-foreground">
                  {categoryName}
                </Badge>
              ) : null}
              <span className="text-xs text-muted-foreground">
                Last updated {formatDate(course.updated_at)}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {course.title}
            </h1>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {course.short_description || "No short description provided."}
            </p>

            {/* Tutor info if admin */}
            {role === "admin" && "tutor" in course && course.tutor && (
              <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Tutor:</span>
                <span>{course.tutor.name}</span>
              </div>
            )}
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {role === "tutor" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusDialogOpen(true)}
              >
                <Icon name="adjustments" className="mr-1.5 size-4" />
                Change Status
              </Button>
            )}

            {course.slug && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/courses/${course.slug}`} target="_blank">
                  <Icon name="external-link" className="mr-1.5 size-4" />
                  View Public Page
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <CourseStatCards course={course} />

      {/* Navigation Tab Bar */}
      <div className="w-full">
        <nav
          className="inline-flex w-fit h-auto p-1 bg-muted/60 flex-wrap gap-1 rounded-lg border border-border/40"
          aria-label="Course navigation"
        >
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
                )}
              >
                <Icon name={tab.icon as any} className="size-4" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Active Tab Page Content */}
      <div className="w-full">{children}</div>

      {/* Course Status Dialog (Tutor only) */}
      {role === "tutor" && (
        <CourseStatusDialog
          course={course}
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
        />
      )}
    </div>
  );
}
