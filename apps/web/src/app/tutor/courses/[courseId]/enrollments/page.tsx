"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { EnrollmentAccessTable } from "@/components/enrollment-access-table";

import { useManageCoursesQuery } from "@/query-hooks/courses.api";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";

export default function TutorCourseEnrollmentsPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId as string;

  const { data: rawCourses } = useManageCoursesQuery();
  const currentCourse = (rawCourses?.data?.data as any[])?.find((c: any) => c.id === courseId);

  useSetBreadcrumbs([
    { label: "My Courses", href: "/tutor/courses" },
    { label: currentCourse?.title || "Course", href: `/tutor/courses/${courseId}` },
    { label: "Enrolled Students" },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/tutor/courses">
            <span className="flex items-center gap-1.5">
              <Icon name="arrow-left" className="size-4" />
              Back to Courses
            </span>
          </Link>
        </Button>
        <PageHeader
          title="Enrolled Students"
          subtitle="Students enrolled in this course, and their access status"
        />
      </div>

      <EnrollmentAccessTable
        courseId={courseId}
        emptyText="No students enrolled in this course"
        showAccessActions={false}
      />
    </div>
  );
}
