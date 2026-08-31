"use client";

import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { Certificate } from "@/schema/certificate.types";
import { formatDate, truncate } from "@/lib/format";
import { Icon } from "@/components/icon";
import { CertificateDownloadButton } from "./certificate-pdf";
import { Button } from "@/components/ui/button";

type ExtendedCertificate = Certificate & { isClaimable?: boolean };

const columnHelper = createColumnHelper<ExtendedCertificate>();

export const getColumns = (
  studentName: string,
  claimMutation: any,
): ColumnDef<ExtendedCertificate, any>[] => [
  columnHelper.accessor((row) => row.course.title, {
    id: "course",
    header: "Course",
    cell: ({ row }) => {
      const course = row.original.course;
      return (
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            {course.thumbnail ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={course.thumbnail} alt={course.title} className="size-full object-cover" />
            ) : (
              <Icon name="shield-check" className="size-5 opacity-40" />
            )}
          </div>
          <div className="min-w-0">
            <p className="max-w-70 truncate font-medium">{course.title}</p>
            <p className="font-mono text-xs text-muted-foreground">{truncate(course.id, 18)}</p>
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("issued_at", {
    header: "Issued",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.isClaimable ? "Not Claimed" : formatDate(row.original.issued_at)}
      </span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        {row.original.isClaimable ? (
          <Button
            size="sm"
            disabled={claimMutation.isPending}
            onClick={() => claimMutation.execute(row.original.course.id)}
          >
            Claim Certificate
          </Button>
        ) : (
          <CertificateDownloadButton studentName={studentName} certificate={row.original} />
        )}
      </div>
    ),
  }),
];
