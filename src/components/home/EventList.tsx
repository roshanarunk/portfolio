import Link from "next/link";
import type { Project } from "@/lib/types";

/**
 * The event list: every project that genuinely executes in the browser.
 *
 * Each row carries one real measurement of that project. These are verified
 * values — 667 kills counted from the committed match files, 0.886 AUC read
 * from the fitted model's own metrics — not illustrative figures. A project
 * with no measurement worth quoting shows its stack instead of inventing one.
 */

const measurement: Record<string, { figure: string; of: string } | undefined> = {
  "league-ml": { figure: "0.886", of: "ROC-AUC, 3,831 games" },
  valheatmap: { figure: "667", of: "kills plotted, 6 matches" },
  sudoku: { figure: "~450k", of: "decisions, hardest board" },
  cc3k: { figure: "7", of: "enemy types, 5 races" },
  vrvision: { figure: "GLSL", of: "the app's own shaders" },
  wattravl: { figure: "Dijkstra", of: "multi-floor building graph" },
};

export function EventList({ projects }: { projects: Project[] }) {
  return (
    <ul className="border-x border-t border-[var(--steel)]">
      {projects.map((project) => {
        const m = measurement[project.slug];
        return (
          <li key={project.slug} className="border-b border-[var(--steel)]">
            <Link
              href={`/projects/${project.slug}`}
              className="group flex flex-wrap items-baseline gap-x-5 gap-y-1 px-4 py-3.5 transition-colors hover:bg-[var(--vac-lift)]"
            >
              <span className="fig w-10 shrink-0 text-xs text-[var(--label)]">
                {project.year}
              </span>

              <span className="min-w-0 flex-1 text-sm font-medium text-[var(--read)] transition-colors group-hover:text-[var(--beam)]">
                {project.title}
              </span>

              <span className="hidden min-w-0 flex-1 truncate text-xs text-[var(--label)] sm:block">
                {project.tagline}
              </span>

              {m && (
                <span className="flex shrink-0 items-baseline gap-2">
                  <span className="fig text-sm font-semibold text-[var(--track)]">
                    {m.figure}
                  </span>
                  <span className="hidden text-[0.65rem] text-[var(--label)] md:inline">
                    {m.of}
                  </span>
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
