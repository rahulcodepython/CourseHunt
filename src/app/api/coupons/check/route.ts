import { connectDB } from "@/lib/db.connect";
import { Coupon } from "@/models/coupon.models";

export async function POST(request: Request) {
    try {
        const { code } = await request.json();

        if (!code) {
            return new Response(JSON.stringify({
                error: "Coupon code is required"
            }), { status: 400 });
        }

        await connectDB();

        const coupon = await Coupon.findOne({ code })

        if (!coupon) {
            return new Response(JSON.stringify({
                error: "Coupon not found"
            }), { status: 404 });
        }

        if (!coupon.isActive) {
            return new Response(JSON.stringify({
                error: "Coupon is not active"
            }), { status: 400 });
        }

        if (coupon.usage >= coupon.maxUsage) {
            return new Response(JSON.stringify({
                error: "Coupon usage limit reached"
            }), { status: 400 });
        }

        const today = new Date();
        const expiryDate = new Date(coupon?.expiryDate);

        if (today > expiryDate) {
            return new Response(JSON.stringify({
                error: "Coupon has expired"
            }), { status: 400 });
        }

        return new Response(JSON.stringify({
            _id: coupon._id,
            code: coupon.code,
            offerValue: coupon.offerValue,
            description: coupon.description
        }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({
            error: "Error checking coupon"
        }), { status: 500 });
    }
}