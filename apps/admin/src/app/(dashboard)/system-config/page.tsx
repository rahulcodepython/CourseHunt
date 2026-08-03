"use client";

import * as React from "react";
import { toast } from "sonner";

import { PageHeader } from "@package/components/page-header";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Switch } from "@package/ui/switch";

const serviceToggles = [
    { key: "registration", label: "User Registration", description: "Allow new users to sign up on the platform", default: true },
    { key: "courseCreation", label: "Course Creation", description: "Allow tutors to create and publish courses", default: true },
    { key: "payments", label: "Payment Processing", description: "Enable online payments for enrollments", default: true },
    { key: "feedback", label: "Feedback System", description: "Allow students to leave course feedback", default: true },
    { key: "discussions", label: "Discussion System", description: "Enable lesson discussions for students", default: true },
    { key: "googleOAuth", label: "Google OAuth Login", description: "Allow sign in with Google accounts", default: true },
];

const settingsFields = [
    { key: "siteName", label: "Site Name", type: "text", defaultValue: "CourseHunt" },
    { key: "supportEmail", label: "Support Email", type: "email", defaultValue: "support@coursehunt.com" },
    { key: "currency", label: "Currency", type: "text", defaultValue: "INR", disabled: true },
    { key: "taxRate", label: "Tax Rate %", type: "number", defaultValue: "18" },
    { key: "minPrice", label: "Min Course Price ₹", type: "number", defaultValue: "99" },
    { key: "maxPrice", label: "Max Course Price ₹", type: "number", defaultValue: "9999" },
    { key: "sessionTimeout", label: "Session Timeout (minutes)", type: "number", defaultValue: "60" },
];

export default function SystemConfigPage() {
    const [toggles, setToggles] = React.useState<Record<string, boolean>>(() =>
        Object.fromEntries(serviceToggles.map((s) => [s.key, s.default])),
    );
    const [values, setValues] = React.useState<Record<string, string>>(() =>
        Object.fromEntries(settingsFields.map((f) => [f.key, f.defaultValue])),
    );

    const handleSave = () => {
        toast.success("Settings saved (local only)");
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="System Configuration"
                subtitle="Manage platform settings and service toggles"
            />

            <Card>
                <CardHeader>
                    <CardTitle>Service Toggles</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                        {serviceToggles.map((service) => (
                            <div
                                key={service.key}
                                className="flex items-center justify-between py-2.5"
                            >
                                <div className="pr-4">
                                    <p className="text-sm font-medium">{service.label}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {service.description}
                                    </p>
                                </div>
                                <Switch
                                    checked={toggles[service.key]}
                                    onCheckedChange={(checked) =>
                                        setToggles((prev) => ({ ...prev, [service.key]: checked }))
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Platform Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        {settingsFields.map((field) => (
                            <div
                                key={field.key}
                                className={field.key === "supportEmail" ? "col-span-2" : ""}
                            >
                                <Label htmlFor={field.key}>{field.label}</Label>
                                <Input
                                    id={field.key}
                                    type={field.type}
                                    value={values[field.key]}
                                    disabled={field.disabled}
                                    onChange={(e) =>
                                        setValues((prev) => ({
                                            ...prev,
                                            [field.key]: e.target.value,
                                        }))
                                    }
                                    className="mt-1.5 bg-muted/30"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-6">
                        <Button onClick={handleSave}>Save Settings</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
