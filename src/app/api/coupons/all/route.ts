import { connectDB } from "@/lib/db.connect";
import { Coupon } from "@/models/coupon.models";

export async function GET() {
    try {
        await connectDB();

        const coupons = await Coupon.find();

        return new Response(JSON.stringify(coupons), { status: 200 });
    } catch (error) {
        console.error("Error fetching coupons:", error);
        return new Response(JSON.stringify({
            message: "Error fetching coupons"
        }), { status: 500 });
    }
}