
import { routeHandlerWrapper } from "@/action";
import { Coupon } from "@/models/coupon.models";

export const PATCH = routeHandlerWrapper(async (req: Request, { params }: { params: Promise<{ _id: string }> }) => {
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
});

export const DELETE = routeHandlerWrapper(async (req: Request, { params }: { params: Promise<{ _id: string }> }) => {
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
});
