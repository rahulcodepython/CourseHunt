import Link from "next/link";
import type { CoursePublicResponse } from "@/schema/courses.types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icon";
import { formatINR } from "@/lib/format";

export function CourseCard({ course }: { course: CoursePublicResponse }) {
  return (
    <Link href={`/courses/${course.slug}`}>
      <Card className="h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
        <div className="aspect-video w-full bg-muted flex items-center justify-center text-muted-foreground">
          {course.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={course.image_url} alt={course.title} className="size-full object-cover" />
          ) : (
            <Icon name="book" className="size-8 opacity-40" />
          )}
        </div>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">{course.level}</Badge>
            {course.category && <Badge variant="outline">{course.category.name}</Badge>}
          </div>
          <p className="line-clamp-2 font-semibold leading-snug">{course.title}</p>
          <p className="text-sm text-muted-foreground">{course.instructor.name}</p>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 text-sm">
              <Icon name="star" className="size-4 fill-yellow-400 text-yellow-400" />
              <span className="tabular-nums">{course.rating_avg.toFixed(1)}</span>
              <span className="text-muted-foreground">({course.feedback_count})</span>
            </div>
            {course.is_free ? (
              <Badge className="bg-green-600 hover:bg-green-700">Free</Badge>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">{formatINR(course.final_price)}</span>
                {course.final_price < course.actual_price && (
                  <span className="text-xs text-muted-foreground line-through">{formatINR(course.actual_price)}</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
