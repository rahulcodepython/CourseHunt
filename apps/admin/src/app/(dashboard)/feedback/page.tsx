"use client";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { useFeedbacksQuery, useUpdateFeedbackMutation, useDeleteFeedbackMutation } from "@package/query-hooks/feedbacks.api";
import { ConfirmDeleteDialog } from "@package/components/confirm-delete-dialog";
import type { Feedback } from "@package/schema/feedbacks.types";
import { useState } from "react";

export default function FeedbackPage() {
    const [page, setPage] = useState(1);
    const limit = 10;
    const { data: raw, isLoading } = useFeedbacksQuery();
    const updateMutation = useUpdateFeedbackMutation();
    const deleteMutation = useDeleteFeedbackMutation();
    const paginatedData = raw?.data;
    const feedbacks: Feedback[] = paginatedData?.data ?? [];
    const total = paginatedData?.total ?? 0;
    const totalPages = Math.ceil(total / (paginatedData?.limit || limit));

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handlePin = async (id: string, pinned: boolean) => {
        await updateMutation.execute({ id, data: { is_pinned: !pinned } as any });
    };

    const handleDelete = async () => {
        if (deleteId) {
            await deleteMutation.execute(deleteId);
            setDeleteId(null);
        }
    };

    const columns: DataTableColumn<Feedback>[] = [
        {
            header: "User",
            render: (fb) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{fb.user?.name || "Anonymous"}</span>
                </div>
            ),
        },
        {
            header: "Course",
            render: (fb) => <span className="text-sm">{fb.course?.title || "Unknown"}</span>,
        },
        {
            header: "Rating",
            render: (fb) => (
                <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Icon
                            key={i}
                            name="IconStar"
                            className={`h-3.5 w-3.5 ${i < (fb.rating || 0) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`}
                        />
                    ))}
                </div>
            ),
        },
        {
            header: "Comment",
            render: (fb) => (
                <span className="text-xs text-muted-foreground line-clamp-2 max-w-62.5 block">
                    {fb.content || "—"}
                </span>
            ),
        },
        {
            header: "Status",
            render: (fb) => (
                fb.is_pinned ? (
                    <Badge variant="default" className="bg-blue-500">Pinned</Badge>
                ) : (
                    <Badge variant="outline">Normal</Badge>
                )
            ),
        },
        {
            header: "Date",
            render: (fb) => (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(fb.created_at).toLocaleDateString()}
                </span>
            ),
            className: "text-right",
            headerClassName: "text-right",
        },
        {
            header: "Actions",
            render: (fb) => (
                <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => handlePin(fb.id, fb.is_pinned)}>
                        <Icon
                            name="IconPin"
                            className={`h-4 w-4 ${fb.is_pinned ? "text-primary rotate-45" : "text-muted-foreground"}`}
                        />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(fb.id)}>
                        <Icon name="IconTrash" className="h-4 w-4" />
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
                <h1 className="text-2xl font-bold">Feedback</h1>
                <p className="text-muted-foreground text-sm">Manage course reviews and feedback</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Feedback ({total})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={feedbacks}
                        keyExtractor={(fb) => fb.id}
                        isLoading={isLoading}
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        pageSize={paginatedData?.limit || limit}
                        onPageChange={setPage}
                        label="feedbacks"
                    />
                </CardContent>
            </Card>

            <ConfirmDeleteDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Feedback"
                description="Are you sure you want to delete this feedback? This action cannot be undone."
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
