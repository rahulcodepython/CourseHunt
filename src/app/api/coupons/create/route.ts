import { connectDB } from "@/lib/db.connect";
import { Coupon } from "@/models/coupon.models";

export async function POST(req: Request) {
    try {
        await connectDB();

        const body = await req.json()

        const coupon = new Coupon(body)
        await coupon.save()

        return new Response(JSON.stringify({
            message: "Coupon created successfully",
            coupon: coupon
        }), { status: 201 })
    } catch {
        return new Response(JSON.stringify({
            message: "Error creating coupon"
        }), { status: 500 })
    }
}
