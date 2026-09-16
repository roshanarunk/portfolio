"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav, site } from "@/content/site";
import { cn } from "@/lib/utils";
import { Container } from "./Container";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/85 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/85">
      <Container className="flex items-center justify-between gap-4 py-3">
        {/*
          The full name wraps to two lines on a phone and cramps the nav, so the
          short form carries the narrow breakpoint and the full name appears
          once there is room for it.
        */}
        <Link
          href="/"
          className="font-medium whitespace-nowrap text-neutral-900 dark:text-neutral-100"
        >
          <span className="sm:hidden">{site.shortName}</span>
          <span className="hidden sm:inline">{site.name}</span>
        </Link>

        {/*
          The trailing control carries its own padding, so its box ends 8px
          past the last visible pixel. Pulling it out by that much lands the
          optical edge on the same line as the content below, which is the
          edge a reader actually sees.
        */}
        <nav aria-label="Main" className="-mr-2 flex items-center gap-1">
          {nav.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm",
                  active
                    ? "font-medium text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
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
