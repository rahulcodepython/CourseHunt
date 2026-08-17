"use client";

import * as React from "react";
import { useUsersQuery } from "@/query-hooks/users.api";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { getColumns } from "./columns";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { useSessionStore } from "@/store/session.store";
import { hasPermission } from "@/lib/permissions";
import { ROLES, PERMISSIONS } from "@/lib/const";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { ManageRolesDialog } from "@/components/manage-roles-dialog";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { useUserBanActions } from "@/hooks/use-user-ban-actions";
import type { UserListResponse } from "@/schema/users.types";

export default function TutorsPage() {
  const permissions = useSessionStore((s) => s.permissions);
  const canCreateTutor = hasPermission(permissions, PERMISSIONS.ADMIN_USERS_ROLE_ASSIGN);
  const canChangePassword = hasPermission(permissions, PERMISSIONS.ADMIN_USERS_PASSWORD_RESET);
  const { canBan, currentUserId, handleBanToggle } = useUserBanActions();

  const { data: rawTutors, isLoading } = useUsersQuery({ role: ROLES.TUTOR });
  const [createOpen, setCreateOpen] = React.useState(false);
  const [selectedTutor, setSelectedTutor] = React.useState<UserListResponse | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [passwordTutor, setPasswordTutor] = React.useState<UserListResponse | null>(null);

  const tutors: UserListResponse[] = rawTutors?.data?.data ?? [];

  const handleManage = (tutor: UserListResponse) => {
    setSelectedTutor(tutor);
    setDialogOpen(true);
  };

  const columns = React.useMemo(
    () => getColumns(handleManage, handleBanToggle, setPasswordTutor, { canBan, canChangePassword, currentUserId }),
    [canBan, canChangePassword, currentUserId], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tutors"
        subtitle="Manage tutor profiles and their performance"
        actions={
          canCreateTutor ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Icon name="plus" className="size-4" />
              Create Tutor
            </Button>
          ) : null
        }
      />

      <DataTable
        columns={columns}
        data={tutors}
        searchPlaceholder="Search by name..."
        searchColumnKey="name"
        exportFilename="tutors"
        emptyIcon="book"
        emptyText="No tutors found"
        isLoading={isLoading}
        loadingText="Loading tutors..."
      />

      <ManageRolesDialog
        userId={selectedTutor?.id ?? null}
        userName={selectedTutor?.name}
        currentRoles={selectedTutor?.roles ?? []}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {canCreateTutor && (
        <CreateUserDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          title="Create Tutor"
          authRole={ROLES.TUTOR}
        />
      )}

      <ChangePasswordDialog
        open={!!passwordTutor}
        onOpenChange={(open) => !open && setPasswordTutor(null)}
        userId={passwordTutor?.id ?? null}
        userName={passwordTutor?.name}
        userEmail={passwordTutor?.email}
        role={ROLES.TUTOR}
      />
    </div>
  );
}
