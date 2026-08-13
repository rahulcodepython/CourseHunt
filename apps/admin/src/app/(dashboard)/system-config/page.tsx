"use client";

import * as React from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const systemConfigSchema = z.object({
  registration: z.boolean(),
  courseCreation: z.boolean(),
  payments: z.boolean(),
  feedback: z.boolean(),
  discussions: z.boolean(),
  googleOAuth: z.boolean(),
  siteName: z.string().min(1, "Site name is required"),
  supportEmail: z.string().min(1, "Support email is required").email("Invalid email address"),
  taxRate: z.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100%"),
  minPrice: z.number().min(0, "Price cannot be negative"),
  maxPrice: z.number().min(0, "Price cannot be negative"),
  sessionTimeout: z.number().min(1, "Timeout must be at least 1 minute"),
});

type SystemConfigFormData = z.infer<typeof systemConfigSchema>;

const serviceToggles = [
  {
    key: "registration" as const,
    label: "User Registration",
    description: "Allow new users to sign up on the platform",
  },
  {
    key: "courseCreation" as const,
    label: "Course Creation",
    description: "Allow tutors to create and publish courses",
  },
  {
    key: "payments" as const,
    label: "Payment Processing",
    description: "Enable online payments for enrollments",
  },
  {
    key: "feedback" as const,
    label: "Feedback System",
    description: "Allow students to leave course feedback",
  },
  {
    key: "discussions" as const,
    label: "Discussion System",
    description: "Enable lesson discussions for students",
  },
  {
    key: "googleOAuth" as const,
    label: "Google OAuth Login",
    description: "Allow sign in with Google accounts",
  },
];

export default function SystemConfigPage() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SystemConfigFormData>({
    resolver: zodResolver(systemConfigSchema),
    defaultValues: {
      registration: true,
      courseCreation: true,
      payments: true,
      feedback: true,
      discussions: true,
      googleOAuth: true,
      siteName: "CourseHunt",
      supportEmail: "support@coursehunt.com",
      taxRate: 18,
      minPrice: 99,
      maxPrice: 9999,
      sessionTimeout: 60,
    },
  });

  const onSubmit = (data: SystemConfigFormData) => {
    toast.success("System configuration saved");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Configuration"
        subtitle="Manage platform settings and service toggles"
      />

      <Card className="max-w-2xl mx-auto shadow-sm">
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription>
            Configure global platform settings, pricing thresholds, and service toggles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold tracking-tight text-foreground uppercase">
                Service Toggles
              </h3>
              <div className="divide-y rounded-md border p-3 bg-muted/10">
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
                    <Controller
                      control={control}
                      name={service.key}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-semibold tracking-tight text-foreground uppercase">
                Platform Settings
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    {...register("siteName")}
                    className="mt-1.5 bg-muted/30"
                  />
                  {errors.siteName && (
                    <p className="text-xs text-red-400 mt-1">{errors.siteName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    {...register("supportEmail")}
                    className="mt-1.5 bg-muted/30"
                  />
                  {errors.supportEmail && (
                    <p className="text-xs text-red-400 mt-1">{errors.supportEmail.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value="INR"
                    disabled
                    className="mt-1.5 bg-muted/30"
                  />
                </div>

                <div>
                  <Label htmlFor="taxRate">Tax Rate %</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    {...register("taxRate", { valueAsNumber: true })}
                    className="mt-1.5 bg-muted/30"
                  />
                  {errors.taxRate && (
                    <p className="text-xs text-red-400 mt-1">{errors.taxRate.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="minPrice">Min Course Price ₹</Label>
                  <Input
                    id="minPrice"
                    type="number"
                    {...register("minPrice", { valueAsNumber: true })}
                    className="mt-1.5 bg-muted/30"
                  />
                  {errors.minPrice && (
                    <p className="text-xs text-red-400 mt-1">{errors.minPrice.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="maxPrice">Max Course Price ₹</Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    {...register("maxPrice", { valueAsNumber: true })}
                    className="mt-1.5 bg-muted/30"
                  />
                  {errors.maxPrice && (
                    <p className="text-xs text-red-400 mt-1">{errors.maxPrice.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    {...register("sessionTimeout", { valueAsNumber: true })}
                    className="mt-1.5 bg-muted/30"
                  />
                  {errors.sessionTimeout && (
                    <p className="text-xs text-red-400 mt-1">{errors.sessionTimeout.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                Save System Configuration
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
