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

    const course = await Course.findById(_id);

    if (!course) {
        return new Response("Course not found", { status: 404 });
    }

    const courseRecord = await CourseRecord.findOne({ userId: user._id, courseId: course._id });

    if (!courseRecord) {
        return new Response("You haven't purchased the course", { status: 404 });
    }

    const responseData = {
        _id: course._id,
        title: course.title,
        totalLessons: course.lessonsCount,
        completedLessons: courseRecord.completedLessons,
        lastViewedLessonId: courseRecord.lastViewedLessonId,
        viewedLessons: courseRecord.viewedLessons || [],
        chapters: course.chapters,
        resources: course.resources,

    }

    return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
})