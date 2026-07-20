"use client";

import React from "react";
import { Progress } from "@package/ui/progress";
import { Badge } from "@package/ui/badge";
import type { StudyChapterItem } from "@package/schema/courses.types";
import { ChapterAccordionItem } from "./ChapterAccordionItem";

interface CourseSidebarProps {
	courseTitle?: string;
	completionPercent: number;
	completed: boolean;
	chapters: StudyChapterItem[];
	currentLessonId: string | null;
	toggleChapter: (chapterId: string) => void;
	expandedChapters: Record<string, boolean>;
	handleLessonClick: (lessonId: string) => void;
}

export function CourseSidebar({
	courseTitle,
	completionPercent,
	completed,
	chapters,
	currentLessonId,
	toggleChapter,
	expandedChapters,
	handleLessonClick,
}: CourseSidebarProps) {
	return (
		<aside className="w-full lg:w-80 shrink-0 border rounded-xl bg-card h-fit lg:sticky lg:top-4 overflow-hidden flex flex-col shadow-xs">
			<div className="p-4 border-b bg-muted/20">
				<h3 className="font-bold text-sm line-clamp-1">{courseTitle || "Course Content"}</h3>
				<div className="flex items-center justify-between mt-3 mb-2">
					<span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Progress</span>
					<Badge variant={completed ? "default" : "secondary"} className={`text-[10px] ${completed ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}>
						{completed ? "Completed" : `${completionPercent.toFixed(0)}% Done`}
					</Badge>
				</div>
				<Progress value={completionPercent} className="h-1.5" />
			</div>

			<div className="divide-y max-h-[60vh] lg:max-h-[calc(100vh-14rem)] overflow-y-auto">
				{chapters.map((chapter) => (
					<ChapterAccordionItem
						key={chapter.id}
						chapter={chapter}
						isExpanded={!!expandedChapters[chapter.id]}
						currentLessonId={currentLessonId}
						onToggle={toggleChapter}
						onLessonClick={handleLessonClick}
					/>
				))}
			</div>
		</aside>
	);
}
