import { Coupon } from "@/types/coupon.type";

export default async function updateCoupon(formData: Coupon, couponId: string | null) {
    if (!couponId) {
        throw new Error("Invalid coupon ID");
    }

    const response = await fetch(`/api/coupons/edit/${couponId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update coupon");
    }

    return await response.json();
}