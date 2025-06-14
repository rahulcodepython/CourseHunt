const getAdminCourseSingle = async (_id: string) => {
    const response = await fetch(`/api/courses/${_id}`)

    if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to fetch course data")
    }

    return await response.json()
}

export default getAdminCourseSingle