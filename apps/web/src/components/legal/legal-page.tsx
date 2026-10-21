import Link from "next/link";
import type { ReactNode } from "react";
import { LEGAL, ROUTES } from "@/lib/constants/const";

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

export const LEGAL_LINKS = [
  { href: ROUTES.PRIVACY_POLICY, label: "Privacy Policy" },
  { href: ROUTES.DATA_SECURITY, label: "Data Security" },
  { href: ROUTES.TERMS, label: "Terms & Conditions" },
];

export function LegalPage({
  title,
  summary,
  sections,
}: {
  title: string;
  summary: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 md:py-16">
      <header className="mb-10 border-b pb-8">
        <p className="text-sm text-muted-foreground">Last updated: {LEGAL.LAST_UPDATED}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        <div className="mt-4 max-w-3xl text-muted-foreground">{summary}</div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="On this page" className="text-sm">
            <p className="mb-3 font-semibold">On this page</p>
            <ol className="space-y-2">
              {sections.map((section, i) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {i + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="prose prose-zinc max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-a:text-primary">
          {sections.map((section, i) => (
            <section key={section.id} id={section.id}>
              <h2>
                {i + 1}. {section.title}
              </h2>
              {section.content}
            </section>
          ))}

          <hr />
          <p className="text-sm">
            Related:{" "}
            {LEGAL_LINKS.filter((link) => link.label !== title).map((link, i) => (
              <span key={link.href}>
                {i > 0 && " · "}
                <Link href={link.href}>{link.label}</Link>
              </span>
            ))}
          </p>
        </article>
      </div>
    </div>
  );
}
