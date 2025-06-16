import { connectDB } from "@/lib/db.connect";
import { Coupon } from "@/models/coupon.models";
import { Course } from "@/models/course.models";
import { Transaction } from "@/models/transaction.models";
import { User } from "@/models/user.models";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
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

        await connectDB()

        const cookieStore = await cookies();

        const userId = cookieStore.get('session_id')?.value;

        if (!userId) {
            return new Response(JSON.stringify({ error: 'User not authenticated' }), { status: 401 });
        }

        const user = await User.findById(userId);

        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }

        const course = await Course.findById(courseId);

        if (!course) {
            return new Response(JSON.stringify({ error: 'Course not found' }), { status: 404 });
        }


        if (user.purchasedCourses.some((course: any) =>
            course._id === course._id
        )) {
            return new Response(JSON.stringify({ error: 'You have already purchased this course' }), { status: 400 });
        }

        const coupon = await Coupon.findById(couponId);

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
            transactionId: 'txn_' + courseId + userId + Date.now(), // Example transaction ID, you might want to use a more robust method
            createdAt: new Date(),
            courseId: courseId,
            courseName: course.title,
            userId: userId,
            userEmail: user.email,
            couponId: couponId,
            couponCode: (!coupon) ? "" : coupon.code,
            amount: price
        })

        const transactionSaved = await transaction.save();

        if (!transactionSaved) {
            return new Response(JSON.stringify({ error: 'Error saving transaction' }), { status: 500 });
        }

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.phone = phone || user.phone;
        user.address = address || user.address;
        user.city = city || user.city;
        user.zip = zip || user.zip;
        user.country = country || user.country;
        user.purchasedCourses.push({
            _id: courseId,
            name: course.title
        });
        await user.save();

        course.students = course.students + 1
        course.enrolledStudents.push({
            _id: userId,
            email: user.email
        })
        await course.save();

        if (couponId) {
            coupon.usage += 1;
            await coupon.save();
        }


        return new Response(JSON.stringify({ message: "Course purchased successfully", transaction: "transactionSaved" }), { status: 201 });
    } catch (error) {
        console.error('Error processing purchase:', error);
        return new Response(JSON.stringify({ error: 'Error processing purchase' }), { status: 500 });
    }
}