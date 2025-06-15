export default async function toggleCoupon(_id: string, isActive: boolean) {
    const response = await fetch(`/api/coupons/edit/${_id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ isActive })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to toggle coupon status");
    }

    return await response.json();
}