"use client";

import React from "react";
import { Button } from "@package/ui/button";
import { Card, CardContent } from "@package/ui/card";
import { Icon } from "@/components/icon";
import { QuizTaker } from "./QuizTaker";

interface LessonContentPlayerProps {
	content: {
		lesson_type: string;
		video_content?: {
			video_url: string;
			written_content?: string | null;
		} | null;
		document_content?: {
			content: string;
		} | null;
		quiz_content?: {
			id: string;
			title: string;
			total_questions: number;
			time_limit_seconds: number;
			pass_score_percent: number;
		} | null;
	};
	handleComplete: () => void;
}

export function LessonContentPlayer({ content, handleComplete }: LessonContentPlayerProps) {
	return (
		<Card className="overflow-hidden border-none shadow-xs mt-0">
			<div className="bg-muted/10 border-b p-4 flex items-center justify-between">
				<h2 className="font-bold text-base capitalize flex items-center gap-2">
					{content.lesson_type === "video" && <Icon name="IconVideo" className="w-5 h-5 text-primary" />}
					{content.lesson_type === "document" && <Icon name="IconFileText" className="w-5 h-5 text-primary" />}
					{content.lesson_type === "quiz" && <Icon name="IconHelp" className="w-5 h-5 text-primary" />}
					Lesson Content
				</h2>
				<Button size="sm" variant="outline" className="text-xs h-8 cursor-pointer" onClick={handleComplete}>
					<Icon name="IconCheck" className="w-4 h-4 mr-1.5" /> Mark Complete
				</Button>
			</div>

			<CardContent className="p-0">
				{content.lesson_type === "video" && content.video_content && (
					<div className="relative aspect-video bg-black flex items-center justify-center">
						<video src={content.video_content.video_url} controls className="w-full h-full object-contain" />
					</div>
				)}

				{content.lesson_type === "document" && content.document_content && (
					<div className="p-6 prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
						{content.document_content.content}
					</div>
				)}

				{content.lesson_type === "quiz" && content.quiz_content && (
					<QuizTaker quizMetadata={content.quiz_content} />
				)}
			</CardContent>
		</Card>
	);
}
