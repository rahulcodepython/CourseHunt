"use client";

import * as React from "react";
import { useAssignRoleMutation, useRevokeRoleMutation, useUsersQuery } from "@/query-hooks/users.api";
import { useSessionStore } from "@/store/session.store";
import { hasPermission } from "@/lib/permissions";
import { getPrimaryRole } from "@/lib/roles";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { useRolesQuery } from "@/query-hooks/roles.api";
import type { UserListResponse } from "@/schema/users.types";
import type { Role } from "@/schema/roles.types";
import { PageHeader } from "@/components/page-header";
import { LoadingButton } from "@/components/loading-button";
import { DataTable } from "@/components/data-table";
import { FormDialog } from "@/components/form-dialog";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getColumns } from "./columns";

const assignRoleSchema = z.object({
    roleId: z.string().min(1, "Please select a role"),
});

type AssignRoleFormData = z.infer<typeof assignRoleSchema>;

function ManageRolesDialog({
    user,
    open,
    onOpenChange,
}: {
    user: UserListResponse | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data: rawRoles } = useRolesQuery();
    const assignRoleMutation = useAssignRoleMutation();
    const revokeRoleMutation = useRevokeRoleMutation();

    const roles: Role[] = rawRoles?.data ?? [];
    const customRoles = roles.filter((r) => !r.is_system);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AssignRoleFormData>({
        resolver: zodResolver(assignRoleSchema),
        defaultValues: {
            roleId: "",
        },
    });

    const handleAssign = async (data: AssignRoleFormData) => {
        if (!user) return;
        const res = await assignRoleMutation.execute({
            id: user.id,
            data: { role_id: data.roleId },
        });
        if (res?.success) {
            reset({ roleId: "" });
        }
    };

    const handleRevoke = async (roleId: string) => {
        if (!user) return;
        await revokeRoleMutation.execute({
            id: user.id,
            data: { role_id: roleId },
        });
    };

    const currentCustomRoles = user?.roles.filter((r) => r.name !== "admin") ?? [];
    const isPending = assignRoleMutation.isPending || revokeRoleMutation.isPending;

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={`Manage Roles · ${user?.name ?? ""}`}
            description="Assign or revoke custom roles for this admin user."
        >
            <div className="space-y-4">
                <form onSubmit={handleSubmit(handleAssign)} className="flex items-end gap-2">
                    <div className="flex-1 space-y-1.5">
                        <Label>Custom Role</Label>
                        <Controller
                            control={control}
                            name="roleId"
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customRoles.length > 0 ? (
                                            customRoles.map((role) => (
                                                <SelectItem key={role.id} value={role.id}>
                                                    {role.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-3 text-center text-xs text-muted-foreground">
                                                No custom roles available
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.roleId && (
                            <p className="text-xs text-red-400">{errors.roleId.message}</p>
                        )}
                    </div>
                    <LoadingButton
                        type="submit"
                        loading={isPending}
                    >
                        Assign
                    </LoadingButton>
                </form>

                <div className="space-y-2">
                    <p className="text-sm font-medium">Current Roles</p>
                    {
                        currentCustomRoles.length > 0 ? currentCustomRoles.map((role) => <div
                            key={role.id}
                            className="flex items-center justify-between rounded-lg border px-3 py-2"
                        >
                            <Badge variant="secondary" className="capitalize">
                                {role.name}
                            </Badge>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRevoke(role.id ?? role.name)}
                                disabled={isPending}
                                aria-label={`Revoke ${role.name}`}
                            >
                                <Icon name="x" className="size-4" />
                            </Button>
                        </div>
                        )
                            : <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                                No custom roles assigned
                            </p>
                    }
                </div>
            </div>
            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Close
                </Button>
            </DialogFooter>
        </FormDialog>
    );
}

export default function AdminsPage() {
    const permissions = useSessionStore((s) => s.permissions);
    const canCreateAdmin = hasPermission(permissions, "admin:users:role:assign");

    const { data: rawAdmins, isLoading } = useUsersQuery({ role: "admin" });
    const [selectedUser, setSelectedUser] = React.useState<UserListResponse | null>(null);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [createOpen, setCreateOpen] = React.useState(false);

    const rawList: UserListResponse[] = rawAdmins?.data?.data ?? [];
    const admins: UserListResponse[] = rawList.filter((u) => getPrimaryRole(u) === "admin");

    const handleManage = (user: UserListResponse) => {
        setSelectedUser(user);
        setDialogOpen(true);
    };

    const columns = React.useMemo(() => getColumns(handleManage), []);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Admin Users"
                subtitle="View platform administrators and manage role assignments"
                actions={
                    canCreateAdmin ? <Button onClick={() => setCreateOpen(true)}>
                        <Icon name="plus" className="size-4" />
                        Create Admin
                    </Button>
                        : null
                }
            />

            <DataTable
                columns={columns}
                data={admins}
                emptyIcon="user-check"
                emptyText="No admin users found"
                isLoading={isLoading}
                loadingText="Loading admin users..."
            />

            <ManageRolesDialog
                user={selectedUser}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />

            {canCreateAdmin && (
                <CreateUserDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    title="Create Admin"
                    mode="admin"
                />
            )}
        </div>
    );
}
