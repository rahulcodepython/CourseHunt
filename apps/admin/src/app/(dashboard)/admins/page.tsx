"use client";

import { Icon } from "@package/components/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@package/ui/avatar";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { useUsersQuery, useAssignRoleMutation, useRevokeRoleMutation } from "@package/query-hooks/users.api";
import type { UserListResponse } from "@package/schema/users.types";
import { useRolesQuery } from "@package/query-hooks/roles.api";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@package/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@package/ui/select";

export default function AdminsPage() {
    const { data: raw, isLoading } = useUsersQuery();
    const { data: roles } = useRolesQuery();
    const assignRole = useAssignRoleMutation();
    const revokeRole = useRevokeRoleMutation();

    const allUsers: UserListResponse[] = raw?.data?.data ?? [];
    const admins = allUsers.filter((u) => u.roles?.some((r) => r.name === "admin"));

    const [assignDialogUserId, setAssignDialogUserId] = useState<string | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<string>("");

    const columns: DataTableColumn<UserListResponse>[] = [
        {
            header: "Name",
            render: (user) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                </div>
            ),
        },
        {
            header: "Email",
            render: (user) => <span className="text-muted-foreground">{user.email}</span>,
        },
        {
            header: "Roles",
            render: (user) => (
                <div className="flex gap-1 flex-wrap">
                    {user.roles?.map((r) => (
                        <Badge key={r.id} variant={r.name === "admin" ? "default" : "secondary"}>
                            {r.name}
                        </Badge>
                    ))}
                </div>
            ),
        },
        {
            header: "Joined",
            render: (user) => (
                <span className="text-muted-foreground text-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
            ),
        },
        {
            header: "Actions",
            render: (user) => (
                <div className="flex gap-1">
                    <Dialog open={assignDialogUserId === user.id} onOpenChange={(open) => { setAssignDialogUserId(open ? user.id : null); setSelectedRoleId(""); }}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <Icon name="IconUsers" className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Manage Custom Roles - {user.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Select value={selectedRoleId} onValueChange={(val) => setSelectedRoleId(val || "")}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(roles?.data || [])
                                                .filter((r) => !r.is_system)
                                                .map((r) => (
                                                    <SelectItem key={r.id} value={r.id}>
                                                        {r.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        size="sm"
                                        disabled={!selectedRoleId || assignRole.isPending}
                                        onClick={() => {
                                            assignRole.mutate({ id: user.id, data: { role_id: selectedRoleId } });
                                            setAssignDialogUserId(null);
                                            setSelectedRoleId("");
                                        }}
                                    >
                                        Assign
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {user.roles
                                        ?.filter((r) => r.name !== "admin")
                                        .map((r) => (
                                            <div key={r.id} className="flex items-center justify-between">
                                                <Badge variant="outline">{r.name}</Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive"
                                                    disabled={revokeRole.isPending}
                                                    onClick={() => {
                                                        revokeRole.mutate({ id: user.id, data: { role_id: r.id } });
                                                    }}
                                                >
                                                    <Icon name="IconX" className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Admins</h1>
                    <p className="text-muted-foreground text-sm">Manage admin users and their custom roles</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Admins ({admins.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={admins}
                        keyExtractor={(u) => u.id}
                        isLoading={isLoading}
                        page={1}
                        totalPages={1}
                        total={admins.length}
                        pageSize={admins.length || 1}
                        onPageChange={() => {}}
                        label="admins"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
