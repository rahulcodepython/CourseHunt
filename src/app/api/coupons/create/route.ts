import { routeHandlerWrapper } from "@/action";
import { Coupon } from "@/models/coupon.models";

export const POST = routeHandlerWrapper(async (req: Request) => {
    const body = await req.json();

    const coupon = new Coupon(body);
    await coupon.save();

    return new Response(
        JSON.stringify({
            message: "Coupon created successfully",
            coupon: coupon,
        }),
        { status: 201 }
    );
});
