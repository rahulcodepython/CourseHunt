"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Button } from "@package/ui/button";
import { Input } from "@package/ui/input";
import { Textarea } from "@package/ui/textarea";
import { Label } from "@package/ui/label";
import { useAddVideoMutation } from "@package/query-hooks/lessons.api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Icon } from "@package/components/icon";

interface VideoContentEditorProps {
	lessonId: string;
	initialVideoUrl?: string | null;
	initialWrittenContent?: string | null;
}

export function VideoContentEditor({ lessonId, initialVideoUrl, initialWrittenContent }: VideoContentEditorProps) {
	const addVideo = useAddVideoMutation(lessonId);
	const [videoUrl, setVideoUrl] = useState(initialVideoUrl || "");
	const [writtenContent, setWrittenContent] = useState(initialWrittenContent || "");

	useEffect(() => {
		if (initialVideoUrl) setVideoUrl(initialVideoUrl);
		if (initialWrittenContent) setWrittenContent(initialWrittenContent);
	}, [initialVideoUrl, initialWrittenContent]);

	const handleSaveVideo = async () => {
		if (!videoUrl.trim()) return toast.error("Video URL is required");
		const res = await addVideo.execute({ video_url: videoUrl, written_content: writtenContent || null });
		if (res) toast.success("Video content saved");
	};

	return (
		<Card>
			<CardHeader><CardTitle>Video Content</CardTitle></CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label>Video URL</Label>
					<Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://example.com/video.mp4" />
				</div>
				<div className="space-y-2">
					<Label>Written Content (optional)</Label>
					<Textarea value={writtenContent} onChange={(e) => setWrittenContent(e.target.value)} className="min-h-[200px]" placeholder="Supplementary written material..." />
				</div>
				<Button onClick={handleSaveVideo} disabled={addVideo.isPending}>
					<Icon name="IconDeviceFloppy" className="w-4 h-4 mr-1" />
					{addVideo.isPending ? "Saving..." : "Save Video"}
				</Button>
			</CardContent>
		</Card>
	);
}
