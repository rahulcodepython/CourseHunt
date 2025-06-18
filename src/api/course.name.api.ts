export default async function getCourseName() {
    const response = await fetch(`/api/courses/name`);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch course name");
    }

    return await response.json();
}