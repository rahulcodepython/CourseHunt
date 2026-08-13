"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { Coupon } from "@/schema/coupons.types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

const columnHelper = createColumnHelper<Coupon>();

function isExpired(coupon: Coupon): boolean {
  return !!coupon.expires_at && new Date(coupon.expires_at) < new Date();
}

export const getColumns = (
  onEdit: (coupon: Coupon) => void,
  onToggleActive: (coupon: Coupon) => void,
  onDelete: (coupon: Coupon) => void,
) => [
  columnHelper.accessor("code", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Code</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="font-mono text-sm font-bold tracking-wider">
        {getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("discount_percent", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Discount</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="font-semibold text-primary">{getValue()}% OFF</span>
    ),
  }),
  columnHelper.accessor("usage_count", {
    header: "Usage",
    cell: ({ row }) => {
      const coupon = row.original;
      return (
        <span className="tabular-nums">
          {coupon.max_usage
            ? `${coupon.usage_count ?? 0} / ${coupon.max_usage}`
            : "∞"}
        </span>
      );
    },
  }),
  columnHelper.accessor("expires_at", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Expires</span>
        <Icon name="arrow-up-down" className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ row, getValue }) => {
      const expired = isExpired(row.original);
      const val = getValue();
      if (!val) return <span className="text-muted-foreground">—</span>;
      return (
        <span className={expired ? "text-destructive" : "text-muted-foreground"}>
          {formatDate(val)}
        </span>
      );
    },
  }),
  columnHelper.accessor("is_active", {
    header: "Status",
    cell: ({ row }) => {
      const coupon = row.original;
      const expired = isExpired(coupon);
      if (expired) return <Badge variant="destructive">Expired</Badge>;
      if (coupon.is_active) {
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
          >
            Active
          </Badge>
        );
      }
      return <Badge variant="outline">Inactive</Badge>;
    },
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const coupon = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onEdit(coupon)}
            aria-label="Edit coupon"
          >
            <Icon name="pencil" className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onToggleActive(coupon)}
            aria-label={coupon.is_active ? "Deactivate coupon" : "Activate coupon"}
          >
            <Icon
              name={coupon.is_active ? "pause" : "play"}
              className="size-4"
            />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(coupon)}
            aria-label="Delete coupon"
          >
            <Icon name="trash" className="size-4" />
          </Button>
        </div>
      );
    },
  }),
];
