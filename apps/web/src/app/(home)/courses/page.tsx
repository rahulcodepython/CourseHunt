"use client";

import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Input } from "@package/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@package/ui/select";
import { useCategoriesQuery } from "@package/query-hooks/categories.api";
import { useCoursesQuery } from "@package/query-hooks/courses.api";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import type { Category } from "@package/schema/category.types";
import type { CoursePublicResponse } from "@package/schema/courses.types";
import { useDebounce } from "@package/hooks/use-debounce";
import Loading from "@package/components/loading";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 10;

const LEVELS = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
];

const columns: DataTableColumn<CoursePublicResponse>[] = [
    {
        header: "Image",
        className: "w-[100px]",
        headerClassName: "w-[100px]",
        render: (course) => (
            <div className="w-16 h-10 rounded overflow-hidden bg-muted">
                <img
                    src={course.image_url || "/placeholder.svg"}
                    alt={course.title}
                    className="w-full h-full object-cover"
                />
            </div>
        ),
    },
    {
        header: "Title",
        className: "font-medium max-w-[200px] truncate",
        render: (course) => course.title,
    },
    {
        header: "Instructor",
        render: (course) => course.instructor.name,
    },
    {
        header: "Category",
        render: (course) => course.category?.name ?? "-",
    },
    {
        header: "Level",
        render: (course) => (
            <Badge variant="secondary" className="capitalize">{course.level}</Badge>
        ),
    },
    {
        header: "Price",
        className: "text-right",
        headerClassName: "text-right",
        render: (course) => (
            <>
                <span className="font-semibold">₹{course.final_price}</span>
                {course.final_price < course.actual_price && (
                    <span className="text-sm text-muted-foreground line-through ml-1">₹{course.actual_price}</span>
                )}
            </>
        ),
    },
    {
        header: "Rating",
        className: "text-right",
        headerClassName: "text-right",
        render: (course) => (
            <>
                <span>{course.rating_avg.toFixed(1)}</span>
                <span className="text-muted-foreground text-sm ml-1">({course.feedback_count})</span>
            </>
        ),
    },
    {
        header: "Action",
        className: "text-right",
        headerClassName: "text-right",
        render: (course) => (
            <Link href={`/courses/${course.id}`}>
                <Button size="sm" variant="outline">View</Button>
            </Link>
        ),
    },
];

const Courses = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [subcategoryId, setSubcategoryId] = useState("");
    const [level, setLevel] = useState("");

    const debouncedSearch = useDebounce(search, 300);

    const { data: categoriesResponse } = useCategoriesQuery();
    const categories: Category[] = categoriesResponse?.data ?? [];

    const { data: raw, isLoading } = useCoursesQuery({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        category_id: categoryId || undefined,
        subcategory_id: subcategoryId || undefined,
        level: level || undefined,
    });

    const paginatedData = raw?.data;
    const courseList: CoursePublicResponse[] = paginatedData ? (paginatedData.data as unknown as CoursePublicResponse[]) : [];
    const total = paginatedData?.total ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    const selectedCategory = useMemo(() => categories.find(c => c.id === categoryId), [categories, categoryId]);
    const subcategories = selectedCategory?.subcategories ?? [];

    useEffect(() => {
        setSubcategoryId("");
    }, [categoryId]);

    const handleFilterChange = (setter: (v: string) => void) => (value: string | null) => {
        setter(value ?? "");
        setPage(1);
    };

    if (isLoading && courseList.length === 0) return <Loading />;

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-6">
            <h1 className="text-3xl font-bold text-center my-6">Available Courses</h1>
            <p className="text-center text-gray-600 mb-4">Explore our wide range of courses to enhance your skills and knowledge.</p>

            <div className="flex flex-wrap gap-4 items-center">
                <Input
                    placeholder="Search courses..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="max-w-xs"
                />
                <Select value={categoryId} onValueChange={handleFilterChange(setCategoryId)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={subcategoryId}
                    onValueChange={handleFilterChange(setSubcategoryId)}
                    disabled={!categoryId || subcategories.length === 0}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={categoryId && subcategories.length > 0 ? "All Subcategories" : "No subcategories"} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Subcategories</SelectItem>
                        {subcategories.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={level} onValueChange={handleFilterChange(setLevel)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Levels</SelectItem>
                        {LEVELS.map((l) => (
                            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                columns={columns}
                data={courseList}
                keyExtractor={(course) => course.id}
                isLoading={isLoading}
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                label="courses"
                emptyState={
                    <div className="text-center text-gray-500 py-12 border-2 border-dashed rounded-2xl bg-muted/10">
                        <p className="text-lg font-medium">No courses found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filter criteria.</p>
                    </div>
                }
            />
        </div>
    );
};

export default Courses;
