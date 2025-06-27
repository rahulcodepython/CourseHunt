import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { Course } from "@/models/course.models";
import { CourseRecord } from "@/models/course.record.models";
import { isValidObjectId } from "mongoose";

export const POST = routeHandlerWrapper(async (request: Request) => {
    const user = await checkAuthencticatedUserRequest();

    if (user instanceof Response) {
        return user;
    }

    const { lessonId, courseId } = await request.json();

    if (!lessonId || !courseId) {
        return new Response("Missing lessonId or courseId", { status: 400 });
    }

    const course = await Course.findById(courseId);

    if (!course) {
        return new Response("Course not found", { status: 404 });
    }

    if (!isValidObjectId(lessonId)) {
        return new Response("Invalid lessonId", { status: 400 });
    }

    const courseRecord = await CourseRecord.findOne({ userId: user._id });

    if (!courseRecord) {
        return new Response("No course record found", { status: 404 });
    }

    courseRecord.lastViewedLessonId = lessonId;
    await courseRecord.save();


    return new Response(JSON.stringify({}), {
        headers: { "Content-Type": "application/json" },
    });
})