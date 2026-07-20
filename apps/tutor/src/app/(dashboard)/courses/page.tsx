"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { useTutorCoursesQuery } from "@package/query-hooks/courses.api";
import { useState } from "react";
import { CoursesToolbar } from "./components/CoursesToolbar";
import { CoursesTable } from "./components/CoursesTable";
import { CourseCreateDialog } from "./components/CourseCreateDialog";
import { CourseUpdateDialog } from "./components/CourseUpdateDialog";
import type { CourseInspectResponse } from "@package/schema/courses.types";

export default function TutorCoursesPage() {
	const [page, setPage] = useState(1);
	const limit = 10;
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("all");
	const [level, setLevel] = useState("all");

	const { data: raw, isLoading } = useTutorCoursesQuery({
		page,
		limit,
		search: search || undefined,
		status: status === "all" ? undefined : status,
		level: level === "all" ? undefined : level,
	});

	const courses = raw?.data?.data ?? [];
	const total = raw?.data?.total ?? 0;
	const totalPages = raw?.data ? Math.ceil(raw.data.total / raw.data.limit) : 0;

	const [createOpen, setCreateOpen] = useState(false);
	const [updateCourse, setUpdateCourse] = useState<CourseInspectResponse | null>(null);

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold">My Courses</h1>
					<p className="text-muted-foreground text-sm">Manage your courses, chapters, and lessons</p>
				</div>
			</div>

			<CoursesToolbar
				search={search}
				onSearchChange={setSearch}
				status={status}
				onStatusChange={setStatus}
				level={level}
				onLevelChange={setLevel}
				onCreateClick={() => setCreateOpen(true)}
			/>

			<Card>
				<CardHeader>
					<CardTitle>All Courses</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<CoursesTable
						courses={courses}
						isLoading={isLoading}
						page={page}
						totalPages={totalPages}
						total={total}
						limit={limit}
						onPageChange={setPage}
						onUpdateClick={setUpdateCourse}
					/>
				</CardContent>
			</Card>

			<CourseCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
			<CourseUpdateDialog
				course={updateCourse}
				open={!!updateCourse}
				onOpenChange={(open) => !open && setUpdateCourse(null)}
			/>
		</div>
	);
}
