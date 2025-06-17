export async function logout() {
    const response = await fetch('/api/auth/logout', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${errorData.message || 'Unknown error'}`);
    }

    return response.json();
}