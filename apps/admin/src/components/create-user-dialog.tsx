"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { downloadCredentialsCSV } from "@/lib/csv";
import { FormDialog } from "@/components/form-dialog";
import { LoadingButton } from "@/components/loading-button";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/react-query/query-keys";
import { useRolesQuery } from "@/query-hooks/roles.api";
import { useAssignRoleMutation } from "@/query-hooks/users.api";

const createUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    roleId: z.string().optional(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export function CreateUserDialog({
    open,
    onOpenChange,
    authRole,
    presetRoleName,
    title = "Create User",
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /**
     * The account's segment — sets better-auth's users.role field directly
     * (admin/tutor/user). Immutable after creation; there's no UI to change
     * it later. Segment alone decides dashboard fallback, nothing else —
     * actual capabilities come from the optional custom role below.
     */
    authRole: "admin" | "tutor" | "user";
    presetRoleName?: string;
    title?: string;
}) {
    const [isCreating, setIsCreating] = React.useState(false);
    const queryClient = useQueryClient();
    const assignRoleMutation = useAssignRoleMutation({ showToast: false });

    // Custom-role assignment is only meaningful for admin/tutor segments —
    // plain "user" accounts don't participate in the permission system.
    const showRolePicker = authRole !== "user";

    const { data: rawRoles } = useRolesQuery();
    const assignableRoles = React.useMemo(
        () => ((rawRoles?.data as { id: string; name: string; is_system?: boolean }[] | null | undefined) ?? [])
            .filter((r) => !r.is_system),
        [rawRoles],
    );

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<CreateUserFormData>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            roleId: "",
        },
    });

    React.useEffect(() => {
        if (!open) return;
        const preset = presetRoleName
            ? assignableRoles.find((r) => r.name === presetRoleName)?.id ?? ""
            : "";
        reset({ name: "", email: "", password: "", roleId: preset });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, presetRoleName, assignableRoles.length]);

    const onSubmit = async (data: CreateUserFormData) => {
        setIsCreating(true);
        try {
            const res = await authClient.admin.createUser({
                email: data.email,
                password: data.password,
                name: data.name,
                role: authRole,
            });

            if (res.error) {
                toast.error(res.error.message || "Failed to create user");
                return;
            }

            const createdUserId = res.data?.user?.id;
            const selectedRole = showRolePicker
                ? assignableRoles.find((r) => r.id === data.roleId)
                : undefined;

            if (showRolePicker && selectedRole && createdUserId) {
                await assignRoleMutation.execute({
                    id: createdUserId,
                    data: { role_id: selectedRole.id },
                });
            }

            const roleLabel = authRole;
            toast.success(`${roleLabel[0].toUpperCase()}${roleLabel.slice(1)} account created successfully! Credentials CSV downloaded.`);
            downloadCredentialsCSV(
                { name: data.name, email: data.email, password: data.password, role: roleLabel },
                typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
            );
            queryClient.invalidateQueries({ queryKey: queryKeys.users() });
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to create user");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description="Create a new account on the platform with assigned credentials."
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="create-user-name">Full Name</Label>
                    <Input
                        id="create-user-name"
                        placeholder="e.g. Jane Doe"
                        {...register("name")}
                    />
                    {errors.name && (
                        <p className="text-xs text-red-400">{errors.name.message}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="create-user-email">Email Address</Label>
                    <Input
                        id="create-user-email"
                        type="email"
                        placeholder="e.g. jane@example.com"
                        {...register("email")}
                    />
                    {errors.email && (
                        <p className="text-xs text-red-400">{errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="create-user-password">Initial Password</Label>
                    <Input
                        id="create-user-password"
                        type="password"
                        placeholder="••••••••"
                        {...register("password")}
                    />
                    {errors.password && (
                        <p className="text-xs text-red-400">{errors.password.message}</p>
                    )}
                </div>

                {showRolePicker && (
                    <div className="space-y-1.5">
                        <Label>Role</Label>
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
                                                <SelectItem key={role.id} value={role.id} className="capitalize">
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
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <LoadingButton
                        type="submit"
                        loading={isCreating}
                        className="w-full sm:w-auto"
                    >
                        {title}
                    </LoadingButton>
                </DialogFooter>
            </form>
        </FormDialog>
    );
}
