import { Coupon } from "@/types/coupon.type";

export default async function createCoupon(formData: Omit<Coupon, "_id">) {
    const response = await fetch("/api/coupons/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create coupon");
    }

    return await response.json();
}