"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useManageCourseQuery, useDeleteCourseMutation } from "@/query-hooks/courses.api";
import type { Course, AdminCourseDetail } from "@/schema/courses.types";
import { Loading } from "@/components/common/loading";
import { CourseSettingsTab } from "@/components/courses/manage/course-settings-tab";
import { ConfirmDeleteDialog } from "@/components/dialogs/confirm-delete-dialog";

export function CourseSettingsPage({
  courseId,
  role,
}: {
  courseId: string;
  role: "admin" | "tutor";
}) {
  const router = useRouter();
  const { data: rawCourse, isLoading } = useManageCourseQuery(
    courseId,
    role === "admin" ? "admin" : "tutor",
  );
  const course = rawCourse as (Course | AdminCourseDetail) | undefined;

  const deleteCourseMutation = useDeleteCourseMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const handleDeleteCourse = async () => {
    try {
      await deleteCourseMutation.execute(courseId);
      toast.success("Course deleted successfully");
      router.push(role === "admin" ? "/admin/courses" : "/tutor/courses");
    } catch {
      // handled in mutation
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!course) {
    return null;
  }

  return (
    <React.Fragment>
      <CourseSettingsTab
        course={course}
        role={role}
        onDeleteRequest={() => setDeleteDialogOpen(true)}
      />

      {role === "tutor" && (
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteCourse}
          loading={deleteCourseMutation.isPending}
          title="Permanently Delete Course"
          description={`Are you sure you want to permanently delete "${course.title}"? This is an irreversible action. All chapters, lessons, quizzes, resources, discussions, and associated enrollment records will be permanently destroyed.`}
          confirmText="Yes, Delete Course"
          variant="destructive"
        />
      )}
    </React.Fragment>
  );
}
