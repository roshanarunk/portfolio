import Link from "next/link";
import type { Project } from "@/lib/types";

/**
 * The row of machines.
 *
 * Every project that genuinely runs in the browser gets a panel here, and each
 * one carries its ticket of origin — what it was ported from and what is
 * actually executing — because that is the claim the whole site rests on.
 * A cabinet you cannot play is not in this row; those live on /projects.
 */
export function CabinetRow({ projects }: { projects: Project[] }) {
  return (
    <ul className="grid gap-px border-2 border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <li key={project.slug} className="bg-[var(--ground-panel)]">
          <Link
            href={`/projects/${project.slug}`}
            className="group flex h-full flex-col gap-3 p-5 transition-colors hover:bg-[var(--ground)]"
          >
            <span className="flex items-baseline justify-between gap-3">
              <span className="screened text-[0.6rem] text-[var(--live)]">
                Playable
              </span>
              <span className="screened score text-[0.6rem] text-[var(--score)]">
                {project.year}
              </span>
            </span>

            <span className="marquee text-xl text-[var(--ink)] transition-colors group-hover:text-[var(--active)]">
              {project.title}
            </span>

            <span className="flex-1 text-sm text-[var(--ink-dim)]">
              {project.tagline}
            </span>

            {/* The ticket of origin: what this was before it ran here. */}
            <span className="screened border-t border-[var(--rule)] pt-3 text-[0.58rem] text-[var(--ink-dim)]">
              {project.tech
                .slice(0, 3)
                .map((t) => t.label)
                .join(" · ")}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
