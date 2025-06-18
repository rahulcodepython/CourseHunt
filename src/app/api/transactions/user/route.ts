import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { Transaction } from "@/models/transaction.models";
import { NextResponse } from "next/server";

export const GET = routeHandlerWrapper(async () => {
    const user = await checkAuthencticatedUserRequest()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactions = await Transaction.find({ userId: user._id })

    return NextResponse.json(transactions);
});
