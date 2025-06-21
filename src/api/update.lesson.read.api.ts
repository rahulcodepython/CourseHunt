export default async function updateLessonRead(courseId: string, chapterId: string, lessonId: string) {
    const response = await fetch("/api/study/mark-read", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            courseId,
            chapterId,
            lessonId,
        }),
    });

    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(`Error marking lesson as read: ${errorResponse.message || "Unknown error"}`);
    }

    return await response.json();
}