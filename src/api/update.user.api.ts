import { UserProfileType } from "@/types/user.type";

export default async function updateUser(formData: UserProfileType) {
    const response = await fetch('/api/users/edit', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
    }

    return await response.json();

}