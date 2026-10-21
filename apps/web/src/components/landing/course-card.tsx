"use client";

import * as React from "react";
import Link from "next/link";
import type { CoursePublicResponse } from "@/schema/courses.types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/common/icon";
import { formatINR } from "@/lib/utils/format";

function CourseImage({ src, alt }: { src?: string | null; alt: string }) {
  // Falls back to the placeholder when the URL is missing or fails to load
  // (e.g. a deleted upload or a dead external link).
  const [failed, setFailed] = React.useState(false);

  if (!src || failed) {
    return (
      <div className="flex size-full items-center justify-center bg-linear-to-br from-primary/15 to-primary/5 text-primary">
        <Icon name="book" className="size-10 opacity-60" />
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
}

export function CourseCard({ course }: { course: CoursePublicResponse }) {
  return (
    <Link href={`/courses/${course.slug}`} className="group block h-full">
      <Card className="h-full gap-0 overflow-hidden py-0 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <CourseImage src={course.image_url} alt={course.title} />
          {course.is_free && (
            <Badge className="absolute left-3 top-3 bg-green-600 shadow hover:bg-green-700">
              Free
            </Badge>
          )}
        </div>
        <CardContent className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {course.level}
            </Badge>
            {course.category && <Badge variant="outline">{course.category.name}</Badge>}
          </div>
          <p className="line-clamp-2 font-semibold leading-snug transition-colors group-hover:text-primary">
            {course.title}
          </p>
          <p className="text-sm text-muted-foreground">{course.instructor.name}</p>
          <div className="mt-auto flex items-center justify-between pt-2">
            <div className="flex items-center gap-1 text-sm">
              <Icon name="star" className="size-4 fill-yellow-400 text-yellow-400" />
              <span className="tabular-nums">{course.rating_avg.toFixed(1)}</span>
              <span className="text-muted-foreground">({course.feedback_count})</span>
            </div>
            {course.is_free ? (
              <span className="font-semibold text-green-600">Free</span>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">{formatINR(course.final_price)}</span>
                {course.final_price < course.actual_price && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatINR(course.actual_price)}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
