"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { UserGrowth } from "@/schema/dashboard.types";

const columnHelper = createColumnHelper<UserGrowth>();

export const userGrowthColumns = [
  columnHelper.accessor("month", {
    header: "Month",
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  columnHelper.accessor("count", {
    header: () => <div className="text-right">New Users</div>,
    cell: ({ getValue }) => (
      <div className="text-right tabular-nums">
        {(getValue() ?? 0).toLocaleString()}
      </div>
    ),
  }),
];
