export async function chackCoupon(code: string) {
    const response = await fetch('/api/coupons/check', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error checking coupon');
    }

    return await response.json();
}