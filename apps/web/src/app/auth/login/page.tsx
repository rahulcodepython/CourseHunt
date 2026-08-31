"use client";

import React from "react";

import { AuthCard } from "@/components/auth-card";
import { StaffLoginForm } from "@/components/auth/staff-login-form";
import { StudentLoginForm } from "@/components/auth/student-login-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  return (
    <AuthCard title="Welcome Back" subtitle="Sign in to continue to CourseHunt">
      <Tabs defaultValue="student" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
          <TabsTrigger value="student">Student</TabsTrigger>
          <TabsTrigger value="staff">Admin / Tutor</TabsTrigger>
        </TabsList>
        <TabsContent value="student" className="mt-6">
          <StudentLoginForm />
        </TabsContent>
        <TabsContent value="staff" className="mt-6">
          <StaffLoginForm />
        </TabsContent>
      </Tabs>
    </AuthCard>
  );
}
