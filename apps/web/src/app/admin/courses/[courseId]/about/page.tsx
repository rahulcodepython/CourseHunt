"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AdminCourseAboutRedirect() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/admin/courses/${params.courseId}/settings`);
  }, [params.courseId, router]);

  return null;
}
