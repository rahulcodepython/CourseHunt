"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { useChaptersQuery } from "@package/query-hooks/chapters.api";
import type { Chapter } from "@package/schema/chapters.types";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@package/components/page-header";
import { LoadingSpinner as Loading } from "@package/components/loading";
import { ChapterCard } from "./chapter-card";

export default function CourseChaptersPage() {
	const params = useParams();
	const courseId = params.courseId as string;

	const { data: chaptersRaw, isLoading: chaptersLoading } = useChaptersQuery(courseId);
	const chapters: Chapter[] = chaptersRaw?.data ?? [];

	if (chaptersLoading || !chaptersRaw?.data) {
		return (
			<div className="space-y-6">
				<div>
					<ButtonGhostBack />
					<PageHeader
						title="Course Chapters"
						subtitle="Browse the chapters and lessons for this course"
					/>
				</div>
				<Loading />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<ButtonGhostBack />
				<PageHeader
					title="Course Chapters"
					subtitle="Browse the chapters and lessons for this course"
				/>
			</div>

			{chapters.length === 0 ? (
				<div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed py-16 text-muted-foreground">
					<Icon name="IconHierarchy" className="size-10 opacity-40" />
					<p className="text-sm">No chapters yet.</p>
				</div>
			) : (
				<div className="space-y-4">
					{chapters.map((chapter) => (
						<ChapterCard
							key={chapter.id}
							chapter={chapter}
							courseId={courseId}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function ButtonGhostBack() {
	return (
		<Button
			variant="ghost"
			size="sm"
			asChild
			className="-ml-2 mb-2"
		>
			<Link href="/courses">
				<span className="flex items-center gap-1.5">
					<Icon name="IconArrowLeft" className="size-4" />
					Back to Courses
				</span>
			</Link>
		</Button>
	);
}
