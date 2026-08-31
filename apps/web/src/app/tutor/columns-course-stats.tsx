"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { TutorCourseStat } from "@/schema/dashboard.types";
import { Icon } from "@/components/icon";

const columnHelper = createColumnHelper<TutorCourseStat>();

export const courseStatsColumns = [
  columnHelper.display({
    id: "rank",
    header: () => <div className="text-right">#</div>,
    cell: ({ row }) => (
      <div className="text-right text-xs text-muted-foreground">{row.index + 1}</div>
    ),
  }),
  columnHelper.accessor("title", {
    header: "Course",
    cell: ({ getValue }) => <span className="max-w-70 truncate font-medium">{getValue()}</span>,
  }),
  columnHelper.accessor("students", {
    header: () => <div className="text-right">Students</div>,
    cell: ({ getValue }) => (
      <div className="text-right tabular-nums">{(getValue() ?? 0).toLocaleString()}</div>
    ),
  }),
  columnHelper.display({
    id: "student_icon",
    header: () => <div className="text-right">Share</div>,
    cell: ({ row, table }) => {
      const total = table
        .getPrePaginationRowModel()
        .rows.reduce((acc, r) => acc + (r.original.students ?? 0), 0);
      const count = row.original.students ?? 0;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return (
        <div className="flex items-center justify-end gap-1.5">
          <span className="font-mono text-xs text-muted-foreground">{pct}%</span>
          <Icon name="users" className="size-3.5 text-muted-foreground" />
        </div>
      );
    },
  }),
];
