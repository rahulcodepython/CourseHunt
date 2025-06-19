import { checkAuthencticatedUserRequest, routeHandlerWrapper } from "@/action";
import { User } from "@/models/user.models";
import { NextResponse } from "next/server";

export const GET = routeHandlerWrapper(async () => {
    const user = await checkAuthencticatedUserRequest()

    if (user instanceof NextResponse) {
        return user;
    }

    return NextResponse.json(user);
});

export const PATCH = routeHandlerWrapper(async (request: Request) => {
    const user = await checkAuthencticatedUserRequest()

    if (user instanceof NextResponse) {
        return user;
    }

    const body = await request.json();

    const { _id, name, firstName, lastName, phone, address, city, country, zip, email, avatar } = body;

    const exsistingUserWithSameEmail = await User.findOne({ email });

    if (exsistingUserWithSameEmail && exsistingUserWithSameEmail._id.toString() !== _id) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const newName = `${firstName} ${lastName}`.trim();

    const updatedUser = await User.findByIdAndUpdate(user._id, {
        name: newName,
        firstName,
        lastName,
        phone,
        address,
        city,
        country,
        zip,
        email,
        avatar
    }, { new: true });
    await updatedUser.save();

    return NextResponse.json({ message: "User updated successfully", user: updatedUser }, { status: 200 });
})