"use client";

import * as React from "react";

import { PageHeader } from "@package/components/page-header";
import { LoadingSpinner } from "@package/components/loading";
import LoadingButton from "@package/components/loading-button";
import { Icon } from "@package/components/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@package/ui/avatar";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Separator } from "@package/ui/separator";
import { Textarea } from "@package/ui/textarea";
import { useUserProfileQuery, useCreateUserProfileMutation } from "@package/query-hooks/users.api";
import { useUploadMediaMutation } from "@package/query-hooks/upload.api";
import { useSessionStore } from "@package/store/session.store";
import { useUpdateUserMutation } from "@package/query-hooks/auth.api";
import { toast } from "sonner";

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

  const [name, setName] = React.useState(user?.name ?? "");
  const [headline, setHeadline] = React.useState(profile?.headline ?? "");
  const [website, setWebsite] = React.useState(profile?.website ?? "");
  const [bio, setBio] = React.useState(profile?.bio ?? "");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (profile) {
      setHeadline(profile.headline ?? "");
      setWebsite(profile.website ?? "");
      setBio(profile.bio ?? "");
    }
  }, [profile]);

  React.useEffect(() => {
    if (user) {
      setName(user.name ?? "");
    }
  }, [user]);

  const initials = (user?.name ?? "A")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isLoading = isSessionLoading || userProfileQuery.isLoading || isUploading || isSaving;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadResponse = await uploadMedia({ file, fileType: "image" });
    if (uploadResponse?.data) {
      const url = uploadResponse.data.downloadUrl || "";
      updateUser({ image: url });
      toast.success("Profile picture updated");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const authRes = await updateUserMutation.mutateAsync({
        name,
        image: user?.image ?? null,
      });
      if (!authRes?.success) {
        toast.error("Failed to update profile name/avatar");
        return;
      }

      updateUser({ name, image: user?.image ?? null });

      await updateAdminProfile({
        headline: headline || null,
        bio: bio || null,
        website: website || null,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile changes");
    }
  };

  const handleCancel = () => {
    if (user) setName(user.name ?? "");
    if (profile) {
      setHeadline(profile.headline ?? "");
      setWebsite(profile.website ?? "");
      setBio(profile.bio ?? "");
    }
  };

  if (isLoading || !user) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          title="Profile"
          subtitle="Manage your personal information and profile picture"
        />
        <LoadingSpinner />
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
                  <Icon name="IconPencil" className="size-5 text-white" />
                </div>
              </button>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <Icon name="IconLoader2" className="size-5 animate-spin text-white" />
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
            {headline && (
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {headline}
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-primary">
                  <Icon name="IconUser" className="size-4" />
                  <h3 className="text-sm font-semibold">Basic Information</h3>
                </div>
                <Separator className="my-3" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-muted/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Icon
                        name="IconMail"
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
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. Platform Administrator"
                      className="bg-muted/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="bg-muted/30"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="bio">Biography</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us a little about yourself"
                      className="min-h-[120px] bg-muted/30"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <LoadingButton isLoading={isSaving} className="bg-green-600 hover:bg-green-700">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Update Profile
                  </Button>
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
