"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Button } from "@package/ui/button";
import { Textarea } from "@package/ui/textarea";
import { Label } from "@package/ui/label";
import { useAddDocumentMutation } from "@package/query-hooks/lessons.api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Icon } from "@package/components/icon";

interface DocumentContentEditorProps {
	lessonId: string;
	initialContent?: string | null;
}

export function DocumentContentEditor({ lessonId, initialContent }: DocumentContentEditorProps) {
	const addDocument = useAddDocumentMutation(lessonId);
	const [docContent, setDocContent] = useState(initialContent || "");

	useEffect(() => {
		if (initialContent) setDocContent(initialContent);
	}, [initialContent]);

	const handleSaveDocument = async () => {
		if (!docContent.trim()) return toast.error("Document content is required");
		const res = await addDocument.execute({ content: docContent });
		if (res) toast.success("Document content saved");
	};

	return (
		<Card>
			<CardHeader><CardTitle>Document Content</CardTitle></CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label>Content (Markdown supported)</Label>
					<Textarea value={docContent} onChange={(e) => setDocContent(e.target.value)} className="min-h-[400px] font-mono text-sm" placeholder="Write your lesson content here..." />
				</div>
				<Button onClick={handleSaveDocument} disabled={addDocument.isPending}>
					<Icon name="IconDeviceFloppy" className="w-4 h-4 mr-1" />
					{addDocument.isPending ? "Saving..." : "Save Document"}
				</Button>
			</CardContent>
		</Card>
	);
}
