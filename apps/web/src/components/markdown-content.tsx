"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import * as React from "react";

const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), { ssr: false });

export function MarkdownContent({ content, className }: { content: string; className?: string }) {
    const { theme, systemTheme } = useTheme();
    const currentTheme = theme === "system" ? systemTheme : theme;
    return (
        <div className={cn("markdown-body bg-transparent", className)} data-color-mode={currentTheme || "light"}>
            <MarkdownPreview source={content.replace(/\\n/g, '\n')} style={{ backgroundColor: 'transparent' }} />
        </div>
    );
}
