"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { Faq } from "@/schema/faqs.types";

const columnHelper = createColumnHelper<Faq>();

export const getColumns = () => [
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
