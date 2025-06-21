import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { CourseRecord } from "@/models/course.record.models";

export const POST = routeHandlerWrapper(async (request: Request) => {
    const user = await checkAuthencticatedUserRequest();

    if (user instanceof Response) {
        return user;
    }

    const { lessonId, courseId } = await request.json();

    const courseRecord = await CourseRecord.findOne({ userId: user._id });

    if (!courseRecord) {
        return new Response("No course record found", { status: 404 });
    }

    const courseIndex = courseRecord.courses.findIndex((c: any) => c.courseId.toString() === courseId);

    if (courseIndex === -1) {
        return new Response("Course not found in record", { status: 404 });
    }

    courseRecord.courses[courseIndex].lastViewedLessonId = lessonId;
    await courseRecord.save();


    return new Response(JSON.stringify({}), {
        headers: { "Content-Type": "application/json" },
    });
})