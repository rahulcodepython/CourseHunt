import { CourseType } from "@/types/course.type";

const updateCourse = async <T>(data: T, _id: string): Promise<CourseType> => {
    const response = await fetch(`/api/courses/admin/edit/${_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        return response.json();
    }

    const errorData = await response.json();
    throw new Error(errorData.error || "Server error occurred while updating the course");
};


export default updateCourse