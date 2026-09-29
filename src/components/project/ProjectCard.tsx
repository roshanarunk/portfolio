import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * "Interactive" was system-speak: it could equally mean "has a UI". These say
 * what the visitor actually gets to do. An embedded site is used on the page
 * just like a ported demo, so both say "Try it here"; "Live site" read as a
 * link out, and was one label too many for the same promise.
 */
const demoLabel: Record<Project["demo"]["kind"], string | null> = {
  live: "Try it here",
  iframe: "Try it here",
  video: "Video",
  gallery: null,
  writeup: null,
};

export function ProjectCard({ project }: { project: Project }) {
  const label = project.demo.cardLabel ?? demoLabel[project.demo.kind];
  // Anything a visitor can use on the page earns the accent, including an
  // embedded site — not only demos ported to run as live components.
  const runsHere = project.demo.kind === "live" || project.demo.kind === "iframe";

  return (
    <Link
      href={`/projects/${project.slug}`}
      className={cn(
        "group tx-move relative flex h-full flex-col rounded-xl border p-5",
        "border-neutral-200 hover:border-neutral-400 hover:shadow-sm",
        "dark:border-neutral-800 dark:hover:border-neutral-600",
        // A playable project earns the accent; the rest stay quiet, so the
        // colour means something rather than decorating every card.
        runsHere && "hover:border-emerald-600/60 dark:hover:border-emerald-400/50",
      )}
    >
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
            {project.title}
          </h3>
          <ArrowUpRight
            aria-hidden
            className="tx size-4 shrink-0 text-neutral-500 group-hover:text-neutral-900 dark:text-neutral-400 dark:group-hover:text-neutral-100"
          />
        </div>

        <p className="mt-1 flex-1 text-sm text-neutral-600 dark:text-neutral-400">
          {project.tagline}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {label && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                runsHere
                  ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                  : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
              )}
            >
              {label}
            </span>
          )}
          {project.tech.slice(0, 3).map((tech) => (
            <span
              key={tech.label}
              className="text-xs text-neutral-600 dark:text-neutral-400"
            >
              {tech.label}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
