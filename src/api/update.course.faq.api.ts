import { CourseType, FAQType } from "@/types/course.type"

const updateCourseFAQ = async (formData: { faq: FAQType[] }, _id: string): Promise<CourseType> => {
    const response = await fetch(`/api/courses/${_id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    })

    if (response.ok) {
        return await response.json()
    } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update course")
    }
}

export default updateCourseFAQ;