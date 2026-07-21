"use client";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@package/ui/dialog";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@package/ui/table";
import { useState } from "react";

const demoRoles = [
    { id: 1, name: "admin", description: "Full platform access", users: 3 },
    { id: 2, name: "tutor", description: "Course creation and management", users: 12 },
    { id: 3, name: "student", description: "Course consumption", users: 245 },
];

export default function RolesPage() {
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Roles & Permissions</h1>
                    <p className="text-muted-foreground text-sm">Create and manage roles, assign permissions to users</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Icon name="IconPlus" className="mr-1 h-4 w-4" /> Create Role
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Role</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Role Name</Label>
                                <Input placeholder="e.g. moderator" />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input placeholder="Describe this role's purpose" />
                            </div>
                            <Button className="w-full">Create Role</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Roles</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Users</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {demoRoles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-mono">{role.name}</Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{role.description}</TableCell>
                                    <TableCell>{role.users}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="sm">
                                                <Icon name="IconUsers" className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm">
                                                <Icon name="IconPencil" className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-destructive">
                                                <Icon name="IconTrash" className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
