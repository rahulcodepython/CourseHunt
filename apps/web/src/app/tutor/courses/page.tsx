"use client";

import * as React from "react";

import { useManageCoursesQuery, useDeleteCourseMutation } from "@/query-hooks/courses.api";
import type { Course } from "@/schema/courses.types";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { useCrudDialogState } from "@/hooks/use-crud-dialog-state";
import { getColumns } from "./columns";
import { CourseModal } from "./course-modal";

export default function TutorCoursesPage() {
  const { data: rawCourses, isLoading } = useManageCoursesQuery();
  const deleteMutation = useDeleteCourseMutation();
  const courses: Course[] = (rawCourses?.data?.data as any) ?? [];

  const {
    dialogOpen,
    setDialogOpen,
    editing,
    openCreate,
    openEdit,
    deleting,
    setDeleting,
    requestDelete,
    confirmDelete,
  } = useCrudDialogState<Course>();

  const columns = getColumns(openEdit, requestDelete);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Courses"
        subtitle="Create, edit and manage the courses you teach"
        actions={
          <Button onClick={openCreate}>
            <Icon name="plus" className="size-4" />
            Create Course
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={courses}
        searchPlaceholder="Search courses..."
        emptyIcon="book"
        emptyText="No courses found"
        isLoading={isLoading}
        loadingText="Loading courses..."
      />

      <CourseModal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingCourse={editing}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => confirmDelete(deleteMutation.execute)}
        loading={deleteMutation.isPending}
        title="Delete Course"
        description={`Are you sure you want to delete "${deleting?.title}"? This will also delete all its chapters and lessons. This action cannot be undone.`}
        confirmText="Delete Course"
      />
    </div>
  );
}