export default async function getUserDetails() {
    const response = await fetch(`/api/users/edit`)

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user details');
    }

    return response.json()
}