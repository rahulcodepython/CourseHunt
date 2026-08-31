"use client";

import { Icon } from "@/components/icon";
import { MarkdownContent } from "@/components/markdown-content";

export function ContentTab({ content }: { content: string | null | undefined }) {
  if (!content?.trim()) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-10 text-center">
        <Icon name="file-text" className="size-8 text-muted-foreground opacity-40" />
        <p className="text-sm text-muted-foreground">No written content for this lesson.</p>
      </div>
    );
  }

  return <MarkdownContent content={content} />;
}
