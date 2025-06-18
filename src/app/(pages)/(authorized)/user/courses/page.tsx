import { getBaseUrl } from "@/action";
import CourseCard from "@/components/course-card";
import { Button } from "@/components/ui/button";
import { CourseCardType } from "@/types/course.type";
import { cookies } from "next/headers";
import Link from "next/link";

const MyCourses = async () => {
    const baseurl = await getBaseUrl()

    const cookieStore = await cookies();

    const response = await fetch(`${baseurl}/api/courses/user`, {
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieStore.getAll().map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
        },
    })

    const courseData: { courses: CourseCardType[] } = await response.json()

    return (
        <div className='flex flex-col w-full gap-4'>
            <div>
                <h1 className="text-3xl font-bold">My Courses</h1>
                <p className="mt-2">Manage your courses and their details</p>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4'>
                {
                    courseData.courses.map((course, index) => (
                        <CourseCard key={index} courseData={course} study={
                            <Link href={`/user/study/${course._id}`}>
                                <Button className="bg-green-600 hover:bg-green-700 text-white cursor-pointer">
                                    Study
                                </Button>
                            </Link>
                        } />
                    ))
                }
            </div>
        </div>
    )
}

export default MyCourses