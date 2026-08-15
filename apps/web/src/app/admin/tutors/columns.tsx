"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { AdminProfileItem, UserListResponse } from "@/schema/users.types";
import { Icon } from "@/components/icon";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { RowActions, RowActionButton } from "@/components/row-actions";
import { toast } from "sonner";
import UserCell from "@/components/user-cell";

// /tutors sources rows from useUsersQuery (UserListResponse), not the
// profiles endpoint — headline/total_students/rating_avg aren't actually
// present on that response today, but the columns below already tolerate
// their absence (fallback dashes), so this widened type just adds what the
// "Manage Roles" action needs (id, roles) without touching that pre-existing
// display gap.
type TutorRow = UserListResponse & Partial<Pick<AdminProfileItem, "headline" | "total_students" | "rating_avg">>;

const columnHelper = createColumnHelper<TutorRow>();

export const getColumns = (onManage: (tutor: TutorRow) => void) => [
  columnHelper.accessor("name", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Tutor" />,
    cell: ({ row }) => <UserCell name={row.original.name} />,
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue()}</span>
    ),
  }),
  columnHelper.accessor("headline", {
    header: "Headline",
    cell: ({ getValue }) => (
      <span className="block max-w-48 truncate text-muted-foreground">
        {getValue() || "—"}
      </span>
    ),
  }),
  columnHelper.accessor("total_students", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Students" />,
    cell: ({ getValue }) => (
      <span className="tabular-nums">
        {(getValue() ?? 0).toLocaleString()}
      </span>
    ),
  }),
  columnHelper.accessor("rating_avg", {
    header: ({ column }) => <SortableColumnHeader column={column} label="Rating" />,
    cell: ({ getValue }) => {
      const rating = getValue();
      return (
        <div className="flex items-center gap-1">
          <Icon name="star" className="size-4 fill-yellow-500 text-yellow-500" />
          <span className="font-medium tabular-nums">
            {rating ? rating.toFixed(1) : "—"}
          </span>
        </div>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const tutor = row.original;
      return (
        <RowActions>
          <RowActionButton
            icon="users"
            label="Manage Roles"
            onClick={() => onManage(tutor)}
          />
          <RowActionButton
            icon="ban"
            label="Ban Tutor"
            onClick={() => toast.error(`${tutor.name} has been banned`)}
            destructive
          />
        </RowActions>
      );
    },
  }),
];
