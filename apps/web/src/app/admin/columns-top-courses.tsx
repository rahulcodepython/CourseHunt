"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { AdminTopCourse } from "@/schema/dashboard.types";
import { formatINR } from "@/lib/format";

const columnHelper = createColumnHelper<AdminTopCourse>();

export const topCoursesColumns = [
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
  columnHelper.accessor("revenue", {
    header: () => <div className="text-right">Revenue</div>,
    cell: ({ getValue }) => (
      <div className="text-right font-medium tabular-nums">{formatINR(getValue() || 0)}</div>
    ),
  }),
];
