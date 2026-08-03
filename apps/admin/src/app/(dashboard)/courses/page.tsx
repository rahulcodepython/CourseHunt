"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { useManageCoursesQuery } from "@package/query-hooks/courses.api";
import { useDebounce } from "@package/hooks/use-debounce";
import { PageHeader } from "@package/components/page-header";
import { CoursesToolbar } from "./courses-toolbar";
import { CoursesTable } from "./courses-table";

export default function CoursesPage() {
	const [page, setPage] = React.useState(1);
	const limit = 10;
	const [search, setSearch] = React.useState("");
	const debouncedSearch = useDebounce(search, 350);
	const [status, setStatus] = React.useState("all");
	const [level, setLevel] = React.useState("all");

	const { data: raw, isLoading } = useManageCoursesQuery({
		page,
		limit,
		search: debouncedSearch || undefined,
		status: status === "all" ? undefined : status,
		level: level === "all" ? undefined : level,
	});

	const courses = raw?.data?.data ?? [];
	const total = raw?.data?.total ?? 0;
	const totalPages = raw?.data ? Math.ceil(raw.data.total / raw.data.limit) : 0;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Courses"
				subtitle="Search, filter and manage all platform courses"
			/>

			<CoursesToolbar
				search={search}
				onSearchChange={setSearch}
				status={status}
				onStatusChange={(v) => {
					setStatus(v);
					setPage(1);
				}}
				level={level}
				onLevelChange={(v) => {
					setLevel(v);
					setPage(1);
				}}
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
