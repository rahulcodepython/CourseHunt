"use client";

import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/icon";
import { DataTable } from "@/components/data-table";
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
            <PageHeader
                title="Logs"
                subtitle="Audit trail of every mutating request across the platform"
                actions={
                    <Button variant="outline" disabled={isFetching} onClick={() => refresh()}>
                        <Icon name="refresh" className="size-4" />
                        Refresh
                    </Button>
                }
            />

            <DataTable
                columns={logsColumns}
                data={items}
                pageSize={1000}
                searchPlaceholder="Search logs..."
                emptyIcon="file-text"
                emptyText="No log entries found"
                isLoading={isLoading}
                exportFilename="logs"
                toolbarActions={
                    hasMore ? (
                        <Button variant="outline" size="sm" disabled={isFetching} onClick={() => loadMore()}>
                            <Icon name="chevron-down" className="size-4" />
                            Load Older
                        </Button>
                    ) : undefined
                }
            />
        </div>
    );
}
