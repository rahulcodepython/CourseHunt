"use client";

import { useLessonsQuery } from "@package/query-hooks/lessons.api";
import { Button } from "@package/ui/button";
import { Icon } from "@package/components/icon";
import { cn } from "@package/lib/utils";
import Link from "next/link";
import type { Lesson } from "@package/schema/lessons.types";

interface LessonsTableProps {
	chapterId: string;
	courseId: string;
}

export function LessonsTable({ chapterId, courseId }: LessonsTableProps) {
	const { data: raw, isLoading } = useLessonsQuery(chapterId);
	const lessons: Lesson[] = raw?.data ?? [];

	if (isLoading) return <p className="text-xs text-muted-foreground p-4">Loading lessons...</p>;

	return (
		<div className="space-y-3">
			{lessons.map((lesson) => (
				<div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 px-3 rounded-lg bg-background border gap-3 sm:gap-0">
					<div className="flex items-start sm:items-center gap-3">
						<div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0 text-xs font-medium">
							{lesson.lesson_no}
						</div>
						<div>
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium">{lesson.title}</span>
								<span className={cn(
									"text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
									lesson.lesson_type === "video" ? "bg-blue-500/10 text-blue-500" :
									lesson.lesson_type === "document" ? "bg-green-500/10 text-green-500" :
									"bg-amber-500/10 text-amber-500"
								)}>
									{lesson.lesson_type}
								</span>
							</div>
							<p className="text-xs text-muted-foreground line-clamp-1">{lesson.short_description || "No description"}</p>
						</div>
					</div>
					<div className="flex items-center gap-1.5 self-end sm:self-auto">
						<Link href={`/discussions/${lesson.id}`} title="View discussions">
							<Button variant="outline" size="sm">
								<Icon name="IconMessage" className="w-4 h-4" />
								<span className="ml-1 text-xs">Discussions</span>
							</Button>
						</Link>
					</div>
				</div>
			))}
			{lessons.length === 0 && (
				<div className="text-center py-6 border-2 border-dashed rounded-lg">
					<p className="text-sm text-muted-foreground">No lessons in this chapter.</p>
				</div>
			)}
		</div>
	);
}
