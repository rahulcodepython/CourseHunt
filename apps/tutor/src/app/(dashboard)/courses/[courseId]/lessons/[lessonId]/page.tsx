"use client";

import { useLessonContentQuery } from "@package/query-hooks/lessons.api";
import { useParams } from "next/navigation";
import { VideoContentEditor } from "./components/VideoContentEditor";
import { DocumentContentEditor } from "./components/DocumentContentEditor";
import { QuizContentEditor } from "./components/QuizContentEditor";
import { ResourcesPanel } from "./components/ResourcesPanel";
import { Icon } from "@package/components/icon";
import Link from "next/link";
import { Badge } from "@package/ui/badge";

export default function LessonEditorPage() {
	const params = useParams();
	const courseId = params.courseId as string;
	const lessonId = params.lessonId as string;

	const { data: contentRaw, isLoading } = useLessonContentQuery(lessonId);
	const content = contentRaw?.data;

	if (isLoading) {
		return <div className="py-12 text-center text-muted-foreground">Loading lesson content...</div>;
	}

	if (!content) {
		return <div className="py-12 text-center text-muted-foreground">Failed to load lesson content.</div>;
	}

	return (
		<div className="space-y-6 max-w-4xl pb-12">
			<div className="flex items-center gap-2 mb-2">
				<Link href={`/courses/${courseId}/chapters`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
					<Icon name="IconArrowLeft" className="w-4 h-4" />
					Back to Chapters
				</Link>
			</div>
			
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold flex items-center gap-3">
						Lesson Editor
						<Badge variant="outline" className="uppercase tracking-widest text-[10px] py-1 border-primary/20 text-primary">
							{content.lesson_type}
						</Badge>
					</h1>
					<p className="text-muted-foreground text-sm mt-1">Manage content and resources for this lesson</p>
				</div>
			</div>

			<div className="mt-6">
				{content.lesson_type === "video" && (
					<VideoContentEditor
						lessonId={lessonId}
						initialVideoUrl={content.video_content?.video_url}
						initialWrittenContent={content.video_content?.written_content}
					/>
				)}
				
				{content.lesson_type === "document" && (
					<DocumentContentEditor
						lessonId={lessonId}
						initialContent={content.document_content?.content}
					/>
				)}
				
				{content.lesson_type === "quiz" && (
					<QuizContentEditor
						lessonId={lessonId}
						quiz={content.quiz_content || undefined}
					/>
				)}
			</div>

			<ResourcesPanel lessonId={lessonId} />
		</div>
	);
}
