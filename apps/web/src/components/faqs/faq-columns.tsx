"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { Faq } from "@/schema/faqs.types";
import { RowActions, RowActionButton } from "@/components/table/row-actions";
import type { TableColumn } from "@/components/table/data-table";

const columnHelper = createColumnHelper<Faq>();

export interface FaqColumnOptions {
  onEdit?: (faq: Faq) => void;
  onDelete?: (faq: Faq) => void;
}

export const getFaqColumns = (options?: FaqColumnOptions): TableColumn<Faq>[] => {
  const cols: TableColumn<Faq>[] = [
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
  ];

  if (options?.onEdit || options?.onDelete) {
    cols.push(
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const faq = row.original;
          return (
            <RowActions>
              {options.onEdit && (
                <RowActionButton icon="pencil" label="Edit FAQ" onClick={() => options.onEdit?.(faq)} />
              )}
              {options.onDelete && (
                <RowActionButton
                  icon="trash"
                  label="Delete FAQ"
                  onClick={() => options.onDelete?.(faq)}
                  destructive
                />
              )}
            </RowActions>
          );
        },
      }),
    );
  }

  return cols;
};
