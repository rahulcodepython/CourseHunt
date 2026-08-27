import Link from "next/link";
import { Icon } from "@/components/icon";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Icon name="book" className="size-4 text-primary" />
          CourseHunt
        </Link>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CourseHunt. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
