"use client";

import * as React from "react";
import { toast } from "sonner";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { PageHeader } from "@package/components/page-header";
import { LoadingSpinner as Loading } from "@package/components/loading";
import { useAdminProfilesQuery } from "@package/query-hooks/users.api";
import type { AdminProfileItem } from "@package/schema/users.types";

export default function TutorsPage() {
  const [page, setPage] = React.useState(1);
  const limit = 10;
  const { data: raw, isLoading } = useAdminProfilesQuery({ page, limit });

  const paginatedData = raw?.data;
  const tutors: AdminProfileItem[] = paginatedData?.data ?? [];
  const total = paginatedData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (paginatedData?.limit || limit)));

  if (isLoading || !raw?.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tutors" subtitle="Manage tutor profiles and their performance" />
        <Loading />
      </div>
    );
  }

  const columns: DataTableColumn<AdminProfileItem>[] = [
    {
      header: "Tutor",
      render: (t) => <span className="font-medium">{t.name}</span>,
    },
    {
      header: "Email",
      render: (t) => <span className="text-muted-foreground">{t.email}</span>,
    },
    {
      header: "Headline",
      render: (t) => (
        <span className="block max-w-48 truncate text-muted-foreground">
          {t.headline || "—"}
        </span>
      ),
    },
    {
      header: "Students",
      render: (t) => (
        <span className="tabular-nums">{(t.total_students ?? 0).toLocaleString()}</span>
      ),
    },
    {
      header: "Rating",
      render: (t) => (
        <div className="flex items-center gap-1">
          <Icon name="IconStar" className="size-4 fill-yellow-500 text-yellow-500" />
          <span className="font-medium tabular-nums">{t.rating_avg?.toFixed(1) || "—"}</span>
        </div>
      ),
    },
    {
      header: "Actions",
      render: (t) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => toast.info(`Viewing ${t.name}'s profile`)}
            aria-label="View tutor"
          >
            <Icon name="IconEye" className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => toast.error(`${t.name} has been banned`)}
            aria-label="Ban tutor"
          >
            <Icon name="IconBan" className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tutors"
        subtitle="Manage tutor profiles and their performance"
      />

      <Card>
        <CardHeader>
          <CardTitle>All Tutors ({total})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={tutors}
            keyExtractor={(t) => t.id}
            isLoading={false}
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={paginatedData?.limit || limit}
            onPageChange={setPage}
            label="tutors"
            emptyState={
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <Icon name="IconBook" className="size-8 opacity-40" />
                <p className="text-sm">No tutors found</p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
