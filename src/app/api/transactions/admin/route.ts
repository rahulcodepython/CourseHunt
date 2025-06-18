import { checkAdminUserRequest, routeHandlerWrapper } from "@/action";
import { Transaction } from "@/models/transaction.models";
import { NextResponse } from "next/server";

export const GET = routeHandlerWrapper(async () => {
    const user = await checkAdminUserRequest()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactions = await Transaction.find({ userId: user._id }, {
        _id: 1,
        transactionId: 1,
        createdAt: 1,
        courseName: 1,
        userId: 1,
        userEmail: 1,
        couponCode: 1,
        amount: 1,
    })

    return NextResponse.json(transactions);
});
