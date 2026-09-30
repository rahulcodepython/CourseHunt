"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useManageCourseQuery } from "@/query-hooks/courses.api";
import { CouponsManager } from "@/components/coupons/coupons-manager";

export default function TutorCourseCouponsPage() {
  const params = useParams<{ courseId: string }>();
  const { data: course } = useManageCourseQuery(params.courseId, "tutor");

  return (
    <CouponsManager
      scope="tutor"
      fixedCourseId={params.courseId}
      fixedCourseTitle={course?.title}
    />
  );
}
