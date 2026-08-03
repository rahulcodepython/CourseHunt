"use client";

import * as React from "react";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@package/ui/dialog";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@package/ui/table";
import { useRolesQuery, usePermissionsQuery, useCreateRoleMutation, useDeleteRoleMutation, useRolePermissionsQuery, useUpdateRolePermissionsMutation } from "@package/query-hooks/roles.api";
import type { Role, Permission } from "@package/schema/roles.types";
import { PageHeader } from "@package/components/page-header";
import { LoadingSpinner as Loading } from "@package/components/loading";
import LoadingButton from "@package/components/loading-button";
import { ConfirmDeleteDialog } from "@package/components/confirm-delete-dialog";
import { cn } from "@package/lib/utils";

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
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {(allPermissions?.data ?? []).map((permission: Permission) => {
          const isSelected = selected.includes(permission.id);
          return (
            <button
              key={permission.id}
              type="button"
              onClick={() => toggle(permission.id)}
              className={cn(
                "flex items-center gap-2 rounded border px-2 py-1 text-sm transition-colors cursor-pointer",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-muted-foreground",
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
                {isSelected && <Icon name="IconCheck" className="size-3" />}
              </span>
              <span className="truncate font-mono text-xs">
                {permission.name}
              </span>
            </button>
          );
        })}
      </div>
      <LoadingButton
        isLoading={isSaving}
        title="Saving..."
        className="w-full sm:w-auto"
      >
        <Button size="sm" disabled={!dirty} onClick={() => onSave(roleId, selected)}>
          Save Permissions
        </Button>
      </LoadingButton>
    </div>
  );
}

function CreateRoleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useCreateRoleMutation();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await mutation.mutateAsync({ name: name.trim(), description: description.trim() });
      setName("");
      setDescription("");
      onOpenChange(false);
    } catch {
      // handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Role</DialogTitle>
          <DialogDescription>
            Add a new custom role to the platform
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="role-name">Role Name</Label>
            <Input
              id="role-name"
              placeholder="e.g. moderator"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-mono"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-desc">Description</Label>
            <Input
              id="role-desc"
              placeholder="What can this role do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
            <LoadingButton isLoading={mutation.isPending}>
              <Button type="submit">Create Role</Button>
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function RolesPage() {
    const { data: roles, isLoading } = useRolesQuery();
    const deleteRole = useDeleteRoleMutation();
    const updateRolePermissions = useUpdateRolePermissionsMutation();

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

    if (isLoading || !roles?.data) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Roles & Permissions"
                    subtitle="Manage access control roles and their permissions"
                />
                <Loading />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Roles & Permissions"
                subtitle="Manage access control roles and their permissions"
                actions={
                    <Button onClick={() => setCreateOpen(true)}>
                        <Icon name="IconPlus" className="size-4" />
                        Create Role
                    </Button>
                }
            />

            <Card>
                <CardHeader>
                    <CardTitle>All Roles</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>System</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.data.map((role: Role) => (
                                <React.Fragment key={role.id}>
                                    <TableRow className={cn(expandedRoleId === role.id && "bg-muted/50")}>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono">{role.name}</Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{role.description ?? "-"}</TableCell>
                                        <TableCell>
                                            {role.is_system ? (
                                                <Badge variant="outline" className="gap-1 text-muted-foreground">
                                                    <Icon name="IconLock" className="size-3" />
                                                    System
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">Custom</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() => handleToggleExpand(role.id)}
                                                    aria-label="Manage permissions"
                                                >
                                                    <Icon
                                                        name="IconShield"
                                                        className={cn(
                                                            "size-4",
                                                            expandedRoleId === role.id ? "text-primary" : "text-muted-foreground",
                                                        )}
                                                    />
                                                </Button>
                                                {!role.is_system && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-destructive hover:text-destructive"
                                                        onClick={() => setDeleting(role)}
                                                        aria-label="Delete role"
                                                    >
                                                        <Icon name="IconTrash" className="size-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    {expandedRoleId === role.id && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="bg-muted/30 px-4 py-4">
                                                <PermissionsGrid
                                                    roleId={role.id}
                                                    rolePermissions={(rolePermissions?.data ?? []).map((p: Permission) => p.id)}
                                                    onSave={handleSavePermissions}
                                                    isSaving={updateRolePermissions.isPending}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} />

            <ConfirmDeleteDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                onConfirm={handleDelete}
                title="Delete Role"
                description={`Are you sure you want to delete the role "${deleting?.name}"? This action cannot be undone.`}
                isLoading={deleteRole.isPending}
            />
        </div>
    );
}
