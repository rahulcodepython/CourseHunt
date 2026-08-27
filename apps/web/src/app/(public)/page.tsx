"use client";

import * as React from "react";
import Link from "next/link";
import { useCoursesQuery } from "@/query-hooks/courses.api";
import { usePinnedFeedbacksQuery } from "@/query-hooks/feedbacks.api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/icon";
import { CourseCard } from "./components/course-card";
import { ReviewCard } from "./components/review-card";

export default function LandingPage() {
    const { data: rawCourses, isLoading: isLoadingCourses } = useCoursesQuery({ limit: 8 });
    const { data: rawFeedbacks } = usePinnedFeedbacksQuery();

    const courses = rawCourses?.data?.data ?? [];
    const feedbacks = (rawFeedbacks?.data?.data ?? []).filter((fb) => fb.content);

    return (
        <div className="bg-background">
            <section className="bg-linear-to-br from-primary/10 via-background to-secondary/10 py-20">
                <div className="container mx-auto grid items-center gap-12 px-4 lg:grid-cols-2">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                            Master New Skills with <span className="text-primary">CourseHunt</span>
                        </h1>
                        <p className="mt-6 text-lg text-muted-foreground">
                            Learn from industry experts with hands-on, project-based courses — at your own pace, on any device.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <Button size="lg" className="bg-green-600 hover:bg-green-700" asChild>
                                <Link href="/courses">
                                    Start Learning Today
                                    <Icon name="arrow-right" className="size-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <div className="hidden lg:block">
                        <div className="aspect-square rounded-2xl bg-linear-to-br from-primary/20 to-secondary/20 shadow-2xl" />
                    </div>
                </div>
            </section>

            <section className="bg-muted/50 py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-bold">Featured Courses</h2>
                        <p className="mt-2 text-muted-foreground">Hand-picked courses to get you started</p>
                    </div>

                    {isLoadingCourses ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-72 rounded-lg" />
                            ))}
                        </div>
                    ) : courses.length === 0 ? (
                        <p className="text-center text-muted-foreground">No courses found.</p>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {courses.map((course) => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    )}

                    <div className="mt-10 text-center">
                        <Button variant="outline" asChild>
                            <Link href="/courses">View All Courses</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {feedbacks.length > 0 && (
                <section className="py-20">
                    <div className="container mx-auto px-4">
                        <div className="mb-10 text-center">
                            <h2 className="text-3xl font-bold">What Our Students Say</h2>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {feedbacks.slice(0, 6).map((fb) => (
                                <ReviewCard key={fb.id} feedback={fb} />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
