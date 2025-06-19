import { checkAdminUserRequest, routeHandlerWrapper } from "@/action";
import { Course } from "@/models/course.models";
import { Stats } from "@/models/stats.models";

export const GET = routeHandlerWrapper(async (request: Request, params: { _id: string }) => {
    await checkAdminUserRequest()

    const { _id } = params;
    const course = await Course.findById(_id);
    return new Response(JSON.stringify(course), { status: 200 });
});

export const PATCH = routeHandlerWrapper(async (request: Request, params: { _id: string }) => {
    await checkAdminUserRequest()

    const { _id } = await params;

    if (!_id) {
        return new Response(JSON.stringify({ error: "Course ID is required" }), { status: 400 });
    }

    const courseData = await request.json();

    const previousCourse = await Course.findById(_id);

    if (!previousCourse) {
        return new Response(JSON.stringify({ error: "Course not found" }), { status: 404 });
    }

    const updatedCourse = await Course.findByIdAndUpdate(_id, { ...courseData, updatedAt: new Date() }, { new: true });

    const stats = await Stats.findOne().sort({ lastUpdated: -1 }).limit(1);

    let newTotalActiveCourses = stats.activeCourses;
    if (previousCourse.isPublished !== updatedCourse.isPublished) {
        if (updatedCourse.isPublished) {
            newTotalActiveCourses += 1;
        } else {
            newTotalActiveCourses -= 1;
        }
    }

    if (stats.month !== new Date().toLocaleString('default', { month: 'long' }) || stats.year !== new Date().getFullYear().toString()) {
        const newStats = new Stats({
            totalStudents: stats.totalStudents,
            activeCourses: newTotalActiveCourses,
            monthlyRevenue: 0,
            totalRevenue: stats.totalRevenue,
            month: new Date().toLocaleString('default', { month: 'long' }),
            year: new Date().getFullYear().toString(),
        });
        await newStats.save();
    } else {
        stats.activeCourses = newTotalActiveCourses;
        await stats.save();
    }

    return new Response(JSON.stringify(updatedCourse), { status: 200 });
});

export const DELETE = routeHandlerWrapper(async (request: Request, params: { _id: string }) => {
    await checkAdminUserRequest()

    const { _id } = await params;

    const course = await Course.findById(_id);

    if (!course) {
        return new Response(JSON.stringify({ error: "Course not found" }), { status: 404 });
    }

    await Course.findByIdAndDelete(_id);

    const stats = await Stats.findOne().sort({ lastUpdated: -1 }).limit(1);

    if (stats.month !== new Date().toLocaleString('default', { month: 'long' }) || stats.year !== new Date().getFullYear().toString()) {
        const newStats = new Stats({
            totalStudents: stats.totalStudents,
            activeCourses: stats.activeCourses - 1,
            monthlyRevenue: 0,
            totalRevenue: stats.totalRevenue,
            month: new Date().toLocaleString('default', { month: 'long' }),
            year: new Date().getFullYear().toString(),
        });
        await newStats.save();
    } else {
        stats.lastUpdated = new Date();
        stats.activeCourses -= 1;
        await stats.save();
    }

    return new Response(JSON.stringify({ message: "Course deleted successfully" }), { status: 200 });
});
