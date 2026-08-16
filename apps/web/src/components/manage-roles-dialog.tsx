"use client";

import * as React from "react";

import { FormDialog } from "@/components/form-dialog";
import { LoadingButton } from "@/components/loading-button";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { CollapsibleCheckboxList } from "@/components/collapsible-checkbox-list";
import { useRolesQuery } from "@/query-hooks/roles.api";
import { useAssignRoleMutation, useRevokeRoleMutation } from "@/query-hooks/users.api";
import type { Role } from "@/schema/roles.types";

/**
 * Assigns/revokes custom (non-system) roles for a single user — the
 * modular entitlement layer on top of the account's fixed admin/tutor/user
 * segment. Reusable across /admins and /tutors (any page that manages
 * accounts whose capabilities come from custom roles). A user may hold more
 * than one role, so selection is a multi-checkbox list, not a dropdown.
 */
export function ManageRolesDialog({
    userId,
    userName,
    currentRoles,
    open,
    onOpenChange,
}: {
    userId: string | null;
    userName?: string;
    currentRoles: { id?: string; name: string }[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data: rawRoles } = useRolesQuery();
    const assignRoleMutation = useAssignRoleMutation();
    const revokeRoleMutation = useRevokeRoleMutation();

    const roles: Role[] = rawRoles?.data ?? [];
    const assignableRoles = roles.filter((r) => !r.is_system);

    const initialSelected = React.useMemo(
        () =>
            currentRoles
                .map((r) => r.id)
                .filter((id): id is string => Boolean(id) && assignableRoles.some((r) => r.id === id)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [currentRoles, assignableRoles.length],
    );

    const [selected, setSelected] = React.useState<string[]>(initialSelected);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (open) {
            setSelected(initialSelected);
            setError(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, userId]);

    const isPending = assignRoleMutation.isPending || revokeRoleMutation.isPending;

    const handleSave = async () => {
        if (!userId) return;
        if (selected.length === 0) {
            setError("Select at least one role.");
            return;
        }

        const toAssign = selected.filter((id) => !initialSelected.includes(id));
        const toRevoke = initialSelected.filter((id) => !selected.includes(id));

        if (toAssign.length === 0 && toRevoke.length === 0) {
            onOpenChange(false);
            return;
        }

        const [assignRes, revokeRes] = await Promise.all([
            toAssign.length > 0 ? assignRoleMutation.execute({ id: userId, data: { role_ids: toAssign } }) : null,
            toRevoke.length > 0 ? revokeRoleMutation.execute({ id: userId, data: { role_ids: toRevoke } }) : null,
        ]);

        const assignOk = toAssign.length === 0 || assignRes?.success;
        const revokeOk = toRevoke.length === 0 || revokeRes?.success;
        if (assignOk && revokeOk) {
            onOpenChange(false);
        }
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={`Manage Roles · ${userName ?? ""}`}
            description="Select the custom roles this account should hold."
        >
            <CollapsibleCheckboxList
                title="Select Role"
                items={assignableRoles.map((role) => ({ id: role.id, label: role.name }))}
                selected={selected}
                onChange={(next) => {
                    setSelected(next);
                    if (next.length > 0) setError(null);
                }}
                maxHeight="14rem"
                error={error ?? undefined}
                emptyMessage="No custom roles available"
            />
            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                    Cancel
                </Button>
                <LoadingButton onClick={handleSave} loading={isPending}>
                    Save
                </LoadingButton>
            </DialogFooter>
        </FormDialog>
    );
}
