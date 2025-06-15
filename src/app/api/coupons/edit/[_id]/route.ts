import { connectDB } from "@/lib/db.connect";
import { Coupon } from "@/models/coupon.models";

export async function PATCH(req: Request, { params }: { params: Promise<{ _id: string }> }) {
    try {
        await connectDB();

        const { _id } = await params;

        const body = await req.json();

        const coupon = await Coupon.findByIdAndUpdate(_id, body, { new: true });

        if (!coupon) {
            return new Response(JSON.stringify({
                message: "Coupon not found"
            }), { status: 404 });
        }

        return new Response(JSON.stringify({
            message: "Coupon updated successfully",
            coupon: coupon
        }), { status: 200 });
    } catch {
        return new Response(JSON.stringify({
            message: "Error updating coupon"
        }), { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ _id: string }> }) {
    try {
        await connectDB();

        const { _id } = await params;

        const coupon = await Coupon.findByIdAndDelete(_id);

        if (!coupon) {
            return new Response(JSON.stringify({
                message: "Coupon not found"
            }), { status: 404 });
        }

        return new Response(JSON.stringify({
            message: "Coupon deleted successfully"
        }), { status: 200 });
    } catch {
        return new Response(JSON.stringify({
            message: "Error deleting coupon"
        }), { status: 500 });
    }
}
