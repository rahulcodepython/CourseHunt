"use client";

import * as React from "react";
import { useUsersQuery } from "@/query-hooks/users.api";
import { useSessionStore } from "@/store/session.store";
import { hasPermission } from "@/lib/permissions";
import { getPrimaryRole } from "@/lib/roles";
import { ROLES, PERMISSIONS } from "@/lib/const";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { ManageRolesDialog } from "@/components/manage-roles-dialog";
import type { UserListResponse } from "@/schema/users.types";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { getColumns } from "./columns";

export default function AdminsPage() {
    const permissions = useSessionStore((s) => s.permissions);
    const canCreateAdmin = hasPermission(permissions, PERMISSIONS.ADMIN_USERS_ROLE_ASSIGN);

    const { data: rawAdmins, isLoading } = useUsersQuery({ role: ROLES.ADMIN });
    const [selectedUser, setSelectedUser] = React.useState<UserListResponse | null>(null);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [createOpen, setCreateOpen] = React.useState(false);

    const rawList: UserListResponse[] = rawAdmins?.data?.data ?? [];
    const admins: UserListResponse[] = rawList.filter((u) => getPrimaryRole(u) === ROLES.ADMIN);

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
                userId={selectedUser?.id ?? null}
                userName={selectedUser?.name}
                currentRoles={selectedUser?.roles ?? []}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />

            {canCreateAdmin && (
                <CreateUserDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    title="Create Admin"
                    authRole={ROLES.ADMIN}
                />
            )}
        </div>
    );
}
