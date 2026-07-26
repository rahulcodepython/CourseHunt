"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { useDiscussionsQuery, useCreateDiscussionMutation, useUpdateDiscussionMutation, useDeleteDiscussionMutation } from "@package/query-hooks/discussions.api";
import { useSessionStore } from "@package/store/session.store";
import type { Discussion } from "@package/schema/discussions.types";
import { useState } from "react";
import { Input } from "@package/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@package/ui/dialog";
import { Textarea } from "@package/ui/textarea";
import { toast } from "sonner";
import { useParams } from "next/navigation";

export default function TutorDiscussionsPage() {
    const [page, setPage] = useState(1);
    const limit = 10;


    const params = useParams();
    const lessonId = params.lesson_id as string;

    const { data: raw, isLoading } = useDiscussionsQuery(lessonId, page);
    const deleteDiscussion = useDeleteDiscussionMutation();
    const updateDiscussion = useUpdateDiscussionMutation();
    const createReply = useCreateDiscussionMutation();

    const session = useSessionStore((s) => s.data);
    const currentUserId = session?.user?.id;

    const discussions = raw?.data?.data ?? [];
    const total = raw?.data?.total ?? 0;
    const totalPages = raw?.data ? Math.ceil(raw.data.total / raw.data.limit) : 0;

    const [editDialog, setEditDialog] = useState<Discussion | null>(null);
    const [editContent, setEditContent] = useState("");

    const [replyDialog, setReplyDialog] = useState<Discussion | null>(null);
    const [replyContent, setReplyContent] = useState("");

    const handleEdit = async () => {
        if (!editDialog || !editContent.trim()) return;
        const res = await updateDiscussion.execute({ id: editDialog.id, data: { content: editContent } });
        if (res) {
            setEditDialog(null);
            setEditContent("");
            toast.success("Discussion updated");
        }
    };

    const handleReply = async () => {
        if (!replyDialog || !replyContent.trim()) return;
        const res = await createReply.execute({
            content: replyContent,
            lesson_id: replyDialog.lesson_id,
            parent_id: replyDialog.id,
        });
        if (res) {
            setReplyDialog(null);
            setReplyContent("");
            toast.success("Reply posted");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this discussion?")) {
            await deleteDiscussion.execute(id);
        }
    };

    const columns: DataTableColumn<Discussion>[] = [
        {
            header: "Student",
            render: (d) => (
                <div className="flex items-center gap-2">
                    {d.user?.image && <img src={d.user.image} alt="" className="w-6 h-6 rounded-full" />}
                    <span className="font-medium text-sm">{d.user?.name || "Anonymous"}</span>
                </div>
            ),
        },
        {
            header: "Lesson",
            render: (d) => (
                <span className="text-xs text-muted-foreground truncate block max-w-37.5">
                    {d.lesson_id}
                </span>
            ),
        },
        {
            header: "Message",
            render: (d) => (
                <span className="text-sm line-clamp-2 block max-w-75">{d.content}</span>
            ),
        },
        {
            header: "Replies",
            render: (d) => (
                <span className="text-sm">{d.reply_count}</span>
            ),
        },
        {
            header: "Date",
            render: (d) => (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(d.created_at).toLocaleDateString()}
                </span>
            ),
            className: "text-right",
        },
        {
            header: "",
            render: (d) => (
                <div className="flex items-center gap-1 justify-end">
                    <Dialog open={replyDialog?.id === d.id} onOpenChange={(open) => { if (!open) setReplyDialog(null); else setReplyDialog(d); }}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <Icon name="IconMessageReply" className="w-4 h-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Reply to Discussion</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                                <div className="bg-muted/30 rounded-lg p-3 text-sm">
                                    <p className="font-medium">{d.user?.name}</p>
                                    <p className="text-muted-foreground text-xs mt-1">{d.content}</p>
                                </div>
                                <Textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Write your reply..."
                                    className="min-h-25"
                                />
                                <Button onClick={handleReply} className="w-full">Post Reply</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Only show edit for own messages */}
                    {d.user?.id === currentUserId && (
                        <Dialog open={editDialog?.id === d.id} onOpenChange={(open) => { if (!open) setEditDialog(null); else { setEditDialog(d); setEditContent(d.content); } }}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <Icon name="IconPencil" className="w-4 h-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Edit Discussion</DialogTitle></DialogHeader>
                                <div className="space-y-4">
                                    <Textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="min-h-25"
                                    />
                                    <Button onClick={handleEdit} className="w-full">Save</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}

                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(d.id)}>
                        <Icon name="IconTrash" className="w-4 h-4" />
                    </Button>
                </div>
            ),
            className: "text-right",
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Course Discussions</h1>
                    <p className="text-muted-foreground text-sm">View, edit, reply to, and manage discussions across your courses</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Discussions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={discussions}
                        keyExtractor={(d) => d.id}
                        isLoading={isLoading}
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        pageSize={limit}
                        onPageChange={setPage}
                        label="discussions"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
