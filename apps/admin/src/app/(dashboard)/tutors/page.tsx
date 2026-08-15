"use client";

import * as React from "react";
import { useUsersQuery } from "@/query-hooks/users.api";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { useSessionStore } from "@/store/session.store";
import { hasPermission } from "@/lib/permissions";
import { getPrimaryRole } from "@/lib/roles";
import { CreateUserDialog } from "@/components/create-user-dialog";

export default function TutorsPage() {
  const permissions = useSessionStore((s) => s.permissions);
  const canCreateTutor = hasPermission(permissions, "admin:users:role:assign");

  const { data: rawTutors, isLoading } = useUsersQuery({ role: "tutor" });
  const [createOpen, setCreateOpen] = React.useState(false);

  const rawList: any[] = rawTutors?.data?.data ?? [];
  const tutors = rawList.filter((u: any) => getPrimaryRole(u) === "tutor");

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

      {canCreateTutor && (
        <CreateUserDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          title="Create Tutor"
          mode="custom"
          presetRoleName="tutor"
        />
      )}
    </div>
  );
}
