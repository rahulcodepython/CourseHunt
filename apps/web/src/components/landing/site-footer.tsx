import Link from "next/link";
import Image from "next/image";
import { LEGAL_LINKS } from "@/components/legal/legal-page";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image src={"/logo.png"} alt="Logo" width={100} height={100} />
          CourseHunt
        </Link>
        <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CourseHunt. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
