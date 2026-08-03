"use client";

import * as React from "react";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { useFeedbacksQuery, useUpdateFeedbackMutation, useDeleteFeedbackMutation } from "@package/query-hooks/feedbacks.api";
import { ConfirmDeleteDialog } from "@package/components/confirm-delete-dialog";
import { PageHeader } from "@package/components/page-header";
import { LoadingSpinner as Loading } from "@package/components/loading";
import { cn } from "@package/lib/utils";
import { formatDate } from "@package/lib/format";
import type { Feedback } from "@package/schema/feedbacks.types";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon
          key={i}
          name="IconStar"
          className={cn(
            "size-3.5",
            i < rating
              ? "fill-yellow-500 text-yellow-500"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

export default function FeedbackPage() {
    const [page, setPage] = React.useState(1);
    const limit = 10;
    const { data: raw, isLoading } = useFeedbacksQuery();
    const updateMutation = useUpdateFeedbackMutation();
    const deleteMutation = useDeleteFeedbackMutation();
    const paginatedData = raw?.data;
    const feedbacks: Feedback[] = paginatedData?.data ?? [];
    const total = paginatedData?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / (paginatedData?.limit || limit)));

    const [deleting, setDeleting] = React.useState<Feedback | null>(null);

    const handlePin = (feedback: Feedback) => {
        updateMutation.execute({ id: feedback.id, data: { is_pinned: !feedback.is_pinned } as any });
    };

    const handleDelete = async () => {
        if (deleting) {
            await deleteMutation.execute(deleting.id);
            setDeleting(null);
        }
    };

    if (isLoading || !raw?.data) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Feedback"
                    subtitle="Review and moderate student course feedback"
                />
                <Loading />
            </div>
        );
    }

    const columns: DataTableColumn<Feedback>[] = [
        {
            header: "User",
            render: (fb) => <span className="font-medium">{fb.user?.name || "Anonymous"}</span>,
        },
        {
            header: "Course",
            render: (fb) => <span className="text-muted-foreground">{fb.course?.title ?? "Unknown"}</span>,
        },
        {
            header: "Rating",
            render: (fb) => <StarRating rating={fb.rating || 0} />,
        },
        {
            header: "Comment",
            render: (fb) => (
                <span className="block max-w-62.5 line-clamp-2 text-muted-foreground">
                    {fb.content || "—"}
                </span>
            ),
        },
        {
            header: "Status",
            render: (fb) =>
                fb.is_pinned ? (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400">Pinned</Badge>
                ) : (
                    <Badge variant="outline">Normal</Badge>
                ),
        },
        {
            header: "Date",
            render: (fb) => (
                <span className="text-muted-foreground">{formatDate(fb.created_at)}</span>
            ),
        },
        {
            header: "Actions",
            render: (fb) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("size-8", fb.is_pinned && "text-primary")}
                        onClick={() => handlePin(fb)}
                        aria-label={fb.is_pinned ? "Unpin" : "Pin"}
                    >
                        <Icon name="IconPin" className={cn("size-4", fb.is_pinned && "rotate-45")} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleting(fb)}
                        aria-label="Delete feedback"
                    >
                        <Icon name="IconTrash" className="size-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Feedback"
                subtitle="Review and moderate student course feedback"
            />

            <Card>
                <CardHeader>
                    <CardTitle>All Feedback ({total})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={feedbacks}
                        keyExtractor={(fb) => fb.id}
                        isLoading={false}
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        pageSize={paginatedData?.limit || limit}
                        onPageChange={setPage}
                        label="feedbacks"
                        emptyState={
                            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                                <Icon name="IconMessage" className="size-8 opacity-40" />
                                <p className="text-sm">No feedback yet</p>
                            </div>
                        }
                    />
                </CardContent>
            </Card>

            <ConfirmDeleteDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                onConfirm={handleDelete}
                title="Delete Feedback"
                description={`Are you sure you want to delete the feedback from "${deleting?.user?.name}"? This action cannot be undone.`}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
