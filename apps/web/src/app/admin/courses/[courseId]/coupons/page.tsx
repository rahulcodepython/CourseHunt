"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useManageCourseQuery } from "@/query-hooks/courses.api";
import { CouponsManager } from "@/components/coupons/coupons-manager";

export default function AdminCourseCouponsPage() {
  const params = useParams<{ courseId: string }>();
  const { data: course } = useManageCourseQuery(params.courseId, "admin");

  return (
    <CouponsManager
      scope="admin"
      fixedCourseId={params.courseId}
      fixedCourseTitle={course?.title}
    />
  );
}
