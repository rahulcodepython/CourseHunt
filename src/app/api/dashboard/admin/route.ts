import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { Course } from "@/models/course.models";
import { Stats } from "@/models/stats.models";
import { User } from "@/models/user.models";
import { NextResponse } from "next/server";

export const GET = routeHandlerWrapper(async () => {
    await checkAuthencticatedUserRequest();

    const students = await User.find({ role: 'user' }, {
        _id: 1,
        name: 1,
        email: 1,
        createdAt: 1,
        purchasedCourses: 1,
    }).lean();

    const courses = await Course.find({ isPublished: true }, {
        _id: 1,
        title: 1,
        students: 1,
        totalRevenue: 1,
    }).lean();

    const stats = await Stats.find().sort({ createdAt: -1 }).limit(1).lean();

    const responseData = {
        students: students,
        activeCourses: courses,
        monthlyRevenue: stats[0].monthlyRevenue,
        totalRevenue: stats[0].totalRevenue,
    }

    return NextResponse.json(responseData, { status: 200 });
});