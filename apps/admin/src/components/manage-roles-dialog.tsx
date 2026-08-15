"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { FormDialog } from "@/components/form-dialog";
import { LoadingButton } from "@/components/loading-button";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icon";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRolesQuery } from "@/query-hooks/roles.api";
import { useAssignRoleMutation, useRevokeRoleMutation } from "@/query-hooks/users.api";
import type { Role } from "@/schema/roles.types";

const assignRoleSchema = z.object({
    roleId: z.string().min(1, "Please select a role"),
});

type AssignRoleFormData = z.infer<typeof assignRoleSchema>;

/**
 * Assigns/revokes custom (non-system) roles for a single user — the
 * modular entitlement layer on top of the account's fixed admin/tutor/user
 * segment. Reusable across /admins and /tutors (any page that manages
 * accounts whose capabilities come from custom roles).
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

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AssignRoleFormData>({
        resolver: zodResolver(assignRoleSchema),
        defaultValues: {
            roleId: "",
        },
    });

    const handleAssign = async (data: AssignRoleFormData) => {
        if (!userId) return;
        const res = await assignRoleMutation.execute({
            id: userId,
            data: { role_id: data.roleId },
        });
        if (res?.success) {
            reset({ roleId: "" });
        }
    };

    const handleRevoke = async (roleId: string) => {
        if (!userId) return;
        await revokeRoleMutation.execute({
            id: userId,
            data: { role_id: roleId },
        });
    };

    const isPending = assignRoleMutation.isPending || revokeRoleMutation.isPending;

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={`Manage Roles · ${userName ?? ""}`}
            description="Assign or revoke custom roles for this account."
        >
            <div className="space-y-4">
                <form onSubmit={handleSubmit(handleAssign)} className="flex items-end gap-2">
                    <div className="flex-1 space-y-1.5">
                        <Label>Custom Role</Label>
                        <Controller
                            control={control}
                            name="roleId"
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {assignableRoles.length > 0 ? (
                                            assignableRoles.map((role) => (
                                                <SelectItem key={role.id} value={role.id}>
                                                    {role.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-3 text-center text-xs text-muted-foreground">
                                                No custom roles available
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.roleId && (
                            <p className="text-xs text-red-400">{errors.roleId.message}</p>
                        )}
                    </div>
                    <LoadingButton
                        type="submit"
                        loading={isPending}
                    >
                        Assign
                    </LoadingButton>
                </form>

                <div className="space-y-2">
                    <p className="text-sm font-medium">Current Roles</p>
                    {
                        currentRoles.length > 0 ? currentRoles.map((role) => <div
                            key={role.id ?? role.name}
                            className="flex items-center justify-between rounded-lg border px-3 py-2"
                        >
                            <Badge variant="secondary" className="capitalize">
                                {role.name}
                            </Badge>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRevoke(role.id ?? role.name)}
                                disabled={isPending}
                                aria-label={`Revoke ${role.name}`}
                            >
                                <Icon name="x" className="size-4" />
                            </Button>
                        </div>
                        )
                            : <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                                No custom roles assigned
                            </p>
                    }
                </div>
            </div>
            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Close
                </Button>
            </DialogFooter>
        </FormDialog>
    );
}
