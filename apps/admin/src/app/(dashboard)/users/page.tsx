"use client";

import { Icon } from "@package/components/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@package/ui/avatar";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@package/ui/dialog";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@package/ui/select";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { useUsersQuery, useCreateUserMutation } from "@package/query-hooks/users.api";
import type { UserListResponse } from "@package/schema/users.types";
import { useDebounce } from "@package/hooks/use-debounce";
import { downloadCredentialsCSV } from "@package/lib/csv";
import { useState } from "react";

export default function UsersPage() {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebounce(search, 300);
	const { data: raw, isLoading } = useUsersQuery();

	const createUser = useCreateUserMutation();
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [newName, setNewName] = useState("");
	const [newEmail, setNewEmail] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [newRole, setNewRole] = useState("");

	const users: UserListResponse[] = raw?.data?.data ?? [];

	const filtered = debouncedSearch
		? users.filter((u) =>
			u.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
			u.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
		)
		: users;

	const handleCreateUser = async () => {
		if (!newName || !newEmail || !newPassword || !newRole) return;
		try {
			const result = await createUser.mutateAsync({
				name: newName,
				email: newEmail,
				password: newPassword,
				role: newRole as "admin" | "tutor",
			});
			downloadCredentialsCSV(
				{ name: newName, email: newEmail, password: newPassword, role: newRole },
				window.location.origin,
			);
			setCreateDialogOpen(false);
			setNewName("");
			setNewEmail("");
			setNewPassword("");
			setNewRole("");
		} catch {
			// error handled by mutation toast
		}
	};

	const columns: DataTableColumn<UserListResponse>[] = [
		{
			header: "User",
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
			header: "Role",
			render: (user) => (
				<div className="flex gap-1 flex-wrap">
					{user.roles?.length ? user.roles.map((r) => (
						<Badge key={r.id} variant={r.name === "admin" ? "default" : r.name === "tutor" ? "secondary" : "outline"}>
							{r.name}
						</Badge>
					)) : <Badge variant="outline">student</Badge>}
				</div>
			),
		},
		{
			header: "Status",
			render: (user) => (
				user.banned ? (
					<Badge variant="destructive">Banned</Badge>
				) : (
					<Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
				)
			),
		},
		{
			header: "Joined",
			render: (user) => (
				<span className="text-muted-foreground text-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Users</h1>
				<p className="text-muted-foreground text-sm">Manage all platform users</p>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>All Users ({users.length})</CardTitle>
						<div className="flex items-center gap-2">
							<div className="relative w-64">
								<Icon name="IconSearch" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search by name or email..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="pl-10"
								/>
							</div>
							<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
								<DialogTrigger asChild>
									<Button>
										<Icon name="IconPlus" className="mr-1 h-4 w-4" /> Create User
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Create Admin / Tutor User</DialogTitle>
									</DialogHeader>
									<div className="space-y-4">
										<div className="space-y-2">
											<Label>Name</Label>
											<Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" />
										</div>
										<div className="space-y-2">
											<Label>Email</Label>
											<Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" type="email" />
										</div>
										<div className="space-y-2">
											<Label>Password</Label>
											<Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="Min 8 characters" />
										</div>
										<div className="space-y-2">
											<Label>Role</Label>
											<Select value={newRole} onValueChange={setNewRole}>
												<SelectTrigger>
													<SelectValue placeholder="Select role" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="admin">Admin</SelectItem>
													<SelectItem value="tutor">Tutor</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<Button className="w-full" onClick={handleCreateUser} disabled={createUser.isPending}>
											{createUser.isPending ? "Creating..." : "Create User"}
										</Button>
									</div>
								</DialogContent>
							</Dialog>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						columns={columns}
						data={filtered}
						keyExtractor={(u) => u.id}
						isLoading={isLoading}
						page={1}
						totalPages={1}
						total={filtered.length}
						pageSize={filtered.length || 1}
						onPageChange={() => {}}
						label="users"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
