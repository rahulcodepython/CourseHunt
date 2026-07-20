"use client";

import React, { useState } from "react";
import { Button } from "@package/ui/button";
import { Card, CardContent } from "@package/ui/card";
import { Label } from "@package/ui/label";
import { Textarea } from "@package/ui/textarea";
import { useCreateFeedbackMutation } from "@package/query-hooks/feedbacks.api";
import { toast } from "sonner";
import { StarRating } from "./StarRating";

interface FeedbackTabProps {
	courseId: string;
}

export function FeedbackTab({ courseId }: FeedbackTabProps) {
	const createFeedbackMutation = useCreateFeedbackMutation();

	const [feedbackRating, setFeedbackRating] = useState(5);
	const [feedbackContent, setFeedbackContent] = useState("");

	const handleSubmitFeedback = async () => {
		if (!feedbackContent.trim()) {
			toast.error("Please fill in feedback details");
			return;
		}
		const res = await createFeedbackMutation.execute({
			course_id: courseId,
			content: feedbackContent,
			rating: feedbackRating,
		});
		if (res) {
			toast.success("Thank you for your feedback!");
			setFeedbackContent("");
		}
	};

	return (
		<Card className="border shadow-xs">
			<CardContent className="p-5 space-y-5">
				<div className="space-y-1">
					<Label className="text-xs font-semibold">Course Rating</Label>
					<StarRating value={feedbackRating} onChange={setFeedbackRating} />
				</div>

				<div className="space-y-2">
					<Label htmlFor="feed" className="text-xs font-semibold">Feedback Comment</Label>
					<Textarea
						id="feed"
						placeholder="Tell us what you liked or how we can improve this course..."
						value={feedbackContent}
						onChange={(e) => setFeedbackContent(e.target.value)}
						className="min-h-[100px] bg-muted/20 text-xs"
					/>
				</div>

				<Button size="sm" onClick={handleSubmitFeedback} className="text-white bg-primary cursor-pointer">
					Submit Review
				</Button>
			</CardContent>
		</Card>
	);
}
