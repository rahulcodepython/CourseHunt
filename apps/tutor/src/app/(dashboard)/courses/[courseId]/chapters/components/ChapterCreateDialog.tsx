"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@package/ui/dialog";
import { Button } from "@package/ui/button";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { useCreateChapterMutation } from "@package/query-hooks/chapters.api";
import { useState } from "react";
import { toast } from "sonner";

interface ChapterCreateDialogProps {
	courseId: string;
	nextChapterNo: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ChapterCreateDialog({ courseId, nextChapterNo, open, onOpenChange }: ChapterCreateDialogProps) {
	const createMutation = useCreateChapterMutation(courseId);
	const [title, setTitle] = useState("");

	const handleCreate = async () => {
		if (!title.trim()) {
			toast.error("Chapter title is required");
			return;
		}
		const res = await createMutation.execute({ title, chapter_no: nextChapterNo });
		if (res) {
			onOpenChange(false);
			setTitle("");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create New Chapter</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Chapter Number</Label>
						<Input value={nextChapterNo} disabled />
					</div>
					<div className="space-y-2">
						<Label>Chapter Title</Label>
						<Input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="e.g. Introduction to Course"
						/>
					</div>
					<Button onClick={handleCreate} className="w-full" disabled={createMutation.isPending}>
						{createMutation.isPending ? "Creating..." : "Create Chapter"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
