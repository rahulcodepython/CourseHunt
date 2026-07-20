"use client";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@package/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@package/ui/table";
import { Progress } from "@package/ui/progress";
import type { RecentCourseCard, UserDashboard } from "@package/schema/dashboard.types";
import Link from "next/link";

export default function DashboardCoursesSlot({ data }: { data: UserDashboard }) {

	return (
		<Card className="shadow-sm border-none bg-muted/20 h-full">
			<CardHeader className="flex flex-row items-center justify-between">
				<div className="space-y-1">
					<CardTitle>My Courses</CardTitle>
					<CardDescription>Continue where you left off</CardDescription>
				</div>
			</CardHeader>
			<CardContent className="p-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Course</TableHead>
							<TableHead>Progress</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Action</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.recent_courses.map((course: RecentCourseCard) => {
								const progress = course.completion_percent;
							return (
								<TableRow key={course.id}>
									<TableCell>
										<div className="flex items-center gap-3">
											<div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
												<img
													src={course.image_url || "/placeholder.svg"}
													alt={course.title}
													className="w-full h-full object-cover"
												/>
											</div>
											<div>
												<div className="font-medium">{course.title}</div>
												<div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
													<Icon name="IconClock" className="w-3 h-3" />
													In progress
												</div>
											</div>
										</div>
									</TableCell>
									<TableCell className="min-w-[180px]">
										<div className="space-y-1">
											<Progress value={progress} className="h-2" />
											<div className="flex justify-between text-xs text-muted-foreground">
												<span>{progress.toFixed(0)}% complete</span>
												<span>{progress.toFixed(0)}%</span>
											</div>
										</div>
									</TableCell>
									<TableCell>
										<Badge
											variant={progress >= 100 ? "default" : "secondary"}
											className={progress >= 100 ? "bg-green-500" : ""}
										>
											{progress >= 100 ? "Completed" : "In Progress"}
										</Badge>
									</TableCell>
									<TableCell className="text-right">
										<Link href={`/dashboard/study/${course.id}`}>
											<Button size="sm" className="h-8">
												<Icon name="IconPlayerPlay" className="h-3.5 w-3.5 mr-1 fill-current" />
												{progress >= 100 ? "Review" : "Resume"}
											</Button>
										</Link>
									</TableCell>
								</TableRow>
							);
						})}
						{(data.recent_courses?.length || 0) === 0 && (
					<div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/10 mx-6 my-4">
						<Icon name="IconBook" className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
						<p className="text-muted-foreground font-medium">You haven't enrolled in any courses yet.</p>
						<Link href="/courses">
							<Button variant="outline" className="mt-4">Explore Courses</Button>
						</Link>
					</div>
				)}
				</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
