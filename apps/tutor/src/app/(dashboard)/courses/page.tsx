"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { useTutorCoursesQuery, useCreateCourseMutation, useDeleteCourseMutation, useUpdateCourseMutation } from "@package/query-hooks/courses.api";
import type { CourseInspectResponse } from "@package/schema/courses.types";
import { useState } from "react";
import Link from "next/link";
import { Badge } from "@package/ui/badge";
import { Input } from "@package/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@package/ui/dialog";
import { Label } from "@package/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@package/ui/select";
import { toast } from "sonner";

const columns: DataTableColumn<CourseInspectResponse>[] = [
    {
        header: "Course",
        render: (course) => (
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted">
                    {course.image_url && (
                        <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                    )}
                </div>
                <div>
                    <div className="font-medium text-sm">{course.title}</div>
                    <div className="text-xs text-muted-foreground">{course.total_lectures} lectures</div>
                </div>
            </div>
        ),
    },
    {
        header: "Status",
        render: (course) => (
            <Badge variant={course.status === "published" ? "default" : "secondary"}>
                {course.status}
            </Badge>
        ),
    },
    {
        header: "Price",
        render: (course) => (
            <div className="font-medium">₹{course.final_price}</div>
        ),
    },
    {
        header: "Rating",
        render: (course) => (
            <div className="flex items-center gap-1">
                <Icon name="IconStar" className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{course.rating_avg.toFixed(1)}</span>
            </div>
        ),
    },
    {
        header: "",
        render: (course) => (
            <div className="flex items-center gap-2 justify-end">
                <Link href={`/courses/${course.id}/chapters`}>
                    <Button variant="outline" size="sm">
                        <Icon name="IconHierarchy" className="w-4 h-4" />
                    </Button>
                </Link>
                <Link href={`/courses/${course.id}/resources`}>
                    <Button variant="outline" size="sm">
                        <Icon name="IconPaperclip" className="w-4 h-4" />
                    </Button>
                </Link>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleDelete(course.id)}
                >
                    <Icon name="IconTrash" className="w-4 h-4" />
                </Button>
            </div>
        ),
        className: "text-right",
    },
];

function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this course?")) {
        useDeleteCourseMutation().execute(id);
    }
}

export default function TutorCoursesPage() {
    const [page, setPage] = useState(1);
    const [createOpen, setCreateOpen] = useState(false);
    const limit = 10;

    const { data: raw, isLoading } = useTutorCoursesQuery();
    const createMutation = useCreateCourseMutation();
    const updateMutation = useUpdateCourseMutation();

    const courses = raw?.data?.data ?? [];
    const total = raw?.data?.total ?? 0;
    const totalPages = raw?.data ? Math.ceil(raw.data.total / raw.data.limit) : 0;

    const [newCourse, setNewCourse] = useState({ title: "", language: "english", level: "beginner", status: "draft" });

    const handleCreate = async () => {
        if (!newCourse.title.trim()) {
            toast.error("Course title is required");
            return;
        }
        const res = await createMutation.execute(newCourse);
        if (res) {
            setCreateOpen(false);
            setNewCourse({ title: "", language: "english", level: "beginner", status: "draft" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">My Courses</h1>
                    <p className="text-muted-foreground text-sm">Manage your courses, chapters, and lessons</p>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Icon name="IconPlus" className="w-4 h-4 mr-1" />
                            New Course
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Course</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    value={newCourse.title}
                                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                                    placeholder="Course title"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Language</Label>
                                <Select value={newCourse.language} onValueChange={(v) => setNewCourse({ ...newCourse, language: v || "english" })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="english">English</SelectItem>
                                        <SelectItem value="hindi">Hindi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Level</Label>
                                <Select value={newCourse.level} onValueChange={(v) => setNewCourse({ ...newCourse, level: v || "beginner" })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="advanced">Advanced</SelectItem>
                                        <SelectItem value="all">All Levels</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={newCourse.status} onValueChange={(v) => setNewCourse({ ...newCourse, status: v || "draft" })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleCreate} className="w-full">Create Course</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Courses</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={courses}
                        keyExtractor={(c) => c.id}
                        isLoading={isLoading}
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        pageSize={limit}
                        onPageChange={setPage}
                        label="courses"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
