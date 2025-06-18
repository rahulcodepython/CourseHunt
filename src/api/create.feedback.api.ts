export default async function createFeedback(courseId: string, message: string, rating: number) {
    const response = await fetch("/api/feedback/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId, message, rating }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create feedback");
    }

    return await response.json();
}