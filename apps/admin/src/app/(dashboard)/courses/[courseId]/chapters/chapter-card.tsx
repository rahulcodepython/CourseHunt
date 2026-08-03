"use client";

import { Card, CardContent } from "@package/ui/card";
import { Button } from "@package/ui/button";
import { Icon } from "@package/components/icon";
import { cn } from "@package/lib/utils";
import type { Chapter } from "@package/schema/chapters.types";
import { LessonsTable } from "./lessons-table";
import { useState } from "react";

interface ChapterCardProps {
	chapter: Chapter;
	courseId: string;
}

export function ChapterCard({ chapter, courseId }: ChapterCardProps) {
	const [open, setOpen] = useState(false);

	return (
		<Card className="gap-0">
			<CardContent className="flex items-start gap-3 py-4">
				<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
					{chapter.chapter_no}
				</div>
				<div className="flex min-w-0 flex-1 flex-col">
					<p className="font-semibold">{chapter.title}</p>
					<p className="text-sm text-muted-foreground">
						{chapter.total_lectures} lessons
					</p>
					<div className="mt-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setOpen((o) => !o)}
							className="justify-start gap-1 px-0 font-medium"
						>
							{open ? "Hide Lessons" : "Show Lessons"}
							<Icon
								name="IconChevronDown"
								className={cn("size-3.5 transition-transform", open && "rotate-180")}
							/>
						</Button>
						{open && (
							<div className="mt-3 space-y-3 border-t bg-muted/5 pt-4">
								<LessonsTable chapterId={chapter.id} courseId={courseId} />
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
