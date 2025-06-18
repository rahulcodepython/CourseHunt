import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { Transaction } from "@/models/transaction.models";
import { NextResponse } from "next/server";

export const GET = routeHandlerWrapper(async () => {
    const user = await checkAuthencticatedUserRequest()

    if (user instanceof NextResponse) {
        return user;
    }

    const transactions = await Transaction.find({ userId: user._id }, {
        _id: 1,
        transactionId: 1,
        createdAt: 1,
        courseName: 1,
        couponCode: 1,
        amount: 1,
    })

    return NextResponse.json(transactions);
});
