"use client";

import * as React from "react";

import { Icon } from "@package/components/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@package/ui/avatar";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@package/ui/dialog";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@package/ui/select";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { PageHeader } from "@package/components/page-header";
import { LoadingSpinner as Loading } from "@package/components/loading";
import LoadingButton from "@package/components/loading-button";
import { useUsersQuery } from "@package/query-hooks/users.api";
import { useCreateUserMutation } from "@package/query-hooks/auth.api";
import type { UserListResponse } from "@package/schema/users.types";
import { useDebounce } from "@package/hooks/use-debounce";
import { downloadCredentialsCSV } from "@package/lib/csv";
import { formatDate } from "@package/lib/format";

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  tutor: "secondary",
  student: "outline",
};

function UserCell({ user }: { user: UserListResponse }) {
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

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useCreateUserMutation();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState("admin");

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("admin");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    try {
      await mutation.mutateAsync({
        name,
        email,
        password,
        role: role as "admin" | "tutor",
      });
      downloadCredentialsCSV(
        { name, email, password, role },
        window.location.origin,
      );
      reset();
      onOpenChange(false);
    } catch {
      // error handled by mutation toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>
            Create an admin or tutor account. Credentials will be downloaded as
            a CSV file.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cu-name">Name</Label>
            <Input
              id="cu-name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cu-email">Email</Label>
            <Input
              id="cu-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cu-password">Password</Label>
            <Input
              id="cu-password"
              type="text"
              placeholder="Temporary password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="tutor">Tutor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <LoadingButton
              isLoading={mutation.isPending}
              className="w-full sm:w-auto"
            >
              <Button type="submit">Create User</Button>
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersPage() {
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { data: raw, isLoading } = useUsersQuery();
  const [createOpen, setCreateOpen] = React.useState(false);

  const users: UserListResponse[] = raw?.data?.data ?? [];

  const filtered = debouncedSearch
    ? users.filter(
        (u) =>
          u.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          u.email?.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
    : users;

  if (isLoading || !raw?.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Users" subtitle="Manage all platform users" />
        <Loading />
      </div>
    );
  }

  const columns: DataTableColumn<UserListResponse>[] = [
    {
      header: "User",
      render: (user) => <UserCell user={user} />,
    },
    {
      header: "Email",
      render: (user) => <span className="text-muted-foreground">{user.email}</span>,
    },
    {
      header: "Role",
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.roles?.length
            ? user.roles.map((r) => (
                <Badge
                  key={r.id}
                  variant={roleBadgeVariant[r.name] ?? "outline"}
                  className="capitalize"
                >
                  {r.name}
                </Badge>
              ))
            : <Badge variant="outline">student</Badge>}
        </div>
      ),
    },
    {
      header: "Status",
      render: (user) =>
        user.banned ? (
          <Badge variant="destructive">Banned</Badge>
        ) : (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400">Active</Badge>
        ),
    },
    {
      header: "Joined",
      render: (user) => (
        <span className="text-muted-foreground">{formatDate(user.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle="Manage all platform users, create admin and tutor accounts"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Icon name="IconPlus" className="size-4" />
            Create User
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>All Users ({users.length})</CardTitle>
          <div className="relative">
            <Icon
              name="IconSearch"
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(u) => u.id}
            isLoading={false}
            page={1}
            totalPages={1}
            total={filtered.length}
            pageSize={filtered.length || 1}
            onPageChange={() => {}}
            label="users"
            emptyState={
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <Icon name="IconUsers" className="size-8 opacity-40" />
                <p className="text-sm">
                  {search ? "No users match your search" : "No users found"}
                </p>
              </div>
            }
          />
        </CardContent>
      </Card>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
