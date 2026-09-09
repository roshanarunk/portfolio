import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

const demoLabel: Record<Project["demo"]["kind"], string | null> = {
  live: "Interactive",
  iframe: "Live site",
  video: "Video",
  gallery: null,
  writeup: null,
};

export function ProjectCard({ project }: { project: Project }) {
  const label = demoLabel[project.demo.kind];

  return (
    <Link
      href={`/projects/${project.slug}`}
      className={cn(
        "group flex flex-col rounded-xl border border-neutral-200 p-5 transition",
        "hover:border-neutral-400 hover:shadow-sm dark:border-neutral-800 dark:hover:border-neutral-600",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
          {project.title}
        </h3>
        <ArrowUpRight
          aria-hidden
          className="size-4 shrink-0 text-neutral-400 transition group-hover:text-neutral-900 dark:group-hover:text-neutral-100"
        />
      </div>

      <p className="mt-1 flex-1 text-sm text-neutral-600 dark:text-neutral-400">
        {project.tagline}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {label && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            {label}
          </span>
        )}
        {project.tech.slice(0, 3).map((tech) => (
          <span
            key={tech.label}
            className="text-xs text-neutral-500 dark:text-neutral-500"
          >
            {tech.label}
          </span>
        ))}
      </div>
    </Link>
  );
}
