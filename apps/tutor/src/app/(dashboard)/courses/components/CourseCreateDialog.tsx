"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@package/ui/dialog";
import { Button } from "@package/ui/button";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@package/ui/select";
import { useCreateCourseMutation } from "@package/query-hooks/courses.api";
import { useState } from "react";
import { toast } from "sonner";

interface CourseCreateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CourseCreateDialog({ open, onOpenChange }: CourseCreateDialogProps) {
	const createMutation = useCreateCourseMutation();
	const [newCourse, setNewCourse] = useState({ title: "", language: "english", level: "beginner", status: "draft" });

	const handleCreate = async () => {
		if (!newCourse.title.trim()) {
			toast.error("Course title is required");
			return;
		}
		const res = await createMutation.execute(newCourse);
		if (res) {
			onOpenChange(false);
			setNewCourse({ title: "", language: "english", level: "beginner", status: "draft" });
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create New Course</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Title</Label>
						<Input
							value={newCourse.title}
							onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
							placeholder="Course title"
						/>
					</div>
					<div className="space-y-2">
						<Label>Language</Label>
						<Select value={newCourse.language} onValueChange={(v) => setNewCourse({ ...newCourse, language: v || "english" })}>
							<SelectTrigger><SelectValue /></SelectTrigger>
							<SelectContent>
								<SelectItem value="english">English</SelectItem>
								<SelectItem value="hindi">Hindi</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Level</Label>
						<Select value={newCourse.level} onValueChange={(v) => setNewCourse({ ...newCourse, level: v || "beginner" })}>
							<SelectTrigger><SelectValue /></SelectTrigger>
							<SelectContent>
								<SelectItem value="beginner">Beginner</SelectItem>
								<SelectItem value="intermediate">Intermediate</SelectItem>
								<SelectItem value="advanced">Advanced</SelectItem>
								<SelectItem value="all">All Levels</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Status</Label>
						<Select value={newCourse.status} onValueChange={(v) => setNewCourse({ ...newCourse, status: v || "draft" })}>
							<SelectTrigger><SelectValue /></SelectTrigger>
							<SelectContent>
								<SelectItem value="draft">Draft</SelectItem>
								<SelectItem value="published">Published</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<Button onClick={handleCreate} className="w-full" disabled={createMutation.isPending}>
						{createMutation.isPending ? "Creating..." : "Create Course"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
