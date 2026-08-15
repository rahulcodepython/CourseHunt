"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { UserListResponse } from "@/schema/users.types";
import { formatDate } from "@/lib/format";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { RowActions, RowActionButton } from "@/components/row-actions";
import { RolesCell } from "@/components/roles-cell";
import UserCell from "@/components/user-cell";

const columnHelper = createColumnHelper<UserListResponse>();

export const getColumns = (onManage: (user: UserListResponse) => void) => [
    columnHelper.accessor("name", {
        header: ({ column }) => <SortableColumnHeader column={column} label="Name" />,
        cell: ({ row }) => <UserCell name={row.original.name} image={row.original.image} />,
    }),
    columnHelper.accessor("email", {
        header: "Email",
        cell: ({ getValue }) => (
            <span className="text-muted-foreground">{getValue()}</span>
        ),
    }),
    columnHelper.accessor("roles", {
        header: "Roles",
        cell: ({ getValue, row }) => (
            <RolesCell
                roles={getValue()}
                fallbackRole={row.original.role ?? "admin"}
                variantFor={(name) => (name === "admin" ? "default" : "secondary")}
            />
        ),
    }),
    columnHelper.accessor("createdAt", {
        header: ({ column }) => <SortableColumnHeader column={column} label="Joined" />,
        cell: ({ getValue }) => (
            <span className="text-muted-foreground">{formatDate(getValue() || "")}</span>
        ),
    }),
    columnHelper.display({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
            <RowActions>
                <RowActionButton icon="users" label="Manage Roles" onClick={() => onManage(row.original)} />
            </RowActions>
        ),
    }),
];
