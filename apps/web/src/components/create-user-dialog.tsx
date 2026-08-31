"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import authClient from "@/lib/auth-client";
import { downloadCredentialsCSV } from "@/lib/csv";
import { FormDialog } from "@/components/form-dialog";
import { LoadingButton } from "@/components/loading-button";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { Label } from "@/components/ui/label";
import { CollapsibleCheckboxList } from "@/components/collapsible-checkbox-list";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/react-query/query-keys";
import { useRolesQuery } from "@/query-hooks/roles.api";
import { useAssignRoleMutation } from "@/query-hooks/users.api";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
    () =>
      (
        (rawRoles?.data as
          { id: string; name: string; is_system?: boolean }[] | null | undefined) ?? []
      ).filter((r) => !r.is_system),
    [rawRoles],
  );

  const [roleIds, setRoleIds] = React.useState<string[]>([]);
  const [roleError, setRoleError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  React.useEffect(() => {
    if (!open) return;
    const preset = presetRoleName
      ? assignableRoles.find((r) => r.name === presetRoleName)?.id
      : undefined;
    reset({ name: "", email: "", password: "" });
    setRoleIds(preset ? [preset] : []);
    setRoleError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, presetRoleName, assignableRoles.length]);

  const onSubmit = async (data: CreateUserFormData) => {
    if (showRolePicker && roleIds.length === 0) {
      setRoleError("Select at least one role.");
      return;
    }

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

      if (showRolePicker && roleIds.length > 0 && createdUserId) {
        await assignRoleMutation.execute({
          id: createdUserId,
          data: { role_ids: roleIds },
        });
      }

      const roleLabel = authRole;
      toast.success(
        `${roleLabel[0].toUpperCase()}${roleLabel.slice(1)} account created successfully! Credentials CSV downloaded.`,
      );
      downloadCredentialsCSV(
        { name: data.name, email: data.email, password: data.password, role: roleLabel },
        typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
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
          <Input id="create-user-name" placeholder="e.g. Jane Doe" {...register("name")} />
          {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="create-user-email">Email Address</Label>
          <Input
            id="create-user-email"
            type="email"
            placeholder="e.g. jane@example.com"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="create-user-password">Initial Password</Label>
          <PasswordInput
            id="create-user-password"
            placeholder="••••••••"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
        </div>

        {showRolePicker && (
          <CollapsibleCheckboxList
            title="Select Role"
            items={assignableRoles.map((role) => ({ id: role.id, label: role.name }))}
            selected={roleIds}
            onChange={(next) => {
              setRoleIds(next);
              if (next.length > 0) setRoleError(null);
            }}
            maxHeight="12rem"
            error={roleError ?? undefined}
            emptyMessage="No custom roles available"
          />
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton type="submit" loading={isCreating} className="w-full sm:w-auto">
            {title}
          </LoadingButton>
        </DialogFooter>
      </form>
    </FormDialog>
  );
}
