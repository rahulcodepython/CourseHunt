export default async function getCourseStudyData(courseId: string) {
    const response = await fetch(`/api/study/${courseId}`);

    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(`Error fetching course study data: ${errorResponse.message || 'Unknown error'}`);
    }

    return response.json();
}