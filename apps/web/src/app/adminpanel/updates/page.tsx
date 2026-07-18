"use client";

import { Icon } from "@/components/icon";


import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@package/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@package/ui/dialog";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@package/ui/table";
import { Textarea } from "@package/ui/textarea";
import {
	useAdminUpdatesQuery,
	useCreateUpdateMutation,
	useDeleteUpdateMutation,
	useUpdateUpdateMutation,
	type RecentUpdate,
} from "@/hooks/api/updates-hooks";
import Loading from "@/components/loading";

import { useState } from "react";
import { toast } from "sonner";

export default function AdminUpdatesPage() {
	const { data: updates, isLoading, refetch } = useAdminUpdatesQuery();
	const createMutation = useCreateUpdateMutation();
	const updateMutation = useUpdateUpdateMutation();
	const deleteMutation = useDeleteUpdateMutation();

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingUpdate, setEditingUpdate] = useState<RecentUpdate | null>(null);
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		date: new Date().toISOString().split("T")[0],
	});

	const handleOpenCreate = () => {
		setEditingUpdate(null);
		setFormData({
			title: "",
			description: "",
			date: new Date().toISOString().split("T")[0],
		});
		setIsDialogOpen(true);
	};

	const handleOpenEdit = (update: RecentUpdate) => {
		setEditingUpdate(update);
		setFormData({
			title: update.title,
			description: update.description,
			date: update.date.split("T")[0],
		});
		setIsDialogOpen(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			if (editingUpdate) {
				await updateMutation.execute({
					id: editingUpdate.id,
					...formData,
				});
				toast.success("Update updated successfully");
			} else {
				await createMutation.execute(formData);
				toast.success("Update created successfully");
			}
			setIsDialogOpen(false);
			refetch();
		} catch (error) {
			toast.error("Failed to save update");
		}
	};

	const handleDelete = async (id: number) => {
		if (confirm("Are you sure you want to delete this update?")) {
			try {
				await deleteMutation.execute(id);
				toast.success("Update deleted successfully");
				refetch();
			} catch (error) {
				toast.error("Failed to delete update");
			}
		}
	};

	if (isLoading) return <Loading />;

	return (
		<div className="p-8 space-y-8">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold text-white">Recent Updates</h1>
					<p className="text-muted-foreground">Manage platform announcements</p>
				</div>
				<Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90">
					<Icon name="IconPlus" className="w-5 h-5 mr-2" />
					New Update
				</Button>
			</div>

			<Card className="bg-muted/20 border-none shadow-xl overflow-hidden">
				<CardHeader className="bg-muted/30">
					<CardTitle>Platform Updates</CardTitle>
					<CardDescription>All scheduled and published updates</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent border-muted">
								<TableHead className="w-[150px]">Date</TableHead>
								<TableHead>Title</TableHead>
								<TableHead className="max-w-[400px]">Description</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{updates?.map((update) => (
								<TableRow key={update.id} className="border-muted hover:bg-muted/10">
									<TableCell className="font-mono text-xs">
										<div className="flex items-center gap-2">
											<Icon name="IconCalendar" className="w-3 h-3 text-primary" />
											{new Date(update.date).toLocaleDateString()}
										</div>
									</TableCell>
									<TableCell className="font-bold">{update.title}</TableCell>
									<TableCell className="text-muted-foreground text-sm line-clamp-1 py-4">
										{update.description}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-2">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleOpenEdit(update)}
												className="hover:bg-primary/10 hover:text-primary"
											>
												<Icon name="IconPencil" className="w-5 h-5" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleDelete(update.id)}
												className="hover:bg-red-500/10 hover:text-red-500"
											>
												<Icon name="IconTrash" className="w-5 h-5" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
							{updates?.length === 0 && (
								<TableRow>
									<TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
										No updates found. Create one to get started.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-[500px] bg-card border-muted">
					<DialogHeader>
						<DialogTitle>{editingUpdate ? "Edit Update" : "Create New Update"}</DialogTitle>
						<DialogDescription>
							Fill in the details for the platform update.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="title">Title</Label>
							<Input
								id="title"
								value={formData.title}
								onChange={(e) => setFormData({ ...formData, title: e.target.value })}
								placeholder="Enter update title..."
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="date">Announcement Date</Label>
							<Input
								id="date"
								type="date"
								value={formData.date}
								onChange={(e) => setFormData({ ...formData, date: e.target.value })}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={formData.description}
								onChange={(e) => setFormData({ ...formData, description: e.target.value })}
								placeholder="Describe the update in detail..."
								className="min-h-[150px]"
								required
							/>
						</div>
						<DialogFooter className="pt-4">
							<Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
								Cancel
							</Button>
							<Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
								{editingUpdate ? "Save Changes" : "Create Update"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
