"use client";

import * as React from "react";

import { useCoursesQuery } from "@/query-hooks/courses.api";
import { useCategoriesQuery } from "@/query-hooks/categories.api";
import type { Category } from "@/schema/category.types";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/icon";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CourseCard } from "../components/course-card";

const PAGE_SIZE = 12;

export default function CoursesBrowsePage() {
    const [page, setPage] = React.useState(1);
    const [searchInput, setSearchInput] = React.useState("");
    const [categoryId, setCategoryId] = React.useState("all");
    const [level, setLevel] = React.useState("all");
    const search = useDebounce(searchInput, 300);

    React.useEffect(() => {
        setPage(1);
    }, [search, categoryId, level]);

    const { data: rawCategories } = useCategoriesQuery();
    const categories: Category[] = Array.isArray(rawCategories?.data)
        ? rawCategories.data
        : ((rawCategories?.data as { data?: Category[] } | undefined)?.data ?? []);

    const { data: rawCourses, isLoading } = useCoursesQuery({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        category_id: categoryId === "all" ? undefined : categoryId,
        level: level === "all" ? undefined : level,
    });

    const courses = rawCourses?.data?.data ?? [];
    const total = rawCourses?.data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="container mx-auto space-y-6 px-4 py-12">
            <div className="text-center">
                <h1 className="text-3xl font-bold">Available Courses</h1>
                <p className="mt-2 text-muted-foreground">Browse our full catalog and find your next skill</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
                <div className="relative w-full max-w-xs">
                    <Icon name="search" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search courses..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="w-45">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                            <SelectGroup key={cat.id}>
                                <SelectLabel>{cat.name}</SelectLabel>
                                {(cat.subcategories ?? []).map((sub) => (
                                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                                ))}
                            </SelectGroup>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="w-45">
                        <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-72 rounded-lg" />
                    ))}
                </div>
            ) : courses.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-16 text-center">
                    <Icon name="book" className="size-10 text-muted-foreground opacity-40" />
                    <p className="font-medium">No courses found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria.</p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {courses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-4">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
