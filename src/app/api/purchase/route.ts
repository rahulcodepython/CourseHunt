import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { Coupon } from "@/models/coupon.models";
import { Course } from "@/models/course.models";
import { CourseRecord } from "@/models/course.record.models";
import { Stats } from "@/models/stats.models";
import { Transaction } from "@/models/transaction.models";
import { User } from "@/models/user.models";

export const POST = routeHandlerWrapper(async (request: Request) => {
    const user = await checkAuthencticatedUserRequest()

    if (user instanceof Response) {
        return user;
    }

    const {
        courseId,
        couponId,
        firstName,
        lastName,
        phone,
        address,
        city,
        zip,
        country,
        price
    } = await request.json();

    if (!courseId) {
        return new Response(JSON.stringify({ error: 'Course ID is required' }), { status: 400 });
    }

    const course = await Course.findById(courseId);

    if (!course) {
        return new Response(JSON.stringify({ error: 'Course not found' }), { status: 404 });
    }

    const previousPurchasedCourses = await CourseRecord.findOne({ userId: user._id });

    if (previousPurchasedCourses) {
        if (previousPurchasedCourses.courses.some((c: { courseId: string }) => c.courseId.toString() === course._id.toString())) {
            return new Response(JSON.stringify({ error: 'You have already purchased this course' }), { status: 400 });
        }
    }

    const coupon = couponId ? await Coupon.findById(couponId) : null;

    if (couponId) {
        if (!coupon) {
            return new Response(JSON.stringify({ error: 'Invalid coupon ID' }), { status: 400 });
        }

        if (!coupon.isActive) {
            return new Response(JSON.stringify({ error: 'Coupon is not active' }), { status: 400 });
        }

        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
            return new Response(JSON.stringify({ error: 'Coupon has expired' }), { status: 400 });
        }

        if (coupon.usage >= coupon.maxUsage) {
            return new Response(JSON.stringify({ error: 'Coupon usage limit reached' }), { status: 400 });
        }
    }

    const transaction = await new Transaction({
        transactionId: 'txn_' + courseId + user._id + Date.now(),
        createdAt: new Date(),
        courseId: courseId,
        courseName: course.title,
        userId: user._id,
        userEmail: user.email,
        couponId: couponId,
        couponCode: coupon ? coupon.code : "",
        amount: price
    });

    const transactionSaved = await transaction.save();

    if (!transactionSaved) {
        return new Response(JSON.stringify({ error: 'Error saving transaction' }), { status: 500 });
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, {
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        phone: phone || user.phone,
        address: address || user.address,
        city: city || user.city,
        zip: zip || user.zip,
        country: country || user.country,
    }, { new: true });

    updatedUser.purchasedCourses += 1;
    await updatedUser.save();

    course.students += 1;
    course.totalRevenue += price;
    course.enrolledStudents.push({
        _id: user._id,
        email: user.email
    });
    await course.save();

    if (couponId) {
        coupon.usage += 1;
        await coupon.save();
    }

    if (previousPurchasedCourses) {
        previousPurchasedCourses.courses.push({
            courseId: course._id,
            totalLessons: course.lessonsCount,
            completedLessons: 0,
            lastViewedLessonId: '',
            viewed: []
        });
        await previousPurchasedCourses.save();
    } else {
        const courseRecord = new CourseRecord({
            userId: user._id,
            courses: [
                {
                    courseId: course._id,
                    totalLessons: course.lessonsCount,
                    completedLessons: 0,
                    lastViewedLessonId: '',
                    viewed: []
                }
            ]
        });
        await courseRecord.save();
    }

    const stats = await Stats.findOne().sort({ lastUpdated: -1 }).limit(1);

    if (stats.month !== new Date().toLocaleString('default', { month: 'long' }) || stats.year !== new Date().getFullYear().toString()) {
        const newStats = new Stats({
            totalStudents: stats.totalStudents,
            activeCourses: stats.activeCourses,
            monthlyRevenue: price,
            totalRevenue: stats.totalRevenue + price,
            month: new Date().toLocaleString('default', { month: 'long' }),
            year: new Date().getFullYear().toString(),
        });
        await newStats.save();
    } else {
        stats.lastUpdated = new Date();
        stats.totalRevenue += price;
        stats.monthlyRevenue += price;
        await stats.save();
    }


    return new Response(JSON.stringify({ message: "Course purchased successfully", transaction: transactionSaved }), { status: 201 });
});
