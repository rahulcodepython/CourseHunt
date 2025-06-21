import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { CourseRecord } from "@/models/course.record.models";

export const POST = routeHandlerWrapper(async (request: Request) => {
    const user = await checkAuthencticatedUserRequest();

    if (user instanceof Response) {
        return user;
    }

    const { courseId, chapterId, lessonId } = await request.json();

    const courseRecord = await CourseRecord.findOne({ userId: user._id });

    if (!courseRecord) {
        return new Response(JSON.stringify({ error: "No course record found" }), { status: 404 });
    }

    const courseIndex = courseRecord.courses.findIndex((c: any) => c.courseId.toString() === courseId);

    if (courseIndex === -1) {
        return new Response(JSON.stringify({ error: "Course not found in record" }), { status: 404 });
    }

    if (courseRecord.courses[courseIndex].viewed.length === 0) {
        courseRecord.courses[courseIndex].viewed.push({
            chapters: [{
                chapterId,
                lessons: [{ lessonId, viewedAt: new Date() }],
            }],
        });
    } else {
        const chapterIndex = courseRecord.courses[courseIndex].viewed[0].chapters.findIndex((c: any) => c.chapterId === chapterId);

        if (chapterIndex === -1) {
            courseRecord.courses[courseIndex].viewed[0].chapters.push({
                chapterId,
                lessons: [{ lessonId, viewedAt: new Date() }],
            });
        }

        const lessonIdIsPresent = courseRecord.courses[courseIndex].viewed[0].chapters[chapterIndex].lessons.some((l: any) => l.lessonId === lessonId);

        if (lessonIdIsPresent) {
            return new Response(JSON.stringify({ error: "Lesson already marked as read" }), { status: 400 });
        }

        courseRecord.courses[courseIndex].viewed[0].chapters[chapterIndex].lessons.push({
            lessonId,
            viewedAt: new Date(),
        });
    }

    courseRecord.courses[courseIndex].completedLessons += 1;
    courseRecord.courses[courseIndex].lastViewedLessonId = lessonId;
    courseRecord.completedLessons += 1;
    await courseRecord.save();

    return new Response(JSON.stringify({ message: "Lesson marked as read" }), {
        headers: { "Content-Type": "application/json" },
    });
})