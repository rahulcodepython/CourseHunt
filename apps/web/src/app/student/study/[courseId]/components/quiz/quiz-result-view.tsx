"use client";

import type { SubmitQuizResponse } from "@/schema/quiz.types";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

export function QuizResultView({
  result,
  passScorePercent,
  onRetake,
  onViewBreakdown,
}: {
  result: SubmitQuizResponse;
  passScorePercent: number;
  onRetake: () => void;
  onViewBreakdown: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div
        className={cn(
          "flex size-16 items-center justify-center rounded-full",
          result.passed ? "bg-green-100 dark:bg-green-500/10" : "bg-red-100 dark:bg-red-500/10",
        )}
      >
        <Icon
          name={result.passed ? "check" : "x"}
          className={cn("size-8", result.passed ? "text-green-600" : "text-red-600")}
        />
      </div>

      <div>
        <p
          className={cn("text-xl font-semibold", result.passed ? "text-green-600" : "text-red-600")}
        >
          {result.passed ? "Quiz Passed!" : "Quiz Not Passed"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          You scored {Math.round(result.total_score)}% &middot; pass mark is {passScorePercent}%
        </p>
      </div>

      <div className="flex gap-6 text-sm">
        <div className="text-center">
          <p className="font-semibold text-green-600">{result.correct_count}</p>
          <p className="text-muted-foreground">Correct</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-red-600">{result.incorrect_count}</p>
          <p className="text-muted-foreground">Incorrect</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-muted-foreground">{result.skipped_count}</p>
          <p className="text-muted-foreground">Skipped</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onViewBreakdown}>
          <Icon name="file-text" className="size-4" />
          View Full Breakdown
        </Button>
        <Button variant="outline" onClick={onRetake}>
          <Icon name="refresh" className="size-4" />
          Retake Quiz
        </Button>
      </div>
    </div>
  );
}
