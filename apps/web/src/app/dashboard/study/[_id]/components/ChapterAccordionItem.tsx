"use client";

import { Icon } from "@package/components/icon";
import type { StudyChapterItem } from "@package/schema/courses.types";
import { LessonRow } from "./LessonRow";

interface ChapterAccordionItemProps {
	chapter: StudyChapterItem;
	isExpanded: boolean;
	currentLessonId: string | null;
	onToggle: (chapterId: string) => void;
	onLessonClick: (lessonId: string) => void;
}

export function ChapterAccordionItem({
	chapter,
	isExpanded,
	currentLessonId,
	onToggle,
	onLessonClick,
}: ChapterAccordionItemProps) {
	return (
		<div className="flex flex-col">
			<button
				onClick={() => onToggle(chapter.id)}
				className="flex items-start justify-between p-4 w-full text-left hover:bg-muted/30 transition-colors cursor-pointer border-none bg-transparent"
			>
				<div className="space-y-1 pr-2">
					<h4 className="text-xs font-bold text-foreground">
						Ch {chapter.chapter_no}: {chapter.title}
					</h4>
					<div className="text-[10px] text-muted-foreground font-mono">
						{chapter.progress.lessons_completed}/{chapter.total_lectures} lectures • {Math.floor(chapter.total_duration_seconds / 60)}m
					</div>
				</div>
				<Icon
					name={isExpanded ? "IconChevronUp" : "IconChevronDown"}
					className="w-4.5 h-4.5 text-muted-foreground shrink-0 mt-0.5"
				/>
			</button>

			{isExpanded && (
				<div className="bg-muted/10 divide-y border-t">
					{chapter.lessons.map((lesson) => (
						<LessonRow
							key={lesson.id}
							lesson={lesson}
							isActive={currentLessonId === lesson.id}
							onClick={() => onLessonClick(lesson.id)}
						/>
					))}
				</div>
			)}
		</div>
	);
}
