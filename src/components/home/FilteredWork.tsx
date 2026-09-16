"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/lib/types";
import { ProjectCard } from "@/components/project/ProjectCard";
import { cn } from "@/lib/utils";

/**
 * Selected work, filterable by the technology a project showcases.
 *
 * Filters are OR: selecting Python and React shows projects using either, not
 * both. That matches how a recruiter actually scans — they are looking for any
 * familiar stack, not an intersection.
 *
 * Three cards stay on screen whatever the filter. The pool is every project,
 * not just the three flagged `featured`, because filtering three projects by
 * stack would usually return nothing.
 */

/** The stacks worth offering, in the order a visitor is likely to scan them. */
const FILTERS = [
  "Python",
  "React",
  "C++",
  "Java",
  "TypeScript",
  "Android",
] as const;

const SHOWN = 3;

export function FilteredWork({
  projects,
  featuredOrder,
}: {
  projects: Project[];
  /** Slugs that lead when no filter is active. */
  featuredOrder: string[];
}) {
  const [active, setActive] = useState<string[]>([]);

  const shown = useMemo(() => {
    const pool =
      active.length === 0
        ? // No filter: the curated three, in their deliberate order.
          projects
            .filter((p) => featuredOrder.includes(p.slug))
            .sort(
              (a, b) =>
                featuredOrder.indexOf(a.slug) - featuredOrder.indexOf(b.slug),
            )
        : projects.filter((p) =>
            p.tech.some((t) => active.includes(t.label)),
          );

    return pool.slice(0, SHOWN);
  }, [active, projects, featuredOrder]);

  /** How many projects match, so a filter that finds more than fits says so. */
  const matchCount = useMemo(
    () =>
      active.length === 0
        ? projects.filter((p) => featuredOrder.includes(p.slug)).length
        : projects.filter((p) => p.tech.some((t) => active.includes(t.label)))
            .length,
    [active, projects, featuredOrder],
  );

  function toggle(label: string) {
    setActive((current) =>
      current.includes(label)
        ? current.filter((l) => l !== label)
        : [...current, label],
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="h-meta mr-1 text-neutral-600 dark:text-neutral-400">
          Filter
        </span>

        {FILTERS.map((label) => {
          const on = active.includes(label);
          return (
            <button
              key={label}
              type="button"
              onClick={() => toggle(label)}
              aria-pressed={on}
              className={cn(
                "tx rounded-full border px-3 py-1 text-xs font-medium",
                on
                  ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-neutral-950"
                  : "border-neutral-300 text-neutral-700 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500",
              )}
            >
              {label}
            </button>
          );
        })}

        {active.length > 0 && (
          <button
            type="button"
            onClick={() => setActive([])}
            className="tx ml-1 text-xs text-neutral-600 underline underline-offset-4 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((project, i) => (
          /*
           * Keying on the slug makes React replace the element when the filter
           * changes the occupant of a slot, so the incoming card mounts fresh
           * and replays its entrance rather than the text swapping in place.
           */
          <div
            key={project.slug}
            className={cn("swap-in", ["", "swap-1", "swap-2"][i])}
          >
            <ProjectCard project={project} />
          </div>
        ))}
      </div>

      <p aria-live="polite" className="mt-3 text-xs text-neutral-600 dark:text-neutral-400">
        {active.length === 0
          ? `Showing ${shown.length} selected projects.`
          : matchCount > SHOWN
            ? `Showing ${shown.length} of ${matchCount} matching projects.`
            : matchCount === 0
              ? "No projects use that stack."
              : `Showing ${matchCount} matching ${matchCount === 1 ? "project" : "projects"}.`}
      </p>
    </>
  );
}
