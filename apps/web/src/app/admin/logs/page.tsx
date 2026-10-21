"use client";

import * as React from "react";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/table/data-table";
import { Icon } from "@/components/common/icon";
import { Button } from "@/components/ui/button";
import { useCursorFeed } from "@/hooks/use-cursor-feed";
import { fetchLogs } from "@/query-hooks/logs.api";
import { queryKeys } from "@/react-query/query-keys";
import { logsColumns } from "./columns";

const POLL_INTERVAL_MS = 60 * 1000;

export default function LogsPage() {
  const { items, loadMore, hasMore, refresh, isLoading, isFetching } = useCursorFeed(
    queryKeys.logsFeed(),
    fetchLogs,
    { limit: 10, refetchInterval: POLL_INTERVAL_MS },
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Logs" subtitle="Audit trail of every mutating request across the platform" />

      <DataTable
        columns={logsColumns}
        data={items}
        searchPlaceholder="Search logs..."
        emptyIcon="file-text"
        emptyText="No log entries found"
        isLoading={isLoading}
        exportFilename="logs"
        onLoadMore={loadMore}
        hasNextPage={hasMore}
        isFetchingNextPage={isFetching}
        toolbarActions={
          <Button variant="outline" size="sm" disabled={isFetching} onClick={() => refresh()}>
            <Icon name="refresh" className="size-4" />
            Refresh
          </Button>
        }
      />
    </div>
  );
}
