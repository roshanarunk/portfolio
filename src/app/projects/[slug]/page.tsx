import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink, FileText, Info, Mail } from "lucide-react";
import { GithubIcon } from "@/components/ui/icons";
import { Container } from "@/components/layout/Container";
import { DemoRenderer } from "@/components/demos/DemoRenderer";
import { getProject, projects } from "@/content/projects";
import { site } from "@/content/site";
import type { Project } from "@/lib/types";

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

/**
 * The runnable project after this one, wrapping at the end. A visitor who has
 * just played a demo is at the peak of their interest, so the page ends by
 * offering the next one rather than stopping at the last paragraph.
 */
function nextRunnable(current: Project): Project {
  const runnable = projects.filter(
    (p) => p.demo.kind === "live" || p.demo.kind === "iframe",
  );
  const from = projects.indexOf(current);
  return (
    runnable.find((p) => projects.indexOf(p) > from && p.slug !== current.slug) ??
    runnable.find((p) => p.slug !== current.slug)!
  );
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const next = nextRunnable(project);

  return (
    <Container as="article" className="py-12">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        <ArrowLeft aria-hidden className="size-4" />
        All projects
      </Link>

      {/*
        Header, prose and the demo all sit on the same page edge. Only the
        running text is held to a narrow measure; the demo stays full width,
        because several of them need the room to be usable.
      */}
      <header className="mt-6 max-w-2xl">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            {project.title}
          </h1>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
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
              Repository
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
        <p className="mt-8 flex max-w-2xl gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          {project.disclosure}
        </p>
      )}

      <div className="mt-10">
        <DemoRenderer demo={project.demo} />
      </div>

      <section className="mt-12 max-w-xl space-y-4">
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
        <section className="mt-10 max-w-xl">
          <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            What it does
          </h2>
          <ul className="mt-4 space-y-2">
            {project.highlights.map((item) => (
              <li
                key={item}
                className="flex gap-3 text-neutral-700 dark:text-neutral-300"
              >
                <span
                  aria-hidden
                  className="mt-2.5 size-1 shrink-0 rounded-full bg-neutral-400"
                />
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.challenges && project.challenges.length > 0 && (
        <section className="mt-10 max-w-xl">
          <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            Problems worth writing down
          </h2>
          {/*
            Labelled rather than told apart by a colour step: which paragraph is
            the problem and which is the response should not depend on seeing a
            slightly lighter grey.
          */}
          <div className="mt-4 divide-y divide-neutral-200 dark:divide-neutral-800">
            {project.challenges.map((challenge) => (
              <dl
                key={challenge.problem.slice(0, 40)}
                className="grid gap-x-6 gap-y-1.5 py-5 first:pt-0 sm:grid-cols-[6rem_1fr]"
              >
                <dt className="h-meta pt-1.5 text-neutral-600 dark:text-neutral-400">
                  Problem
                </dt>
                <dd className="text-neutral-800 dark:text-neutral-200">
                  {challenge.problem}
                </dd>
                <dt className="h-meta mt-3 pt-1.5 text-neutral-600 sm:mt-0 dark:text-neutral-400">
                  What I did
                </dt>
                <dd className="text-neutral-700 dark:text-neutral-300">
                  {challenge.solution}
                </dd>
              </dl>
            ))}
          </div>
        </section>
      )}

      <nav
        aria-label="What next"
        className="mt-16 flex flex-wrap items-center justify-between gap-x-8 gap-y-5 border-t border-neutral-200 pt-8 dark:border-neutral-800"
      >
        <Link
          href={`/projects/${next.slug}`}
          className="group tx min-w-0"
        >
          <span className="h-meta block text-neutral-600 dark:text-neutral-400">
            Next demo
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-lg font-medium text-neutral-900 group-hover:text-emerald-700 dark:text-neutral-100 dark:group-hover:text-emerald-400">
            {next.title}
            <ArrowRight
              aria-hidden
              className="tx-move size-4 group-hover:translate-x-0.5"
            />
          </span>
          <span className="block text-sm text-neutral-600 dark:text-neutral-400">
            {next.tagline}
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={site.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="tx inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            <FileText aria-hidden className="size-3.5" />
            Resume
          </a>
          <a
            href={`mailto:${site.email}`}
            className="tx inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            <Mail aria-hidden className="size-3.5" />
            Email me
          </a>
        </div>
      </nav>
    </Container>
  );
}
