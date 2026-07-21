"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@package/ui/dialog";
import { Button } from "@package/ui/button";
import { Input } from "@package/ui/input";
import { Textarea } from "@package/ui/textarea";
import { Label } from "@package/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@package/ui/select";
import { useUpdateCourseMutation } from "@package/query-hooks/courses.api";
import { useState, useEffect } from "react";
import type { Course } from "@package/schema/courses.types";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@package/ui/tabs";

interface CourseUpdateDialogProps {
	course: Course | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CourseUpdateDialog({ course, open, onOpenChange }: CourseUpdateDialogProps) {
	const updateMutation = useUpdateCourseMutation();
	const [formData, setFormData] = useState({
		title: "",
		short_description: "",
		long_description: "",
		image_url: "",
		preview_video_url: "",
		language: "english",
		level: "beginner",
		actual_price: 0,
		final_price: 0,
		status: "draft",
	});

	useEffect(() => {
		if (course) {
			setFormData({
				title: course.title,
				short_description: course.short_description || "",
				long_description: course.long_description || "",
				image_url: course.image_url || "",
				preview_video_url: course.preview_video_url || "",
				language: course.language,
				level: course.level,
				actual_price: course.actual_price,
				final_price: course.final_price,
				status: course.status,
			});
		}
	}, [course]);

	const handleUpdate = async () => {
		if (!course) return;
		if (!formData.title.trim()) {
			toast.error("Course title is required");
			return;
		}

		const res = await updateMutation.execute({
			id: course.id,
			data: {
				title: formData.title,
				short_description: formData.short_description || null,
				long_description: formData.long_description || null,
				image_url: formData.image_url || null,
				preview_video_url: formData.preview_video_url || null,
				language: formData.language,
				level: formData.level,
				actual_price: formData.actual_price,
				final_price: formData.final_price,
				status: formData.status,
			},
		});

		if (res) {
			onOpenChange(false);
			toast.success("Course details updated");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Update Course Details</DialogTitle>
				</DialogHeader>

				<Tabs defaultValue="basic">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="basic">Basic Info</TabsTrigger>
						<TabsTrigger value="media">Media & Pricing</TabsTrigger>
						<TabsTrigger value="settings">Settings</TabsTrigger>
					</TabsList>

					<TabsContent value="basic" className="space-y-4 pt-4">
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
								rows={2}
							/>
						</div>
						<div className="space-y-2">
							<Label>Long Description</Label>
							<Textarea
								value={formData.long_description}
								onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
								rows={5}
							/>
						</div>
					</TabsContent>

					<TabsContent value="media" className="space-y-4 pt-4">
						<div className="space-y-2">
							<Label>Thumbnail Image URL</Label>
							<Input
								value={formData.image_url}
								onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
							/>
						</div>
						<div className="space-y-2">
							<Label>Preview Video URL</Label>
							<Input
								value={formData.preview_video_url}
								onChange={(e) => setFormData({ ...formData, preview_video_url: e.target.value })}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Actual Price (₹)</Label>
								<Input
									type="number"
									value={formData.actual_price}
									onChange={(e) => setFormData({ ...formData, actual_price: Number(e.target.value) })}
								/>
							</div>
							<div className="space-y-2">
								<Label>Final Price (₹)</Label>
								<Input
									type="number"
									value={formData.final_price}
									onChange={(e) => setFormData({ ...formData, final_price: Number(e.target.value) })}
								/>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="settings" className="space-y-4 pt-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Language</Label>
								<Select value={formData.language} onValueChange={(v) => setFormData({ ...formData, language: v || "english" })}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>
										<SelectItem value="english">English</SelectItem>
										<SelectItem value="hindi">Hindi</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Level</Label>
								<Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v || "beginner" })}>
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
								<Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v || "draft" })}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>
										<SelectItem value="draft">Draft</SelectItem>
										<SelectItem value="published">Published</SelectItem>
										<SelectItem value="archived">Archived</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</TabsContent>
				</Tabs>

				<div className="flex justify-end pt-4 border-t">
					<Button onClick={handleUpdate} disabled={updateMutation.isPending}>
						{updateMutation.isPending ? "Saving..." : "Save Changes"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
