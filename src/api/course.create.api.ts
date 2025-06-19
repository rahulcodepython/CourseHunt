const createCourse = async (title: string) => {
    const response = await fetch('/api/courses/admin/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create course");
    }

    return await response.json();
}

export default createCourse;