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

/**
 * Generic collapsible, scrollable multi-checkbox list — a card-header
 * trigger showing the title and selected count, expanding into a vertical
 * checkbox list capped at `maxHeight` (scrolls beyond that). Used anywhere a
 * flat set of checkable items needs picking: role selection, permission
 * assignment, etc. Only the title/data/maxHeight differ per use site.
 */
export function CollapsibleCheckboxList({
    title,
    items,
    selected,
    onChange,
    maxHeight = "16rem",
    defaultOpen = true,
    emptyMessage = "No options available",
    error,
    className,
}: {
    title: string;
    items: CollapsibleCheckboxListItem[];
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

    return (
        <div className={className}>
            <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border">
                <CollapsibleTrigger className="bg-card flex w-full items-center justify-between rounded-t-md px-4 py-2.5 text-sm font-medium">
                    <span>{title}</span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs font-normal">
                            {selected.length} selected
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
                    <div className="flex flex-col gap-0.5 p-2">
                        {items.length === 0 ? (
                            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                                {emptyMessage}
                            </p>
                        ) : (
                            items.map((item) => (
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
                        )}
                    </div>
                </CollapsibleContent>
            </Collapsible>
            {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
        </div>
    );
}
