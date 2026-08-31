"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useTutorProfileQuery, useCreateTutorProfileMutation } from "@/query-hooks/users.api";
import { useUploadMediaMutation } from "@/query-hooks/upload.api";
import authClient from "@/lib/auth-client";
import { useSessionStore } from "@/store/session.store";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";

import { PageHeader } from "@/components/page-header";
import { Loading } from "@/components/loading";
import { LoadingButton } from "@/components/loading-button";
import { Icon } from "@/components/icon";
import UserAvatar from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function TutorProfilePage() {
  const session = useSessionStore((s) => s.data);
  const isSessionLoading = useSessionStore((s) => s.isPending);
  const updateUser = useSessionStore((s) => s.updateUser);
  const user = session?.user;

  useSetBreadcrumbs([{ label: "Tutor Profile" }]);

  const profileQuery = useTutorProfileQuery();
  const profile = profileQuery.data?.data;
  const { isPending: isSaving, mutateAsync: updateTutorProfile } = useCreateTutorProfileMutation();
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

  const isLoading = isSessionLoading || profileQuery.isLoading;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploadResponse = await uploadMedia({ file, fileType: "image" });
      if (uploadResponse?.data) {
        const url = uploadResponse.data.downloadUrl || "";
        const res = await authClient.updateUser({ image: url });
        if (!res.error) {
          updateUser({ image: url });
        }
        toast.success("Profile picture updated");
      }
    } catch {
      toast.error("Failed to upload profile picture");
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const authRes = await authClient.updateUser({
        name: data.name,
        image: user?.image ?? null,
      });
      if (authRes.error) {
        toast.error("Failed to update profile name/avatar");
        return;
      }

      updateUser({ name: data.name, image: user?.image ?? undefined });

      await updateTutorProfile({
        headline: data.headline || null,
        bio: data.bio || null,
        website: data.website || null,
      });
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
          title="Tutor Profile"
          subtitle="Manage your personal information and profile picture"
        />
        <Loading />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Tutor Profile"
        subtitle="Manage your personal information and public teaching profile"
      />

      <div className="flex flex-col gap-6 md:flex-row">
        <Card className="w-full shrink-0 self-start md:w-80 py-0">
          <div className="h-24 rounded-t-xl bg-linear-to-r from-primary to-primary/60" />
          <CardContent className="flex flex-col items-center p-6 pt-0">
            <div className="group relative -mt-12">
              <button
                type="button"
                className="relative block rounded-full"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload avatar"
              >
                <UserAvatar
                  name={user.name}
                  image={user.image}
                  className="size-24 rounded-full border-4 border-background"
                  fallbackClassName="text-2xl font-bold"
                />
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
                {(user as any).role ?? "tutor"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
            {profile?.headline ? (
              <p className="mt-2 text-center text-sm text-muted-foreground">{profile.headline}</p>
            ) : null}
            {(profile?.total_students ?? 0) > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {profile?.total_students ?? 0} students ·{" "}
                {profile?.rating_avg ? `${profile.rating_avg.toFixed(1)} rating` : "no ratings yet"}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <p className="text-sm text-muted-foreground">Update your tutor profile information</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-primary mb-6">
                  <Icon name="user" className="size-4" />
                  <h3 className="text-sm font-semibold">Basic Information</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Display Name</Label>
                    <Input id="name" {...register("name")} className="bg-muted/30" />
                    {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Icon
                        name="mail"
                        className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input id="email" value={user.email} disabled className="bg-muted/30 pl-9" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="headline">Headline</Label>
                    <Input
                      id="headline"
                      {...register("headline")}
                      placeholder="e.g. Full-stack Developer & Educator"
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
                      placeholder="Tell students a little about yourself and your teaching"
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
