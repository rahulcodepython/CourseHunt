"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { useCourseStudyQuery } from "@/query-hooks/courses.api";
import { Loading } from "@/components/loading";
import { Icon } from "@/components/icon";
import { CourseSidebar } from "./components/course-sidebar";

export default function StudyLayout({ children }: { children: React.ReactNode }) {
    const { courseId } = useParams<{ courseId: string }>();
    const searchParams = useSearchParams();
    const router = useRouter();
    const lessonId = searchParams.get("lessonId");

    const { data: raw, isLoading } = useCourseStudyQuery(courseId);
    const study = raw?.data;

    React.useEffect(() => {
        if (!study || lessonId) return;
        const allLessons = study.chapters.flatMap((c) => c.lessons);
        const target = allLessons.find((l) => !l.completed) ?? allLessons[0];
        if (target) router.replace(`/student/study/${courseId}?lessonId=${target.id}`);
    }, [study, lessonId, courseId, router]);

    if (isLoading) return <Loading />;

    if (!study) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
                <Icon name="ban" className="size-10 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">Course not found or not enrolled.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-4 lg:flex-row md:p-6">
            <main className="min-w-0 flex-1">{children}</main>
            <CourseSidebar courseId={courseId} study={study} activeLessonId={lessonId} />
        </div>
    );
}
