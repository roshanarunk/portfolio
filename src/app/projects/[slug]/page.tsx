import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Info } from "lucide-react";
import { GithubIcon } from "@/components/ui/icons";
import { Container } from "@/components/layout/Container";
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
    <Container as="article" className="py-12">
      <Link
        href="/projects"
        className="screened inline-flex items-center gap-2 text-[0.65rem] text-[var(--ink-dim)] transition-colors hover:text-[var(--active)]"
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
          <h1 className="marquee text-4xl text-[var(--ink)] sm:text-5xl">
            {project.title}
          </h1>
          <span className="screened score text-[0.65rem] text-[var(--score)]">
            {project.year}
          </span>
        </div>
        <p className="mt-4 text-lg text-[var(--ink-dim)]">{project.summary}</p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="screened inline-flex items-center gap-2 border-2 border-[var(--rule)] px-4 py-2.5 text-[0.68rem] text-[var(--ink)] transition-colors hover:border-[var(--active)] hover:text-[var(--active)]"
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
              className="screened inline-flex items-center gap-2 border-2 border-[var(--rule)] px-4 py-2.5 text-[0.68rem] text-[var(--ink)] transition-colors hover:border-[var(--active)] hover:text-[var(--active)]"
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
              className="border border-[var(--rule)] px-2.5 py-1 text-xs text-[var(--ink-dim)]"
            >
              {tech.label}
            </li>
          ))}
        </ul>
      </header>

      {project.disclosure && (
        <p className="mt-8 flex max-w-2xl gap-3 border-2 border-[var(--score)]/50 bg-[var(--ground-panel)] p-4 text-sm text-[var(--ink-dim)]">
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
            className="leading-relaxed text-[var(--ink-dim)]"
          >
            {paragraph}
          </p>
        ))}
      </section>

      {project.highlights && project.highlights.length > 0 && (
        <section className="mt-10 max-w-xl">
          <h2 className="marquee text-2xl text-[var(--ink)]">What it does</h2>
          <ul className="mt-4 space-y-2">
            {project.highlights.map((item) => (
              <li key={item} className="flex gap-3 text-[var(--ink-dim)]">
                <span
                  aria-hidden
                  className="mt-2.5 size-1.5 shrink-0 bg-[var(--live)]"
                />
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.challenges && project.challenges.length > 0 && (
        <section className="mt-10 max-w-xl">
          <h2 className="marquee text-2xl text-[var(--ink)]">
            Problems worth writing down
          </h2>
          <div className="mt-4 space-y-6">
            {project.challenges.map((challenge) => (
              <div
                key={challenge.problem.slice(0, 40)}
                className="border-l-2 border-[var(--rule)] pl-4"
              >
                <p className="text-[var(--ink)]">{challenge.problem}</p>
                <p className="mt-2 text-[var(--ink-dim)]">{challenge.solution}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
