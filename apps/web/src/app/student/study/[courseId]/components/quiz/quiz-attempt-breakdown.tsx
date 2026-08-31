"use client";

import { useQuizAttemptDetailQuery } from "@/query-hooks/quiz.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { QUESTION_TYPE } from "@/lib/const";
import type { QuizAttemptQuestionBreakdown } from "@/schema/quiz.types";

function ChoiceAnswer({ question }: { question: QuizAttemptQuestionBreakdown }) {
  const multi = question.question_type === QUESTION_TYPE.MULTI_CHOICE;
  return (
    <div className="space-y-2">
      {(question.options ?? []).map((opt) => {
        const selected = opt.is_selected;
        const correct = opt.is_correct;
        return (
          <div
            key={opt.option_id}
            className={cn(
              "flex items-center gap-3 rounded-md border p-3 text-sm",
              correct && "border-green-500/60 bg-green-500/5",
              selected && !correct && "border-red-500/60 bg-red-500/5",
            )}
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                correct
                  ? "border-green-500 text-green-600"
                  : selected
                    ? "border-red-500 text-red-600"
                    : "border-border",
              )}
            >
              {selected && <span className="size-2 rounded-[2px] bg-current" />}
            </span>
            <span className="min-w-0 flex-1">{opt.option_text}</span>
            <span className="flex shrink-0 items-center gap-1 text-xs">
              {correct && (
                <span className="flex items-center gap-0.5 text-green-600">
                  <Icon name="check" className="size-3.5" /> Correct
                </span>
              )}
              {selected && !correct && (
                <span className="flex items-center gap-0.5 text-red-600">
                  <Icon name="x" className="size-3.5" /> Your answer
                </span>
              )}
            </span>
          </div>
        );
      })}
      {multi && question.options?.length === 0 && (
        <p className="text-sm text-muted-foreground">No options recorded for this question.</p>
      )}
    </div>
  );
}

function ArrangeAnswer({ question }: { question: QuizAttemptQuestionBreakdown }) {
  const items = [...(question.arrange_items ?? [])].sort(
    (a, b) => (a.submitted_order ?? 0) - (b.submitted_order ?? 0),
  );
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No items recorded for this question.</p>;
  }
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Shown in the order you submitted. Green rows are in the correct position.
      </p>
      {items.map((item, index) => {
        const placed = item.submitted_order === item.correct_order;
        return (
          <div
            key={item.item_id}
            className={cn(
              "flex items-center gap-3 rounded-md border p-3 text-sm",
              placed && "border-green-500/60 bg-green-500/5",
            )}
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">{item.item_text}</span>
            <span className="flex shrink-0 items-center gap-1 text-xs">
              {placed ? (
                <span className="flex items-center gap-0.5 text-green-600">
                  <Icon name="check" className="size-3.5" /> Position {item.correct_order}
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-muted-foreground">
                  <Icon name="x" className="size-3.5" /> Correct position {item.correct_order}
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function FillAnswer({ question }: { question: QuizAttemptQuestionBreakdown }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-muted-foreground">Your answer</Label>
        <Input value={question.is_skipped ? "Skipped" : question.your_answer} readOnly disabled />
      </div>
      {!question.is_correct && (question.fill_answers?.length ?? 0) > 0 && (
        <div className="space-y-1.5">
          <Label className="text-green-600">
            Correct answer{(question.fill_answers.length ?? 0) > 1 ? "s" : ""}
          </Label>
          <ul className="space-y-1">
            {question.fill_answers.map((answer, i) => (
              <li
                key={i}
                className="rounded-md border border-green-500/60 bg-green-500/5 px-3 py-2 text-sm text-green-700"
              >
                {answer}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function QuizAttemptBreakdown({
  attemptId,
  onBack,
}: {
  attemptId: string;
  onBack: () => void;
}) {
  const { data: raw, isLoading } = useQuizAttemptDetailQuery(attemptId);
  const detail = raw?.data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <Icon name="arrow-left" className="size-4" />
          Back
        </Button>
        {detail && (
          <span
            className={cn("text-sm font-medium", detail.passed ? "text-green-600" : "text-red-600")}
          >
            {Math.round(detail.total_score)}% &middot; {detail.passed ? "Passed" : "Not Passed"}
          </span>
        )}
      </div>

      {isLoading || !detail ? (
        <div className="flex items-center justify-center py-16">
          <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <Accordion type="multiple" className="w-full">
            {detail.questions.map((q, i) => (
              <AccordionItem key={q.question_id} value={q.question_id}>
                <AccordionTrigger className="hover:no-underline">
                  <span className="flex min-w-0 flex-1 items-start gap-2">
                    <span className="shrink-0 font-semibold tabular-nums">{i + 1}.</span>
                    <span className="min-w-0 flex-1">{q.question_text}</span>
                    <span className="ml-2 flex shrink-0 items-center gap-2">
                      <span className="text-xs text-muted-foreground">{q.points} pts</span>
                      <Icon
                        name={q.is_skipped ? "circle" : q.is_correct ? "check" : "x"}
                        className={cn(
                          "size-4",
                          q.is_skipped
                            ? "text-muted-foreground"
                            : q.is_correct
                              ? "text-green-600"
                              : "text-red-600",
                        )}
                      />
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-1">
                  {q.is_skipped ? (
                    <p className="text-sm text-muted-foreground">This question was skipped.</p>
                  ) : (
                    <div className="space-y-3">
                      {q.question_type === QUESTION_TYPE.SINGLE_CHOICE && (
                        <ChoiceAnswer question={q} />
                      )}
                      {q.question_type === QUESTION_TYPE.MULTI_CHOICE && (
                        <ChoiceAnswer question={q} />
                      )}
                      {q.question_type === QUESTION_TYPE.ARRANGE && <ArrangeAnswer question={q} />}
                      {q.question_type === QUESTION_TYPE.FILL_BLANK && <FillAnswer question={q} />}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
}
