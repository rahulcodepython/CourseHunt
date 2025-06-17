import { getBaseUrl } from "@/action"

const MyCourses = async () => {
    const baseurl = await getBaseUrl()

    const response = await fetch(`${baseurl}/api/courses/my-course`, {
        cache: 'no-store',
    })

    const courseData = await response.json()

    return (
        <div className='flex flex-col'>
            <div>
                <h1 className="text-3xl font-bold">My Courses</h1>
                <p className="mt-2">Manage your courses and their details</p>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4'>
                {
                    // courseData.map((course, index) => (
                    // <CourseCard key={index} courseData={course} study={
                    //     <Link href={`/user/study/${course._id}`}>
                    //         <Button className="bg-green-600 hover:bg-green-700 text-white cursor-pointer">
                    //             Study
                    //         </Button>
                    //     </Link>
                    // } />
                    // ))
                }
            </div>
        </div>
    )
}

export default MyCourses