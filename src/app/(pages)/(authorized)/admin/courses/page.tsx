import { getBaseUrl } from '@/action';
import { CourseCardType } from '@/types/course.type';
import { cookies } from 'next/headers';
import CoursesGrid from './courses-grid';

const Courses = async () => {
    const baseurl = await getBaseUrl();

    const cookieStore = await cookies();

    const response = await fetch(`${baseurl}/api/courses/admin/all`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieStore.getAll().map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
        },
    });

    const courseData: CourseCardType[] = await response.json();

    return (
        <CoursesGrid initialData={courseData} />
    )
}

export default Courses