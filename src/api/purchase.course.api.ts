import { PurchaseCourseDataType } from "@/types/purchase.type";

export async function purchaseCourse(formData: PurchaseCourseDataType) {
    const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error purchasing course');
    }

    return await response.json();
}