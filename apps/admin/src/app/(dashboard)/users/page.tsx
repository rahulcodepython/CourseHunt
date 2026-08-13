"use client";

import * as React from "react";
import { downloadCredentialsCSV } from "@/lib/csv";
import { useUsersQuery } from "@/query-hooks/users.api";
import { useCreateUserMutation } from "@/query-hooks/auth.api";
import type { UserListResponse } from "@/schema/users.types";
import { PageHeader } from "@/components/page-header";
import { LoadingButton } from "@/components/loading-button";
import { DataTable } from "@/components/data-table";
import { FormDialog } from "@/components/form-dialog";
import { Icon } from "@/components/icon";
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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { columns } from "./columns";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "tutor"]),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createUserMutation = useCreateUserMutation();

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
      role: "admin",
    },
  });

  const onSubmit = async (data: CreateUserFormData) => {
    const res = await createUserMutation.execute({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
    });

    if (res?.success) {
      downloadCredentialsCSV(
        { name: data.name, email: data.email, password: data.password, role: data.role },
        window.location.origin,
      );
      reset();
      onOpenChange(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create User"
      description="Create an admin or tutor account. Credentials will be downloaded as a CSV file."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="cu-name">Name</Label>
          <Input id="cu-name" placeholder="Full name" {...register("name")} />
          {errors.name && (
            <p className="text-xs text-red-400">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cu-email">Email</Label>
          <Input
            id="cu-email"
            type="email"
            placeholder="user@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cu-password">Password</Label>
          <Input
            id="cu-password"
            type="text"
            placeholder="Temporary password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="tutor">Tutor</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
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
            loading={createUserMutation.isPending}
            className="w-full sm:w-auto"
          >
            Create User
          </LoadingButton>
        </DialogFooter>
      </form>
    </FormDialog>
  );
}

export default function UsersPage() {
  const { data: rawUsers, isLoading } = useUsersQuery();
  const [createOpen, setCreateOpen] = React.useState(false);

  const users: UserListResponse[] = rawUsers?.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle="Manage all platform users, create admin and tutor accounts"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Icon name="plus" className="size-4" />
            Create User
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Search users..."
        emptyIcon="users"
        emptyText={isLoading ? "Loading users..." : "No users found"}
      />

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
