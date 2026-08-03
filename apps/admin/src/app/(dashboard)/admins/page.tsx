"use client";

import * as React from "react";

import { Icon } from "@package/components/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@package/ui/avatar";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@package/ui/dialog";
import { Label } from "@package/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@package/ui/select";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { PageHeader } from "@package/components/page-header";
import { LoadingSpinner as Loading } from "@package/components/loading";
import LoadingButton from "@package/components/loading-button";
import { useUsersQuery, useAssignRoleMutation, useRevokeRoleMutation } from "@package/query-hooks/users.api";
import { useRolesQuery } from "@package/query-hooks/roles.api";
import type { UserListResponse } from "@package/schema/users.types";
import { formatDate } from "@package/lib/format";

function AdminNameCell({ user }: { user: UserListResponse }) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-8">
        {user.image ? <AvatarImage src={user.image} /> : null}
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="font-medium">{user.name}</span>
    </div>
  );
}

function ManageRolesDialog({
  user,
  open,
  onOpenChange,
}: {
  user: UserListResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: roles } = useRolesQuery();
  const assignMutation = useAssignRoleMutation();
  const revokeMutation = useRevokeRoleMutation();
  const [selectedRoleId, setSelectedRoleId] = React.useState("");

  const customRoles = (roles?.data ?? []).filter((r) => !r.is_system);

  const handleAssign = () => {
    if (!user || !selectedRoleId) return;
    assignMutation.mutate(
      { id: user.id, data: { role_id: selectedRoleId } },
      { onSettled: () => setSelectedRoleId("") },
    );
  };

  const handleRevoke = (roleId: string) => {
    if (!user) return;
    revokeMutation.mutate({ id: user.id, data: { role_id: roleId } });
  };

  const currentCustomRoles = user?.roles.filter((r) => r.name !== "admin") ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Roles · {user?.name}</DialogTitle>
          <DialogDescription>
            Assign or revoke custom roles for this admin user.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label>Custom Role</Label>
              <Select value={selectedRoleId} onValueChange={(value) => setSelectedRoleId(value ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {customRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <LoadingButton
              isLoading={assignMutation.isPending}
              title="Assigning..."
              className="w-full sm:w-auto"
            >
              <Button disabled={!selectedRoleId} onClick={handleAssign}>
                Assign
              </Button>
            </LoadingButton>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Current Roles</p>
            {currentCustomRoles.length > 0 ? (
              currentCustomRoles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <Badge variant="secondary" className="capitalize">
                    {role.name}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRevoke(role.id)}
                    disabled={revokeMutation.isPending}
                    aria-label={`Revoke ${role.name}`}
                  >
                    <Icon name="IconX" className="size-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                No custom roles assigned
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminsPage() {
  const { data: raw, isLoading } = useUsersQuery();
  const [selectedUser, setSelectedUser] = React.useState<UserListResponse | null>(null);

  const allUsers: UserListResponse[] = raw?.data?.data ?? [];
  const admins = allUsers.filter((u) => u.roles?.some((r) => r.name === "admin"));

  if (isLoading || !raw?.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admins" subtitle="Manage admin users and assign custom roles" />
        <Loading />
      </div>
    );
  }

  const columns: DataTableColumn<UserListResponse>[] = [
    {
      header: "Name",
      render: (user) => <AdminNameCell user={user} />,
    },
    {
      header: "Email",
      render: (user) => <span className="text-muted-foreground">{user.email}</span>,
    },
    {
      header: "Roles",
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.roles.map((r) => (
            <Badge
              key={r.id}
              variant={r.name === "admin" ? "default" : "secondary"}
              className="capitalize"
            >
              {r.name}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: "Joined",
      render: (user) => (
        <span className="text-muted-foreground">{formatDate(user.createdAt)}</span>
      ),
    },
    {
      header: "Actions",
      render: (user) => (
        <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
          <Icon name="IconUsers" className="size-4" />
          Manage
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admins"
        subtitle="Manage admin users and assign custom roles"
      />

      <Card>
        <CardHeader>
          <CardTitle>All Admins ({admins.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={admins}
            keyExtractor={(u) => u.id}
            isLoading={false}
            page={1}
            totalPages={1}
            total={admins.length}
            pageSize={admins.length || 1}
            onPageChange={() => {}}
            label="admins"
            emptyState={
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <Icon name="IconUserCheck" className="size-8 opacity-40" />
                <p className="text-sm">No admin users found</p>
              </div>
            }
          />
        </CardContent>
      </Card>

      <ManageRolesDialog
        user={selectedUser}
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      />
    </div>
  );
}
