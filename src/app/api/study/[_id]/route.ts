import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { Course } from "@/models/course.models";
import { CourseRecord } from "@/models/course.record.models";

export const GET = routeHandlerWrapper(async (request: Request, params: { _id: string }) => {
    const user = await checkAuthencticatedUserRequest()

    if (user instanceof Response) {
        return user;
    }

    const { _id } = params;

    if (!_id) {
        return new Response("Invalid ID", { status: 400 });
    }

    const courseRecord = await CourseRecord.findOne({ userId: user._id })

    const courseData = courseRecord?.courses.find((c: any) => c.courseId.toString() === _id);
    const viewedLessonIds = new Set<string>();

    if (!courseData) {
        return new Response("You haven't purchased the course", { status: 404 });
    }

    if (courseData) {
        courseData.viewed?.forEach((view: any) => {
            view.chapters.forEach((chapter: any) => {
                chapter.lessons.forEach((lesson: any) => {
                    viewedLessonIds.add(lesson.lessonId);
                });
            });
        });
    }

    const course: any = await Course.findById(_id).lean(); // ✅ Already correct!

    const chaptersWithProgress = course?.chapters?.map((chapter: any) => ({
        _id: chapter._id.toString(),
        title: chapter.title,
        preview: chapter.preview,
        totallessons: chapter.totallessons,
        lessons: chapter.lessons.map((lesson: any) => ({
            _id: lesson._id.toString(),
            title: lesson.title,
            duration: lesson.duration,
            type: lesson.type,
            videoUrl: lesson.videoUrl,
            content: lesson.content,
            isCompleted: viewedLessonIds.has(lesson._id.toString()),
        })),
    }));

    const responseData = {
        _id: course._id,
        title: course.title,
        totalLessons: courseData.totalLessons,
        completedLessons: courseData.completedLessons,
        lastViewedLessonId: courseData.lastViewedLessonId,
        chapters: chaptersWithProgress,
        resources: course.resources,

    }

    return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
})