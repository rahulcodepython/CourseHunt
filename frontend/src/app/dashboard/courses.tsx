"use client";

import { Icon } from "@/components/icon";


import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUserDashboardQuery, type UserCourseType } from "@/hooks/api";

import Link from "next/link";

export default function DashboardCoursesSlot() {
	const { data: responseData, isLoading } = useUserDashboardQuery();

	if (isLoading || !responseData) return null;

	return (
		<Card className="shadow-sm border-none bg-muted/20 h-full">
			<CardHeader className="flex flex-row items-center justify-between">
				<div className="space-y-1">
					<CardTitle>My Courses</CardTitle>
					<CardDescription>Continue where you left off</CardDescription>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{responseData.courses.map((course: UserCourseType) => {
					const progress =
						course.totalLessons > 0
							? (course.completedLessons / course.totalLessons) * 100
							: 0;
					return (
						<div
							key={course._id}
							className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-shadow"
						>
							<div className="relative group overflow-hidden rounded-lg w-full sm:w-32 aspect-video shrink-0">
								<img
									src={course.imageUrl?.url || "/placeholder.svg"}
									alt={course.title}
									className="w-full h-full object-cover transition-transform group-hover:scale-110"
								/>
								<div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
									<Icon name="IconPlayerPlay" className="w-8 h-8 text-white fill-white" />
								</div>
							</div>
							<div className="flex-1 w-full space-y-3">
								<div className="flex justify-between items-start gap-2">
									<h3 className="font-bold text-lg leading-tight line-clamp-1">
										{course.title}
									</h3>
									<Badge
										variant={course.completed ? "default" : "secondary"}
										className={course.completed ? "bg-green-500 hover:bg-green-600" : ""}
									>
										{course.completed ? "Completed" : "In Progress"}
									</Badge>
								</div>
								<div className="space-y-1.5">
									<div className="flex justify-between text-xs font-medium text-muted-foreground">
										<span>
											{course.completedLessons} of {course.totalLessons} lessons
										</span>
										<span>{progress.toFixed(0)}%</span>
									</div>
									<Progress value={progress} className="h-2" />
								</div>
								<div className="flex items-center justify-between pt-1">
									<span className="text-xs text-muted-foreground flex items-center gap-1">
										<Clock className="w-3 h-3" />
										{course.duration || "N/A"}
									</span>
									<Link href={`/dashboard/study/${course._id}`}>
										<Button
											size="sm"
											className="h-8 px-4 font-semibold text-white bg-primary hover:bg-primary/90"
										>
											<Icon name="IconPlayerPlay" className="h-3.5 w-3.5 mr-1.5 fill-current" />
											{course.completed ? "Review" : "Resume"}
										</Button>
									</Link>
								</div>
							</div>
						</div>
					);
				})}
				{responseData.courses.length === 0 && (
					<div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/10">
						<Icon name="IconBook" className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
						<p className="text-muted-foreground font-medium">
							You haven't enrolled in any courses yet.
						</p>
						<Link href="/courses">
							<Button variant="outline" className="mt-4">
								Explore Courses
							</Button>
						</Link>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

const Clock = ({ className }: { className?: string }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<circle cx="12" cy="12" r="10" />
		<polyline points="12 6 12 12 16 14" />
	</svg>
);
