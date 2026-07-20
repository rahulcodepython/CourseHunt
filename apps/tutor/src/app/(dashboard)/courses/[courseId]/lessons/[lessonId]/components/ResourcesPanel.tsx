"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Button } from "@package/ui/button";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@package/ui/select";
import { useLessonResourcesQuery, useAddResourceMutation, useDeleteResourceMutation } from "@package/query-hooks/lessons.api";
import { useState } from "react";
import { toast } from "sonner";
import { Icon } from "@package/components/icon";
import { ConfirmDeleteDialog } from "@package/components/confirm-delete-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@package/ui/dialog";

interface ResourcesPanelProps {
	lessonId: string;
}

export function ResourcesPanel({ lessonId }: ResourcesPanelProps) {
	const { data: raw, isLoading } = useLessonResourcesQuery(lessonId);
	const addResource = useAddResourceMutation(lessonId);
	const deleteResource = useDeleteResourceMutation(lessonId);
	
	const resources = raw?.data ?? [];

	const [addOpen, setAddOpen] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const [formData, setFormData] = useState<{ title: string; file_url: string; file_type: string | null }>({ title: "", file_url: "", file_type: "" });

	const handleAdd = async () => {
		if (!formData.title.trim() || !formData.file_url.trim()) return toast.error("Title and URL are required");
		const res = await addResource.execute({
			title: formData.title,
			file_url: formData.file_url,
			file_type: formData.file_type || null,
		});
		if (res) {
			setAddOpen(false);
			setFormData({ title: "", file_url: "", file_type: "" });
		}
	};

	const handleDelete = async () => {
		if (deleteId) {
			await deleteResource.execute(deleteId);
			setDeleteId(null);
		}
	};

	return (
		<div className="space-y-4 pt-8 mt-8 border-t">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Downloadable Resources</CardTitle>
						<p className="text-xs text-muted-foreground mt-1">Files students can download for this lesson</p>
					</div>
					<Dialog open={addOpen} onOpenChange={setAddOpen}>
						<DialogTrigger asChild>
							<Button size="sm">
								<Icon name="IconPlus" className="w-4 h-4 mr-1" /> Add Resource
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader><DialogTitle>Add Resource</DialogTitle></DialogHeader>
							<div className="space-y-4 pt-4">
								<div className="space-y-2">
									<Label>Title</Label>
									<Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Cheat Sheet PDF" />
								</div>
								<div className="space-y-2">
									<Label>File URL</Label>
									<Input value={formData.file_url} onChange={(e) => setFormData({ ...formData, file_url: e.target.value })} placeholder="https://..." />
								</div>
								<div className="space-y-2">
									<Label>File Type (Optional)</Label>
									<Select value={formData.file_type} onValueChange={(v) => setFormData({ ...formData, file_type: v })}>
										<SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
										<SelectContent>
											<SelectItem value="pdf">PDF</SelectItem>
											<SelectItem value="video">Video</SelectItem>
											<SelectItem value="document">Document</SelectItem>
											<SelectItem value="image">Image</SelectItem>
											<SelectItem value="other">Other</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<Button onClick={handleAdd} disabled={addResource.isPending} className="w-full">
									{addResource.isPending ? "Adding..." : "Add Resource"}
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</CardHeader>
				<CardContent>
					{isLoading && <p className="text-sm text-muted-foreground">Loading resources...</p>}
					<div className="space-y-2">
						{resources.map((r) => (
							<div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
								<div className="flex items-center gap-3">
									<Icon name={r.file_type === "pdf" ? "IconFileTypePdf" : "IconFile"} className="w-5 h-5 text-primary" />
									<div>
										<p className="text-sm font-medium">{r.title}</p>
										<p className="text-xs text-muted-foreground uppercase">{r.file_type || "unknown"}</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<a href={r.file_url} target="_blank" rel="noopener noreferrer">
										<Button variant="ghost" size="sm" title="Download/View">
											<Icon name="IconDownload" className="w-4 h-4" />
										</Button>
									</a>
									<Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(r.id)} title="Delete resource">
										<Icon name="IconTrash" className="w-4 h-4" />
									</Button>
								</div>
							</div>
						))}
						{!isLoading && resources.length === 0 && (
							<p className="text-center text-sm text-muted-foreground py-6 border-2 border-dashed rounded-lg">No resources added.</p>
						)}
					</div>
				</CardContent>
			</Card>
			<ConfirmDeleteDialog
				open={!!deleteId}
				onOpenChange={(open) => !open && setDeleteId(null)}
				onConfirm={handleDelete}
				title="Delete Resource"
				description="Are you sure you want to remove this resource?"
				isLoading={deleteResource.isPending}
			/>
		</div>
	);
}
