"use client";

import * as React from "react";
import { useCourseAnalyticsQuery } from "@/query-hooks/courses.api";
import { CourseAnalyticsTab } from "@/components/courses/manage/course-analytics-tab";

export function CourseOverviewPage({
  courseId,
  role,
}: {
  courseId: string;
  role: "admin" | "tutor";
}) {
  const { data: analytics, isLoading } = useCourseAnalyticsQuery(
    courseId,
    role === "admin" ? "admin" : "tutor",
  );

  return (
    <CourseAnalyticsTab
      isLoading={isLoading}
      dailySales={analytics?.daily_sales ?? []}
      monthlySales={analytics?.monthly_sales ?? []}
    />
  );
}
