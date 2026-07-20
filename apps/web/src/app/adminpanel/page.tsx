"use client";

import { Icon } from "@package/components/icon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@package/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@package/ui/table";
import { useAdminDashboardQuery } from "@package/query-hooks/dashboard.api";
import type { AdminDashboard, AdminTopCourse, UserGrowth } from "@package/schema/dashboard.types";
import Loading from "@package/components/loading";

const Admin = () => {
	const { data: raw, isLoading } = useAdminDashboardQuery();
	const responseData: AdminDashboard | undefined = raw?.data ?? undefined;

	if (isLoading) return <Loading />;
	if (!responseData) return <div className="p-6">Failed to load dashboard.</div>;

	return (
		<div className="flex-1 space-y-6 p-6">
			<div className="space-y-2">
				<h2 className="text-2xl font-bold">Welcome to Admin Panel 🚀</h2>
				<p className="text-muted-foreground">Manage your courses, students, and track platform performance.</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Students</CardTitle>
						<Icon name="IconUsers" className="h-5 w-5 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{responseData.total_users}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Courses</CardTitle>
						<Icon name="IconBook" className="h-5 w-5 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{responseData.total_courses}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
						<Icon name="IconCurrencyDollar" className="h-5 w-5 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{responseData.total_enrollments}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
						<Icon name="IconVideo" className="h-5 w-5 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">₹{responseData.total_revenue}</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Top Courses</CardTitle>
						<CardDescription>Manage your course catalog</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Course</TableHead>
									<TableHead>Students</TableHead>
									<TableHead>Revenue</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{(responseData.top_courses || []).map((course: AdminTopCourse, i: number) => (
									<TableRow key={i}>
										<TableCell>
											<div className="font-medium text-sm">{course.title}</div>
										</TableCell>
										<TableCell>{course.students}</TableCell>
										<TableCell>₹{course.revenue}</TableCell>
									</TableRow>
								))}
								{(responseData.top_courses?.length || 0) === 0 && (
									<TableRow>
										<TableCell colSpan={3} className="text-center text-muted-foreground">
											No courses yet.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>User Growth</CardTitle>
						<CardDescription>New user registrations</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Month</TableHead>
									<TableHead>Users</TableHead>
									<TableHead>Joined</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{(responseData.user_growth || []).map((student: UserGrowth, i: number) => (
									<TableRow key={i}>
										<TableCell>
											<div className="font-medium">{student.month}</div>
										</TableCell>
										<TableCell>{student.count}</TableCell>
										<TableCell>{student.count} users</TableCell>
									</TableRow>
								))}
								{(responseData.user_growth?.length || 0) === 0 && (
									<TableRow>
										<TableCell colSpan={3} className="text-center text-muted-foreground">
											No data yet.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default Admin;
