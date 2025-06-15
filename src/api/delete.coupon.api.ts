export async function deleteCoupon(_id: string) {
    const response = await fetch(`/api/coupons/edit/${_id}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete coupon");
    }

    return await response.json();
}
