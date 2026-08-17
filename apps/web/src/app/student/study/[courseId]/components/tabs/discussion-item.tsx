"use client";

import * as React from "react";

import {
    useDiscussionRepliesQuery,
    useCreateDiscussionMutation,
    useUpdateDiscussionMutation,
    useDeleteDiscussionMutation,
} from "@/query-hooks/discussions.api";
import type { Discussion } from "@/schema/discussions.types";
import UserAvatar from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/icon";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { formatDateTime } from "@/lib/format";
import useSession from "@/hooks/use-session";
import { mergeListPage } from "./discussion-list-utils";

const REPLIES_PAGE_SIZE = 5;

export function DiscussionItem({
    lessonId,
    discussion,
    isReply = false,
    onUpdated,
    onDeleted,
    canEditAny = false,
    canDeleteAny = false,
}: {
    lessonId: string;
    discussion: Discussion;
    isReply?: boolean;
    onUpdated?: (discussion: Discussion) => void;
    onDeleted?: (id: string) => void;
    canEditAny?: boolean;
    canDeleteAny?: boolean;
}) {
    const { user } = useSession();
    const isOwner = user?.id === discussion.user.id;
    const canEdit = isOwner || canEditAny;
    const canDelete = isOwner || canDeleteAny;

    const [showReplies, setShowReplies] = React.useState(false);
    const [editing, setEditing] = React.useState(false);
    const [editText, setEditText] = React.useState(discussion.content);
    const [deleting, setDeleting] = React.useState(false);

    const updateDiscussion = useUpdateDiscussionMutation();
    const deleteDiscussion = useDeleteDiscussionMutation();

    const submitEdit = async () => {
        if (!editText.trim()) return;
        const res = await updateDiscussion.execute({ id: discussion.id, data: { content: editText } });
        if (res?.success && res.data) {
            onUpdated?.(res.data);
            setEditing(false);
        }
    };

    return (
        <div className="flex gap-2.5">
            <UserAvatar name={discussion.user.name} image={discussion.user.image} className="size-8 mt-0.5" />
            <div className="min-w-0 flex-1 space-y-1">
                <div className="min-w-0 rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{discussion.user.name}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(discussion.created_at)}</span>
                    </div>

                    {editing ? (
                        <div className="mt-1.5 space-y-2">
                            <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-16 bg-background" />
                            <div className="flex gap-2">
                                <Button size="sm" disabled={updateDiscussion.isPending} onClick={submitEdit}>Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditText(discussion.content); }}>Cancel</Button>
                            </div>
                        </div>
                    ) : (
                        <p className="mt-0.5 text-sm whitespace-pre-wrap">{discussion.content}</p>
                    )}
                </div>

                <div className="flex items-center gap-3 px-1 text-xs text-muted-foreground">
                    {!editing && (
                        <>
                            {canEdit && (
                                <button type="button" className="font-medium hover:text-foreground" onClick={() => setEditing(true)}>
                                    Edit
                                </button>
                            )}
                            {canDelete && (
                                <button type="button" className="font-medium hover:text-destructive" onClick={() => setDeleting(true)}>
                                    Delete
                                </button>
                            )}
                        </>
                    )}
                    {!isReply && (
                        <button
                            type="button"
                            className="flex items-center gap-1 font-medium hover:text-foreground"
                            onClick={() => setShowReplies((v) => !v)}
                        >
                            <Icon name="messages" className="size-3.5" />
                            {showReplies
                                ? "Hide replies"
                                : discussion.reply_count > 0
                                    ? `${discussion.reply_count} ${discussion.reply_count === 1 ? "reply" : "replies"}`
                                    : "Reply"}
                        </button>
                    )}
                </div>

                {!isReply && showReplies && <DiscussionReplies lessonId={lessonId} parentId={discussion.id} canEditAny={canEditAny} canDeleteAny={canDeleteAny} />}
            </div>

            <ConfirmDeleteDialog
                open={deleting}
                onOpenChange={setDeleting}
                onConfirm={async () => {
                    const res = await deleteDiscussion.execute(discussion.id);
                    if (res?.success) {
                        onDeleted?.(discussion.id);
                        setDeleting(false);
                    }
                }}
                loading={deleteDiscussion.isPending}
                title="Delete Comment"
                description="Are you sure you want to delete this comment? This action cannot be undone."
            />
        </div>
    );
}

function DiscussionReplies({
    lessonId,
    parentId,
    canEditAny = false,
    canDeleteAny = false,
}: {
    lessonId: string;
    parentId: string;
    canEditAny?: boolean;
    canDeleteAny?: boolean;
}) {
    const [page, setPage] = React.useState(1);
    const [items, setItems] = React.useState<Discussion[]>([]);
    const [replyText, setReplyText] = React.useState("");

    const { data: raw, isLoading, isFetching } = useDiscussionRepliesQuery(parentId, page, REPLIES_PAGE_SIZE);
    const createReply = useCreateDiscussionMutation();

    React.useEffect(() => {
        const pageItems = raw?.data?.data;
        if (!pageItems) return;
        setItems((prev) => mergeListPage(prev, pageItems));
    }, [raw]);

    const total = raw?.data?.total ?? 0;
    const hasMore = items.length < total;

    const submitReply = async () => {
        if (!replyText.trim()) return;
        const res = await createReply.execute({ content: replyText, parent_id: parentId, lesson_id: lessonId });
        if (res?.success && res.data) {
            setItems((prev) => [...prev, res.data!]);
            setReplyText("");
        }
    };

    const handleUpdated = (updated: Discussion) => {
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    };

    const handleDeleted = (id: string) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
    };

    return (
        <div className="space-y-3 border-l pl-4 pt-3">
            {isLoading && items.length === 0 ? (
                <p className="text-xs text-muted-foreground">Loading replies...</p>
            ) : (
                items.map((reply) => (
                    <DiscussionItem
                        key={reply.id}
                        lessonId={lessonId}
                        discussion={reply}
                        isReply
                        onUpdated={handleUpdated}
                        onDeleted={handleDeleted}
                        canEditAny={canEditAny}
                        canDeleteAny={canDeleteAny}
                    />
                ))
            )}

            {hasMore && (
                <button
                    type="button"
                    disabled={isFetching}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => setPage((p) => p + 1)}
                >
                    {isFetching ? "Loading..." : "Load more replies"}
                </button>
            )}

            <div className="flex gap-2 pt-1">
                <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="min-h-10 resize-none"
                />
                <Button size="icon" className="shrink-0" disabled={!replyText.trim() || createReply.isPending} onClick={submitReply}>
                    <Icon name="send" className="size-3.5" />
                </Button>
            </div>
        </div>
    );
}
