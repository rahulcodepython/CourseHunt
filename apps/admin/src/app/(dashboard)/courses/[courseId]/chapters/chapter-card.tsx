"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Button } from "@package/ui/button";
import { Icon } from "@package/components/icon";
import type { Chapter } from "@package/schema/chapters.types";
import { LessonsTable } from "./lessons-table";
import { useState } from "react";

interface ChapterCardProps {
	chapter: Chapter;
	courseId: string;
}

export function ChapterCard({ chapter, courseId }: ChapterCardProps) {
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
				<Button size="sm" variant={expanded ? "default" : "outline"} onClick={() => setExpanded(!expanded)}>
					<Icon name={expanded ? "IconChevronUp" : "IconChevronDown"} className="w-4 h-4 mr-1" />
					{expanded ? "Hide Lessons" : "Show Lessons"}
				</Button>
			</CardHeader>
			{expanded && (
				<CardContent className="pt-0 border-t bg-muted/5">
					<div className="pt-4">
						<LessonsTable chapterId={chapter.id} courseId={courseId} />
					</div>
				</CardContent>
			)}
		</Card>
	);
}
