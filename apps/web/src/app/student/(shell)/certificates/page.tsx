"use client";

import * as React from "react";

import { useInfiniteCertificatesQuery, useClaimCertificateMutation } from "@/query-hooks/certificates.api";
import { useEnrolledCoursesQuery } from "@/query-hooks/courses.api";
import useSession from "@/hooks/use-session";
import type { Certificate } from "@/schema/certificate.types";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/table/data-table";
import { getColumns, type ExtendedCertificate } from "./columns";

export default function StudentCertificatesPage() {
  const { user } = useSession();
  const {
    data: certsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCertificatesQuery({ limit: 12 });
  const { data: rawEnrolled } = useEnrolledCoursesQuery();
  const claimMutation = useClaimCertificateMutation();

  const certificates: Certificate[] = React.useMemo(
    () => certsData?.pages.flatMap((page) => page.data) ?? [],
    [certsData],
  );
  const totalCount = certsData?.pages[0]?.total ?? 0;
  const enrolled = rawEnrolled?.data ?? [];

  const certifiedCourseIds = new Set(certificates.map((c) => c.course.id));
  const claimable = enrolled.filter(
    (c) => c.completion_percent >= 100 && !certifiedCourseIds.has(c.id),
  );

  const claimableCerts: ExtendedCertificate[] = claimable.map((c) => ({
    id: `claimable_${c.id}`,
    user_id: user?.id ?? "",
    course: {
      id: c.id,
      title: c.title,
      slug: c.slug,
      thumbnail: c.image_url ?? null,
    },
    tutor: {
      id: "",
      name: "",
      email: "",
    },
    issued_at: new Date().toISOString(),
    isClaimable: true,
  }));

  const allCerts: ExtendedCertificate[] = [...claimableCerts, ...certificates];

  const columns = React.useMemo(
    () => getColumns(user?.name ?? "Student", claimMutation),
    [user?.name, claimMutation],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Certificates" subtitle="Certificates earned for your completed courses" />

      <DataTable
        columns={columns}
        data={allCerts}
        showColumnToggle={false}
        emptyIcon="shield-check"
        emptyText="No certificates yet — complete a course to earn one."
        isLoading={isLoading}
        loadingText="Loading certificates..."
        onLoadMore={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        totalCount={totalCount}
      />
    </div>
  );
}
