import { checkAdminUserRequest, routeHandlerWrapper } from "@/action";
import { Coupon } from "@/models/coupon.models";
import { NextResponse } from "next/server";

export const GET = routeHandlerWrapper(async (request: Request) => {
    const user = await checkAdminUserRequest()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coupons = await Coupon.find();

    return NextResponse.json(coupons, { status: 200 });
});
