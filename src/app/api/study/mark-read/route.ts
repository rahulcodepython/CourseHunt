import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { Course } from "@/models/course.models";
import { CourseRecord } from "@/models/course.record.models";
import { isValidObjectId } from "mongoose";

export const POST = routeHandlerWrapper(async (request: Request) => {
    const user = await checkAuthencticatedUserRequest();

    if (user instanceof Response) {
        return user;
    }

    const { courseId, chapterId, lessonId } = await request.json();

    const course = await Course.findById(courseId);

    if (!course) {
        return new Response(JSON.stringify({ error: "Course not found" }), { status: 404 });
    }

    const courseRecord = await CourseRecord.findOne({ userId: user._id, courseId: course._id });

    if (!courseRecord) {
        return new Response(JSON.stringify({ error: "No course record found" }), { status: 404 });
    }

    if (!isValidObjectId(chapterId) || !isValidObjectId(lessonId)) {
        return new Response(JSON.stringify({ error: "Invalid chapterId or lessonId" }), { status: 400 });
    }

    const alreadyViewed = courseRecord.viewedLessons.some(
        (lesson: { lessonId: string, chapterId: string }) => lesson.lessonId === lessonId && lesson.chapterId === chapterId
    );

    if (alreadyViewed) {
        return new Response(JSON.stringify({ message: "Lesson already marked as read" }), {
            headers: { "Content-Type": "application/json" },
        });
    }

    courseRecord.viewedLessons.push({
        chapterId: chapterId,
        lessonId: lessonId,
        viewedAt: new Date(),
    });
    courseRecord.completedLessons += 1;
    courseRecord.lastViewedLessonId = lessonId;
    await courseRecord.save();

    return new Response(JSON.stringify({ message: "Lesson marked as read" }), {
        headers: { "Content-Type": "application/json" },
    });
})