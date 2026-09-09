import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Info } from "lucide-react";
import { GithubIcon } from "@/components/ui/icons";
import { DemoRenderer } from "@/components/demos/DemoRenderer";
import { getProject, projects } from "@/content/projects";

interface Params {
  params: Promise<{ slug: string }>;
}

/** Static export needs every route enumerated at build time. */
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  return {
    title: project.title,
    description: project.summary,
    openGraph: { title: project.title, description: project.summary },
  };
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        <ArrowLeft aria-hidden className="size-4" />
        All projects
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            {project.title}
          </h1>
          <span className="text-sm text-neutral-500 dark:text-neutral-500">
            {project.year}
          </span>
        </div>
        <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400">
          {project.summary}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              <GithubIcon className="size-3.5" />
              Source
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              <ExternalLink aria-hidden className="size-3.5" />
              Live site
            </a>
          )}
        </div>

        <ul className="mt-5 flex flex-wrap gap-2">
          {project.tech.map((tech) => (
            <li
              key={tech.label}
              className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            >
              {tech.label}
            </li>
          ))}
        </ul>
      </header>

      {project.disclosure && (
        <p className="mt-8 flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          {project.disclosure}
        </p>
      )}

      <div className="mt-10">
        <DemoRenderer demo={project.demo} />
      </div>

      <section className="mt-12 space-y-4">
        {project.longDescription.map((paragraph) => (
          <p
            key={paragraph.slice(0, 40)}
            className="leading-relaxed text-neutral-700 dark:text-neutral-300"
          >
            {paragraph}
          </p>
        ))}
      </section>

      {project.highlights && project.highlights.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            What it does
          </h2>
          <ul className="mt-4 space-y-2">
            {project.highlights.map((item) => (
              <li
                key={item}
                className="flex gap-3 text-neutral-700 dark:text-neutral-300"
              >
                <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-neutral-400" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.challenges && project.challenges.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            Problems worth writing down
          </h2>
          <div className="mt-4 space-y-6">
            {project.challenges.map((challenge) => (
              <div
                key={challenge.problem.slice(0, 40)}
                className="border-l-2 border-neutral-200 pl-4 dark:border-neutral-800"
              >
                <p className="text-neutral-700 dark:text-neutral-300">
                  {challenge.problem}
                </p>
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                  {challenge.solution}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
