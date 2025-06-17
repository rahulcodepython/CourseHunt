import { getBaseUrl } from '@/action';
import { CourseCardType } from '@/types/course.type';
import CoursesGrid from './courses-grid';

const Courses = async () => {
    const baseurl = await getBaseUrl();

    const response = await fetch(`${baseurl}/api/courses/admin/all`, {
        method: 'GET',
        credentials: 'include',
    });

    const courseData: CourseCardType[] = await response.json();

    return (
        <CoursesGrid initialData={courseData} />
    )
}

export default Courses