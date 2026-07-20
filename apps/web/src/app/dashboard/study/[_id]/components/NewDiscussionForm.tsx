"use client";

import { useState } from "react";
import { Button } from "@package/ui/button";
import { Label } from "@package/ui/label";
import { Textarea } from "@package/ui/textarea";

interface NewDiscussionFormProps {
	onSubmit: (content: string) => Promise<boolean>;
}

export function NewDiscussionForm({ onSubmit }: NewDiscussionFormProps) {
	const [content, setContent] = useState("");

	const handleSubmit = async () => {
		if (!content.trim()) return;
		const ok = await onSubmit(content);
		if (ok) setContent("");
	};

	return (
		<div className="bg-card border rounded-lg p-4 space-y-3 shadow-xs">
			<Label htmlFor="discuss" className="text-xs font-semibold">Ask a Question / Post Update</Label>
			<Textarea
				id="discuss"
				placeholder="What would you like to discuss about this lesson?"
				value={content}
				onChange={(e) => setContent(e.target.value)}
				className="min-h-20 bg-muted/20 text-xs"
			/>
			<Button size="sm" onClick={handleSubmit} className="text-white bg-primary cursor-pointer">
				Post Thread
			</Button>
		</div>
	);
}
