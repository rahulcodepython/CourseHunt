"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { useInspectFeedbacksQuery, useUpdateFeedbackMutation, useDeleteFeedbackMutation } from "@package/query-hooks/feedbacks.api";
import type { Feedback } from "@package/schema/feedbacks.types";
import { useState } from "react";
import { Badge } from "@package/ui/badge";

const columns: DataTableColumn<Feedback>[] = [
    {
        header: "Course",
        render: (fb) => <span className="font-medium text-sm">{fb.course?.title || "Unknown"}</span>,
    },
    {
        header: "Student",
        render: (fb) => (
            <div className="flex items-center gap-2">
                {fb.user?.image && (
                    <img src={fb.user.image} alt="" className="w-6 h-6 rounded-full" />
                )}
                <span className="text-sm">{fb.user?.name || "Anonymous"}</span>
            </div>
        ),
    },
    {
        header: "Rating",
        render: (fb) => (
            <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                    <Icon
                        key={i}
                        name="IconStar"
                        className={`w-4 h-4 ${i < fb.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
                    />
                ))}
            </div>
        ),
    },
    {
        header: "Comment",
        render: (fb) => (
            <span className="text-xs text-muted-foreground line-clamp-2 max-w-[250px] block">
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
    },
];

export default function TutorFeedbacksPage() {
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data: raw, isLoading } = useInspectFeedbacksQuery();
    const updateFeedback = useUpdateFeedbackMutation();
    const deleteFeedback = useDeleteFeedbackMutation();

    const feedbacks = raw?.data?.data ?? [];
    const total = raw?.data?.total ?? 0;
    const totalPages = raw?.data ? Math.ceil(raw.data.total / raw.data.limit) : 0;

    const handleTogglePin = async (fb: Feedback) => {
        await updateFeedback.execute({ id: fb.id, data: { is_pinned: !fb.is_pinned } });
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this feedback?")) {
            await deleteFeedback.execute(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Course Feedbacks</h1>
                    <p className="text-muted-foreground text-sm">View and manage student feedback on your courses</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Feedbacks</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={[
                            ...columns,
                            {
                                header: "Actions",
                                render: (fb) => (
                                    <div className="flex items-center gap-1 justify-end">
                                        <Button variant="ghost" size="sm" onClick={() => handleTogglePin(fb)}>
                                            <Icon name="IconStar" className={`w-4 h-4 ${fb.is_pinned ? "text-amber-400 fill-amber-400" : ""}`} />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(fb.id)}>
                                            <Icon name="IconTrash" className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ),
                                className: "text-right",
                            },
                        ]}
                        data={feedbacks}
                        keyExtractor={(fb) => fb.id}
                        isLoading={isLoading}
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        pageSize={limit}
                        onPageChange={setPage}
                        label="feedbacks"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
