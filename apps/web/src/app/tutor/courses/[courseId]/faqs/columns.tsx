"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { Faq } from "@/schema/faqs.types";
import { RowActions, RowActionButton } from "@/components/row-actions";

const columnHelper = createColumnHelper<Faq>();

export const getColumns = (onEdit: (faq: Faq) => void, onDelete: (faq: Faq) => void) => [
  columnHelper.accessor("question", {
    header: "Question",
    cell: ({ getValue }) => <span className="max-w-md truncate font-medium">{getValue()}</span>,
  }),
  columnHelper.accessor("answer", {
    header: "Answer",
    cell: ({ getValue }) => (
      <p className="line-clamp-2 max-w-md text-muted-foreground">{getValue()}</p>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const faq = row.original;
      return (
        <RowActions>
          <RowActionButton icon="pencil" label="Edit FAQ" onClick={() => onEdit(faq)} />
          <RowActionButton
            icon="trash"
            label="Delete FAQ"
            onClick={() => onDelete(faq)}
            destructive
          />
        </RowActions>
      );
    },
  }),
];
