"use client";

import * as React from "react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Wraps a DataTable cell's rendered content: click anywhere on the cell to
 * copy its text to the clipboard (a click that lands on an interactive
 * element inside it — a button, link, etc. — is left alone so the cell's
 * own controls still work), plus a hover tooltip showing the full text for
 * content truncated by the cell's own styling. Cells with no text content
 * (icon-only action columns) render as-is, untouched.
 */
export function CopyableCell({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [text, setText] = React.useState("");

  React.useLayoutEffect(() => {
    setText(ref.current?.textContent?.trim() ?? "");
  });

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, a, input, [role='button'], [role='menuitem']"))
      return;
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const content = (
    <div ref={ref} onClick={handleClick} className={text ? "cursor-pointer" : undefined}>
      {children}
    </div>
  );

  if (!text) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}
