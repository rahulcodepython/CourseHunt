"use client"
import deleteCourse from '@/api/delete.course.api'
import CourseCard from '@/components/course-card'
import LoadingButton from '@/components/loading-button'
import { Button } from '@/components/ui/button'
import { useApiHandler } from '@/hooks/useApiHandler'
import { CourseCardType } from '@/types/course.type'
import Link from 'next/link'
import React from 'react'
import CreateCourse from './create-course'

const CoursesGrid = ({
    initialData,
}: {
    initialData: CourseCardType[]
}) => {
    const [courseData, setCourseData] = React.useState<CourseCardType[]>(initialData);

    const addCourse = (newCourse: CourseCardType) => {
        setCourseData((prev) => [...prev, newCourse]);
    }

    return (
        <div className='flex flex-col'>
            <h1 className='text-3xl font-bold text-center my-6'>Manage Courses</h1>
            <div className='flex justify-end mb-4'>
                <CreateCourse onCreate={addCourse} />
            </div>
            {
                courseData.length === 0 && (
                    <div className='text-center text-gray-500'>
                        No courses available. Please create a new course.
                    </div>
                )
            }
            {
                courseData.length > 0 && <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4'>
                    {courseData.map((course, index) => (
                        <CourseCard key={index} courseData={course} edit={
                            <div className="flex items-center gap-2">
                                <Link href={`/admin/courses/edit/${course._id}/`}>
                                    <Button className="bg-green-600 hover:bg-green-700 text-white cursor-pointer">
                                        Edit
                                    </Button>
                                </Link>
                                <DeleteButton courseId={course._id} setCourseData={setCourseData} />
                            </div>
                        } />
                    ))}
                </div>
            }
        </div>
    )
}

const DeleteButton = ({ courseId, setCourseData }: { courseId: string, setCourseData: React.Dispatch<React.SetStateAction<CourseCardType[]>> }) => {
    const { isLoading, callApi } = useApiHandler()

    const handleDelete = async () => {
        const deleted = await callApi(() => deleteCourse(courseId))
        if (deleted) {
            setCourseData((prev) => prev.filter(course => course._id !== courseId));
        }
    }

    return (
        <LoadingButton isLoading={isLoading} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
            <Button className="bg-red-600 hover:bg-red-700 text-white cursor-pointer" onClick={handleDelete}>
                Delete
            </Button>
        </LoadingButton>
    )
}

export default CoursesGrid