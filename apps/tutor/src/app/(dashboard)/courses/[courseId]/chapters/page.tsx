"use client";

import { Button } from "@package/ui/button";
import { Icon } from "@package/components/icon";
import { useChaptersQuery, useDeleteChapterMutation } from "@package/query-hooks/chapters.api";
import type { Chapter } from "@package/schema/chapters.types";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ChapterCard } from "./components/ChapterCard";
import { ChapterCreateDialog } from "./components/ChapterCreateDialog";
import { ChapterUpdateDialog } from "./components/ChapterUpdateDialog";
import { LessonCreateDialog } from "./components/LessonCreateDialog";
import { ConfirmDeleteDialog } from "@package/components/confirm-delete-dialog";
import Link from "next/link";

export default function CourseChaptersPage() {
	const params = useParams();
	const courseId = params.courseId as string;

	const { data: chaptersRaw, isLoading: chaptersLoading } = useChaptersQuery(courseId);
	const deleteMutation = useDeleteChapterMutation(courseId);
	const chapters: Chapter[] = chaptersRaw?.data ?? [];

	const [createChapterOpen, setCreateChapterOpen] = useState(false);
	const [updateChapter, setUpdateChapter] = useState<Chapter | null>(null);
	const [deleteChapterId, setDeleteChapterId] = useState<string | null>(null);

	const [createLessonChapterId, setCreateLessonChapterId] = useState<string | null>(null);

	const handleDeleteChapter = async () => {
		if (deleteChapterId) {
			await deleteMutation.execute(deleteChapterId);
			setDeleteChapterId(null);
		}
	};

	const getNextLessonNo = (chapterId: string) => {
		const chapter = chapters.find((c) => c.id === chapterId);
		return chapter ? chapter.total_lectures + 1 : 1;
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<div className="flex items-center gap-2 mb-2">
						<Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
							<Icon name="IconArrowLeft" className="w-4 h-4" />
							Back to Courses
						</Link>
					</div>
					<h1 className="text-2xl font-bold">Course Structure</h1>
					<p className="text-muted-foreground text-sm">Manage chapters and lessons</p>
				</div>
				<Button onClick={() => setCreateChapterOpen(true)}>
					<Icon name="IconPlus" className="w-4 h-4 mr-1" />
					Add Chapter
				</Button>
			</div>

			{chaptersLoading && <p className="text-muted-foreground">Loading chapters...</p>}

			<div className="space-y-4">
				{chapters.map((chapter) => (
					<ChapterCard
						key={chapter.id}
						chapter={chapter}
						courseId={courseId}
						onEdit={setUpdateChapter}
						onDelete={setDeleteChapterId}
						onLessonCreate={setCreateLessonChapterId}
					/>
				))}
				{chapters.length === 0 && !chaptersLoading && (
					<div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
						<Icon name="IconHierarchy" className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
						<p>No chapters yet. Create your first chapter to get started.</p>
					</div>
				)}
			</div>

			<ChapterCreateDialog
				courseId={courseId}
				nextChapterNo={chapters.length + 1}
				open={createChapterOpen}
				onOpenChange={setCreateChapterOpen}
			/>

			<ChapterUpdateDialog
				courseId={courseId}
				chapter={updateChapter}
				open={!!updateChapter}
				onOpenChange={(open) => !open && setUpdateChapter(null)}
			/>

			<LessonCreateDialog
				chapterId={createLessonChapterId}
				open={!!createLessonChapterId}
				onOpenChange={(open) => !open && setCreateLessonChapterId(null)}
				nextLessonNo={createLessonChapterId ? getNextLessonNo(createLessonChapterId) : 1}
			/>

			<ConfirmDeleteDialog
				open={!!deleteChapterId}
				onOpenChange={(open) => !open && setDeleteChapterId(null)}
				onConfirm={handleDeleteChapter}
				title="Delete Chapter"
				description="Are you sure you want to delete this chapter? All lessons inside this chapter will be permanently removed. This action cannot be undone."
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}
