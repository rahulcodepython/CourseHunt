"use client";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@package/ui/dialog";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Textarea } from "@package/ui/textarea";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { useUpdatesQuery, useCreateUpdateMutation, useUpdateUpdateMutation, useDeleteUpdateMutation } from "@package/query-hooks/updates.api";
import { useState } from "react";
import { ConfirmDeleteDialog } from "@package/components/confirm-delete-dialog";
import type { CourseUpdate } from "@package/schema/updates.types";

export default function UpdatesPage() {
    const { data: raw, isLoading } = useUpdatesQuery();
    const createMutation = useCreateUpdateMutation();
    const updateMutation = useUpdateUpdateMutation();
    const deleteMutation = useDeleteUpdateMutation();
    const updates: CourseUpdate[] = raw?.data?.data ?? [];

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<CourseUpdate | null>(null);
    const [message, setMessage] = useState("");
    const [courseId, setCourseId] = useState("");

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const openCreate = () => {
        setEditing(null);
        setMessage("");
        setCourseId("");
        setDialogOpen(true);
    };

    const openEdit = (u: CourseUpdate) => {
        setEditing(u);
        setMessage(u.message || "");
        setCourseId(u.course?.id || "");
        setDialogOpen(true);
    };

    const handleSave = async () => {
        const data: any = { message };
        if (!editing && courseId) data.course_id = courseId;
        if (editing) {
            await updateMutation.execute({ id: editing.id, data });
        } else {
            await createMutation.execute(data);
        }
        setDialogOpen(false);
    };

    const handleDelete = async () => {
        if (deleteId) {
            await deleteMutation.execute(deleteId);
            setDeleteId(null);
        }
    };

    const columns: DataTableColumn<CourseUpdate>[] = [
        {
            header: "Date",
            render: (u) => <span className="text-sm">{new Date(u.created_at).toLocaleDateString()}</span>,
        },
        {
            header: "Message",
            render: (u) => <span className="text-muted-foreground text-sm max-w-xs truncate block">{u.message}</span>,
        },
        {
            header: "Course",
            render: (u) => <span className="text-sm">{u.course?.title || "Platform-wide"}</span>,
        },
        {
            header: "",
            render: (u) => (
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                        <Icon name="IconPencil" className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(u.id)}>
                        <Icon name="IconTrash" className="h-4 w-4" />
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
                    <h1 className="text-2xl font-bold">Updates</h1>
                    <p className="text-muted-foreground text-sm">Manage platform announcements and updates</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate}>
                            <Icon name="IconPlus" className="mr-1 h-4 w-4" /> Create Update
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editing ? "Edit Update" : "Create Update"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Message</Label>
                                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Update message" rows={4} />
                            </div>
                            {!editing && (
                                <div className="space-y-2">
                                    <Label>Course ID (optional)</Label>
                                    <Input value={courseId} onChange={(e) => setCourseId(e.target.value)} placeholder="Leave empty for platform-wide" />
                                </div>
                            )}
                            <Button onClick={handleSave} className="w-full">
                                <Icon name="IconDeviceFloppy" className="mr-1 h-4 w-4" /> {editing ? "Save Changes" : "Create"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Updates ({updates.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={updates}
                        keyExtractor={(u) => u.id}
                        isLoading={isLoading}
                        page={1}
                        totalPages={1}
                        total={updates.length}
                        pageSize={updates.length || 1}
                        onPageChange={() => {}}
                        label="updates"
                    />
                </CardContent>
            </Card>

            <ConfirmDeleteDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Update"
                description="Are you sure you want to delete this update? This action cannot be undone."
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
