"use client";

import * as React from "react";

import { useCertificatesQuery, useClaimCertificateMutation } from "@/query-hooks/certificates.api";
import { useEnrolledCoursesQuery } from "@/query-hooks/courses.api";
import useSession from "@/hooks/use-session";
import type { Certificate } from "@/schema/certificate.types";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { getColumns } from "./columns";

export default function StudentCertificatesPage() {
    const { user } = useSession();
    const { data: rawCerts, isLoading } = useCertificatesQuery();
    const { data: rawEnrolled } = useEnrolledCoursesQuery();
    const claimMutation = useClaimCertificateMutation();

    const certificates: Certificate[] = rawCerts?.data?.data ?? [];
    const enrolled = rawEnrolled?.data?.data ?? [];

    const certifiedCourseIds = new Set(certificates.map((c) => c.course.id));
    const claimable = enrolled.filter((c) => c.completion_percent >= 100 && !certifiedCourseIds.has(c.id));

    const claimableCerts = claimable.map((c) => ({
        id: `claimable_${c.id}`,
        user_id: user?.id ?? "",
        course: c as any,
        tutor: (c as any).tutor,
        issued_at: new Date().toISOString(),
        isClaimable: true,
    }));

    const allCerts = [...claimableCerts, ...certificates];

    const columns = React.useMemo(() => getColumns(user?.name ?? "Student", claimMutation), [user?.name, claimMutation]);

    return (
        <div className="space-y-6">
            <PageHeader title="Certificates" subtitle="Certificates earned for your completed courses" />

            <DataTable
                columns={columns}
                data={allCerts as any[]}
                showColumnToggle={false}
                emptyIcon="shield-check"
                emptyText="No certificates yet — complete a course to earn one."
                isLoading={isLoading}
                loadingText="Loading certificates..."
            />
        </div>
    );
}
