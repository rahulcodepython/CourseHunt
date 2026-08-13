"use client";

import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import type { Chapter } from "@/schema/chapters.types";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

const columnHelper = createColumnHelper<Chapter>();

export const getColumns = (courseId: string) => [
  columnHelper.accessor("chapter_no", {
    header: "#",
    cell: ({ getValue }) => (
      <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {getValue()}
      </div>
    ),
  }),
  columnHelper.accessor("title", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Title</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ getValue }) => <span className="font-semibold">{getValue()}</span>,
  }),
  columnHelper.accessor("total_lectures", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Lessons</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue()} lessons</span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const chapter = row.original;
      return (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/courses/${courseId}/chapters/${chapter.id}/lessons`}>
              <span>View Lessons</span>
              <Icon name="chevron-right" className="ml-1 size-3.5" />
            </Link>
          </Button>
        </div>
      );
    },
  }),
];
