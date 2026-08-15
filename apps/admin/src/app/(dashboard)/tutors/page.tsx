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
import { getPrimaryRole } from "@/lib/roles";
import { ROLES, PERMISSIONS } from "@/lib/const";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { ManageRolesDialog } from "@/components/manage-roles-dialog";
import type { UserListResponse } from "@/schema/users.types";

export default function TutorsPage() {
  const permissions = useSessionStore((s) => s.permissions);
  const canCreateTutor = hasPermission(permissions, PERMISSIONS.ADMIN_USERS_ROLE_ASSIGN);

  const { data: rawTutors, isLoading } = useUsersQuery({ role: ROLES.TUTOR });
  const [createOpen, setCreateOpen] = React.useState(false);
  const [selectedTutor, setSelectedTutor] = React.useState<UserListResponse | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const rawList: UserListResponse[] = rawTutors?.data?.data ?? [];
  const tutors = rawList.filter((u) => getPrimaryRole(u) === ROLES.TUTOR);

  const handleManage = (tutor: UserListResponse) => {
    setSelectedTutor(tutor);
    setDialogOpen(true);
  };

  const columns = React.useMemo(() => getColumns(handleManage), []);

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
    </div>
  );
}
