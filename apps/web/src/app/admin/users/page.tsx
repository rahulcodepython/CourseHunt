"use client";
import * as React from "react";

import { useInfiniteUsersQuery } from "@/query-hooks/users.api";
import type { UserListResponse } from "@/schema/users.types";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/table/data-table";
import { ROLES } from "@/lib/constants/const";
import { useUserBanActions } from "@/hooks/use-user-ban-actions";
import { getColumns } from "./columns";

export default function UsersPage() {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteUsersQuery({ role: ROLES.USER, limit: 12 });
  const { canBan, currentUserId, handleBanToggle } = useUserBanActions();

  const users: UserListResponse[] = React.useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );
  const totalCount = data?.pages[0]?.total ?? 0;

  const columns = React.useMemo(
    () => getColumns(handleBanToggle, { canBan, currentUserId }),
    [canBan, currentUserId], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle="Manage platform users" />

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Search users..."
        emptyIcon="users"
        emptyText="No users found"
        isLoading={isLoading}
        loadingText="Loading users..."
        onLoadMore={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        totalCount={totalCount}
      />
    </div>
  );
}
