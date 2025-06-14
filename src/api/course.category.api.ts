import { CourseCategoryType } from "@/types/course.category.type";

const getCourseCategory = async (): Promise<CourseCategoryType[]> => {
    try {
        const response = await fetch("/api/course-category");

        if (!response.ok) {
            return [];
        }

        return await response.json();
    } catch (error) {
        return [];
    }
}

export default getCourseCategory;