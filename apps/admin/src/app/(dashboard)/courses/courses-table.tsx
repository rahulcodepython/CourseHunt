"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { Badge } from "@package/ui/badge";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import type { Course } from "@package/schema/courses.types";
import { formatINR } from "@package/lib/format";
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
					<div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
						{course.image_url && (
							<img src={course.image_url} alt={course.title} className="size-full object-cover" />
						)}
					</div>
					<div className="min-w-0">
						<p className="max-w-[280px] truncate font-medium">{course.title}</p>
						<p className="text-xs text-muted-foreground">{course.total_lectures} lectures</p>
					</div>
				</div>
			),
		},
		{
			header: "Status",
			render: (course) => (
				<Badge variant={course.status === "published" ? "default" : "secondary"} className="capitalize">
					{course.status}
				</Badge>
			),
		},
		{
			header: "Price",
			render: (course) => (
				<span className="font-medium tabular-nums">{formatINR(course.final_price)}</span>
			),
		},
		{
			header: "Rating",
			render: (course) => (
				<div className="flex items-center gap-1">
					<Icon name="IconStar" className="size-4 fill-yellow-500 text-yellow-500" />
					<span className="tabular-nums">{course.rating_avg.toFixed(1)}</span>
				</div>
			),
		},
		{
			header: "Students",
			render: (course) => (
				<div className="flex items-center gap-1.5 text-muted-foreground">
					<Icon name="IconUsers" className="size-4" />
					<span className="tabular-nums">{course.student_count.toLocaleString()}</span>
				</div>
			),
		},
		{
			header: "",
			render: (course) => (
				<div className="flex items-center justify-end gap-1">
					<Link href={`/courses/${course.id}/chapters`} title="View chapters & lessons">
						<Button variant="ghost" size="icon" className="size-8">
							<Icon name="IconHierarchy" className="size-4" />
						</Button>
					</Link>
					<Link href={`/courses/overview/${course.id}`} title="View analytics">
						<Button variant="ghost" size="icon" className="size-8">
							<Icon name="IconChartBar" className="size-4" />
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
			emptyState={
				<div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
					<Icon name="IconCategory" className="size-8 opacity-40" />
					<p className="text-sm">No courses match your filters</p>
				</div>
			}
		/>
	);
}
