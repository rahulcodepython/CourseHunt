"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@package/ui/dialog";
import { Button } from "@package/ui/button";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Textarea } from "@package/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@package/ui/select";
import { useCreateLessonMutation } from "@package/query-hooks/lessons.api";
import { useState } from "react";
import { toast } from "sonner";
import { Icon } from "@package/components/icon";
import { cn } from "@package/lib/utils";

interface LessonCreateDialogProps {
	chapterId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	nextLessonNo: number;
}

export function LessonCreateDialog({ chapterId, open, onOpenChange, nextLessonNo }: LessonCreateDialogProps) {
	const createMutation = useCreateLessonMutation(chapterId || "");
	
	const [step, setStep] = useState<1 | 2>(1);
	const [type, setType] = useState<"video" | "document" | "quiz">("video");
	const [formData, setFormData] = useState({
		title: "",
		short_description: "",
		preview_video_url: "",
		duration_seconds: 0,
	});

	const handleReset = () => {
		setStep(1);
		setType("video");
		setFormData({ title: "", short_description: "", preview_video_url: "", duration_seconds: 0 });
	};

	const handleCreate = async () => {
		if (!chapterId) return;
		if (!formData.title.trim()) {
			toast.error("Lesson title is required");
			return;
		}

		const res = await createMutation.execute({
			lesson_no: nextLessonNo,
			lesson_type: type,
			title: formData.title,
			short_description: formData.short_description || null,
			preview_video_url: type === "video" ? formData.preview_video_url || null : null,
			duration_seconds: formData.duration_seconds || 0,
		});

		if (res) {
			onOpenChange(false);
			handleReset();
		}
	};

	const typeCards = [
		{ id: "video", title: "Video Lesson", desc: "Upload or embed a video", icon: "IconVideo" },
		{ id: "document", title: "Document", desc: "Rich text article or PDF", icon: "IconFileText" },
		{ id: "quiz", title: "Quiz", desc: "Multiple choice assessment", icon: "IconQuestionMark" },
	] as const;

	return (
		<Dialog open={open} onOpenChange={(o) => {
			if (!o) handleReset();
			onOpenChange(o);
		}}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{step === 1 ? "Select Lesson Type" : "Create Lesson"}</DialogTitle>
				</DialogHeader>
				
				{step === 1 && (
					<div className="space-y-4 pt-4">
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							{typeCards.map((card) => (
								<button
									key={card.id}
									onClick={() => setType(card.id)}
									className={cn(
										"flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all hover:bg-muted/50",
										type === card.id ? "border-primary bg-primary/5" : "border-transparent bg-muted"
									)}
								>
									<Icon name={card.icon as any} className="w-8 h-8 mb-2" />
									<span className="font-semibold text-sm">{card.title}</span>
									<span className="text-xs text-muted-foreground mt-1">{card.desc}</span>
								</button>
							))}
						</div>
						<div className="flex justify-end pt-4">
							<Button onClick={() => setStep(2)}>Continue</Button>
						</div>
					</div>
				)}

				{step === 2 && (
					<div className="space-y-4 pt-4">
						<div className="space-y-2">
							<Label>Lesson Number</Label>
							<Input value={nextLessonNo} disabled />
						</div>
						<div className="space-y-2">
							<Label>Title</Label>
							<Input
								value={formData.title}
								onChange={(e) => setFormData({ ...formData, title: e.target.value })}
								placeholder="Lesson title"
							/>
						</div>
						<div className="space-y-2">
							<Label>Short Description</Label>
							<Textarea
								value={formData.short_description}
								onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
								placeholder="Brief summary..."
								rows={3}
							/>
						</div>
						{type === "video" && (
							<div className="space-y-2">
								<Label>Preview Video URL (Optional)</Label>
								<Input
									value={formData.preview_video_url}
									onChange={(e) => setFormData({ ...formData, preview_video_url: e.target.value })}
									placeholder="https://..."
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
						<div className="flex justify-between pt-4">
							<Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
							<Button onClick={handleCreate} disabled={createMutation.isPending}>
								{createMutation.isPending ? "Creating..." : "Create Lesson"}
							</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
