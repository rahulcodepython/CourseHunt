"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { EnrollmentAccessTable } from "@/components/enrollment-access-table";

import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";

export default function UserPurchasedCoursesPage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId as string;

  useSetBreadcrumbs([
    { label: "Users", href: "/users" },
    { label: "Purchased Courses" },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/users">
            <span className="flex items-center gap-1.5">
              <Icon name="arrow-left" className="size-4" />
              Back to Users
            </span>
          </Link>
        </Button>
        <PageHeader
          title="Purchased Courses"
          subtitle="Courses this user has access to, and their access status"
        />
      </div>

      <EnrollmentAccessTable userId={userId} emptyText="This user hasn't purchased any courses" />
    </div>
  );
}
