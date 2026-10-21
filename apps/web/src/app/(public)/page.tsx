"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCoursesQuery } from "@/query-hooks/courses.api";
import { usePinnedFeedbacksQuery } from "@/query-hooks/feedbacks.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon, type IconName } from "@/components/common/icon";
import { CourseCard } from "@/components/landing/course-card";
import { ReviewCard } from "@/components/landing/review-card";
import { ROUTES } from "@/lib/constants/const";

const FEATURES: { icon: IconName; title: string; description: string }[] = [
  {
    icon: "video",
    title: "Expert-led video lessons",
    description: "Structured courses taught by practitioners, broken into short, focused lessons.",
  },
  {
    icon: "list",
    title: "Quizzes & assignments",
    description: "Check your understanding after every chapter and practise with real tasks.",
  },
  {
    icon: "chart-line",
    title: "Track your progress",
    description:
      "Pick up exactly where you left off, on any device, with progress saved automatically.",
  },
  {
    icon: "shield-check",
    title: "Verifiable certificates",
    description: "Finish a course and earn a certificate anyone can verify with a single link.",
  },
];

const HIGHLIGHTS = ["Learn at your own pace", "Any device", "Certificate on completion"];

export default function LandingPage() {
  const { data: rawCourses, isLoading: isLoadingCourses } = useCoursesQuery({ limit: 8 });
  const { data: rawFeedbacks } = usePinnedFeedbacksQuery();

  const courses = rawCourses?.data ?? [];
  const feedbacks = (rawFeedbacks?.data ?? []).filter((fb) => fb.content);
  const spotlight = courses[0];

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 size-[32rem] rounded-full bg-primary/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-32 size-[28rem] rounded-full bg-primary/10 blur-3xl"
        />

        <div className="container relative mx-auto grid items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-2 lg:gap-16">
          <div>
            <Badge variant="secondary" className="mb-6 gap-1.5 rounded-full px-3 py-1 text-primary">
              <Icon name="star" className="size-3.5 fill-current" />
              Learn by doing
            </Badge>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl xl:text-6xl">
              Master new skills with <span className="text-primary">CourseHunt</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Learn from industry experts with hands-on, project-based courses — at your own pace,
              on any device.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/courses">
                  Explore courses
                  <Icon name="arrow-right" className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={ROUTES.LOGIN}>Sign in</Link>
              </Button>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Icon name="check" className="size-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="relative aspect-4/3 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-black/5">
              <Image
                src="/hero-learning.jpg"
                alt="Students learning together on their laptops"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent" />
            </div>

            {spotlight && (
              <Link
                href={`/courses/${spotlight.slug}`}
                className="absolute -bottom-6 left-4 right-4 flex items-center gap-3 rounded-2xl border bg-background/95 p-3 shadow-xl backdrop-blur transition-transform hover:-translate-y-0.5 sm:left-auto sm:right-6 sm:w-80"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name="play" className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Featured course</p>
                  <p className="truncate text-sm font-semibold">{spotlight.title}</p>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-1 text-sm">
                  <Icon name="star" className="size-4 fill-yellow-400 text-yellow-400" />
                  <span className="tabular-nums">{spotlight.rating_avg.toFixed(1)}</span>
                </div>
              </Link>
            )}

            <div className="absolute -top-5 -left-4 hidden items-center gap-3 rounded-2xl border bg-background/95 p-3 shadow-xl backdrop-blur sm:flex">
              <div className="flex size-10 items-center justify-center rounded-xl bg-green-600/10 text-green-600">
                <Icon name="shield-check" className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Certificate</p>
                <p className="text-xs text-muted-foreground">on every completed course</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y bg-muted/40 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Everything you need to learn well</h2>
            <p className="mt-3 text-muted-foreground">
              More than videos — a complete path from your first lesson to a certificate.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border bg-background p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name={feature.icon} className="size-5" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured courses */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Featured courses</h2>
              <p className="mt-2 text-muted-foreground">Hand-picked courses to get you started</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/courses">
                View all courses
                <Icon name="arrow-right" className="size-4" />
              </Link>
            </Button>
          </div>

          {isLoadingCourses ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
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
        </div>
      </section>

      {/* Testimonials */}
      {feedbacks.length > 0 && (
        <section className="bg-muted/40 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">What our students say</h2>
              <p className="mt-3 text-muted-foreground">
                Real reviews from learners on CourseHunt.
              </p>
            </div>
            {/* Flex + fixed widths so a partial last row stays centred. */}
            <div className="flex flex-wrap justify-center gap-6">
              {feedbacks.slice(0, 6).map((fb) => (
                <div
                  key={fb.id}
                  className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
                >
                  <ReviewCard feedback={fb} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call to action */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground md:px-12">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/10 blur-2xl"
            />
            <h2 className="relative text-3xl font-bold tracking-tight md:text-4xl">
              Ready to start learning?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Create your free account in seconds with Google or your email, and begin your first
              lesson today.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link href={ROUTES.LOGIN}>
                  Get started
                  <Icon name="arrow-right" className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                asChild
              >
                <Link href="/courses">Browse courses</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
