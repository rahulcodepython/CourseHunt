"use client";

import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { Coupon } from "@/schema/coupons.types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { RowActions, RowActionButton } from "@/components/row-actions";

const columnHelper = createColumnHelper<Coupon>();

function isExpired(coupon: Coupon): boolean {
    return !!coupon.expires_at && new Date(coupon.expires_at) < new Date();
}

export const getColumns = (
    onEdit: (coupon: Coupon) => void,
    onToggleActive: (coupon: Coupon) => void,
    onDelete: (coupon: Coupon) => void,
): ColumnDef<Coupon, any>[] => {
    const cols: ColumnDef<Coupon, any>[] = [
        columnHelper.accessor("code", {
            header: ({ column }) => <SortableColumnHeader column={column} label="Code" />,
            cell: ({ getValue }) => (
                <span className="font-mono text-sm font-bold tracking-wider">
                    {getValue()}
                </span>
            ),
        }),
        columnHelper.accessor("discount_percent", {
            header: ({ column }) => <SortableColumnHeader column={column} label="Discount" />,
            cell: ({ getValue }) => (
                <span className="font-medium text-emerald-500">{getValue()}% OFF</span>
            ),
        }),
        columnHelper.accessor("max_usage", {
            header: "Max Usage",
            cell: ({ getValue }) => {
                const val = getValue();
                return (
                    <span className="font-mono text-xs text-muted-foreground">
                        {val ? `${val} uses` : "Unlimited"}
                    </span>
                );
            },
        }),
        columnHelper.accessor("usage_count", {
            header: "Redeemed",
            cell: ({ getValue }) => (
                <span className="font-mono text-xs font-medium">{getValue()}</span>
            ),
        }),
        columnHelper.accessor("expires_at", {
            header: ({ column }) => <SortableColumnHeader column={column} label="Expires" />,
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
    ];

    cols.push(
        columnHelper.display({
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const coupon = row.original;
                return (
                    <RowActions>
                        <RowActionButton icon="pencil" label="Edit Coupon" onClick={() => onEdit(coupon)} />
                        <RowActionButton
                            icon={coupon.is_active ? "pause" : "play"}
                            label={coupon.is_active ? "Deactivate" : "Activate"}
                            onClick={() => onToggleActive(coupon)}
                        />
                        <RowActionButton icon="trash" label="Delete Coupon" onClick={() => onDelete(coupon)} destructive />
                    </RowActions>
                );
            },
        })
    );

    return cols;
};
