"use client";

import * as React from "react";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@package/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@package/ui/dialog";
import { useCategoriesQuery, useCreateCategoryMutation, useDeleteCategoryMutation, useUpdateCategoryMutation } from "@package/query-hooks/categories.api";
import { useDebounce } from "@package/hooks/use-debounce";
import { PageHeader } from "@package/components/page-header";
import { LoadingSpinner as Loading } from "@package/components/loading";
import LoadingButton from "@package/components/loading-button";
import { ConfirmDeleteDialog } from "@package/components/confirm-delete-dialog";
import { cn } from "@package/lib/utils";

interface CategoryFormData {
    name: string;
    parent_id: string | null;
    description: string;
}

function CategoryTreeItem({
    category,
    depth,
    allCategories,
    onEdit,
    onDelete,
}: {
    category: any;
    depth: number;
    allCategories: any[];
    onEdit: (category: any) => void;
    onDelete: (id: string) => void;
}) {
    const [expanded, setExpanded] = React.useState(true);
    const children = allCategories.filter((c: any) => c.parent_id === category.id);

    return (
        <div>
            <div
                className="group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted/50"
                style={{ paddingLeft: depth * 20 + 8 }}
            >
                <button
                    type="button"
                    className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted",
                        children.length === 0 && "invisible",
                    )}
                    onClick={() => setExpanded((e) => !e)}
                    aria-label={expanded ? "Collapse" : "Expand"}
                >
                    <Icon
                        name="IconChevronRight"
                        className={cn(
                            "size-3.5 transition-transform",
                            expanded && "rotate-90",
                        )}
                    />
                </button>
                <Icon name="IconFolder" className="size-4 shrink-0 text-amber-500" />
                <span className="flex-1 truncate text-sm font-medium">
                    {category.name}
                </span>
                <Badge variant="secondary" className="shrink-0">
                    {category.course_count ?? 0}
                </Badge>
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => onEdit(category)}
                        aria-label={`Edit ${category.name}`}
                    >
                        <Icon name="IconPencil" className="size-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={() => onDelete(category.id)}
                        aria-label={`Delete ${category.name}`}
                    >
                        <Icon name="IconTrash" className="size-3.5" />
                    </Button>
                </div>
            </div>
            {expanded &&
                children.map((child) => (
                    <CategoryTreeItem
                        key={child.id}
                        category={child}
                        depth={depth + 1}
                        allCategories={allCategories}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
        </div>
    );
}

function CategoryDialog({
    open,
    onOpenChange,
    editing,
    categories,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: any | null;
    categories: any[];
}) {
    const createMutation = useCreateCategoryMutation();
    const [name, setName] = React.useState("");
    const [parentId, setParentId] = React.useState("none");

    React.useEffect(() => {
        if (open) {
            setName(editing?.name ?? "");
            setParentId(editing?.parent_id ?? "none");
        }
    }, [open, editing]);

    const updateMutation = editing
        ? useUpdateCategoryMutation(editing.id)
        : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (editing && updateMutation) {
            await updateMutation.execute({ name: name.trim() });
        } else {
            await createMutation.execute({
                name: name.trim(),
                parent_id: parentId === "none" ? undefined : parentId,
            });
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {editing ? "Edit Category" : "Create Category"}
                    </DialogTitle>
                    <DialogDescription>
                        {editing
                            ? "Update the category name"
                            : "Add a new course category"}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="cat-name">Name</Label>
                        <Input
                            id="cat-name"
                            placeholder="e.g. Web Development"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    {!editing && (
                        <div className="space-y-1.5">
                            <Label>Parent Category</Label>
                            <Select value={parentId} onValueChange={(value) => setParentId(value ?? "")}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (Top Level)</SelectItem>
                                    {categories
                                        .filter((c: any) => !c.parent_id)
                                        .map((c: any) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <LoadingButton
                            isLoading={createMutation.isPending || !!updateMutation?.isPending}
                        >
                            <Button type="submit">
                                {editing ? "Save Changes" : "Create"}
                            </Button>
                        </LoadingButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function CategoriesPage() {
    const { data: raw, isLoading } = useCategoriesQuery();
    const categories: any[] = raw?.data ?? [];
    const createMutation = useCreateCategoryMutation();
    const deleteMutation = useDeleteCategoryMutation();
    const [search, setSearch] = React.useState("");
    const [debouncedSearch, setDebouncedSearch] = React.useState("");
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<any | null>(null);
    const [deleting, setDeleting] = React.useState<any | null>(null);

    const roots = categories.filter((c: any) => !c.parent_id);

    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const filteredRoots = React.useMemo(() => {
        const q = debouncedSearch.toLowerCase();
        if (!q) return roots;
        return roots.filter(
            (c: any) =>
                c.name.toLowerCase().includes(q) ||
                categories.some(
                    (child: any) =>
                        child.parent_id === c.id &&
                        child.name.toLowerCase().includes(q),
                ),
        );
    }, [roots, categories, debouncedSearch]);

    const subcategoryCount = categories.filter((c: any) => c.parent_id).length;

    const openCreate = () => {
        setEditing(null);
        setDialogOpen(true);
    };

    const openEdit = (category: any) => {
        setEditing(category);
        setDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deleting) return;
        await deleteMutation.execute(deleting.id);
        setDeleting(null);
    };

    if (isLoading || !raw?.data) {
        return (
            <div className="space-y-6">
                <PageHeader title="Categories" subtitle="Organize courses with categories and subcategories" />
                <Loading />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Categories"
                subtitle="Organize courses with categories and subcategories"
                actions={
                    <Button onClick={openCreate}>
                        <Icon name="IconPlus" className="size-4" />
                        Create Category
                    </Button>
                }
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>All Categories ({categories.length})</CardTitle>
                        <div className="relative">
                            <Icon
                                name="IconSearch"
                                className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                            />
                            <Input
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-48 pl-9"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredRoots.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                                <Icon name="IconFolder" className="size-10 opacity-40" />
                                <p className="text-sm">No categories yet...</p>
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {filteredRoots.map((root: any) => (
                                    <CategoryTreeItem
                                        key={root.id}
                                        category={root}
                                        depth={0}
                                        allCategories={categories}
                                        onEdit={openEdit}
                                        onDelete={setDeleting}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="self-start lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total Categories</span>
                            <span className="font-semibold">{categories.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Top-Level</span>
                            <span className="font-semibold">{roots.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Subcategories</span>
                            <span className="font-semibold">{subcategoryCount}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <CategoryDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editing={editing}
                categories={categories}
            />

            <ConfirmDeleteDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                onConfirm={handleDelete}
                isLoading={deleteMutation.isPending}
                title="Delete Category"
                description={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
            />
        </div>
    );
}
