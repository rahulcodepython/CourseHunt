"use client";

import React from "react";
import { Button } from "@package/ui/button";
import { Card, CardContent } from "@package/ui/card";
import { Icon } from "@package/components/icon";
import { QuizTaker } from "./QuizTaker";
import { LessonTypeIcon } from "./LessonTypeIcon";
import { VideoContent } from "./VideoContent";
import { DocumentContent } from "./DocumentContent";
import { AggregatedLessonContentResponseZod } from "@package/schema/lessons.types";
import z from "zod";

interface LessonContentPlayerProps {
	content: z.infer<typeof AggregatedLessonContentResponseZod>;
	handleComplete: () => void;
}

export function LessonContentPlayer({ content, handleComplete }: LessonContentPlayerProps) {
	return (
		<Card className="overflow-hidden border-none shadow-xs mt-0">
			<div className="bg-muted/10 border-b p-4 flex items-center justify-between">
				<h2 className="font-bold text-base capitalize flex items-center gap-2">
					<LessonTypeIcon type={content.lesson_type} className="w-5 h-5 text-primary" />
					Lesson Content
				</h2>
				<Button size="sm" variant="outline" className="text-xs h-8 cursor-pointer" onClick={handleComplete}>
					<Icon name="IconCheck" className="w-4 h-4 mr-1.5" /> Mark Complete
				</Button>
			</div>

			<CardContent className="p-0">
				{content.lesson_type === "video" && content.video_content && (
					<VideoContent videoUrl={content.video_content.video_url} />
				)}
				{content.lesson_type === "document" && content.document_content && (
					<DocumentContent content={content.document_content.content} />
				)}
				{content.lesson_type === "quiz" && content.quiz_content && (
					<QuizTaker quizMetadata={content.quiz_content} />
				)}
			</CardContent>
		</Card>
	);
}
