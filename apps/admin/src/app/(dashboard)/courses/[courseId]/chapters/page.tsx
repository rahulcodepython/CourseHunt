"use client";

import { Icon } from "@package/components/icon";
import { useChaptersQuery } from "@package/query-hooks/chapters.api";
import type { Chapter } from "@package/schema/chapters.types";
import { useParams } from "next/navigation";
import { ChapterCard } from "./chapter-card";
import Link from "next/link";

export default function CourseChaptersPage() {
	const params = useParams();
	const courseId = params.courseId as string;

	const { data: chaptersRaw, isLoading: chaptersLoading } = useChaptersQuery(courseId);
	const chapters: Chapter[] = chaptersRaw?.data ?? [];

	return (
		<div className="space-y-6">
			<div>
				<div className="flex items-center gap-2 mb-2">
					<Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
						<Icon name="IconArrowLeft" className="w-4 h-4" />
						Back to Courses
					</Link>
				</div>
				<h1 className="text-2xl font-bold">Course Chapters</h1>
				<p className="text-muted-foreground text-sm">View chapters and lessons</p>
			</div>

			{chaptersLoading && <p className="text-muted-foreground">Loading chapters...</p>}

			<div className="space-y-4">
				{chapters.map((chapter) => (
					<ChapterCard
						key={chapter.id}
						chapter={chapter}
						courseId={courseId}
					/>
				))}
				{chapters.length === 0 && !chaptersLoading && (
					<div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
						<Icon name="IconHierarchy" className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
						<p>No chapters yet.</p>
					</div>
				)}
			</div>
		</div>
	);
}
