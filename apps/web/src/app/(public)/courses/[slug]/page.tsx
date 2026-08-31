"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { useCourseLandingQuery, useEnrollFreeMutation } from "@/query-hooks/courses.api";
import { useAddCourseToWishlistMutation } from "@/query-hooks/wishlist.api";
import { usePinnedFeedbacksQuery } from "@/query-hooks/feedbacks.api";
import { usePublicFaqsQuery } from "@/query-hooks/faqs.api";
import useSession from "@/hooks/use-session";
import { ROUTES } from "@/lib/const";
import { formatINR, formatDuration } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Icon, type IconName } from "@/components/icon";
import { Loading } from "@/components/loading";
import UserAvatar from "@/components/user-avatar";
import { LESSON_TYPE } from "@/lib/const";
import { ReviewCard } from "../../components/review-card";

const LESSON_TYPE_ICON: Record<string, IconName> = {
  [LESSON_TYPE.VIDEO]: "video",
  [LESSON_TYPE.DOCUMENT]: "file-text",
  [LESSON_TYPE.QUIZ]: "help-circle",
};

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useSession();

  const { data: raw, isLoading } = useCourseLandingQuery(slug);
  const enrollFree = useEnrollFreeMutation();
  const addToWishlist = useAddCourseToWishlistMutation();

  const course = raw?.data;
  const { data: rawFeedbacks } = usePinnedFeedbacksQuery(course?.id);
  const reviews = (rawFeedbacks?.data?.data ?? []).filter((fb) => fb.content);
  const { data: rawFaqs } = usePublicFaqsQuery(course?.id ?? "");
  const faqs = rawFaqs?.data ?? [];

  if (isLoading) return <Loading />;

  if (!course) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Icon name="ban" className="size-10 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  const handleEnrollFree = async () => {
    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }
    const res = await enrollFree.execute(course.id);
    if (res?.success) router.push(`/student/study/${course.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-linear-to-br from-primary/10 via-background to-secondary/10 py-12">
        <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="flex gap-2">
              <Badge variant="secondary" className="capitalize">
                {course.level}
              </Badge>
              {course.category && <Badge variant="outline">{course.category.name}</Badge>}
            </div>
            <h1 className="text-4xl font-bold">{course.title}</h1>
            {course.short_description && (
              <p className="text-xl text-muted-foreground">{course.short_description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Icon name="star" className="size-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{course.rating_avg.toFixed(1)}</span>
                <span className="text-muted-foreground">({course.feedback_count} reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Icon name="book" className="size-4" />
                {course.total_lectures} lectures
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Icon name="globe" className="size-4" />
                {course.language}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <UserAvatar
                name={course.instructor.name}
                image={course.instructor.image}
                className="size-12"
              />
              <div>
                <p className="text-xs text-muted-foreground">Instructor</p>
                <p className="font-medium">{course.instructor.name}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 gap-0 overflow-hidden py-0">
              <div className="aspect-video w-full bg-muted flex items-center justify-center text-muted-foreground">
                {course.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={course.image_url}
                    alt={course.title}
                    className="size-full object-cover"
                  />
                ) : (
                  <Icon name="book" className="size-8 opacity-40" />
                )}
              </div>
              <CardContent className="space-y-4 p-5">
                {course.is_free ? (
                  <p className="text-2xl font-bold text-green-600">Free</p>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{formatINR(course.final_price)}</span>
                    {course.final_price < course.actual_price && (
                      <span className="text-muted-foreground line-through">
                        {formatINR(course.actual_price)}
                      </span>
                    )}
                  </div>
                )}

                {course.is_enrolled ? (
                  <Button className="w-full" asChild>
                    <Link href={`/student/study/${course.id}`}>Go to Course</Link>
                  </Button>
                ) : course.is_free ? (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={enrollFree.isPending}
                    onClick={handleEnrollFree}
                  >
                    {user ? "Enroll for Free" : "Log in to Enroll"}
                  </Button>
                ) : (
                  <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                    <Link href={`/checkout/${course.id}`}>
                      <Icon name="shopping-cart" className="size-4" />
                      Buy Now
                    </Link>
                  </Button>
                )}

                {user && !course.is_enrolled && (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={addToWishlist.isPending}
                    onClick={() => addToWishlist.execute(course.id)}
                  >
                    <Icon name="heart" className="size-4" />
                    Add to Wishlist
                  </Button>
                )}

                <div className="space-y-2 border-t pt-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon name="video" className="size-4" />
                    {course.total_lectures} lectures
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon name="clock" className="size-4" />
                    {formatDuration(course.total_duration_seconds)} total
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon name="shield-check" className="size-4" />
                    Certificate on completion
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto grid gap-8 px-4 py-12 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {course.long_description && (
            <section>
              <h2 className="mb-3 text-2xl font-bold">About This Course</h2>
              <p className="whitespace-pre-line text-muted-foreground">{course.long_description}</p>
            </section>
          )}

          {course.benefits.length > 0 && (
            <section>
              <h2 className="mb-3 text-2xl font-bold">What You&apos;ll Learn</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {course.benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Icon name="check" className="mt-0.5 size-4 shrink-0 text-green-600" />
                    {b}
                  </div>
                ))}
              </div>
            </section>
          )}

          {course.requirements.length > 0 && (
            <section>
              <h2 className="mb-3 text-2xl font-bold">Requirements</h2>
              <div className="space-y-1.5">
                {course.requirements.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Icon name="circle" className="mt-1 size-2 shrink-0" />
                    {r}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-2xl font-bold">Course Content</h2>
            <Card className="py-0">
              <CardContent className="p-2">
                <Accordion type="multiple">
                  {course.chapters.map((chapter) => (
                    <AccordionItem key={chapter.id} value={chapter.id}>
                      <AccordionTrigger className="px-3">
                        <div className="text-left">
                          <p className="text-sm font-medium">
                            Ch {chapter.chapter_no}: {chapter.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {chapter.lessons.length} lectures &middot;{" "}
                            {formatDuration(chapter.total_duration_seconds)}
                          </p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3">
                        <div className="space-y-1 border-l-2 border-muted pl-4">
                          {chapter.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between gap-3 py-1.5 text-sm"
                            >
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Icon
                                  name={LESSON_TYPE_ICON[lesson.lesson_type] ?? "file-text"}
                                  className="size-4"
                                />
                                {lesson.title}
                              </div>
                              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                                {formatDuration(lesson.duration_seconds)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </section>

          {faqs.length > 0 && (
            <section>
              <h2 className="mb-3 text-2xl font-bold">Frequently Asked Questions</h2>
              <Card className="py-0">
                <CardContent className="p-2">
                  <Accordion type="single" collapsible>
                    {faqs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger className="px-3 text-left text-sm font-medium">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="px-3 text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </section>
          )}

          {reviews.length > 0 && (
            <section>
              <h2 className="mb-3 text-2xl font-bold">Student Reviews</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {reviews.map((fb) => (
                  <ReviewCard key={fb.id} feedback={fb} showCourse={false} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
