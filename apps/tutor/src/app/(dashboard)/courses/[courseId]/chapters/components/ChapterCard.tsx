"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Button } from "@package/ui/button";
import { Icon } from "@package/components/icon";
import type { Chapter } from "@package/schema/chapters.types";
import { LessonsTable } from "@/app/(dashboard)/courses/[courseId]/chapters/components/LessonsTable";
import { useState } from "react";
import { cn } from "@package/lib/utils";

interface ChapterCardProps {
	chapter: Chapter;
	courseId: string;
	onEdit: (chapter: Chapter) => void;
	onDelete: (id: string) => void;
	onLessonCreate: (chapterId: string) => void;
}

export function ChapterCard({ chapter, courseId, onEdit, onDelete, onLessonCreate }: ChapterCardProps) {
	const [expanded, setExpanded] = useState(false);

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between py-4">
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
						{chapter.chapter_no}
					</div>
					<div>
						<CardTitle className="text-base">{chapter.title}</CardTitle>
						<p className="text-xs text-muted-foreground">{chapter.total_lectures} lessons</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" onClick={() => onEdit(chapter)} title="Edit chapter title">
						<Icon name="IconPencil" className="w-4 h-4" />
					</Button>
					<Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(chapter.id)} title="Delete chapter">
						<Icon name="IconTrash" className="w-4 h-4" />
					</Button>
					<Button size="sm" variant={expanded ? "default" : "outline"} onClick={() => setExpanded(!expanded)}>
						<Icon name={expanded ? "IconChevronUp" : "IconChevronDown"} className="w-4 h-4 mr-1" />
						{expanded ? "Hide Lessons" : "Show Lessons"}
					</Button>
				</div>
			</CardHeader>
			{expanded && (
				<CardContent className="pt-0 border-t bg-muted/5">
					<div className="pt-4">
						<LessonsTable chapterId={chapter.id} courseId={courseId} onLessonCreate={() => onLessonCreate(chapter.id)} />
					</div>
				</CardContent>
			)}
		</Card>
	);
}
