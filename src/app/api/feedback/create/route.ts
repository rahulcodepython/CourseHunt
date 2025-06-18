import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { Course } from "@/models/course.models";
import { Feedback } from "@/models/feedback.models";
import { NextResponse } from "next/server";

export const POST = routeHandlerWrapper(async (request: Request) => {
    const user = await checkAuthencticatedUserRequest()

    if (user instanceof NextResponse) {
        return user;
    }

    const { courseId, message, rating } = await request.json();

    if (!courseId || !message || rating === undefined) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const course = await Course.findById(courseId);

    if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const feedback = new Feedback({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        courseId,
        courseName: course.title,
        message,
        rating,
    });
    await feedback.save();

    return NextResponse.json({ message: "Feedback submitted successfully" }, { status: 200 });
});
