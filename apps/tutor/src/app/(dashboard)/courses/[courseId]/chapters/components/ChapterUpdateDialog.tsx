"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@package/ui/dialog";
import { Button } from "@package/ui/button";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { useUpdateChapterMutation } from "@package/query-hooks/chapters.api";
import { useState, useEffect } from "react";
import type { Chapter } from "@package/schema/chapters.types";
import { toast } from "sonner";

interface ChapterUpdateDialogProps {
	courseId: string;
	chapter: Chapter | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ChapterUpdateDialog({ courseId, chapter, open, onOpenChange }: ChapterUpdateDialogProps) {
	const updateMutation = useUpdateChapterMutation(courseId);
	const [title, setTitle] = useState("");

	useEffect(() => {
		if (chapter) {
			setTitle(chapter.title);
		}
	}, [chapter]);

	const handleUpdate = async () => {
		if (!chapter) return;
		if (!title.trim()) {
			toast.error("Chapter title is required");
			return;
		}
		const res = await updateMutation.execute({ id: chapter.id, data: { title } });
		if (res) {
			onOpenChange(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Update Chapter</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Chapter Number</Label>
						<Input value={chapter?.chapter_no || ""} disabled />
					</div>
					<div className="space-y-2">
						<Label>Chapter Title</Label>
						<Input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
					</div>
					<Button onClick={handleUpdate} className="w-full" disabled={updateMutation.isPending}>
						{updateMutation.isPending ? "Saving..." : "Save Changes"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
