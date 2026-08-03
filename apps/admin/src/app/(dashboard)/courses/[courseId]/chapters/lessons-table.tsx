"use client";

import { useLessonsQuery } from "@package/query-hooks/lessons.api";
import { Button } from "@package/ui/button";
import { Badge } from "@package/ui/badge";
import { Icon } from "@package/components/icon";
import { cn } from "@package/lib/utils";
import Link from "next/link";
import type { Lesson } from "@package/schema/lessons.types";

interface LessonsTableProps {
	chapterId: string;
	courseId: string;
}

const lessonTypeBadge: Record<string, { label: string; className: string }> = {
	video: {
		label: "Video",
		className: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400",
	},
	document: {
		label: "Document",
		className: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400",
	},
	quiz: {
		label: "Quiz",
		className: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
	},
};

export function LessonsTable({ chapterId, courseId }: LessonsTableProps) {
	const { data: raw, isLoading } = useLessonsQuery(chapterId);
	const lessons: Lesson[] = raw?.data ?? [];

	if (isLoading) return <p className="text-xs text-muted-foreground p-4">Loading lessons...</p>;

	return (
		<div className="space-y-3">
			{lessons.map((lesson) => (
				<div
					key={lesson.id}
					className="flex items-start gap-3 rounded-lg border bg-background p-3"
				>
					<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold text-muted-foreground">
						{lesson.lesson_no}
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<p className="truncate font-medium">{lesson.title}</p>
							<Badge
								className={cn(
									"shrink-0",
									lessonTypeBadge[lesson.lesson_type]?.className,
								)}
							>
								{lessonTypeBadge[lesson.lesson_type]?.label ?? lesson.lesson_type}
							</Badge>
						</div>
						<p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
							{lesson.short_description || "No description"}
						</p>
					</div>
					<Button variant="outline" size="sm" asChild className="shrink-0">
						<Link href={`/discussions/${lesson.id}`}>Discussions</Link>
					</Button>
				</div>
			))}
			{lessons.length === 0 && (
				<div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-muted-foreground">
					<Icon name="IconHierarchy" className="size-6 opacity-40" />
					<p className="text-sm">No lessons in this chapter.</p>
				</div>
			)}
		</div>
	);
}
