import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The single horizontal container for the whole site. Every surface — header,
 * footer and every page — uses it, so one left edge runs down the page and the
 * chrome lines up with the content beneath it.
 *
 * Reading measure is deliberately NOT handled by narrowing this box. A prose
 * page keeps the same page edge as everything else and constrains its own text
 * column instead (see `Prose`), which is what keeps `/about` aligned with `/`
 * while still holding paragraphs to a comfortable line length.
 */
export function Container({
  as: Tag = "div",
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={cn("mx-auto w-full max-w-7xl px-6 sm:px-8", className)}>
      {children}
    </Tag>
  );
}

/**
 * A text column held to a comfortable measure. Sits inside `Container`, so the
 * page edge stays put and only the line length changes.
 *
 * `max-w-xl` is 576px, which at Geist's ~8.2px average advance for 16px text
 * comes out near 70 characters per line — measured, not guessed. `max-w-2xl`
 * ran to 82ch, past the point where the eye starts losing the next line.
 */
export function Prose({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("max-w-xl", className)}>{children}</div>;
}
