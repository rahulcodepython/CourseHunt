"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { QuizQuestionDetail } from "@/schema/quiz.types";
import { Badge } from "@/components/ui/badge";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { RowActions, RowActionButton } from "@/components/row-actions";

const columnHelper = createColumnHelper<QuizQuestionDetail>();

const typeBadge: Record<string, { label: string; className: string }> = {
  single_choice: {
    label: "Single Choice",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400",
  },
  multi_choice: {
    label: "Multiple Choice",
    className: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-400",
  },
  arrange: {
    label: "Arrange",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  fill_blank: {
    label: "Fill Blank",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  },
};

function CorrectAnswers({ question }: { question: QuizQuestionDetail }) {
  if (question.question_type === "single_choice" || question.question_type === "multi_choice") {
    const correct = (question.options ?? []).filter((o) => o.is_correct);
    if (correct.length === 0) return <span className="text-muted-foreground">—</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {correct.map((o) => (
          <Badge key={o.id} variant="outline" className="font-normal">
            {o.option_text}
          </Badge>
        ))}
      </div>
    );
  }

  if (question.question_type === "arrange") {
    const items = [...(question.arrange_items ?? [])].sort(
      (a, b) => a.correct_order - b.correct_order,
    );
    return (
      <span className="text-xs text-muted-foreground">
        {items.map((item, i) => `${i + 1}. ${item.item_text}`).join("  ·  ")}
      </span>
    );
  }

  if (question.question_type === "fill_blank") {
    const answers = (question.fill_answers ?? []).map((a) => a.answer);
    if (answers.length === 0) return <span className="text-muted-foreground">—</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {answers.map((a, i) => (
          <Badge key={i} variant="outline" className="font-normal">
            {a}
          </Badge>
        ))}
      </div>
    );
  }

  return <span className="text-muted-foreground">—</span>;
}

export const getColumns = (
  onEdit: (question: QuizQuestionDetail) => void,
  onDelete: (question: QuizQuestionDetail) => void,
) => [
  columnHelper.accessor("question_text", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Question" />,
    cell: ({ getValue }) => (
      <span className="block max-w-md truncate font-medium">{getValue()}</span>
    ),
  }),
  columnHelper.accessor("question_type", {
    header: "Type",
    cell: ({ getValue }) => {
      const type = getValue();
      const entry = typeBadge[type];
      return <Badge className={entry?.className}>{entry?.label ?? type}</Badge>;
    },
  }),
  columnHelper.accessor("points", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Points" />,
    cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span>,
  }),
  columnHelper.display({
    id: "correct",
    header: "Correct Answers",
    cell: ({ row }) => <CorrectAnswers question={row.original} />,
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const question = row.original;
      return (
        <RowActions>
          <RowActionButton icon="pencil" label="Edit Question" onClick={() => onEdit(question)} />
          <RowActionButton
            icon="trash"
            label="Delete Question"
            onClick={() => onDelete(question)}
            destructive
          />
        </RowActions>
      );
    },
  }),
];
