"use client";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { useAdminProfilesQuery } from "@package/query-hooks/users.api";
import { useState } from "react";
import type { AdminProfileItem } from "@package/schema/users.types";

export default function TutorsPage() {
    const [page, setPage] = useState(1);
    const limit = 10;
    const { data: raw, isLoading } = useAdminProfilesQuery();
    const paginatedData = raw?.data;
    const tutors: AdminProfileItem[] = paginatedData?.data ?? [];
    const total = paginatedData?.total ?? 0;
    const totalPages = Math.ceil(total / (paginatedData?.limit || limit));

    const columns: DataTableColumn<AdminProfileItem>[] = [
        {
            header: "Tutor",
            render: (t) => (
                <div className="flex items-center gap-3">
                    <span className="font-medium">{t.name}</span>
                </div>
            ),
        },
        {
            header: "Email",
            render: (t) => <span className="text-muted-foreground">{t.email}</span>,
        },
        {
            header: "Headline",
            render: (t) => (
                <span className="text-muted-foreground text-sm max-w-48 truncate block">
                    {t.headline || "—"}
                </span>
            ),
        },
        {
            header: "Students",
            render: (t) => <span>{t.total_students ?? 0}</span>,
        },
        {
            header: "Rating",
            render: (t) => (
                <div className="flex items-center gap-1">
                    <Icon name="IconStar" className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                    <span>{t.rating_avg?.toFixed(1) || "—"}</span>
                </div>
            ),
        },
        {
            header: "Actions",
            render: () => (
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                        <Icon name="IconEye" className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                        <Icon name="IconBan" className="h-4 w-4" />
                    </Button>
                </div>
            ),
            className: "text-right",
            headerClassName: "text-right",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Tutors</h1>
                <p className="text-muted-foreground text-sm">Manage tutors and review applications</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Tutors ({total})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={tutors}
                        keyExtractor={(t) => t.id}
                        isLoading={isLoading}
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        pageSize={paginatedData?.limit || limit}
                        onPageChange={setPage}
                        label="tutors"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
