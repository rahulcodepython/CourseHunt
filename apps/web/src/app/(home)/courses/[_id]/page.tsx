"use client";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent } from "@package/ui/card";
import { useCourseLandingQuery } from "@package/query-hooks/courses.api";
import type { CourseLandingResponse, ChapterCardResponse, LessonCardResponse } from "@package/schema/courses.types";
import { useParams } from "next/navigation";
import Loading from "@package/components/loading";
import EnrollButton from "@package/components/enroll-button";
import { useAddCourseToWishlistMutation } from "@package/query-hooks/wishlist.api";
import { useSession } from "@package/auth/auth-client";
import Image from "next/image";

export default function CourseDetail() {
	const { _id } = useParams();
	const { data: course, isLoading } = useCourseLandingQuery(_id as string);
	const { data: session } = useSession();
	const addToWishlist = useAddCourseToWishlistMutation();

	if (isLoading) return <Loading />;
	if (!course?.data) return <div className="text-center py-20">Course not found.</div>;

	const c: CourseLandingResponse = course.data;

	return (
		<div className="min-h-screen bg-background">
			<div className="bg-linear-to-br primary/10 via-background to-secondary/10">
				<div className="container mx-auto px-4 py-12">
					<div className="grid lg:grid-cols-3 gap-8">
						<div className="lg:col-span-2 space-y-6">
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<Badge variant="secondary">{c.level}</Badge>
									{c.category && <Badge variant="outline">{c.category.name}</Badge>}
								</div>
								<h1 className="text-4xl font-bold">{c.title}</h1>
								<p className="text-xl text-muted-foreground">{c.short_description}</p>
							</div>

							<div className="flex items-center gap-6 text-sm">
								<div className="flex items-center gap-1">
									<Icon name="IconStar" className="h-5 w-5 fill-yellow-400 text-yellow-400" />
									<span className="font-semibold">{c.rating_avg?.toFixed(1)}</span>
									<span className="text-muted-foreground">({c.feedback_count} reviews)</span>
								</div>
								<div className="flex items-center gap-1">
									<Icon name="IconUsers" className="h-5 w-5 text-muted-foreground" />
									<span>{c.total_lectures} lectures</span>
								</div>
								<div className="flex items-center gap-1">
									<Icon name="IconLanguage" className="h-5 w-5 text-muted-foreground" />
									<span>{c.language}</span>
								</div>
							</div>

							{
								c.instructor && <div className="flex items-center gap-3 pt-2">
									<div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
										{
											c.instructor.image ? <Image src={c.instructor.image} alt={c.instructor.name} width={48} height={48} className="object-cover" />
												: <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
													{c.instructor.name?.charAt(0)}
												</div>
										}
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Instructor</p>
										<p className="font-semibold">{c.instructor.name}</p>
										{c.instructor.headline && <p className="text-xs text-muted-foreground">{c.instructor.headline}</p>}
									</div>
								</div>
							}
						</div>

						<div className="lg:col-span-1">
							<Card className="sticky top-24">
								<CardContent className="p-6 space-y-4">
									{
										c.image_url && <Image src={c.image_url} alt={c.title} width={400} height={250} className="w-full rounded-lg object-cover" />
									}
									<div className="flex items-baseline gap-2">
										<span className="text-3xl font-bold">₹{c.final_price}</span>
										<span className="text-lg text-muted-foreground line-through">₹{c.actual_price}</span>
									</div>
									<EnrollButton _id={c.id} />
									{session && (
										<Button
											variant="outline"
											className="w-full"
											onClick={() => addToWishlist.mutate(c.id)}
											disabled={addToWishlist.isPending}
										>
											<Icon name="IconHeart" className="h-4 w-4 mr-2" />
											{addToWishlist.isPending ? "Adding..." : "Add to Wishlist"}
										</Button>
									)}
									<div className="space-y-2 text-sm">
										<div className="flex items-center gap-2"><Icon name="IconVideo" className="h-4 w-4 text-muted-foreground" />{c.total_lectures} lectures</div>
										<div className="flex items-center gap-2"><Icon name="IconClock" className="h-4 w-4 text-muted-foreground" />{Math.floor(c.total_duration_seconds / 3600)}h {Math.floor((c.total_duration_seconds % 3600) / 60)}m</div>
										<div className="flex items-center gap-2"><Icon name="IconAward" className="h-4 w-4 text-muted-foreground" />Certificate of completion</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</div>

			<div className="container mx-auto px-4 py-12">
				<div className="grid lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2 space-y-8">
						{
							c.long_description && <section>
								<h2 className="text-2xl font-bold mb-4">About This Course</h2>
								<p className="text-muted-foreground whitespace-pre-line">{c.long_description}</p>
							</section>
						}

						{
							c.benefits?.length > 0 && <section>
								<h2 className="text-2xl font-bold mb-4">What You'll Learn</h2>
								<div className="grid md:grid-cols-2 gap-3">
									{
										c.benefits.map((b: string, i: number) => <div key={i} className="flex items-center gap-2">
											<Icon name="IconCircleCheck" className="h-5 w-5 text-green-500 shrink-0" />
											<span>{b}</span>
										</div>
										)
									}
								</div>
							</section>
						}

						{
							c.requirements?.length > 0 && <section>
								<h2 className="text-2xl font-bold mb-4">Requirements</h2>
								<ul className="space-y-2">
									{c.requirements.map((r: string, i: number) => (
										<li key={i} className="flex items-center gap-2">
											<Icon name="IconCircle" className="h-5 w-5 text-muted-foreground" />
											<span>{r}</span>
										</li>
									))}
								</ul>
							</section>
						}

						{
							c.chapters?.length > 0 && <section>
								<h2 className="text-2xl font-bold mb-4">Course Content</h2>
								<div className="space-y-4">
									{
										c.chapters.map((ch: ChapterCardResponse, i: number) => <Card key={ch.id || i}>
											<CardContent className="p-4">
												<div className="flex items-center justify-between">
													<div>
														<h3 className="font-semibold">Chapter {ch.chapter_no}: {ch.title}</h3>
														<p className="text-sm text-muted-foreground">{ch.total_lectures} lectures • {Math.floor(ch.total_duration_seconds / 60)} min</p>
													</div>
												</div>
												{
													ch.lessons?.length > 0 && <div className="mt-3 space-y-2 pl-4 border-l-2 border-muted">
														{
															ch.lessons.map((lesson: LessonCardResponse, j: number) => <div key={lesson.id || j} className="flex items-center gap-2 text-sm">
																<Icon name="IconVideo" className="h-4 w-4 text-muted-foreground" />
																<span>{lesson.title}</span>
																<span className="text-xs text-muted-foreground ml-auto">
																	{Math.floor(lesson.duration_seconds / 60)}:{String(lesson.duration_seconds % 60).padStart(2, "0")}
																</span>
															</div>
															)
														}
													</div>
												}
											</CardContent>
										</Card>
										)
									}
								</div>
							</section>
						}
					</div>
				</div>
			</div>
		</div>
	);
}
