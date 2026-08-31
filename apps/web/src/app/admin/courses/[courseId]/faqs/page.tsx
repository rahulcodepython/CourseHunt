"use client";
import * as React from "react";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useFaqsQuery } from "@/query-hooks/faqs.api";
import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/icon";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { getColumns } from "./columns";

import { useManageCourseQuery } from "@/query-hooks/courses.api";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";

export default function AdminCourseFaqsPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId as string;

  const { data: courseData } = useManageCourseQuery(courseId, "admin");
  useSetBreadcrumbs([
    { label: "Courses", href: "/admin/courses" },
    { label: courseData?.data?.title || "Course", href: `/admin/courses/overview/${courseId}` },
    { label: "FAQs" },
  ]);

  const { data: rawFaqs, isLoading } = useFaqsQuery(courseId, "admin");
  const faqs = rawFaqs?.data ?? [];
  const columns = getColumns();

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
          title="Course FAQs"
          subtitle="View the FAQs the tutor has set up for this course (read-only)"
        />
      </div>

      <DataTable
        columns={columns}
        data={faqs}
        searchPlaceholder="Search FAQs..."
        emptyIcon="help-circle"
        emptyText="No FAQs found for this course"
        isLoading={isLoading}
        loadingText="Loading FAQs..."
      />
    </div>
  );
}
