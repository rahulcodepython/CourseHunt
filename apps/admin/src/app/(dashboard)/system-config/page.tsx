"use client";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Separator } from "@package/ui/separator";
import { Switch } from "@package/ui/switch";
import { useState } from "react";

const initialToggles = {
    registration: true,
    courseCreation: true,
    payments: true,
    feedback: true,
    discussions: true,
    googleOAuth: true,
};

export default function SystemConfigPage() {
    const [toggles, setToggles] = useState(initialToggles);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">System Configuration</h1>
                <p className="text-muted-foreground text-sm">Manage platform settings and service toggles</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Service Toggles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { key: "registration", label: "User Registration", desc: "Allow new users to sign up" },
                        { key: "courseCreation", label: "Course Creation", desc: "Allow tutors to create courses" },
                        { key: "payments", label: "Payment Processing", desc: "Enable payment gateway" },
                        { key: "feedback", label: "Feedback System", desc: "Allow users to submit reviews" },
                        { key: "discussions", label: "Discussion System", desc: "Enable course discussions" },
                        { key: "googleOAuth", label: "Google OAuth Login", desc: "Allow sign in with Google" },
                    ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between py-2">
                            <div>
                                <p className="font-medium text-sm">{label}</p>
                                <p className="text-xs text-muted-foreground">{desc}</p>
                            </div>
                            <Switch
                                checked={toggles[key as keyof typeof toggles]}
                                onCheckedChange={(v: boolean) => setToggles({ ...toggles, [key]: v })}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Platform Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Site Name</Label>
                            <Input defaultValue="CourseHunt" />
                        </div>
                        <div className="space-y-2">
                            <Label>Support Email</Label>
                            <Input defaultValue="support@coursehunt.com" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Currency</Label>
                            <Input defaultValue="INR" disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Tax Rate (%)</Label>
                            <Input type="number" defaultValue={18} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Min Course Price (₹)</Label>
                            <Input type="number" defaultValue={99} />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Course Price (₹)</Label>
                            <Input type="number" defaultValue={9999} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Session Timeout (minutes)</Label>
                        <Input type="number" defaultValue={60} />
                    </div>
                    <Button>
                        <Icon name="IconDeviceFloppy" className="mr-1 h-4 w-4" /> Save Settings
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
