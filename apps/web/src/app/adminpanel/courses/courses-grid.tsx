"use client";

import CourseCard from "@package/components/course-card";
import LoadingButton from "@package/components/loading-button";
import { Button } from "@package/ui/button";
import { useManageCoursesQuery, useDeleteCourseMutation } from "@package/query-hooks/courses.api";
import type { Course } from "@package/schema/courses.types";
import Link from "next/link";
import CreateCourse from "./create-course";

const CoursesGrid = () => {
	const coursesQuery = useManageCoursesQuery();
	const paginatedData = coursesQuery.data?.data;
	const courseData: Course[] = paginatedData ? (paginatedData.data as unknown as Course[]) : [];

	return (
		<div className="container mx-auto p-6">
			<div className="flex justify-between items-center mb-8 w-full px-4">
				<div>
					<h1 className="text-3xl font-bold">Course Management</h1>
					<p className="mt-2 text-muted-foreground">Manage your courses and their details</p>
				</div>
				<CreateCourse />
			</div>
			{courseData.length === 0 && (
				<div className="text-center text-gray-500 py-12">No courses available. Please create a new course.</div>
			)}
			{courseData.length > 0 && (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
					{courseData.map((course: Course, index: number) => (
						<CourseCard
							key={index}
							courseData={course as any}
							edit={
								<div className="flex items-center gap-2">
									<Link href={`/adminpanel/courses/edit/${course.id}/`}>
										<Button className="bg-green-600 hover:bg-green-700 text-white cursor-pointer">Edit</Button>
									</Link>
									<DeleteButton courseId={course.id} />
								</div>
							}
						/>
					))}
				</div>
			)}
		</div>
	);
};

const DeleteButton = ({ courseId }: { courseId: string }) => {
	const { isPending, execute } = useDeleteCourseMutation();

	const handleDelete = async () => {
		await execute(courseId);
	};

	return (
		<LoadingButton isLoading={isPending} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
			<Button className="bg-red-600 hover:bg-red-700 text-white cursor-pointer" onClick={handleDelete}>
				Delete
			</Button>
		</LoadingButton>
	);
};

export default CoursesGrid;
