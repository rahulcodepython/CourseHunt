"use client";

import { Icon } from "@/components/icon";
import LoadingButton from "@/components/loading-button";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@package/ui/card";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Badge } from "@package/ui/badge";
import { Textarea } from "@package/ui/textarea";
import { useUserProfileQuery, useCreateUserProfileMutation } from "@package/query-hooks/users.api";
import { useUploadMediaMutation } from "@package/query-hooks/upload.api";
import { authClient, useSession } from "@package/auth/auth-client";
import { useEnrollmentsQuery } from "@package/query-hooks/enrollments.api";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

interface UserProfileType {
	name: string;
	email: string;
	role: string;
	avatarUrl: string;
	headline: string;
	bio: string;
	website: string;
}

export default function Component() {
	const { data: session, isPending: isSessionLoading } = useSession();
	const userProfileQuery = useUserProfileQuery();
	const enrollmentsQuery = useEnrollmentsQuery();
	const { isPending: isSaving, mutateAsync: updateUserProfile } = useCreateUserProfileMutation();
	const { isPending: isUploading, uploadMedia } = useUploadMediaMutation();

	const [formData, setFormData] = useState<UserProfileType>({
		name: "",
		email: "",
		role: "student",
		avatarUrl: "",
		headline: "",
		bio: "",
		website: "",
	});

	const isLoading = isSessionLoading || userProfileQuery.isLoading || isUploading || isSaving;
	const fileRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (session?.user) {
			setFormData((prev) => ({
				...prev,
				name: session.user.name || "",
				email: session.user.email || "",
				role: (session.user as any).role || "student",
				avatarUrl: session.user.image || "",
			}));
		}
	}, [session]);

	useEffect(() => {
		const profile = userProfileQuery.data?.data;
		if (profile) {
			setFormData((prev) => ({
				...prev,
				headline: profile.headline || "",
				bio: profile.bio || "",
				website: profile.website || "",
			}));
		}
	}, [userProfileQuery.data]);

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			const uploadResponse = await uploadMedia({ file: selectedFile, fileType: "image" });
			if (uploadResponse?.data) {
				const url = uploadResponse.data.downloadUrl || "";
				setFormData((prev) => ({ ...prev, avatarUrl: url }));
				toast.success("Profile picture updated");
			}
		}
	};

	const handleSubmit = async () => {
		try {
			// Update basic user profile (name, image)
			const authRes = await authClient.updateUser({
				name: formData.name,
				image: formData.avatarUrl || undefined,
			});
			if (authRes.error) {
				toast.error(authRes.error.message || "Failed to update profile name/avatar");
				return;
			}

			// Update user profile metadata (headline, bio, website)
			await updateUserProfile({
				headline: formData.headline || null,
				bio: formData.bio || null,
				website: formData.website || null,
			});
		} catch (error: any) {
			toast.error(error.message || "Failed to save profile changes");
		}
	};

	const purchasedCount = enrollmentsQuery.data?.data?.total ?? 0;

	return (
		<div className="w-full pb-8 pt-4">
			<div className="max-w-5xl mx-auto space-y-6">
				<div className="flex flex-col md:flex-row gap-6">
					<div className="w-full md:w-80 space-y-6">
						<Card className="overflow-hidden border-none shadow-md mt-0">
							<div className="h-24 bg-linear-to-r from-primary to-primary/60" />
							<CardContent className="pt-0 -mt-10 flex flex-col items-center">
								<div className="relative group">
									<div
										className="h-24 w-24 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden cursor-pointer relative"
										onClick={() => fileRef.current?.click()}
									>
										{formData.avatarUrl ? (
											<Image src={formData.avatarUrl} alt="Profile" fill className="object-cover" />
										) : (
											<span className="text-3xl font-bold text-muted-foreground uppercase">
												{formData.name ? formData.name.charAt(0) : "U"}
											</span>
										)}
										<div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
											<Icon name="IconUpload" className="text-white w-6 h-6" />
										</div>
									</div>
									<input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
								</div>
								<h2 className="mt-3 text-xl font-bold">{formData.name || "Your Name"}</h2>
								<Badge variant="secondary" className="mt-1 capitalize">{formData.role}</Badge>
								<div className="w-full grid grid-cols-1 gap-4 mt-8 pt-6 border-t">
									<div className="text-center">
										<div className="text-xl font-bold">{purchasedCount}</div>
										<div className="text-[10px] uppercase tracking-wider text-muted-foreground">Enrolled Courses</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card className="flex-1 border-none shadow-lg">
						<CardHeader className="border-b bg-muted/20">
							<CardTitle className="text-2xl font-bold">Edit Profile</CardTitle>
							<CardDescription>Update your personal information and account settings</CardDescription>
						</CardHeader>
						<CardContent className="pt-6">
							<div className="space-y-8">
								<div className="space-y-4">
									<div className="flex items-center gap-2 text-primary font-semibold">
										<Icon name="IconUser" className="w-5 h-5" />
										<h3>Basic Information</h3>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="space-y-2">
											<Label htmlFor="name">Display Name</Label>
											<Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="Enter your display name" className="bg-muted/30 focus-visible:ring-primary" />
										</div>
										<div className="space-y-2">
											<Label htmlFor="email">Email Address</Label>
											<div className="relative">
												<Icon name="IconMail" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
												<Input id="email" type="email" value={formData.email} disabled className="pl-10 opacity-70 cursor-not-allowed bg-muted" />
											</div>
										</div>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="space-y-2">
											<Label htmlFor="headline">Headline</Label>
											<Input id="headline" value={formData.headline} onChange={(e) => handleInputChange("headline", e.target.value)} placeholder="e.g., Web Developer / Student" className="bg-muted/30 focus-visible:ring-primary" />
										</div>
										<div className="space-y-2">
											<Label htmlFor="website">Website / Portfolio</Label>
											<Input id="website" value={formData.website} onChange={(e) => handleInputChange("website", e.target.value)} placeholder="e.g., https://johndoe.com" className="bg-muted/30 focus-visible:ring-primary" />
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="bio">Biography</Label>
										<Textarea id="bio" value={formData.bio} onChange={(e) => handleInputChange("bio", e.target.value)} placeholder="Tell us about yourself..." className="bg-muted/30 min-h-[120px] focus-visible:ring-primary" />
									</div>
								</div>

								<div className="flex flex-col sm:flex-row gap-4 pt-6">
									<LoadingButton isLoading={isLoading} title="Saving Changes..." className="flex-1">
										<Button type="submit" className="w-full h-11 text-white bg-green-600 hover:bg-green-700 font-bold" onClick={handleSubmit}>
											<Icon name="IconDeviceFloppy" className="w-5 h-5 mr-2" />
											Update Profile
										</Button>
									</LoadingButton>
									<Button type="button" variant="outline" className="flex-1 h-11">Cancel</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
