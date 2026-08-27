"use client";

import * as React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

export interface CollapsibleCheckboxListItem {
    id: string;
    label: string;
}

export interface CollapsibleCheckboxListGroup {
    groupName: string;
    items: CollapsibleCheckboxListItem[];
}

/**
 * Generic collapsible, scrollable multi-checkbox list — supporting both flat item
 * sets and grouped sections with legends. Used anywhere a set of checkable items
 * needs picking: role selection, permission assignment, etc.
 */
export function CollapsibleCheckboxList({
    title,
    items,
    groups,
    selected,
    onChange,
    maxHeight = "16rem",
    defaultOpen = true,
    emptyMessage = "No options available",
    error,
    className,
}: {
    title: string;
    items?: CollapsibleCheckboxListItem[];
    groups?: CollapsibleCheckboxListGroup[];
    selected: string[];
    onChange: (selected: string[]) => void;
    /** CSS max-height of the scrollable content area once expanded. */
    maxHeight?: string;
    defaultOpen?: boolean;
    emptyMessage?: string;
    /** Validation message shown below the list (e.g. "Select at least one role"). */
    error?: string;
    className?: string;
}) {
    const [open, setOpen] = React.useState(defaultOpen);

    const toggle = (id: string) => {
        onChange(
            selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id],
        );
    };

    const allFlatItems = React.useMemo(() => {
        if (groups) {
            return groups.flatMap((g) => g.items);
        }
        return items ?? [];
    }, [items, groups]);

    const totalSelected = allFlatItems.filter((item) => selected.includes(item.id)).length;

    return (
        <div className={className}>
            <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border">
                <CollapsibleTrigger className="bg-card flex w-full items-center justify-between rounded-t-md px-4 py-2.5 text-sm font-medium">
                    <span>{title}</span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs font-normal">
                            {totalSelected} of {allFlatItems.length} selected
                        </span>
                        <Icon
                            name="chevron-down"
                            className={cn("size-4 transition-transform", open && "rotate-180")}
                        />
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent
                    className="overflow-y-auto border-t"
                    style={{ maxHeight }}
                >
                    <div className="flex flex-col gap-1 p-2">
                        {
                            allFlatItems.length === 0 ? <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                                {emptyMessage}
                            </p> : groups && groups.length > 0 ?
                                groups.map((group) => {
                                    const groupSelectedCount = group.items.filter((i) =>
                                        selected.includes(i.id),
                                    ).length;

                                    return <div key={group.groupName} className="space-y-1 py-1">
                                        <div className="flex items-center justify-between px-2 pt-1.5 pb-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            <span>{group.groupName}</span>
                                            <span className="font-mono text-[10px] font-normal">
                                                {groupSelectedCount} of {group.items.length} selected
                                            </span>
                                        </div>
                                        <div className="ml-2 flex flex-col gap-0.5 border-l border-zinc-800/80 pl-3">
                                            {group.items.map((item) => (
                                                <label
                                                    key={item.id}
                                                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                                                >
                                                    <Checkbox
                                                        checked={selected.includes(item.id)}
                                                        onCheckedChange={() => toggle(item.id)}
                                                    />
                                                    <span className="font-mono text-xs">{item.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                }) : items && items.map((item) => (
                                    <label
                                        key={item.id}
                                        className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                                    >
                                        <Checkbox
                                            checked={selected.includes(item.id)}
                                            onCheckedChange={() => toggle(item.id)}
                                        />
                                        <span>{item.label}</span>
                                    </label>
                                ))
                        }
                    </div>
                </CollapsibleContent>
            </Collapsible>
            {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
        </div>
    );
}
