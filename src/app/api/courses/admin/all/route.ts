import { checkAdminUserRequest, routeHandlerWrapper } from "@/action";
import { Course } from "@/models/course.models";

export const GET = routeHandlerWrapper(async (request: Request) => {
    await checkAdminUserRequest()

    const courses = await Course.find().select("-__v -createdAt");
    return new Response(JSON.stringify(courses), { status: 200 });
});