"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@package/ui/dialog";
import { Button } from "@package/ui/button";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Textarea } from "@package/ui/textarea";
import { useUpdateLessonMutation } from "@package/query-hooks/lessons.api";
import { useState, useEffect } from "react";
import type { Lesson } from "@package/schema/lessons.types";
import { toast } from "sonner";
import { Badge } from "@package/ui/badge";

interface LessonUpdateDialogProps {
	chapterId: string;
	lesson: Lesson | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function LessonUpdateDialog({ chapterId, lesson, open, onOpenChange }: LessonUpdateDialogProps) {
	const updateMutation = useUpdateLessonMutation(chapterId);
	
	const [formData, setFormData] = useState({
		title: "",
		short_description: "",
		preview_video_url: "",
		duration_seconds: 0,
	});

	useEffect(() => {
		if (lesson) {
			setFormData({
				title: lesson.title,
				short_description: lesson.short_description || "",
				preview_video_url: lesson.preview_video_url || "",
				duration_seconds: lesson.duration_seconds,
			});
		}
	}, [lesson]);

	const handleUpdate = async () => {
		if (!lesson) return;
		if (!formData.title.trim()) {
			toast.error("Lesson title is required");
			return;
		}

		const res = await updateMutation.execute({
			id: lesson.id,
			data: {
				title: formData.title,
				short_description: formData.short_description || null,
				preview_video_url: lesson.lesson_type === "video" ? formData.preview_video_url || null : null,
				duration_seconds: formData.duration_seconds || 0,
			},
		});

		if (res) {
			onOpenChange(false);
			toast.success("Lesson details updated");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Update Lesson</DialogTitle>
				</DialogHeader>
				
				<div className="space-y-4 pt-4">
					<div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border">
						<div className="text-sm">Lesson Type</div>
						<Badge variant="outline" className="uppercase font-bold tracking-wider">{lesson?.lesson_type}</Badge>
					</div>

					<div className="space-y-2">
						<Label>Lesson Number</Label>
						<Input value={lesson?.lesson_no || ""} disabled />
					</div>
					<div className="space-y-2">
						<Label>Title</Label>
						<Input
							value={formData.title}
							onChange={(e) => setFormData({ ...formData, title: e.target.value })}
						/>
					</div>
					<div className="space-y-2">
						<Label>Short Description</Label>
						<Textarea
							value={formData.short_description}
							onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
							rows={3}
						/>
					</div>
					{lesson?.lesson_type === "video" && (
						<div className="space-y-2">
							<Label>Preview Video URL (Optional)</Label>
							<Input
								value={formData.preview_video_url}
								onChange={(e) => setFormData({ ...formData, preview_video_url: e.target.value })}
							/>
						</div>
					)}
					<div className="space-y-2">
						<Label>Estimated Duration (seconds)</Label>
						<Input
							type="number"
							value={formData.duration_seconds}
							onChange={(e) => setFormData({ ...formData, duration_seconds: Number(e.target.value) })}
						/>
					</div>
					<div className="flex justify-end pt-4">
						<Button onClick={handleUpdate} disabled={updateMutation.isPending}>
							{updateMutation.isPending ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
