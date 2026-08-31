"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "@/query-hooks/categories.api";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Loading } from "@/components/loading";
import { LoadingButton } from "@/components/loading-button";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { FormDialog } from "@/components/form-dialog";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCrudDialogState } from "@/hooks/use-crud-dialog-state";
import type { Category } from "@/schema/category.types";
import { getColumns } from "./columns";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  parentId: z.string(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

function CategoryDialog({
  open,
  onOpenChange,
  editing,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Category | null;
  categories: Category[];
}) {
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: editing?.name ?? "",
      parentId: editing?.parent_id ?? "none",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: editing?.name ?? "",
        parentId: editing?.parent_id ?? "none",
      });
    }
  }, [open, editing, reset]);

  const onSubmit = async (data: CategoryFormData) => {
    if (editing) {
      await updateMutation.execute({ id: editing.id, data: { name: data.name.trim() } });
    } else {
      await createMutation.execute({
        name: data.name.trim(),
        parent_id: data.parentId === "none" ? undefined : data.parentId,
      });
    }
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit Category" : "Create Category"}
      description={editing ? "Update the category name" : "Add a new course category"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="cat-name">Name</Label>
          <Input id="cat-name" placeholder="e.g. Web Development" {...register("name")} />
          {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
        </div>
        {!editing && (
          <div className="space-y-1.5">
            <Label>Parent Category</Label>
            <Controller
              control={control}
              name="parentId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Top Level)</SelectItem>
                    {categories
                      .filter((c) => !c.parent_id)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            loading={createMutation.isPending || !!updateMutation?.isPending}
          >
            {editing ? "Save Changes" : "Create"}
          </LoadingButton>
        </DialogFooter>
      </form>
    </FormDialog>
  );
}

export default function CategoriesPage() {
  const { data: raw, isLoading } = useCategoriesQuery();
  const categories: Category[] = Array.isArray(raw?.data)
    ? raw.data
    : ((raw?.data as { data?: Category[] } | undefined)?.data ?? []);
  const deleteMutation = useDeleteCategoryMutation();
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
  } = useCrudDialogState<Category>();

  if (isLoading || (!raw?.data && !categories.length)) {
    return <Loading />;
  }

  const columns = getColumns(categories, openEdit, requestDelete);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        subtitle="Organize courses with categories and subcategories"
        actions={
          <Button onClick={openCreate}>
            <Icon name="plus" className="size-4" />
            Create Category
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={categories}
        getSubRows={(category) => category.subcategories}
        searchPlaceholder="Search categories..."
        exportFilename="categories"
        emptyIcon="folder"
        emptyText="No categories found"
      />

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        categories={categories}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => confirmDelete(deleteMutation.execute)}
        loading={deleteMutation.isPending}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        confirmText="Delete Category"
      />
    </div>
  );
}
