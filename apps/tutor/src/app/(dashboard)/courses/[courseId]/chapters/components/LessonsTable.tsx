"use client";

import { useLessonsQuery, useDeleteLessonMutation } from "@package/query-hooks/lessons.api";
import { Button } from "@package/ui/button";
import { Icon } from "@package/components/icon";
import { cn } from "@package/lib/utils";
import Link from "next/link";
import type { Lesson } from "@package/schema/lessons.types";
import { useState } from "react";
import { ConfirmDeleteDialog } from "@package/components/confirm-delete-dialog";
import { LessonUpdateDialog } from "@/app/(dashboard)/courses/[courseId]/chapters/components/LessonUpdateDialog";

interface LessonsTableProps {
	chapterId: string;
	courseId: string;
	onLessonCreate: () => void;
}

export function LessonsTable({ chapterId, courseId, onLessonCreate }: LessonsTableProps) {
	const { data: raw, isLoading } = useLessonsQuery(chapterId);
	const lessons: Lesson[] = raw?.data ?? [];
	const deleteMutation = useDeleteLessonMutation(chapterId);

	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [updateLesson, setUpdateLesson] = useState<Lesson | null>(null);

	const handleDelete = async () => {
		if (deleteId) {
			await deleteMutation.execute(deleteId);
			setDeleteId(null);
		}
	};

	if (isLoading) return <p className="text-xs text-muted-foreground p-4">Loading lessons...</p>;

	return (
		<div className="space-y-3">
			<div className="flex justify-end mb-2">
				<Button size="sm" variant="outline" onClick={onLessonCreate}>
					<Icon name="IconPlus" className="w-4 h-4 mr-1" /> Add Lesson
				</Button>
			</div>
			{lessons.map((lesson) => (
				<div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 px-3 rounded-lg bg-background border gap-3 sm:gap-0 hover:border-primary/50 transition-colors">
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
						<Link href={`/courses/${courseId}/lessons/${lesson.id}`} title="Edit Lesson Content & Resources">
							<Button variant="outline" size="sm">
								<Icon name="IconEdit" className="w-4 h-4" />
							</Button>
						</Link>
						<Button variant="ghost" size="sm" onClick={() => setUpdateLesson(lesson)} title="Update Lesson Details">
							<Icon name="IconSettings" className="w-4 h-4" />
						</Button>
						<Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(lesson.id)} title="Delete Lesson">
							<Icon name="IconTrash" className="w-4 h-4" />
						</Button>
					</div>
				</div>
			))}
			{lessons.length === 0 && (
				<div className="text-center py-6 border-2 border-dashed rounded-lg">
					<p className="text-sm text-muted-foreground">No lessons in this chapter yet.</p>
				</div>
			)}
			<ConfirmDeleteDialog
				open={!!deleteId}
				onOpenChange={(open) => !open && setDeleteId(null)}
				onConfirm={handleDelete}
				title="Delete Lesson"
				description="Are you sure you want to delete this lesson? All of its content, videos, documents, quizzes, and resources will be permanently removed. This action cannot be undone."
				isLoading={deleteMutation.isPending}
			/>
			<LessonUpdateDialog
				chapterId={chapterId}
				lesson={updateLesson}
				open={!!updateLesson}
				onOpenChange={(open) => !open && setUpdateLesson(null)}
			/>
		</div>
	);
}
