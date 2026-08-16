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
import { CollapsibleCheckboxList } from "@/components/collapsible-checkbox-list";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCrudDialogState } from "@/hooks/use-crud-dialog-state";
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

  return (
    <div className="space-y-3">
      <CollapsibleCheckboxList
        title="Select Permissions"
        items={(allPermissions?.data ?? []).map((permission: Permission) => ({
          id: permission.id,
          label: permission.name,
        }))}
        selected={selected}
        onChange={(next) => {
          setSelected(next);
          setDirty(true);
        }}
        maxHeight="20rem"
        emptyMessage="No permissions available"
      />
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

  const {
    dialogOpen: createOpen,
    setDialogOpen: setCreateOpen,
    deleting,
    setDeleting,
    requestDelete,
    confirmDelete,
  } = useCrudDialogState<Role>();
  const [expandedRoleId, setExpandedRoleId] = React.useState<string | null>(null);

  const { data: rolePermissions } = useRolePermissionsQuery(expandedRoleId || "");

  const handleToggleExpand = (roleId: string) => {
    setExpandedRoleId((prev) => (prev === roleId ? null : roleId));
  };

  const handleSavePermissions = async (roleId: string, permissionIds: string[]) => {
    try {
      await updateRolePermissions.mutateAsync({ id: roleId, data: { permission_ids: permissionIds } });
      setExpandedRoleId(null);
    } catch {
      // handled by mutation
    }
  };

  if (isLoading || (!rolesRaw?.data && !roles.length)) {
    return <Loading />;
  }

  const columns = getColumns(expandedRoleId, handleToggleExpand, requestDelete);
  const selectedRole = roles.find((r) => r.id === expandedRoleId);

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

      <FormDialog
        open={!!expandedRoleId}
        onOpenChange={(open) => !open && setExpandedRoleId(null)}
        title={`Manage Permissions · ${selectedRole?.name ?? ""}`}
        description="Select permissions to grant for this custom role."
      >
        {expandedRoleId && (
          <PermissionsGrid
            roleId={expandedRoleId}
            rolePermissions={(rolePermissions?.data ?? []).map((p: Permission) => p.id)}
            onSave={handleSavePermissions}
            isSaving={updateRolePermissions.isPending}
          />
        )}
      </FormDialog>

      <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => confirmDelete(deleteRole.execute)}
        loading={deleteRole.isPending}
        title="Delete Role"
        description={`Are you sure you want to delete the role "${deleting?.name}"? This action cannot be undone.`}
        confirmText="Delete Role"
      />
    </div>
  );
}
