import { checkAdminUserRequest, routeHandlerWrapper } from "@/action";
import { Coupon } from "@/models/coupon.models";
import { NextResponse } from "next/server";

export const POST = routeHandlerWrapper(async (req: Request) => {
    const user = await checkAdminUserRequest()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
