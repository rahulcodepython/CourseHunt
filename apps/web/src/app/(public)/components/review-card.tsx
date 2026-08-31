import type { Feedback } from "@/schema/feedbacks.types";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/icon";
import UserAvatar from "@/components/user-avatar";

export function ReviewCard({
  feedback,
  showCourse = true,
}: {
  feedback: Feedback;
  showCourse?: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Icon
              key={i}
              name="star"
              className={
                i < feedback.rating
                  ? "size-4 fill-yellow-400 text-yellow-400"
                  : "size-4 text-muted-foreground"
              }
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">&ldquo;{feedback.content}&rdquo;</p>
        <div className="flex items-center gap-3">
          <UserAvatar name={feedback.user.name} image={feedback.user.image} className="size-9" />
          <div>
            <p className="text-sm font-medium">{feedback.user.name}</p>
            {showCourse && <p className="text-xs text-muted-foreground">{feedback.course.title}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
