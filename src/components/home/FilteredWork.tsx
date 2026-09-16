"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/lib/types";
import { ProjectCard } from "@/components/project/ProjectCard";
import { cn } from "@/lib/utils";

/**
 * A rotating, filterable sample of the work.
 *
 * Three projects are chosen at random on each load, so a return visitor meets
 * different work rather than the same three cards forever. Filters narrow that
 * by technology and are OR: selecting Python and React shows projects using
 * either, which is how a recruiter scans for a familiar stack. An intersection
 * would be empty for most pairs here.
 *
 * The pool is every project, not just those flagged `featured` — filtering
 * three projects by stack would usually return nothing.
 */

/** The stacks worth offering, in the order a visitor is likely to scan them. */
const FILTERS = ["Python", "React", "C++", "Java", "TypeScript", "Android"] as const;

const SHOWN = 3;

/** Fisher-Yates, so every ordering is equally likely. */
function shuffled<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function FilteredWork({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<string[]>([]);

  /*
   * The random pick must not happen during render: the server cannot produce
   * the same order, so it would mismatch hydration. Drawing it in an effect
   * runs client-only, once per mount.
   *
   * A lazy useState initialiser would be simpler but would run during the
   * server render too. A module-level cache would be simpler still, and was
   * wrong: it draws once per module load, so a return visitor would see the
   * same three projects until a hard refresh.
   */
  const [order, setOrder] = useState<string[] | null>(null);

  useEffect(() => {
    // A deliberate exception to set-state-in-effect. The value is random, so it
    // cannot be derived, and it must not exist during the server render or
    // hydration would mismatch. Drawing it here is the documented way to read a
    // client-only value; the extra render is the cost of doing it correctly.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrder(shuffled(projects.map((p) => p.slug)));
  }, [projects]);

  const matches = useMemo(() => {
    if (active.length > 0) {
      return projects.filter((p) => p.tech.some((t) => active.includes(t.label)));
    }
    if (!order) return projects.slice(0, SHOWN);
    // Random order, resolved back to projects.
    return order.map((slug) => projects.find((p) => p.slug === slug)!).filter(Boolean);
  }, [active, projects, order]);

  const shown = matches.slice(0, SHOWN);

  /*
   * The cards leaving each slot, kept just long enough to animate out. React
   * would otherwise unmount them the instant the filter changes, and an element
   * removed from the tree cannot animate.
   */
  const [leaving, setLeaving] = useState<(Project | null)[]>([]);
  const previous = useRef<Project[]>([]);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const before = previous.current;
    previous.current = shown;

    if (before.length === 0) return;

    // Per slot: what used to be here, if something different is here now.
    const departed = Array.from({ length: SHOWN }, (_, i) =>
      before[i] && before[i].slug !== shown[i]?.slug ? before[i] : null,
    );

    if (departed.every((d) => d === null)) return;

    setLeaving(departed);
    clearTimeout(clearTimer.current);
    // Slightly longer than the exit animation, so it finishes before unmount.
    clearTimer.current = setTimeout(() => setLeaving([]), 340);
    // `shown` is derived from these, and comparing slugs is what this needs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown.map((p) => p.slug).join(",")]);

  useEffect(() => () => clearTimeout(clearTimer.current), []);

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
        {Array.from({ length: SHOWN }, (_, i) => {
          const project = shown[i];
          const departing = leaving[i];
          if (!project && !departing) return null;

          return (
            <div key={i} className="swap-slot">
              {/* The outgoing card, stacked underneath and sliding away. */}
              {departing && (
                <div className="swap-out" aria-hidden>
                  <ProjectCard project={departing} />
                </div>
              )}

              {/*
                Keying on the slug makes React mount a new element when the
                occupant changes, so the entrance animation actually runs.
              */}
              {project && (
                <div
                  key={project.slug}
                  className={cn("swap-in", ["", "swap-1", "swap-2"][i])}
                >
                  <ProjectCard project={project} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p
        aria-live="polite"
        className="mt-3 text-xs text-neutral-600 dark:text-neutral-400"
      >
        {active.length === 0
          ? `A different ${SHOWN} each visit — ${projects.length} in total.`
          : matches.length > SHOWN
            ? `Showing ${shown.length} of ${matches.length} matching projects.`
            : matches.length === 0
              ? "No projects use that stack."
              : `Showing ${matches.length} matching ${matches.length === 1 ? "project" : "projects"}.`}
      </p>
    </>
  );
}
