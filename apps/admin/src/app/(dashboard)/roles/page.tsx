"use client";

import * as React from "react";

import {
  useRolesQuery,
  usePermissionsQuery,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useRolePermissionsQuery,
  useUpdateRolePermissionsMutation,
} from "@/query-hooks/roles.api";
import type { Role, Permission } from "@/schema/roles.types";
import { PageHeader } from "@/components/page-header";
import { Loading } from "@/components/loading";
import { LoadingButton } from "@/components/loading-button";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { FormDialog } from "@/components/form-dialog";
import { DataTable } from "@/components/data-table";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getColumns } from "./columns";

function PermissionsGrid({
  roleId,
  rolePermissions,
  onSave,
  isSaving,
}: {
  roleId: string;
  rolePermissions: string[];
  onSave: (roleId: string, permissionIds: string[]) => void;
  isSaving: boolean;
}) {
  const { data: allPermissions } = usePermissionsQuery();
  const [selected, setSelected] = React.useState<string[]>([]);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    setSelected(rolePermissions);
    setDirty(false);
  }, [rolePermissions]);

  const toggle = (permissionId: string) => {
    setSelected((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
    setDirty(true);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Permissions Matrix
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {(allPermissions?.data ?? []).map((permission: Permission) => {
          const isSelected = selected.includes(permission.id);
          return (
            <button
              key={permission.id}
              type="button"
              onClick={() => toggle(permission.id)}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors cursor-pointer",
                isSelected
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border hover:border-muted-foreground/50",
              )}
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded border",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40",
                )}
              >
                {isSelected && <Icon name="check" className="size-3" />}
              </span>
              <span className="truncate font-mono text-xs">
                {permission.name}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-end pt-1">
        <LoadingButton
          size="sm"
          disabled={!dirty}
          loading={isSaving}
          onClick={() => onSave(roleId, selected)}
        >
          Save Permissions
        </LoadingButton>
      </div>
    </div>
  );
}

const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
});

type CreateRoleFormData = z.infer<typeof createRoleSchema>;

function CreateRoleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useCreateRoleMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: CreateRoleFormData) => {
    try {
      await mutation.mutateAsync({
        name: data.name.trim(),
        description: data.description?.trim() || "",
      });
      reset();
      onOpenChange(false);
    } catch {
      // handled by mutation
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Role"
      description="Add a new custom role to the platform"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="role-name">Role Name</Label>
          <Input
            id="role-name"
            placeholder="e.g. moderator"
            {...register("name")}
            className="font-mono"
          />
          {errors.name && (
            <p className="text-xs text-red-400">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role-desc">Description</Label>
          <Input
            id="role-desc"
            placeholder="What can this role do?"
            {...register("description")}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <LoadingButton type="submit" loading={mutation.isPending}>
            Create Role
          </LoadingButton>
        </DialogFooter>
      </form>
    </FormDialog>
  );
}

export default function RolesPage() {
  const { data: rolesRaw, isLoading } = useRolesQuery();
  const deleteRole = useDeleteRoleMutation();
  const updateRolePermissions = useUpdateRolePermissionsMutation();

  const roles: Role[] = rolesRaw?.data ?? [];

  const [createOpen, setCreateOpen] = React.useState(false);
  const [expandedRoleId, setExpandedRoleId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<Role | null>(null);

  const { data: rolePermissions } = useRolePermissionsQuery(expandedRoleId || "");

  const handleToggleExpand = (roleId: string) => {
    setExpandedRoleId((prev) => (prev === roleId ? null : roleId));
  };

  const handleSavePermissions = async (roleId: string, permissionIds: string[]) => {
    try {
      await updateRolePermissions.mutateAsync({ id: roleId, data: { permission_ids: permissionIds } });
    } catch {
      // handled by mutation
    }
  };

  const handleDelete = async () => {
    if (deleting) {
      try {
        await deleteRole.mutateAsync(deleting.id);
        setDeleting(null);
      } catch {
        // handled by mutation
      }
    }
  };

  if (isLoading || (!rolesRaw?.data && !roles.length)) {
    return <Loading />;
  }

  const columns = getColumns(expandedRoleId, handleToggleExpand, setDeleting);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Manage access control roles and their permissions"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Icon name="plus" className="size-4" />
            Create Role
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={roles}
        searchPlaceholder="Search roles..."
        emptyIcon="shield"
        emptyText="No roles found"
      />

      {expandedRoleId && (
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <PermissionsGrid
            roleId={expandedRoleId}
            rolePermissions={(rolePermissions?.data ?? []).map((p: Permission) => p.id)}
            onSave={handleSavePermissions}
            isSaving={updateRolePermissions.isPending}
          />
        </div>
      )}

      <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteRole.isPending}
        title="Delete Role"
        description={`Are you sure you want to delete the role "${deleting?.name}"? This action cannot be undone.`}
        confirmText="Delete Role"
      />
    </div>
  );
}
