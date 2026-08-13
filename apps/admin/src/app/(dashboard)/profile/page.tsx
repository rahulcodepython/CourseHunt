"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useUserProfileQuery, useCreateUserProfileMutation } from "@/query-hooks/users.api";
import { useUploadMediaMutation } from "@/query-hooks/upload.api";
import { useSessionStore } from "@/store/session.store";
import { useUpdateUserMutation } from "@/query-hooks/auth.api";

import { PageHeader } from "@/components/page-header";
import { Loading } from "@/components/loading";
import { LoadingButton } from "@/components/loading-button";
import { Icon } from "@/components/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1, "Display name is required"),
  headline: z.string().optional(),
  website: z.string().optional(),
  bio: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function AdminProfilePage() {
  const session = useSessionStore((s) => s.data);
  const isSessionLoading = useSessionStore((s) => s.isPending);
  const updateUser = useSessionStore((s) => s.updateUser);
  const user = session?.user;
  const userProfileQuery = useUserProfileQuery();
  const profile = userProfileQuery.data?.data;
  const updateUserMutation = useUpdateUserMutation();
  const { isPending: isSaving, mutateAsync: updateAdminProfile } = useCreateUserProfileMutation();
  const { isPending: isUploading, uploadMedia } = useUploadMediaMutation();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      headline: profile?.headline ?? "",
      website: profile?.website ?? "",
      bio: profile?.bio ?? "",
    },
  });

  React.useEffect(() => {
    reset({
      name: user?.name ?? "",
      headline: profile?.headline ?? "",
      website: profile?.website ?? "",
      bio: profile?.bio ?? "",
    });
  }, [user, profile, reset]);

  const initials = (user?.name ?? "A")
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isLoading = isSessionLoading || userProfileQuery.isLoading;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploadResponse = await uploadMedia({ file, fileType: "image" });
      if (uploadResponse?.data) {
        const url = uploadResponse.data.downloadUrl || "";
        updateUser({ image: url });
        toast.success("Profile picture updated");
      }
    } catch {
      toast.error("Failed to upload profile picture");
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const authRes = await updateUserMutation.mutateAsync({
        name: data.name,
        image: user?.image ?? null,
      });
      if (!authRes?.success) {
        toast.error("Failed to update profile name/avatar");
        return;
      }

      updateUser({ name: data.name, image: user?.image ?? undefined });

      await updateAdminProfile({
        headline: data.headline || null,
        bio: data.bio || null,
        website: data.website || null,
      });
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile changes");
    }
  };

  const handleCancel = () => {
    reset({
      name: user?.name ?? "",
      headline: profile?.headline ?? "",
      website: profile?.website ?? "",
      bio: profile?.bio ?? "",
    });
  };

  if (isLoading || !user) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          title="Profile"
          subtitle="Manage your personal information and profile picture"
        />
        <Loading />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Profile"
        subtitle="Manage your personal information and profile picture"
      />

      <div className="flex flex-col gap-6 md:flex-row">
        <Card className="w-full shrink-0 self-start md:w-80">
          <div className="h-24 rounded-t-xl bg-linear-to-r from-primary to-primary/60" />
          <CardContent className="flex flex-col items-center pb-6">
            <div className="group relative -mt-12">
              <button
                type="button"
                className="relative block rounded-full"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload avatar"
              >
                <Avatar className="size-24 rounded-full border-4 border-background">
                  {user.image ? <AvatarImage src={user.image} /> : null}
                  <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Icon name="pencil" className="size-5 text-white" />
                </div>
              </button>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <Loader2 className="size-5 animate-spin text-white" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <h2 className="text-lg font-semibold">{user.name}</h2>
              <Badge variant="default" className="capitalize">
                {(user as any).role ?? "admin"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
            {profile?.headline && (
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {profile.headline}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <p className="text-sm text-muted-foreground">
              Update your admin profile information
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-primary">
                  <Icon name="user" className="size-4" />
                  <h3 className="text-sm font-semibold">Basic Information</h3>
                </div>
                <Separator className="my-3" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      className="bg-muted/30"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-400">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Icon
                        name="mail"
                        className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        id="email"
                        value={user.email}
                        disabled
                        className="bg-muted/30 pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="headline">Headline</Label>
                    <Input
                      id="headline"
                      {...register("headline")}
                      placeholder="e.g. Platform Administrator"
                      className="bg-muted/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      {...register("website")}
                      placeholder="https://example.com"
                      className="bg-muted/30"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="bio">Biography</Label>
                    <Textarea
                      id="bio"
                      {...register("bio")}
                      placeholder="Tell us a little about yourself"
                      className="min-h-30 bg-muted/30"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <LoadingButton
                  type="submit"
                  loading={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  Update Profile
                </LoadingButton>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
