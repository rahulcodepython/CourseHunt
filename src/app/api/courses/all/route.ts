import { routeHandlerWrapper } from "@/action";
import { Course } from "@/models/course.models";

export const GET = routeHandlerWrapper(async (request: Request) => {
    const courses = await Course.find({ isPublished: true }, {
        title: 1,
        description: 1,
        duration: 1,
        students: 1,
        rating: 1,
        reviews: 1,
        price: 1,
        originalPrice: 1,
        category: 1,
        discount: 1,
        imageUrl: 1,
    }).sort({ createdAt: -1 }).limit(4).lean();

    return new Response(JSON.stringify(courses), { status: 200 });
});
