import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * "Interactive" was system-speak: it could equally mean "has a UI". These say
 * what the visitor actually gets to do.
 */
const demoLabel: Record<Project["demo"]["kind"], string | null> = {
  live: "Playable here",
  iframe: "Live site",
  video: "Video",
  gallery: null,
  writeup: null,
};

/**
 * One cabinet in the row. A project that actually runs is lit — the live ink is
 * reserved for that and nothing else, so the colour means "you can play this"
 * rather than decorating every panel.
 */
export function ProjectCard({
  project,
  featured = false,
}: {
  project: Project;
  featured?: boolean;
}) {
  const label = demoLabel[project.demo.kind];
  const runsHere = project.demo.kind === "live";

  return (
    <Link
      href={`/projects/${project.slug}`}
      className={cn(
        "group relative flex flex-col border-2 bg-[var(--ground-panel)] p-5 transition-colors",
        runsHere
          ? "border-[var(--live)]/45 hover:border-[var(--live)]"
          : "border-[var(--rule)] hover:border-[var(--active)]",
        featured && "sm:col-span-2 sm:flex-row sm:items-start sm:gap-6",
      )}
    >
      <div className={cn("flex flex-col", featured && "sm:flex-1")}>
        <div className="flex items-start justify-between gap-3">
          <h3 className={cn("font-semibold text-[var(--ink)]", featured && "text-lg")}>
            {project.title}
          </h3>
          <ArrowUpRight
            aria-hidden
            className="size-4 shrink-0 text-[var(--ink-dim)] transition-colors group-hover:text-[var(--active)]"
          />
        </div>

        <p
          className={cn(
            "mt-1.5 flex-1 text-sm text-[var(--ink-dim)]",
            featured && "sm:text-base",
          )}
        >
          {project.tagline}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          {label && (
            <span
              className={cn(
                "screened text-[0.6rem]",
                runsHere ? "text-[var(--live)]" : "text-[var(--ink-dim)]",
              )}
            >
              {label}
            </span>
          )}
          {project.tech.slice(0, 3).map((tech) => (
            <span key={tech.label} className="text-xs text-[var(--ink-dim)]">
              {tech.label}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
