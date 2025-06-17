import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { Course } from "@/models/course.models";
import { Types } from "mongoose";

export const GET = routeHandlerWrapper(async (request: Request) => {
    const user = await checkAuthencticatedUserRequest()

    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const purchasedCourses = user.purchasedCourses || [];

    const objectIds = purchasedCourses.map((item: { _id: string, name: string }) => new Types.ObjectId(item._id));

    const courses = await Course.find({ _id: { $in: objectIds } }, {
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
    }).sort({ createdAt: -1 }).lean();

    return new Response(JSON.stringify({ courses: courses }), { status: 200 });
});
