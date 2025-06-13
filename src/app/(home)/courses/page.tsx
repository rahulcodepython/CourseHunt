import CourseCard from '@/components/course-card';
import { Input } from '@/components/ui/input';
import { courseData } from '@/const/course.const';

const Courses = () => {

    return (
        <div className='flex flex-col gap-8'>
            <div className='max-w-4xl mx-auto p-4'>
                <h1 className='text-3xl font-bold text-center my-6'>Available Courses</h1>
                <p className='text-center text-gray-600 mb-4'>Explore our wide range of courses to enhance your skills and knowledge.</p>
                <Input placeholder="Search courses..." />
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4 container mx-auto'>
                {courseData.map((course, index) => (
                    <CourseCard key={index} courseData={course} />
                ))}
            </div>
        </div>
    )
}

export default Courses