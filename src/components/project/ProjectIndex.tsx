"use client";

import { useMemo, useState } from "react";
import type { Project, Tier } from "@/lib/types";
import { ProjectCard } from "./ProjectCard";
import { cn } from "@/lib/utils";

/**
 * Every project, grouped by tier, with a stack filter across all of them.
 *
 * The filter used to live on the landing page, where it narrowed a random
 * three-card sample and hid most matches behind "Showing 3 of 6". Here it
 * filters the whole list, so a recruiter scanning for a familiar stack sees
 * every match. Filters are OR: selecting Python and React shows projects using
 * either — an intersection would be empty for most pairs.
 */

/**
 * The filters are derived from the projects rather than listed by hand: every
 * language or framework used by at least two projects, most-used first. A
 * hand-kept list went stale the moment new work landed in a new language, and a
 * stack only one project uses is a link, not a filter.
 */
export function deriveFilters(projects: Project[]): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const project of projects) {
    const seen = new Set<string>();
    for (const tech of project.tech) {
      if (tech.category !== "language" && tech.category !== "framework") continue;
      if (seen.has(tech.label)) continue;
      seen.add(tech.label);
      counts.set(tech.label, (counts.get(tech.label) ?? 0) + 1);
    }
  }
  return [...counts]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}

function matching(projects: Project[], active: string[]): Project[] {
  if (active.length === 0) return projects;
  return projects.filter((p) => p.tech.some((t) => active.includes(t.label)));
}

export function ProjectIndex({
  projects,
  tiers,
}: {
  projects: Project[];
  tiers: { tier: Tier; label: string }[];
}) {
  const filters = useMemo(() => deriveFilters(projects), [projects]);
  const [active, setActive] = useState<string[]>([]);
  /*
   * The slugs that were on screen before the last filter change. A card not in
   * this set has just arrived and plays the entrance; cards that stayed put do
   * not replay it. Null until the first change, so the page load is left to
   * the route's own entrance. Captured in the handler, not read from a ref
   * during render.
   */
  const [before, setBefore] = useState<Set<string> | null>(null);

  const shown = useMemo(() => matching(projects, active), [projects, active]);

  function change(next: string[]) {
    setBefore(new Set(shown.map((p) => p.slug)));
    setActive(next);
  }

  function toggle(label: string) {
    change(active.includes(label) ? active.filter((l) => l !== label) : [...active, label]);
  }

  return (
    <>
      <div
        role="group"
        aria-label="Filter by language or framework"
        className="mt-8 flex flex-wrap items-center gap-2"
      >
        {filters.map(({ label, count }) => {
          const on = active.includes(label);
          return (
            <button
              key={label}
              type="button"
              onClick={() => toggle(label)}
              aria-pressed={on}
              className={cn(
                "tx inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium pointer-coarse:min-h-11 pointer-coarse:px-4 pointer-coarse:text-sm",
                on
                  ? "border-emerald-700 bg-emerald-700 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-neutral-950"
                  : "border-neutral-300 text-neutral-700 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500",
              )}
            >
              {label}
              <span aria-hidden className={cn("fig ml-1.5", on ? "opacity-80" : "opacity-60")}>
                {count}
              </span>
            </button>
          );
        })}

        {active.length > 0 && (
          <button
            type="button"
            onClick={() => change([])}
            className="tx ml-1 text-xs text-neutral-600 underline underline-offset-4 hover:text-neutral-900 pointer-coarse:min-h-11 pointer-coarse:text-sm dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Clear
          </button>
        )}
      </div>

      <p aria-live="polite" className="mt-3 text-xs text-neutral-600 dark:text-neutral-400">
        {active.length === 0
          ? `All ${projects.length} projects.`
          : `${shown.length} of ${projects.length} projects use ${active.join(" or ")}.`}
      </p>

      {tiers.map(({ tier, label }) => {
        const group = shown.filter((project) => project.tier === tier);
        if (group.length === 0) return null;

        return (
          <section key={tier} className="mt-12">
            <h2 className="mb-5 text-sm font-medium tracking-wide text-neutral-600 uppercase dark:text-neutral-400">
              {label}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((project, i) => (
                <div
                  key={project.slug}
                  className={cn(
                    "flex *:w-full",
                    before && !before.has(project.slug) && "swap-in",
                  )}
                  style={
                    before && !before.has(project.slug)
                      ? { animationDelay: `${Math.min(i, 5) * 50}ms` }
                      : undefined
                  }
                >
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
