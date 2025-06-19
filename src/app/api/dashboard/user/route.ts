import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { Course } from "@/models/course.models";
import { CourseRecord } from "@/models/course.record.models";
import { NextResponse } from "next/server";

interface EnrolledCourse {
    imageUrl: { url: string, fileType: string },
    title: string,
    completedLessons: number,
    totalLessons: number,
    _id: string
}

export const GET = routeHandlerWrapper(async () => {
    const user = await checkAuthencticatedUserRequest();

    if (user instanceof NextResponse) {
        return user;
    }

    const courseRecord = await CourseRecord.find({ userId: user._id }).lean();

    let enrolledCourses: EnrolledCourse[] = [];

    if (!courseRecord) {
        enrolledCourses = [];
    } else {
        enrolledCourses = await Promise.all(courseRecord.map(async (record) => {
            return Promise.all(record.courses.map(async (recordCourse: { courseId: string, completedLessons: number, totalLessons: number }) => {
                const course = await Course.findById(recordCourse.courseId).lean();

                return {
                    _id: recordCourse.courseId,
                    completedLessons: recordCourse.completedLessons,
                    totalLessons: recordCourse.totalLessons,
                    title: (course as any)?.title,
                    imageUrl: (course as any)?.imageUrl
                };
            }));
        })).then(results => results.flat());
    }

    const responseData = {
        user: {
            name: user.name,
        },
        courses: enrolledCourses,
        enrolledCourses: user.purchasedCourses,
        completedLessons: (courseRecord as any)?.completedLessons || 0,
    };

    return NextResponse.json(responseData, { status: 200 });
});