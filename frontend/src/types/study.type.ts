import { ChapterType, ResourcesType } from "./course.type";

export interface ViewedLessonType {
    chapterId: number;
    lessonId: number;
    viewedAt: string;
}

export interface CourseProgressType {
    _id: number;
    title: string;
    totalLessons: number;
    completedLessons: number;
    lastViewedLessonId: number;
    viewedLessons: ViewedLessonType[];
    chapters: ChapterType[];
    resources: ResourcesType[];
}
