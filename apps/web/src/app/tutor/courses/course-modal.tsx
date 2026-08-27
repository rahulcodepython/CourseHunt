"use client";

import { FormDialog } from "@/components/form-dialog";
import type { Course } from "@/schema/courses.types";
import { clearPendingUploads } from "@/lib/pending-uploads";
import { CourseForm } from "./course-form";

export function CourseModal({
  open,
  onOpenChange,
  editingCourse,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCourse: Course | null;
}) {
  return (
    <FormDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) clearPendingUploads();
        onOpenChange(o);
      }}
      title={editingCourse ? "Edit Course" : "Create Course"}
      description={
        editingCourse
          ? "Update the course details"
          : "Create a new course you want to teach"
      }
      className="max-h-[90vh] overflow-y-auto sm:max-w-4xl"
    >
      <CourseForm editingCourse={editingCourse} onSuccess={() => onOpenChange(false)} />
    </FormDialog>
  );
}