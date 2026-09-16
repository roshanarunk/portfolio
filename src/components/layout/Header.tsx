"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav, site } from "@/content/site";
import { cn } from "@/lib/utils";
import { Container } from "./Container";
import { ThemeToggle } from "./ThemeToggle";

/**
 * The cabinet's marquee strip. Nav items are screened labels on the panel, and
 * the current one is lit rather than merely bolder — on a machine, the lit
 * control is the one you are on.
 */
export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-[var(--rule)] bg-[var(--ground)]/92 backdrop-blur">
      {/*
        The trailing control carries its own padding, so its box ends past the
        last visible pixel. Pulling the nav out by that much lands the optical
        edge on the same line as the content below.
      */}
      <Container className="flex items-center justify-between gap-4 py-3">
        <Link
          href="/"
          className="marquee text-lg text-[var(--ink)] transition-colors hover:text-[var(--live)]"
        >
          {site.shortName}
        </Link>

        <nav aria-label="Main" className="-mr-2.5 flex items-center gap-1">
          {nav.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "screened px-2.5 py-2 text-[0.7rem] transition-colors",
                  active
                    ? "text-[var(--active)]"
                    : "text-[var(--ink-dim)] hover:text-[var(--ink)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <ThemeToggle />
        </nav>
      </Container>
    </header>
  );
}
