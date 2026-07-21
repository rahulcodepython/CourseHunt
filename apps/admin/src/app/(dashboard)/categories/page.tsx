"use client";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@package/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@package/ui/dialog";
import { useCategoriesQuery, useCreateCategoryMutation, useDeleteCategoryMutation, useUpdateCategoryMutation } from "@package/query-hooks/categories.api";
import { useState } from "react";
import Loading from "@package/components/loading";
import { ConfirmDeleteDialog } from "@package/components/confirm-delete-dialog";

interface CategoryFormData {
    name: string;
    parent_id: string | null;
    description: string;
}

export default function CategoriesPage() {
    const { data: raw, isLoading } = useCategoriesQuery();
    const categories: any[] = raw?.data ?? [];
    const createMutation = useCreateCategoryMutation();
    const deleteMutation = useDeleteCategoryMutation();
    const [search, setSearch] = useState("");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const [formData, setFormData] = useState<CategoryFormData>({ name: "", parent_id: null, description: "" });

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const rootCategories = categories.filter((c: any) => !c.parent_id);
    const getChildren = (parentId: string) => categories.filter((c: any) => c.parent_id === parentId);

    const filtered = search
        ? categories.filter((c: any) => c.name?.toLowerCase().includes(search.toLowerCase()))
        : categories;

    const openCreate = () => {
        setEditing(null);
        setFormData({ name: "", parent_id: null, description: "" });
        setDialogOpen(true);
    };

    const openEdit = (cat: any) => {
        setEditing(cat);
        setFormData({
            name: cat.name || "",
            parent_id: cat.parent_id || null,
            description: "",
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (editing) {
            await useUpdateCategoryMutation(editing.id).execute({ name: formData.name });
        } else {
            await createMutation.execute({
                name: formData.name,
                parent_id: formData.parent_id,
            });
        }
        setDialogOpen(false);
    };

    const handleDelete = async () => {
        if (deleteId) {
            await deleteMutation.execute(deleteId);
            setDeleteId(null);
        }
    };

    if (isLoading) return <Loading />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Categories</h1>
                    <p className="text-muted-foreground text-sm">Manage course categories and subcategories</p>
                </div>
                <Button onClick={openCreate}>
                    <Icon name="IconPlus" className="mr-1 h-4 w-4" /> Create Category
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>All Categories ({filtered.length})</CardTitle>
                            <div className="relative w-48">
                                <Icon name="IconSearch" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filtered.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Icon name="IconFolder" className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                                <p>No categories yet. Create your first category to organize courses.</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {rootCategories.map((cat: any) => (
                                    <CategoryTreeItem
                                        key={cat.id}
                                        category={cat}
                                        getChildren={getChildren}
                                        onEdit={() => openEdit(cat)}
                                        onDelete={setDeleteId}
                                    />
                                ))}
                                {search && categories.filter((c: any) => c.parent_id).map((cat: any) => {
                                    if (rootCategories.some((rc: any) => rc.id === cat.parent_id)) return null;
                                    if (!cat.name?.toLowerCase().includes(search.toLowerCase())) return null;
                                    return (
                                        <CategoryTreeItem
                                            key={cat.id}
                                            category={cat}
                                            getChildren={getChildren}
                                            onEdit={() => openEdit(cat)}
                                            onDelete={setDeleteId}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Categories</span>
                            <span className="font-medium">{categories.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Top-Level</span>
                            <span className="font-medium">{rootCategories.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subcategories</span>
                            <span className="font-medium">{categories.length - rootCategories.length}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit Category" : "Create Category"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cat-name">Name</Label>
                            <Input
                                id="cat-name"
                                placeholder="Category name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        {!editing && (
                            <div className="space-y-2">
                                <Label htmlFor="cat-parent">Parent Category</Label>
                                <Select
                                    value={formData.parent_id || "none"}
                                    onValueChange={(v) => setFormData({ ...formData, parent_id: v === "none" ? null : v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="None (top-level)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (top-level)</SelectItem>
                                        {categories.filter((c: any) => !c.parent_id).map((cat: any) => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="flex gap-2 pt-2">
                            <Button className="flex-1" onClick={handleSave} disabled={createMutation.isPending}>
                                <Icon name="IconDeviceFloppy" className="mr-1 h-4 w-4" /> Save
                            </Button>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmDeleteDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Category"
                description="Are you sure you want to delete this category? Courses assigned to this category may become uncategorized."
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}

function CategoryTreeItem({
    category,
    getChildren,
    onEdit,
    onDelete,
    depth = 0,
}: {
    category: any;
    getChildren: (parentId: string) => any[];
    onEdit: () => void;
    onDelete: (id: string) => void;
    depth?: number;
}) {
    const children = getChildren(category.id);
    const [expanded, setExpanded] = useState(true);

    return (
        <div>
            <div
                className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-muted/50 group cursor-pointer"
                style={{ paddingLeft: `${depth * 20 + 8}px` }}
            >
                {children.length > 0 ? (
                    <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground">
                        <Icon name={expanded ? "IconChevronDown" : "IconChevronRight"} className="h-4 w-4" />
                    </button>
                ) : (
                    <span className="w-4" />
                )}
                <Icon name="IconFolder" className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium flex-1">{category.name}</span>
                <Badge variant="secondary" className="text-xs">{category.course_count ?? 0}</Badge>
                <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground">
                    <Icon name="IconPencil" className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onDelete(category.id)} className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive">
                    <Icon name="IconTrash" className="h-3.5 w-3.5" />
                </button>
            </div>
            {expanded && children.length > 0 && (
                <div>
                    {children.map((child: any) => (
                        <CategoryTreeItem
                            key={child.id}
                            category={child}
                            getChildren={getChildren}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
