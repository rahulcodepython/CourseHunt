import { routeHandlerWrapper } from "@/action";
import { CourseCategory } from "@/models/course.category.models";

export const GET = routeHandlerWrapper(async (request: Request) => {
    const courseCategories = await CourseCategory.find();
    return new Response(JSON.stringify(courseCategories), { status: 200 });
});
