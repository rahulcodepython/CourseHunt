"use client";

import { useInfiniteUpdateFeedQuery } from "@/query-hooks/updates.api";
import type { UpdateFeedItem } from "@/schema/updates.types";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/table/data-table";
import { columns } from "./columns";

export default function StudentUpdatesPage() {
  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteUpdateFeedQuery({ limit: 20 });

  const updates: UpdateFeedItem[] = data?.pages.flatMap((page) => page.updates.data) ?? [];
  const totalCount = data?.pages[0]?.updates.total;

  return (
    <div className="space-y-6">
      <PageHeader title="Updates" subtitle="The latest announcements for you and your courses" />

      <DataTable
        columns={columns}
        data={updates}
        showColumnToggle={false}
        emptyIcon="bell"
        emptyText="No updates yet."
        isLoading={isLoading}
        loadingText="Loading updates..."
        onLoadMore={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        totalCount={totalCount}
      />
    </div>
  );
}
