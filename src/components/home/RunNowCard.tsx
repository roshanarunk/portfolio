import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Project } from "@/lib/types";
import type { RunNowItem } from "@/content/projects";
import { DemoPreview, previewSource } from "./DemoPreview";

/**
 * A demo card that leads with the artifact. The preview is drawn from the
 * project's own data at build time; the footer says what the visitor does and
 * what it needs, so the choice is about the task rather than the project name.
 */
export function RunNowCard({ project, item }: { project: Project; item: RunNowItem }) {
  const source = previewSource(project.slug);

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group tx-move flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 hover:border-emerald-600/60 hover:shadow-sm dark:border-neutral-800 dark:hover:border-emerald-400/50"
    >
      <div
        aria-hidden
        className="tx flex h-44 flex-col border-b border-neutral-200 bg-neutral-50 group-hover:bg-neutral-100/70 dark:border-neutral-800 dark:bg-neutral-900 dark:group-hover:bg-neutral-900/60"
      >
        <div className="min-h-0 flex-1">
          <DemoPreview slug={project.slug} />
        </div>
        {source && (
          <span className="px-3 pb-2 font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
            {source}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
          {project.title}
        </h3>
        <p className="mt-1 flex-1 text-sm text-neutral-600 dark:text-neutral-400">
          {project.tagline}
        </p>
        <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {item.action}
          <ArrowRight
            aria-hidden
            className="tx-move size-4 group-hover:translate-x-0.5"
          />
        </p>
        <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
          {item.input}
        </p>
      </div>
    </Link>
  );
}
