import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { GithubIcon } from "@/components/ui/icons";
import { ProjectCard } from "@/components/project/ProjectCard";
import { featuredProjects, hoojProjects } from "@/content/projects";
import { site } from "@/content/site";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <section className="py-20 sm:py-28">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl dark:text-neutral-100">
          {site.tagline}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
          {site.intro}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            See the projects
            <ArrowRight aria-hidden className="size-4" />
          </Link>
          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <GithubIcon className="size-4" />
            GitHub
          </a>
        </div>
      </section>

      <section aria-labelledby="featured" className="border-t border-neutral-200 py-16 dark:border-neutral-800">
        <div className="mb-8 flex items-baseline justify-between gap-4">
          <h2
            id="featured"
            className="text-xl font-medium text-neutral-900 dark:text-neutral-100"
          >
            Selected work
          </h2>
          <Link
            href="/projects"
            className="text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            All projects
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {featuredProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>

      {/*
        The four HOOJ repos are far stronger read as one product story than as
        four unrelated side projects.
      */}
      <section
        aria-labelledby="hooj"
        className="border-t border-neutral-200 py-16 dark:border-neutral-800"
      >
        <h2
          id="hooj"
          className="text-xl font-medium text-neutral-900 dark:text-neutral-100"
        >
          Building the tooling for a coaching org
        </h2>
        <p className="mt-3 max-w-2xl text-neutral-600 dark:text-neutral-400">
          I helped run a Valorant coaching organisation, and most of what it
          needed did not exist. Over about a year I built the pieces one problem
          at a time — a public league site, then the admin work behind it, then
          the analysis tools coaches asked for.
        </p>
        <ol className="mt-8 space-y-4">
          {hoojProjects.map((project, index) => (
            <li key={project.slug} className="flex gap-4">
              <span
                aria-hidden
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
              >
                {index + 1}
              </span>
              <div>
                <Link
                  href={`/projects/${project.slug}`}
                  className="font-medium text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-100"
                >
                  {project.title}
                </Link>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {project.tagline}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="contact"
        className="border-t border-neutral-200 py-16 dark:border-neutral-800"
      >
        <h2
          id="contact"
          className="text-xl font-medium text-neutral-900 dark:text-neutral-100"
        >
          Get in touch
        </h2>
        <p className="mt-3 max-w-xl text-neutral-600 dark:text-neutral-400">
          I am looking for internships and early-career software roles. The
          fastest way to reach me is email.
        </p>
        <a
          href={`mailto:${site.email}`}
          className="mt-6 inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          <Mail aria-hidden className="size-4" />
          {site.email}
        </a>
      </section>
    </div>
  );
}
