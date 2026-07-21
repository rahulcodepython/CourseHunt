"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { Badge } from "@package/ui/badge";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import type { Course } from "@package/schema/courses.types";
import Link from "next/link";

interface CoursesTableProps {
	courses: Course[];
	isLoading: boolean;
	page: number;
	totalPages: number;
	total: number;
	limit: number;
	onPageChange: (page: number) => void;
}

export function CoursesTable({
	courses,
	isLoading,
	page,
	totalPages,
	total,
	limit,
	onPageChange,
}: CoursesTableProps) {
	const columns: DataTableColumn<Course>[] = [
		{
			header: "Course",
			render: (course) => (
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted">
						{course.image_url && (
							<img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
						)}
					</div>
					<div>
						<div className="font-medium text-sm">{course.title}</div>
						<div className="text-xs text-muted-foreground">{course.total_lectures} lectures</div>
					</div>
				</div>
			),
		},
		{
			header: "Status",
			render: (course) => (
				<Badge variant={course.status === "published" ? "default" : "secondary"}>
					{course.status}
				</Badge>
			),
		},
		{
			header: "Price",
			render: (course) => (
				<div className="font-medium">₹{course.final_price}</div>
			),
		},
		{
			header: "Rating",
			render: (course) => (
				<div className="flex items-center gap-1">
					<Icon name="IconStar" className="w-4 h-4 text-amber-400 fill-amber-400" />
					<span>{course.rating_avg.toFixed(1)}</span>
				</div>
			),
		},
		{
			header: "Students",
			render: (course) => (
				<div className="flex items-center gap-1 text-muted-foreground">
					<Icon name="IconUsersGroup" className="w-4 h-4" />
					<span>{course.student_count}</span>
				</div>
			),
		},
		{
			header: "",
			render: (course) => (
				<div className="flex items-center gap-2 justify-end">
					<Link href={`/courses/${course.id}/chapters`} title="View chapters & lessons">
						<Button variant="outline" size="sm">
							<Icon name="IconHierarchy" className="w-4 h-4" />
						</Button>
					</Link>
					<Link href={`/courses/overview/${course.id}`} title="View analytics">
						<Button variant="outline" size="sm">
							<Icon name="IconChartBar" className="w-4 h-4" />
						</Button>
					</Link>
				</div>
			),
			className: "text-right",
		},
	];

	return (
		<DataTable
			columns={columns}
			data={courses}
			keyExtractor={(c) => c.id}
			isLoading={isLoading}
			page={page}
			totalPages={totalPages}
			total={total}
			pageSize={limit}
			onPageChange={onPageChange}
			label="courses"
		/>
	);
}
