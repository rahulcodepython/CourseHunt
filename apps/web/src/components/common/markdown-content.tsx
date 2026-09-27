import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils/utils";

export function MarkdownContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose dark:prose-invert max-w-none text-sm break-words",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {(content || "").replace(/\\n/g, "\n")}
      </ReactMarkdown>
    </div>
  );
}
