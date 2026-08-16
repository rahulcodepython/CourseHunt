"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { EnrollmentAccessTable } from "@/components/enrollment-access-table";

import { useCourseLandingQuery } from "@/query-hooks/courses.api";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";

export default function CourseEnrollmentsPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId as string;

  const { data: courseData } = useCourseLandingQuery(courseId);
  useSetBreadcrumbs([
    { label: "Courses", href: "/courses" },
    { label: courseData?.data?.title || "Course", href: `/courses/overview/${courseId}` },
    { label: "Enrolled Users" },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/admin/courses">
            <span className="flex items-center gap-1.5">
              <Icon name="arrow-left" className="size-4" />
              Back to Courses
            </span>
          </Link>
        </Button>
        <PageHeader
          title="Enrolled Users"
          subtitle="Users enrolled in this course, and their access status"
        />
      </div>

      <EnrollmentAccessTable courseId={courseId} emptyText="No users enrolled in this course" />
    </div>
  );
}
