import Link from "next/link";
import { Icon } from "@/components/common/icon";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image src={'/logo.png'} alt="Logo" width={100} height={100} />
          CourseHunt
        </Link>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CourseHunt. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
