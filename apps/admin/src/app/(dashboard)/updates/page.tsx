"use client";

import * as React from "react";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@package/ui/dialog";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Textarea } from "@package/ui/textarea";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { useUpdatesQuery, useCreateUpdateMutation, useUpdateUpdateMutation, useDeleteUpdateMutation } from "@package/query-hooks/updates.api";
import { PageHeader } from "@package/components/page-header";
import { LoadingSpinner as Loading } from "@package/components/loading";
import LoadingButton from "@package/components/loading-button";
import { ConfirmDeleteDialog } from "@package/components/confirm-delete-dialog";
import { formatDate } from "@package/lib/format";
import type { CourseUpdate } from "@package/schema/updates.types";

function UpdateDialog({
    open,
    onOpenChange,
    editing,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: CourseUpdate | null;
}) {
    const createMutation = useCreateUpdateMutation();
    const updateMutation = useUpdateUpdateMutation();
    const [message, setMessage] = React.useState("");
    const [courseId, setCourseId] = React.useState("");

    React.useEffect(() => {
        if (open) {
            setMessage(editing?.message ?? "");
            setCourseId(editing?.course?.id ?? "");
        }
    }, [open, editing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        if (editing) {
            await updateMutation.execute({ id: editing.id, data: { message: message.trim() } });
        } else {
            await createMutation.execute({
                message: message.trim(),
                course_id: courseId.trim() || undefined,
            });
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editing ? "Edit Update" : "Create Update"}</DialogTitle>
                    <DialogDescription>
                        Publish a platform announcement or course update
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="upd-message">Message</Label>
                        <Textarea
                            id="upd-message"
                            placeholder="What's new?"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            required
                        />
                    </div>
                    {!editing && (
                        <div className="space-y-1.5">
                            <Label htmlFor="upd-course">Course ID (optional)</Label>
                            <Input
                                id="upd-course"
                                placeholder="Leave empty for platform-wide"
                                value={courseId}
                                onChange={(e) => setCourseId(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                If empty, the update is shown platform-wide.
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <LoadingButton
                            isLoading={createMutation.isPending || updateMutation.isPending}
                        >
                            <Button type="submit">
                                {editing ? "Save Changes" : "Create Update"}
                            </Button>
                        </LoadingButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function UpdatesPage() {
    const { data: raw, isLoading } = useUpdatesQuery();
    const deleteMutation = useDeleteUpdateMutation();
    const updates: CourseUpdate[] = raw?.data?.data ?? [];

    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<CourseUpdate | null>(null);
    const [deleting, setDeleting] = React.useState<CourseUpdate | null>(null);

    const openCreate = () => {
        setEditing(null);
        setDialogOpen(true);
    };

    const openEdit = (u: CourseUpdate) => {
        setEditing(u);
        setDialogOpen(true);
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
                    title="Updates"
                    subtitle="Manage platform announcements and course updates"
                />
                <Loading />
            </div>
        );
    }

    const columns: DataTableColumn<CourseUpdate>[] = [
        {
            header: "Date",
            render: (u) => <span className="text-muted-foreground">{formatDate(u.created_at)}</span>,
        },
        {
            header: "Message",
            render: (u) => (
                <span className="block max-w-xs truncate text-muted-foreground">{u.message}</span>
            ),
        },
        {
            header: "Course",
            render: (u) =>
                u.course ? (
                    <Badge variant="secondary">{u.course.title}</Badge>
                ) : (
                    <Badge variant="default">Platform-wide</Badge>
                ),
        },
        {
            header: "",
            render: (u) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEdit(u)}
                        aria-label="Edit update"
                    >
                        <Icon name="IconPencil" className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleting(u)}
                        aria-label="Delete update"
                    >
                        <Icon name="IconTrash" className="size-4" />
                    </Button>
                </div>
            ),
            className: "text-right",
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Updates"
                subtitle="Manage platform announcements and course updates"
                actions={
                    <Button onClick={openCreate}>
                        <Icon name="IconPlus" className="size-4" />
                        Create Update
                    </Button>
                }
            />

            <Card>
                <CardHeader>
                    <CardTitle>All Updates ({updates.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={updates}
                        keyExtractor={(u) => u.id}
                        isLoading={false}
                        page={1}
                        totalPages={1}
                        total={updates.length}
                        pageSize={updates.length || 1}
                        onPageChange={() => {}}
                        label="updates"
                        emptyState={
                            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                                <Icon name="IconWorld" className="size-8 opacity-40" />
                                <p className="text-sm">No updates yet</p>
                            </div>
                        }
                    />
                </CardContent>
            </Card>

            <UpdateDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editing={editing}
            />

            <ConfirmDeleteDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                onConfirm={handleDelete}
                title="Delete Update"
                description="Are you sure you want to delete this update? This action cannot be undone."
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
