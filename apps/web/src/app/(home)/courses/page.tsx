"use client";

import CourseCard from '@/components/course-card';
import { Input } from '@package/ui/input';
import { usePublicCoursesQuery } from '@/hooks/api';
import { Skeleton } from '@package/ui/skeleton';
import Loading from '@/components/loading';

const Courses = () => {
    const { data: courses, isLoading } = usePublicCoursesQuery()

    if (isLoading) return <Loading />

    const courseList = courses ?? [];

    return (
        <div className='flex flex-col gap-8'>
            <div className='max-w-4xl mx-auto p-4'>
                <h1 className='text-3xl font-bold text-center my-6'>Available Courses</h1>
                <p className='text-center text-gray-600 mb-4'>Explore our wide range of courses to enhance your skills and knowledge.</p>
                <Input placeholder="Search courses..." />
            </div>
            {
                courseList.length === 0 ? (
                    <div className='text-center text-gray-500 p-4'>
                        No courses available at the moment. Please check back later.
                    </div>
                ) : <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4 container mx-auto'>
                    {
                        courseList.map((course, index) => (
                            <CourseCard key={index} courseData={course} />
                        ))
                    }
                </div>
            }
        </div>
    )
}

export default Courses
