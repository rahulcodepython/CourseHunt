"use client";

import * as React from "react";
import {
  useUpdatesQuery,
  useCreateUpdateMutation,
  useUpdateUpdateMutation,
  useDeleteUpdateMutation,
} from "@/query-hooks/updates.api";
import type { CourseUpdate } from "@/schema/updates.types";
import { PageHeader } from "@/components/page-header";
import { LoadingButton } from "@/components/loading-button";
import { DataTable } from "@/components/data-table";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { FormDialog } from "@/components/form-dialog";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getColumns } from "./columns";

const updateSchema = z.object({
  message: z.string().min(1, "Message is required"),
  courseId: z.string().optional(),
});

type UpdateFormData = z.infer<typeof updateSchema>;

function UpdateDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: CourseUpdate | null;
}) {
  const createMutation = useCreateUpdateMutation();
  const updateMutation = useUpdateUpdateMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      message: editing?.message ?? "",
      courseId: editing?.course?.id ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        message: editing?.message ?? "",
        courseId: editing?.course?.id ?? "",
      });
    }
  }, [open, editing, reset]);

  const onSubmit = async (data: UpdateFormData) => {
    if (editing) {
      await updateMutation.execute({
        id: editing.id,
        data: { message: data.message.trim() },
      });
    } else {
      await createMutation.execute({
        message: data.message.trim(),
        course_id: data.courseId || undefined,
      });
    }
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit Update" : "Create Update"}
      description="Publish a platform announcement or course update"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="upd-message">Message</Label>
          <Textarea
            id="upd-message"
            placeholder="What's new?"
            {...register("message")}
            rows={4}
          />
          {errors.message && (
            <p className="text-xs text-red-400">{errors.message.message}</p>
          )}
        </div>
        {!editing && (
          <div className="space-y-1.5">
            <Label htmlFor="upd-course">Course ID (optional)</Label>
            <Input
              id="upd-course"
              placeholder="Leave empty for platform-wide"
              {...register("courseId")}
            />
            <p className="text-xs text-muted-foreground">
              If empty, the update is shown platform-wide.
            </p>
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {editing ? "Save Changes" : "Create"}
          </LoadingButton>
        </DialogFooter>
      </form>
    </FormDialog>
  );
}

export default function UpdatesPage() {
  const { data: rawUpdates, isLoading } = useUpdatesQuery();
  const deleteMutation = useDeleteUpdateMutation();

  const updates: CourseUpdate[] = (rawUpdates?.data?.data as any) ?? [];

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CourseUpdate | null>(null);
  const [deleting, setDeleting] = React.useState<CourseUpdate | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (u: CourseUpdate) => {
    setEditing(u);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleting) {
      await deleteMutation.execute(deleting.id);
      setDeleting(null);
    }
  };

  const columns = getColumns(openEdit, setDeleting);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Updates"
        subtitle="Manage platform announcements and course updates"
        actions={
          <Button onClick={openCreate}>
            <Icon name="plus" className="size-4" />
            Create Update
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={updates}
        searchPlaceholder="Search updates..."
        emptyIcon="world"
        emptyText="No updates found"
        isLoading={isLoading}
        loadingText="Loading updates..."
      />

      <UpdateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        title="Delete Update"
        description="Are you sure you want to delete this update? This action cannot be undone."
        confirmText="Delete Update"
      />
    </div>
  );
}
