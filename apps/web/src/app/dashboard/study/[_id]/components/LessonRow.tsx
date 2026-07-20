"use client";

import { Icon } from "@package/components/icon";
import type { StudyChapterItem } from "@package/schema/courses.types";
import { LessonTypeIcon } from "./LessonTypeIcon";

type Lesson = StudyChapterItem["lessons"][number];

function formatDuration(seconds: number) {
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

interface LessonRowProps {
	lesson: Lesson;
	isActive: boolean;
	onClick: () => void;
}

export function LessonRow({ lesson, isActive, onClick }: LessonRowProps) {
	return (
		<button
			onClick={onClick}
			className={`flex items-start gap-3 p-3.5 w-full text-left transition-colors cursor-pointer border-none bg-transparent ${
				isActive ? "bg-primary/5 text-primary border-l-2 border-primary pl-[12px]" : "hover:bg-muted/40"
			}`}
		>
			<div className="shrink-0 mt-0.5">
				{lesson.completed ? (
					<Icon name="IconCircleCheck" className="w-4.5 h-4.5 text-green-500 fill-green-500/10" />
				) : (
					<Icon name="IconCircle" className="w-4.5 h-4.5 text-muted-foreground" />
				)}
			</div>
			<div className="min-w-0 flex-1">
				<div className={`text-xs font-medium leading-tight ${isActive ? "font-semibold text-primary" : "text-foreground"}`}>
					{lesson.title}
				</div>
				<div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground font-mono">
					<LessonTypeIcon type={lesson.lesson_type} className="w-3 h-3" />
					<span className="capitalize">{lesson.lesson_type}</span>
					<span>•</span>
					<span>{formatDuration(lesson.duration_seconds)}</span>
				</div>
			</div>
		</button>
	);
}
