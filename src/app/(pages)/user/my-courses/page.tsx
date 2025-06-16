
const Courses = () => {
    return (
        <div className='flex flex-col'>
            <h1 className='text-3xl font-bold text-center my-6'>My Courses</h1>
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

export default Courses