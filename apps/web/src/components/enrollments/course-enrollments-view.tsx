"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Icon } from "@/components/common/icon";
import { Button } from "@/components/ui/button";
import { EnrollmentAccessTable } from "@/components/table/enrollment-access-table";
import { useCourseSummaryQuery } from "@/query-hooks/courses.api";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";

export function CourseEnrollmentsView({ role }: { role: "admin" | "tutor" }) {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId as string;

  const isAdmin = role === "admin";
  const { data: courseSummary } = useCourseSummaryQuery(courseId);

  useSetBreadcrumbs([
    { label: isAdmin ? "Courses" : "My Courses", href: `/${role}/courses` },
    {
      label: courseSummary?.title || "Course",
      href: isAdmin
        ? `/admin/courses/${courseId}`
        : `/tutor/courses/${courseId}`,
    },
    { label: isAdmin ? "Enrolled Users" : "Enrolled Students" },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href={`/${role}/courses`}>
            <span className="flex items-center gap-1.5">
              <Icon name="arrow-left" className="size-4" />
              Back to Courses
            </span>
          </Link>
        </Button>
        <PageHeader
          title={isAdmin ? "Enrolled Users" : "Enrolled Students"}
          subtitle={
            isAdmin
              ? "Users enrolled in this course, and their access status"
              : "Students enrolled in this course, and their access status"
          }
        />
      </div>

      <EnrollmentAccessTable
        courseId={courseId}
        emptyText={
          isAdmin
            ? "No users enrolled in this course"
            : "No students enrolled in this course"
        }
        showAccessActions={isAdmin}
      />
    </div>
  );
}
