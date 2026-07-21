"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { useManageCoursesQuery } from "@package/query-hooks/courses.api";
import { useState } from "react";
import { CoursesToolbar } from "./courses-toolbar";
import { CoursesTable } from "./courses-table";

export default function CoursesPage() {
	const [page, setPage] = useState(1);
	const limit = 10;
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("all");
	const [level, setLevel] = useState("all");

	const { data: raw, isLoading } = useManageCoursesQuery({
		page,
		limit,
		search: search || undefined,
		status: status === "all" ? undefined : status,
		level: level === "all" ? undefined : level,
	});

	const courses = raw?.data?.data ?? [];
	const total = raw?.data?.total ?? 0;
	const totalPages = raw?.data ? Math.ceil(raw.data.total / raw.data.limit) : 0;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Courses</h1>
				<p className="text-muted-foreground text-sm">View all platform courses</p>
			</div>

			<CoursesToolbar
				search={search}
				onSearchChange={setSearch}
				status={status}
				onStatusChange={setStatus}
				level={level}
				onLevelChange={setLevel}
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
					/>
				</CardContent>
			</Card>
		</div>
	);
}
