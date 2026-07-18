"use client";

import CourseCard from '@/components/course-card'
import LoadingButton from '@/components/loading-button'
import { Button } from '@/components/ui/button'
import { useAdminCoursesQuery, useDeleteCourseMutation } from '@/hooks/api'
import Link from 'next/link'
import CreateCourse from './create-course'

const CoursesGrid = () => {
    const coursesQuery = useAdminCoursesQuery();
    const courseData = coursesQuery.data ?? [];

    return (
        <div className='container mx-auto p-6'>
            <div className="flex justify-between items-center mb-8 w-full px-4">
                <div>
                    <h1 className="text-3xl font-bold">Course Management</h1>
                    <p className="mt-2 text-muted-foreground">Manage your courses and their details</p>
                </div>
                <CreateCourse />
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
                                <Link href={`/adminpanel/courses/edit/${course._id}/`}>
                                    <Button className="bg-green-600 hover:bg-green-700 text-white cursor-pointer">
                                        Edit
                                    </Button>
                                </Link>
                                <DeleteButton courseId={course._id} />
                            </div>
                        } />
                    ))}
                </div>
            }
        </div>
    )
}

const DeleteButton = ({ courseId }: { courseId: number }) => {
    const { isPending, deleteCourse } = useDeleteCourseMutation()

    const handleDelete = async () => {
        const deleted = await deleteCourse(courseId.toString())
        if (deleted) {
            return;
        }
    }

    return (
        <LoadingButton isLoading={isPending} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
            <Button className="bg-red-600 hover:bg-red-700 text-white cursor-pointer" onClick={handleDelete}>
                Delete
            </Button>
        </LoadingButton>
    )
}

export default CoursesGrid
