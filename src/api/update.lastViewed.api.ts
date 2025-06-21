export default async function updateLastViewed(lessonId: string, courseId: string) {
    const response = await fetch("/api/study/set-last-viewed", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            lessonId,
            courseId,
        }),
    });

    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(`Error updating last viewed lesson: ${errorResponse.message || "Unknown error"}`);
    }

    return await response.json();
}