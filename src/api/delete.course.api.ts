import { toast } from "sonner";

const deleteCourse = async (_id: string): Promise<boolean> => {
    const response = await fetch(`/api/courses/admin/edit/${_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
        const responseData = await response.json();
        toast.success(responseData.message || "Course deleted successfully");
        return true;
    }

    const errorData = await response.json();
    toast.error(errorData.error || "Server error occurred while updating the course");
    return false;
};


export default deleteCourse;