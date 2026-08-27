"use client";

import * as React from "react";

import type { QuestionForAttempt } from "@/schema/quiz.types";
import { QUESTION_TYPE } from "@/lib/const";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import type { AnswerDraft } from "./types";

function ArrangeInput({
  question,
  onChange,
}: {
  question: QuestionForAttempt;
  onChange: (items: { item_id: string; order: number }[]) => void;
}) {
  const [order, setOrder] = React.useState(() => question.arrange_items ?? []);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...order];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    onChange(next.map((item, i) => ({ item_id: item.id, order: i + 1 })));
  };

  React.useEffect(() => {
    onChange(order.map((item, i) => ({ item_id: item.id, order: i + 1 })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Use the arrows to put these in the correct order.</p>
      {order.map((item, index) => (
        <div key={item.id} className="flex items-center gap-3 rounded-md border p-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1">{item.item_text}</span>
          <div className="flex shrink-0 gap-1">
            <Button type="button" variant="outline" size="icon" className="size-7" disabled={index === 0} onClick={() => move(index, -1)}>
              <Icon name="chevron-up" className="size-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" className="size-7" disabled={index === order.length - 1} onClick={() => move(index, 1)}>
              <Icon name="chevron-down" className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuizQuestionView({
  question,
  index,
  total,
  onSubmit,
}: {
  question: QuestionForAttempt;
  index: number;
  total: number;
  onSubmit: (draft: AnswerDraft) => void;
}) {
  const [selectedOption, setSelectedOption] = React.useState<string>("");
  const [selectedOptions, setSelectedOptions] = React.useState<string[]>([]);
  const [arrangeItems, setArrangeItems] = React.useState<{ item_id: string; order: number }[]>([]);
  const [fillText, setFillText] = React.useState("");

  const canSubmit =
    question.question_type === QUESTION_TYPE.SINGLE_CHOICE ? Boolean(selectedOption) :
      question.question_type === QUESTION_TYPE.MULTI_CHOICE ? selectedOptions.length > 0 :
        question.question_type === QUESTION_TYPE.FILL_BLANK ? fillText.trim().length > 0 :
          true;

  const submitAnswer = (skip: boolean) => {
    const question_id = question.id;
    switch (question.question_type) {
      case QUESTION_TYPE.SINGLE_CHOICE:
        onSubmit({ type: "single_choice", question_id, selected_option_id: skip ? "" : selectedOption, is_skipped: skip });
        return;
      case QUESTION_TYPE.MULTI_CHOICE:
        onSubmit({ type: "multi_choice", question_id, selected_option_ids: skip ? [] : selectedOptions, is_skipped: skip });
        return;
      case QUESTION_TYPE.ARRANGE:
        onSubmit({ type: "arrange", question_id, items: arrangeItems, is_skipped: skip });
        return;
      case QUESTION_TYPE.FILL_BLANK:
        onSubmit({ type: "fill_blank", question_id, fill_text: skip ? "" : fillText, is_skipped: skip });
        return;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Question {index + 1} of {total}</span>
        <span>{question.points} {question.points === 1 ? "point" : "points"}</span>
      </div>

      <p className="text-base font-medium">{question.question_text}</p>

      {question.question_type === QUESTION_TYPE.SINGLE_CHOICE && (
        <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
          {(question.options ?? []).map((opt) => (
            <label
              key={opt.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm",
                selectedOption === opt.id && "border-primary bg-primary/5",
              )}
            >
              <RadioGroupItem value={opt.id} />
              {opt.option_text}
            </label>
          ))}
        </RadioGroup>
      )}

      {question.question_type === QUESTION_TYPE.MULTI_CHOICE && (
        <div className="space-y-2">
          {(question.options ?? []).map((opt) => {
            const checked = selectedOptions.includes(opt.id);
            return (
              <label
                key={opt.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm",
                  checked && "border-primary bg-primary/5",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) =>
                    setSelectedOptions((prev) => (v ? [...prev, opt.id] : prev.filter((id) => id !== opt.id)))
                  }
                />
                {opt.option_text}
              </label>
            );
          })}
        </div>
      )}

      {question.question_type === QUESTION_TYPE.ARRANGE && (
        <ArrangeInput question={question} onChange={setArrangeItems} />
      )}

      {question.question_type === QUESTION_TYPE.FILL_BLANK && (
        <div className="space-y-1.5">
          {question.fill_blank_hint && <Label className="text-muted-foreground">{question.fill_blank_hint}</Label>}
          <Input value={fillText} onChange={(e) => setFillText(e.target.value)} placeholder="Your answer" />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => submitAnswer(true)}>
          Skip
        </Button>
        <Button type="button" disabled={!canSubmit} onClick={() => submitAnswer(false)}>
          {index + 1 === total ? "Finish" : "Next"}
          <Icon name="arrow-right" className="size-4" />
        </Button>
      </div>
    </div>
  );
}
