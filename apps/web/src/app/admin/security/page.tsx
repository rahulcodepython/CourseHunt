"use client";

import * as React from "react";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { DataTable } from "@/components/data-table";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCursorFeed } from "@/hooks/use-cursor-feed";
import { fetchSecurityEvents, useSecurityStatsQuery } from "@/query-hooks/security.api";
import { queryKeys } from "@/react-query/query-keys";
import { securityColumns } from "./columns";

const POLL_INTERVAL_MS = 30 * 1000;

function SecurityEventsTable({ eventType, emptyText }: { eventType: string; emptyText: string }) {
  const { items, loadMore, hasMore, refresh, isLoading, isFetching } = useCursorFeed(
    queryKeys.securityFeed(eventType),
    (params) => fetchSecurityEvents(eventType, params),
    { limit: 10, refetchInterval: POLL_INTERVAL_MS },
  );

  return (
    <DataTable
      columns={securityColumns}
      data={items}
      pageSize={1000}
      searchPlaceholder="Search..."
      emptyIcon="shield"
      emptyText={emptyText}
      isLoading={isLoading}
      exportFilename={eventType}
      toolbarActions={
        <>
          <Button variant="outline" size="sm" disabled={isFetching} onClick={() => refresh()}>
            <Icon name="refresh" className="size-4" />
            Refresh
          </Button>
          {hasMore && (
            <Button variant="outline" size="sm" disabled={isFetching} onClick={() => loadMore()}>
              <Icon name="chevron-down" className="size-4" />
              Load Older
            </Button>
          )}
        </>
      }
    />
  );
}

export default function SecurityPage() {
  const { data: statsResp } = useSecurityStatsQuery(POLL_INTERVAL_MS);
  const stats = statsResp?.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Security" subtitle="Monitor platform security and access activity" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Logins Today" value={String(stats?.logins_today ?? "—")} icon="lock" />
        <StatCard
          title="Unauthorized Attempts (24h)"
          value={String(stats?.unauthorized_last_24h ?? "—")}
          icon="ban"
          iconClassName="text-red-600"
        />
        <StatCard title="Banned Users" value={String(stats?.banned_users ?? "—")} icon="user" />
        <StatCard
          title="Rate Limit Hits (24h)"
          value={String(stats?.rate_limit_hits_last_24h ?? "—")}
          icon="shield"
          iconClassName="text-amber-500"
        />
      </div>

      <Tabs defaultValue="login" className="space-y-4">
        <TabsList>
          <TabsTrigger value="login">Logins</TabsTrigger>
          <TabsTrigger value="unauthorized_access">Unauthorized Access</TabsTrigger>
          <TabsTrigger value="rate_limit_exceeded">Rate Limited</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <SecurityEventsTable eventType="login" emptyText="No logins recorded" />
        </TabsContent>
        <TabsContent value="unauthorized_access">
          <SecurityEventsTable
            eventType="unauthorized_access"
            emptyText="No unauthorized access attempts"
          />
        </TabsContent>
        <TabsContent value="rate_limit_exceeded">
          <SecurityEventsTable eventType="rate_limit_exceeded" emptyText="No rate-limit hits" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
