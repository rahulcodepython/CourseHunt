"use client"

import getUserDetails from "@/api/get.user.details.api"
import updateUser from "@/api/update.user.api"
import FileUpload from "@/components/file-upload"
import LoadingButton from "@/components/loading-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApiHandler } from "@/hooks/useApiHandler"
import { UserProfileType } from "@/types/user.type"
import { Save } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function Component() {
    const [formData, setFormData] = useState<UserProfileType>({
        _id: "",
        name: "John Doe",
        firstName: "John",
        lastName: "Doe",
        phone: "+1 (555) 123-4567",
        address: "123 Main Street",
        city: "New York",
        country: "United States",
        zip: "10001",
        email: "john.doe@example.com",
        avatar: {
            url: "",
            fileType: "image",
        },
    })

    const { isLoading, callApi } = useApiHandler()

    useEffect(() => {
        const handler = async () => {
            const userDetails = await callApi(getUserDetails)

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
                    avatar: {
                        url: userDetails.avatar?.url || "",
                        fileType: "image",
                    },
                })
            }
        }

        handler()
    }, [])

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
        const responseData = await callApi(() => updateUser(formData))

        if (responseData) {
            toast.success(responseData.message || "Profile updated successfully")
        }
    }

    return (
        <div className="min-h-screen w-full py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Edit Profile</CardTitle>
                        <CardDescription>Update your personal information and account settings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {/* Avatar Section */}
                            <FileUpload
                                label="Profile Picture"
                                onChange={handleAvatarChange}
                                field="avatar"
                                value={formData.avatar}
                                accept="image"
                            />

                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Display Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange("name", e.target.value)}
                                            placeholder="Enter your display name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange("email", e.target.value)}
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            id="firstName"
                                            value={formData.firstName}
                                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                                            placeholder="Enter your first name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            value={formData.lastName}
                                            onChange={(e) => handleInputChange("lastName", e.target.value)}
                                            placeholder="Enter your last name"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange("phone", e.target.value)}
                                        placeholder="Enter your phone number"
                                    />
                                </div>
                            </div>

                            {/* Address Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Address Information</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Street Address</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => handleInputChange("address", e.target.value)}
                                        placeholder="Enter your street address"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={(e) => handleInputChange("city", e.target.value)}
                                            placeholder="Enter your city"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="country">Country</Label>
                                        <Input
                                            id="country"
                                            value={formData.country}
                                            onChange={(e) => handleInputChange("country", e.target.value)}
                                            placeholder="Enter your country"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="zip">ZIP / Postal Code</Label>
                                        <Input
                                            id="zip"
                                            value={formData.zip}
                                            onChange={(e) => handleInputChange("zip", e.target.value)}
                                            placeholder="Enter ZIP code"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-4 pt-6">
                                <LoadingButton isLoading={isLoading} title="Saving...">
                                    <Button type="submit" className="w-full" onClick={handleSubmit}>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </Button>
                                </LoadingButton>
                                <Button type="button" variant="outline" className="w-full">
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
