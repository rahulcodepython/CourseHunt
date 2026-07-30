"use client";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@package/ui/dialog";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@package/ui/table";
import { useRolesQuery, usePermissionsQuery, useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation, useRolePermissionsQuery, useUpdateRolePermissionsMutation } from "@package/query-hooks/roles.api";
import type { Role, Permission } from "@package/schema/roles.types";
import { useState } from "react";
import { toast } from "sonner";

export default function RolesPage() {
    const { data: roles, isLoading } = useRolesQuery();
    const { data: allPermissions } = usePermissionsQuery();
    const createRole = useCreateRoleMutation();
    const updateRole = useUpdateRoleMutation();
    const deleteRole = useDeleteRoleMutation();
    const updateRolePermissions = useUpdateRolePermissionsMutation();

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleDescription, setNewRoleDescription] = useState("");
    const [expandedRoleId, setExpandedRoleId] = useState<number | null>(null);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

    const { data: rolePermissions } = useRolePermissionsQuery(expandedRoleId || 0);

    const handleCreateRole = async () => {
        if (!newRoleName) return;
        try {
            await createRole.mutateAsync({ name: newRoleName, description: newRoleDescription || undefined });
            setCreateDialogOpen(false);
            setNewRoleName("");
            setNewRoleDescription("");
            toast.success("Role created");
        } catch {
            // handled by mutation
        }
    };

    const handleDeleteRole = async (role: Role) => {
        if (!confirm(`Delete role "${role.name}"?`)) return;
        try {
            await deleteRole.mutateAsync(role.id);
            toast.success("Role deleted");
        } catch {
            // handled by mutation
        }
    };

    const handleToggleExpand = (roleId: number) => {
        if (expandedRoleId === roleId) {
            setExpandedRoleId(null);
            setSelectedPermissionIds([]);
        } else {
            setExpandedRoleId(roleId);
        }
    };

    const handleTogglePermission = (permId: number) => {
        setSelectedPermissionIds((prev) =>
            prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId],
        );
    };

    const handleSavePermissions = async (roleId: number) => {
        try {
            await updateRolePermissions.mutateAsync({ id: roleId, data: { permission_ids: selectedPermissionIds } });
            toast.success("Permissions updated");
        } catch {
            // handled by mutation
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Roles & Permissions</h1>
                    <p className="text-muted-foreground text-sm">Create and manage roles, assign permissions to users</p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Icon name="IconPlus" className="mr-1 h-4 w-4" /> Create Role
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Role</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Role Name</Label>
                                <Input placeholder="e.g. moderator" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input placeholder="Describe this role's purpose" value={newRoleDescription} onChange={(e) => setNewRoleDescription(e.target.value)} />
                            </div>
                            <Button className="w-full" onClick={handleCreateRole} disabled={createRole.isPending}>
                                {createRole.isPending ? "Creating..." : "Create Role"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

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
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                        <Icon name="IconLoader" className="h-5 w-5 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : (roles?.data || []).map((role: Role) => (
                                <>
                                    <TableRow key={role.id}>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono">{role.name}</Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{role.description || "-"}</TableCell>
                                        <TableCell>
                                            {role.is_system ? (
                                                <Badge variant="outline" className="text-muted-foreground">
                                                    <Icon name="IconLock" className="h-3 w-3 mr-1" /> System
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">Custom</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleToggleExpand(role.id)}
                                                >
                                                    <Icon name="IconShield" className="h-4 w-4" />
                                                </Button>
                                                {!role.is_system && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive"
                                                            onClick={() => handleDeleteRole(role)}
                                                            disabled={deleteRole.isPending}
                                                        >
                                                            <Icon name="IconTrash" className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    {expandedRoleId === role.id && (
                                        <TableRow key={`${role.id}-perms`}>
                                            <TableCell colSpan={4} className="bg-muted/50">
                                                <div className="p-4 space-y-3">
                                                    <h4 className="font-medium text-sm">Permissions</h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                        {(allPermissions?.data || []).map((perm: Permission) => (
                                                            <button
                                                            key={perm.id}
                                                            type="button"
                                                            className={`flex items-center gap-2 text-sm px-2 py-1 rounded border cursor-pointer transition-colors ${
                                                                selectedPermissionIds.includes(perm.id)
                                                                    ? "bg-primary/10 border-primary text-primary"
                                                                    : "border-border hover:border-muted-foreground"
                                                            }`}
                                                            onClick={() => handleTogglePermission(perm.id)}
                                                        >
                                                            {perm.name}
                                                        </button>
                                                        ))}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleSavePermissions(role.id)}
                                                        disabled={updateRolePermissions.isPending}
                                                    >
                                                        {updateRolePermissions.isPending ? "Saving..." : "Save Permissions"}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
