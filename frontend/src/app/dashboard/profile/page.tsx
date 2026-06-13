"use client"

import FileUpload from "@/components/file-upload"
import LoadingButton from "@/components/loading-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useUpdateUserMutation, useUserDetailsQuery } from "@/hooks/api"
import { UserProfileType } from "@/types/user.type"
import { IconDeviceFloppy, IconUser, IconMapPin, IconPhone, IconMail, IconAward, IconBook, IconCircleCheck } from "@tabler/icons-react";
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function Component() {
    const [formData, setFormData] = useState<UserProfileType>({
        _id: "",
        name: "",
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        city: "",
        country: "",
        zip: "",
        email: "",
        role: "student",
        avatar: {
            url: "",
            fileType: "image",
        },
        createdAt: "",
        updatedAt: "",
        purchasedCourses: 0,
        completedCourses: 0,
    })

    const userDetailsQuery = useUserDetailsQuery()
    const updateUserMutation = useUpdateUserMutation()
    const isLoading = userDetailsQuery.isLoading || updateUserMutation.isPending

    useEffect(() => {
        const userDetails = userDetailsQuery.data

        if (userDetails) {
            setFormData({
                _id: userDetails._id,
                name: userDetails.name || "",
                firstName: userDetails.firstName || "",
                lastName: userDetails.lastName || "",
                phone: userDetails.phone || "",
                address: userDetails.address || "",
                city: userDetails.city || "",
                country: userDetails.country || "",
                zip: userDetails.zip || "",
                email: userDetails.email || "",
                role: userDetails.role as any,
                avatar: {
                    url: userDetails.avatar?.url || "",
                    fileType: "image",
                },
                createdAt: userDetails.createdAt,
                updatedAt: userDetails.updatedAt,
                purchasedCourses: userDetails.purchasedCourses,
                completedCourses: userDetails.completedCourses,
            })
        }
    }, [userDetailsQuery.data])

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleAvatarChange = (field: string, url: string, fileType: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: {
                url,
                fileType,
            },
        }))
    }

    const handleSubmit = async () => {
        const responseData = await updateUserMutation.updateUser(formData)

        if (responseData) {
            toast.success("Profile updated successfully")
            setFormData((prev) => ({
                ...prev,
                name: responseData.user.name || prev.name,
            }))
        }
    }

    return (
        <div className="min-h-screen w-full py-8 px-4">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Info */}
                    <div className="w-full md:w-80 space-y-6">
                        <Card className="overflow-hidden border-none shadow-md">
                            <div className="h-24 bg-gradient-to-r from-primary to-primary/60" />
                            <CardContent className="pt-0 -mt-12 flex flex-col items-center">
                                <div className="p-1 bg-background rounded-full">
                                    <FileUpload
                                        label=""
                                        onChange={handleAvatarChange}
                                        field="avatar"
                                        value={formData.avatar}
                                        accept="image"
                                        className="h-24 w-24 rounded-full"
                                    />
                                </div>
                                <h2 className="mt-4 text-xl font-bold">{formData.name || 'Your Name'}</h2>
                                <Badge variant="secondary" className="mt-1 capitalize">{formData.role}</Badge>
                                
                                <div className="w-full grid grid-cols-2 gap-4 mt-8 pt-6 border-t">
                                    <div className="text-center">
                                        <div className="text-xl font-bold">{formData.purchasedCourses}</div>
                                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Courses</div>
                                    </div>
                                    <div className="text-center border-l">
                                        <div className="text-xl font-bold">{formData.completedCourses}</div>
                                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Finished</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <IconAward className="w-4 h-4 text-primary" />
                                    Badges
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Early Adopter</Badge>
                                <Badge variant="outline" className="bg-green-500/5 text-green-600 border-green-500/20">Fast Learner</Badge>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Form */}
                    <Card className="flex-1 border-none shadow-lg">
                        <CardHeader className="border-b bg-muted/20">
                            <CardTitle className="text-2xl font-bold">Edit Profile</CardTitle>
                            <CardDescription>Update your personal information and account settings</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <div className="space-y-10">
                                {/* Basic Information */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-primary font-semibold">
                                        <IconUser className="w-5 h-5" />
                                        <h3>Basic Information</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Display Name</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => handleInputChange("name", e.target.value)}
                                                placeholder="Enter your display name"
                                                className="bg-muted/30 focus-visible:ring-primary"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <div className="relative">
                                                <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                                    placeholder="Enter your email"
                                                    disabled
                                                    className="pl-10 opacity-70 cursor-not-allowed bg-muted"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input
                                                id="firstName"
                                                value={formData.firstName}
                                                onChange={(e) => handleInputChange("firstName", e.target.value)}
                                                placeholder="Enter your first name"
                                                className="bg-muted/30 focus-visible:ring-primary"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                value={formData.lastName}
                                                onChange={(e) => handleInputChange("lastName", e.target.value)}
                                                placeholder="Enter your last name"
                                                className="bg-muted/30 focus-visible:ring-primary"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">IconPhone Number</Label>
                                        <div className="relative">
                                            <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange("phone", e.target.value)}
                                                placeholder="Enter your phone number"
                                                className="pl-10 bg-muted/30 focus-visible:ring-primary"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Address Information */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-primary font-semibold">
                                        <IconMapPin className="w-5 h-5" />
                                        <h3>Address Information</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Street Address</Label>
                                        <Input
                                            id="address"
                                            value={formData.address}
                                            onChange={(e) => handleInputChange("address", e.target.value)}
                                            placeholder="Enter your street address"
                                            className="bg-muted/30 focus-visible:ring-primary"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                value={formData.city}
                                                onChange={(e) => handleInputChange("city", e.target.value)}
                                                placeholder="Enter your city"
                                                className="bg-muted/30 focus-visible:ring-primary"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="country">Country</Label>
                                            <Input
                                                id="country"
                                                value={formData.country}
                                                onChange={(e) => handleInputChange("country", e.target.value)}
                                                placeholder="Enter your country"
                                                className="bg-muted/30 focus-visible:ring-primary"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="zip">ZIP / Postal Code</Label>
                                            <Input
                                                id="zip"
                                                value={formData.zip}
                                                onChange={(e) => handleInputChange("zip", e.target.value)}
                                                placeholder="Enter ZIP code"
                                                className="bg-muted/30 focus-visible:ring-primary"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                    <LoadingButton isLoading={isLoading} title="Saving Changes..." className="flex-1">
                                        <Button type="submit" className="w-full h-11 text-white bg-green-600 hover:bg-green-700 font-bold" onClick={handleSubmit}>
                                            <IconDeviceFloppy className="w-4 h-4 mr-2" />
                                            Update Profile
                                        </Button>
                                    </LoadingButton>
                                    <Button type="button" variant="outline" className="flex-1 h-11">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
