import { checkAdminUserRequest, routeHandlerWrapper } from "@/action";
import { Course } from "@/models/course.models";

export const GET = routeHandlerWrapper(async (request: Request, { params }: { params: Promise<{ _id: string }> }) => {
    await checkAdminUserRequest()

    const { _id } = await params;
    const course = await Course.findById(_id);
    return new Response(JSON.stringify(course), { status: 200 });
});

export const PATCH = routeHandlerWrapper(async (request: Request, { params }: { params: Promise<{ _id: string }> }) => {
    await checkAdminUserRequest()

    const { _id } = await params;
    const courseData = await request.json();
    const updatedCourse = await Course.findByIdAndUpdate(_id, courseData, { new: true });
    return new Response(JSON.stringify(updatedCourse), { status: 200 });
});

export const DELETE = routeHandlerWrapper(async (request: Request, { params }: { params: Promise<{ _id: string }> }) => {
    await checkAdminUserRequest()

    const { _id } = await params;
    await Course.findByIdAndDelete(_id);
    return new Response(JSON.stringify({ message: "Course deleted successfully" }), { status: 200 });
});
