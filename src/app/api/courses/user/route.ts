import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { Course } from "@/models/course.models";
import { CourseRecord } from "@/models/course.record.models";
import { Types } from "mongoose";

export const GET = routeHandlerWrapper(async (request: Request) => {
    const user = await checkAuthencticatedUserRequest()

    if (user instanceof Response) {
        return user;
    }

    const courseRecord = await CourseRecord.findOne({ userId: user._id });

    const purchasedCourses = courseRecord ? courseRecord.courses : [];

    if (purchasedCourses.length === 0) {
        return new Response(JSON.stringify({ courses: [] }), { status: 200 });
    }

    const objectIds = purchasedCourses.map((item: { courseId: string }) => new Types.ObjectId(item.courseId));

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
