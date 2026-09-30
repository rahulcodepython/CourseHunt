"use client";

import * as React from "react";
import {
  useInfiniteUpdatesQuery,
  useCreateUpdateMutation,
  useUpdateUpdateMutation,
  useDeleteUpdateMutation,
} from "@/query-hooks/updates.api";
import type { CourseUpdate } from "@/schema/updates.types";
import { LoadingButton } from "@/components/common/loading-button";
import { DataTable } from "@/components/table/data-table";
import { ConfirmDeleteDialog } from "@/components/dialogs/confirm-delete-dialog";
import { FormDialog } from "@/components/dialogs/form-dialog";
import { Icon } from "@/components/common/icon";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCrudDialogState } from "@/hooks/use-crud-dialog-state";
import { createColumnHelper } from "@tanstack/react-table";
import { formatDate } from "@/lib/utils/format";
import { SortableColumnHeader } from "@/components/table/sortable-column-header";
import { RowActions, RowActionButton } from "@/components/table/row-actions";

const updateSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

type UpdateFormData = z.infer<typeof updateSchema>;

const columnHelper = createColumnHelper<CourseUpdate>();

function getCourseSpecificColumns(
  onEdit: (update: CourseUpdate) => void,
  onDelete: (update: CourseUpdate) => void,
) {
  return [
    columnHelper.accessor("created_at", {
      header: ({ column }) => <SortableColumnHeader column={column} label="Date" />,
      cell: ({ getValue }) => (
        <span className="text-muted-foreground whitespace-nowrap">{formatDate(getValue())}</span>
      ),
    }),
    columnHelper.accessor("message", {
      header: "Message",
      cell: ({ getValue }) => (
        <span className="block max-w-lg truncate text-foreground font-medium">{getValue()}</span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const update = row.original;
        return (
          <RowActions>
            <RowActionButton icon="pencil" label="Edit Update" onClick={() => onEdit(update)} />
            <RowActionButton
              icon="trash"
              label="Delete Update"
              onClick={() => onDelete(update)}
              destructive
            />
          </RowActions>
        );
      },
    }),
  ];
}

interface CourseUpdatesManagerProps {
  courseId: string;
  courseTitle?: string;
  role?: "admin" | "tutor";
}

export function CourseUpdatesManager({
  courseId,
  courseTitle,
  role = "tutor",
}: CourseUpdatesManagerProps) {
  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteUpdatesQuery(role, { limit: 20, course_id: courseId });

  const createMutation = useCreateUpdateMutation(role);
  const updateMutation = useUpdateUpdateMutation(role);
  const deleteMutation = useDeleteUpdateMutation(role);

  const rawUpdates: CourseUpdate[] = React.useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );
  // Ensure only this course's updates are shown
  const updates = React.useMemo(
    () => rawUpdates.filter((u) => u.course?.id === courseId),
    [rawUpdates, courseId],
  );

  const totalCount = updates.length;

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
  } = useCrudDialogState<CourseUpdate>();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: { message: "" },
  });

  React.useEffect(() => {
    if (dialogOpen) {
      reset({ message: editing?.message ?? "" });
    }
  }, [dialogOpen, editing, reset]);

  const onSubmit = async (formData: UpdateFormData) => {
    if (editing) {
      await updateMutation.execute({
        id: editing.id,
        data: { message: formData.message.trim() },
      });
    } else {
      await createMutation.execute({
        message: formData.message.trim(),
        course_id: courseId,
      });
    }
    setDialogOpen(false);
  };

  const handleDelete = () => confirmDelete(deleteMutation.execute);
  const columns = React.useMemo(
    () => getCourseSpecificColumns(openEdit, requestDelete),
    [openEdit, requestDelete],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Course Updates</h2>
          <p className="text-sm text-muted-foreground">
            Announcements and notifications broadcasted specifically to students of this course
          </p>
        </div>
        <Button onClick={openCreate}>
          <Icon name="plus" className="size-4" />
          Create Update
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={updates}
        searchPlaceholder="Search updates..."
        emptyIcon="world"
        emptyText="No updates posted for this course yet"
        isLoading={isLoading}
        loadingText="Loading updates..."
        onLoadMore={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        totalCount={totalCount}
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Course Update" : "Create Course Update"}
        description="Publish an announcement for enrolled students"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="course-name">Course</Label>
            <Input
              id="course-name"
              value={courseTitle || "Current Course"}
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="upd-message">Message</Label>
            <Textarea
              id="upd-message"
              placeholder="What's new in this course?"
              {...register("message")}
              rows={4}
            />
            {errors.message && <p className="text-xs text-red-400">{errors.message.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? "Save Changes" : "Post Update"}
            </LoadingButton>
          </DialogFooter>
        </form>
      </FormDialog>

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        title="Delete Update"
        description="Are you sure you want to delete this course update? This action cannot be undone."
        confirmText="Delete Update"
      />
    </div>
  );
}
