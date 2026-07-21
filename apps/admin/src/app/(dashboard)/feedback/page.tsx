"use client";

import { Icon } from "@package/components/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@package/ui/avatar";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { useInspectFeedbacksQuery, useUpdateFeedbackMutation, useDeleteFeedbackMutation } from "@package/query-hooks/feedbacks.api";
import Loading from "@package/components/loading";
import { ConfirmDeleteDialog } from "@package/components/confirm-delete-dialog";
import type { Feedback } from "@package/schema/feedbacks.types";
import { useState } from "react";

export default function FeedbackPage() {
    const { data: raw, isLoading } = useInspectFeedbacksQuery();
    const updateMutation = useUpdateFeedbackMutation();
    const deleteMutation = useDeleteFeedbackMutation();
    const feedbacks: Feedback[] = raw?.data?.data ?? [];

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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Feedback</h1>
                <p className="text-muted-foreground text-sm">Manage course reviews and feedback</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Feedback ({feedbacks.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Loading />
                    ) : feedbacks.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Icon name="IconStar" className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                            <p>No feedback yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {feedbacks.map((fb) => (
                                <Card key={fb.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={fb.user?.image || undefined} />
                                                    <AvatarFallback>{fb.user?.name?.charAt(0) || "U"}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{fb.user?.name || "Anonymous"}</span>
                                                        <div className="flex">
                                                            {Array.from({ length: 5 }).map((_, i) => (
                                                                <Icon
                                                                    key={i}
                                                                    name="IconStar"
                                                                    className={`h-3.5 w-3.5 ${i < (fb.rating || 0) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <Badge variant="outline" className="text-xs">{fb.rating}/5</Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {fb.course?.title || "Unknown course"} &middot; {new Date(fb.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
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
                                        </div>
                                        <p className="mt-3 text-sm text-muted-foreground">{fb.content}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
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
