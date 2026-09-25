"use client";

import * as React from "react";
import { useUsersQuery } from "@/query-hooks/users.api";
import { useSessionStore } from "@/store/session.store";
import { hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/const";
import { CreateUserDialog } from "@/components/dialogs/create-user-dialog";
import { ManageRolesDialog } from "@/components/dialogs/manage-roles-dialog";
import { ChangePasswordDialog } from "@/components/dialogs/change-password-dialog";
import { useUserBanActions } from "@/hooks/use-user-ban-actions";
import type { UserListResponse } from "@/schema/users.types";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/table/data-table";
import { Icon } from "@/components/common/icon";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";

interface StaffUserManagerProps {
  role: "admin" | "tutor";
  title: string;
  subtitle: string;
  createButtonLabel: string;
  getColumns: (
    onManage: (user: UserListResponse) => void,
    onBanToggle: (user: UserListResponse) => void,
    onChangePassword: (user: UserListResponse) => void,
    options: { canBan: boolean; canChangePassword: boolean; currentUserId?: string },
  ) => ColumnDef<UserListResponse, any>[];
}

export function StaffUserManager({
  role,
  title,
  subtitle,
  createButtonLabel,
  getColumns,
}: StaffUserManagerProps) {
  const permissions = useSessionStore((s) => s.permissions);
  const canCreate = hasPermission(permissions, PERMISSIONS.ADMIN_USERS_ROLE_ASSIGN);
  const canChangePassword = hasPermission(permissions, PERMISSIONS.ADMIN_USERS_PASSWORD_RESET);
  const { canBan, currentUserId, handleBanToggle } = useUserBanActions();

  const { data: rawData, isLoading } = useUsersQuery({ role });
  const [selectedUser, setSelectedUser] = React.useState<UserListResponse | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [passwordUser, setPasswordUser] = React.useState<UserListResponse | null>(null);

  const users: UserListResponse[] = rawData?.data?.data ?? [];

  const handleManage = (user: UserListResponse) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const columns = React.useMemo(
    () =>
      getColumns(handleManage, handleBanToggle, setPasswordUser, {
        canBan,
        canChangePassword,
        currentUserId,
      }),
    [canBan, canChangePassword, currentUserId, getColumns],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Icon name="plus" className="size-4" />
              {createButtonLabel}
            </Button>
          ) : null
        }
      />

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder={`Search ${role === "admin" ? "admins" : "tutors"}...`}
        emptyIcon="users"
        emptyText={`No ${role === "admin" ? "admins" : "tutors"} found`}
        isLoading={isLoading}
        loadingText={`Loading ${role === "admin" ? "admins" : "tutors"}...`}
      />

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        authRole={role}
        title={createButtonLabel}
      />

      <ManageRolesDialog
        userId={selectedUser?.id ?? null}
        userName={selectedUser?.name}
        currentRoles={selectedUser?.roles ?? []}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <ChangePasswordDialog
        open={!!passwordUser}
        onOpenChange={(open) => !open && setPasswordUser(null)}
        userId={passwordUser?.id ?? ""}
        userName={passwordUser?.name ?? ""}
        userEmail={passwordUser?.email ?? ""}
        role={role}
      />
    </div>
  );
}
