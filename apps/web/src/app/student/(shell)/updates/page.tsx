"use client";

import { useUpdateFeedQuery } from "@/query-hooks/updates.api";
import type { UpdateFeedItem } from "@/schema/updates.types";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";

export default function StudentUpdatesPage() {
  const { data: raw, isLoading } = useUpdateFeedQuery({ limit: 20 });
  const updates: UpdateFeedItem[] = raw?.data?.updates?.data ?? [];

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
      />
    </div>
  );
}
