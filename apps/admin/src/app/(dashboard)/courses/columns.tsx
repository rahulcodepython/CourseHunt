"use client";

import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import type { Course } from "@/schema/courses.types";
import { formatINR } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

const columnHelper = createColumnHelper<Course>();

export const columns = [
  columnHelper.accessor("title", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Course</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ row }) => {
      const course = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            {course.image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={course.image_url}
                alt={course.title}
                className="size-full object-cover"
              />
            ) : (
              <Icon name="book" className="size-5 opacity-40" />
            )}
          </div>
          <div className="min-w-0">
            <p className="max-w-[280px] truncate font-medium">{course.title}</p>
            <p className="text-xs text-muted-foreground">
              {course.total_lectures} lectures
            </p>
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue();
      return (
        <Badge
          variant={status === "published" ? "default" : "secondary"}
          className="capitalize"
        >
          {status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value === "all" ? true : row.getValue(id) === value;
    },
  }),
  columnHelper.accessor("final_price", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Price</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="font-medium tabular-nums">{formatINR(getValue())}</span>
    ),
  }),
  columnHelper.accessor("rating_avg", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Rating</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ getValue }) => {
      const rating = getValue();
      return (
        <div className="flex items-center gap-1">
          <Icon
            name="star"
            className="size-4 fill-yellow-500 text-yellow-500"
          />
          <span className="tabular-nums">
            {rating ? rating.toFixed(1) : "—"}
          </span>
        </div>
      );
    },
  }),
  columnHelper.accessor("student_count", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Students</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon name="users" className="size-4" />
        <span className="tabular-nums">
          {(getValue() ?? 0).toLocaleString()}
        </span>
      </div>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const course = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            asChild
            aria-label="View chapters"
          >
            <Link href={`/courses/${course.id}/chapters`}>
              <Icon name="hierarchy" className="size-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            asChild
            aria-label="View analytics"
          >
            <Link href={`/courses/overview/${course.id}`}>
              <Icon name="chart-bar" className="size-4" />
            </Link>
          </Button>
        </div>
      );
    },
  }),
];
