import { checkAdminUserRequest, routeHandlerWrapper } from "@/action";
import { Coupon } from "@/models/coupon.models";
import { NextResponse } from "next/server";

export const GET = routeHandlerWrapper(async (request: Request) => {
    const user = await checkAdminUserRequest()

    const coupons = await Coupon.find();

    return NextResponse.json(coupons, { status: 200 });
});
