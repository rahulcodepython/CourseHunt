"use client";
import * as React from "react";

import { useUsersQuery } from "@/query-hooks/users.api";
import type { UserListResponse } from "@/schema/users.types";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { ROLES } from "@/lib/const";
import { columns } from "./columns";

export default function UsersPage() {
  const { data: rawUsers, isLoading } = useUsersQuery({ role: ROLES.USER });

  const users: UserListResponse[] = rawUsers?.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle="Manage platform users"
      />

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Search users..."
        emptyIcon="users"
        emptyText="No users found"
        isLoading={isLoading}
        loadingText="Loading users..."
      />
    </div>
  );
}
