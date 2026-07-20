"use client";

import { Icon } from "@package/components/icon";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { useTutorCoursesQuery } from "@package/query-hooks/courses.api";
import { useInspectEnrollmentsQuery } from "@package/query-hooks/enrollments.api";
import type { CourseInspectResponse } from "@package/schema/courses.types";
import type { ListEnrollmentResponse } from "@package/schema/enrollments.types";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@package/ui/select";
import { Label } from "@package/ui/label";
import { Badge } from "@package/ui/badge";

const columns: DataTableColumn<ListEnrollmentResponse>[] = [
    {
        header: "Student",
        render: (enr) => (
            <div className="flex items-center gap-3">
                {enr.user?.image && (
                    <img src={enr.user.image} alt="" className="w-8 h-8 rounded-full" />
                )}
                <div>
                    <div className="font-medium text-sm">{enr.user?.name || "Anonymous"}</div>
                    <div className="text-xs text-muted-foreground">{enr.user?.id}</div>
                </div>
            </div>
        ),
    },
    {
        header: "Progress",
        render: (enr) => (
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${enr.completion_percent}%` }}
                        />
                    </div>
                    <span className="text-xs font-medium">{enr.completion_percent.toFixed(0)}%</span>
                </div>
            </div>
        ),
    },
    {
        header: "Status",
        render: (enr) => (
            enr.completed ? (
                <Badge variant="default" className="bg-green-500">Completed</Badge>
            ) : enr.revoked ? (
                <Badge variant="destructive">Revoked</Badge>
            ) : (
                <Badge variant="secondary">Active</Badge>
            )
        ),
    },
    {
        header: "Enrolled At",
        render: (enr) => (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(enr.enrolled_at).toLocaleDateString()}
            </span>
        ),
        className: "text-right",
    },
];

export default function EnrolledStudentsPage() {
    const [page, setPage] = useState(1);
    const [selectedCourse, setSelectedCourse] = useState<string>("");
    const limit = 10;

    const { data: coursesRaw } = useTutorCoursesQuery();
    const courses: CourseInspectResponse[] = coursesRaw?.data?.data ?? [];

    const { data: enrollmentsRaw, isLoading } = useInspectEnrollmentsQuery(selectedCourse);
    const enrollments: ListEnrollmentResponse[] = enrollmentsRaw?.data?.data ?? [];
    const total = enrollmentsRaw?.data?.total ?? 0;
    const totalPages = enrollmentsRaw?.data ? Math.ceil(enrollmentsRaw.data.total / enrollmentsRaw.data.limit) : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Enrolled Students</h1>
                    <p className="text-muted-foreground text-sm">View students enrolled in your courses</p>
                </div>
            </div>

            <div className="max-w-xs space-y-2">
                <Label>Filter by Course</Label>
                <Select value={selectedCourse} onValueChange={(v) => { setSelectedCourse(v || ""); setPage(1); }}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                        {courses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedCourse ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Students</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable
                            columns={columns}
                            data={enrollments}
                            keyExtractor={(enr) => enr.id}
                            isLoading={isLoading}
                            page={page}
                            totalPages={totalPages}
                            total={total}
                            pageSize={limit}
                            onPageChange={setPage}
                            label="students"
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
                    <Icon name="IconUsers" className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-lg font-medium">Select a course to view enrolled students</p>
                    <p className="text-sm mt-1">Choose a course from the dropdown above.</p>
                </div>
            )}
        </div>
    );
}
