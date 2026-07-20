"use client";

import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCourseStudyQuery } from "@package/query-hooks/courses.api";
import Loading from "@/components/loading";
import React, { useEffect, useState } from "react";
import { CourseSidebar } from "@/app/dashboard/study/[_id]/components/CourseSidebar";

export default function StudyLayout({ children }: { children: React.ReactNode }) {
	const { _id } = useParams();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const currentLessonId = searchParams.get("lessonId");

	const { data: response, isLoading } = useCourseStudyQuery(_id as string);
	const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

	const chapters = response?.data?.chapters ?? [];
	const course = response?.data?.course;
	const completionPercent = response?.data?.completion_percent ?? 0;
	const completed = response?.data?.completed ?? false;

	useEffect(() => {
		if (currentLessonId && chapters.length > 0) {
			const activeChapter = chapters.find((ch) =>
				ch.lessons.some((l) => l.id === currentLessonId)
			);
			if (activeChapter) {
				setExpandedChapters((prev) => ({ ...prev, [activeChapter.id]: true }));
			}
		} else if (!currentLessonId && chapters.length > 0 && chapters[0].lessons.length > 0) {
			router.replace(`${pathname}?lessonId=${chapters[0].lessons[0].id}`);
		}
	}, [currentLessonId, chapters, router, pathname]);

	if (isLoading) return <Loading />;
	if (!response?.data) return <div className="text-center py-20 text-muted-foreground">Course not found or not enrolled.</div>;

	const toggleChapter = (chapterId: string) => {
		setExpandedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
	};

	const handleLessonClick = (lessonId: string) => {
		router.push(`${pathname}?lessonId=${lessonId}`);
	};

	return (
		<div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-5rem)]">
			{/* Main Content Area */}
			<main className="flex-1 min-w-0">
				{children}
			</main>

			{/* Course Sidebar Index */}
			<CourseSidebar
				courseTitle={course?.title}
				completionPercent={completionPercent}
				completed={completed}
				chapters={chapters}
				currentLessonId={currentLessonId}
				toggleChapter={toggleChapter}
				expandedChapters={expandedChapters}
				handleLessonClick={handleLessonClick}
			/>
		</div>
	);
}
