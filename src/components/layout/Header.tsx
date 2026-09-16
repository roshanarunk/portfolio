"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav, site } from "@/content/site";
import { cn } from "@/lib/utils";
import { Container } from "./Container";
import { ThemeToggle } from "./ThemeToggle";

/**
 * The menu bar: a solid strip pinned to the top edge, the way a 1-bit desktop
 * carried its menus. Menu titles invert on hover and stay inverted for the
 * current page, which is how the original showed an open menu.
 */
export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--ink)] bg-[var(--paper)]">
      <Container className="flex items-center justify-between gap-4">
        <div className="-ml-2 flex items-center">
          <Link
            href="/"
            className="pixel px-2 py-1.5 text-[0.75rem] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
          >
            {site.shortName}
          </Link>

          <nav aria-label="Main" className="flex items-center">
            {nav.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "pixel px-2.5 py-1.5 text-[0.7rem]",
                    active
                      ? "bg-[var(--ink)] text-[var(--paper)]"
                      : "text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <ThemeToggle />
      </Container>
    </header>
  );
}
