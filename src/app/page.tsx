import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/icons";
import { Container } from "@/components/layout/Container";
import { HeroSolver } from "@/components/home/HeroSolver";
import { Experience } from "@/components/home/Experience";
import { ProjectCarousel } from "@/components/home/ProjectCarousel";
import { featuredProjects, hoojProjects, projects } from "@/content/projects";
import { site } from "@/content/site";

const playableCount = projects.filter((p) => p.demo.kind === "live").length;

export default function HomePage() {
  return (
    <Container>
      {/*
        Experience mode: the artifact leads. The board on the right is the real
        solver from the Sudoku project working the hardest known board, so the
        first thing a visitor meets is the work rather than a claim about it.
      */}
      <section className="grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-16">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-balance text-neutral-900 sm:text-5xl dark:text-neutral-100">
            {site.tagline}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
            {site.intro}{" "}
            <span className="text-neutral-900 dark:text-neutral-100">
              {playableCount} of them run right here in your browser.
            </span>
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/projects/cc3k"
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800 dark:bg-emerald-400 dark:text-neutral-950 dark:hover:bg-emerald-300"
            >
              Play the roguelike
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <Link
              href="/projects"
              className="text-sm font-medium text-neutral-700 underline underline-offset-4 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            >
              All {projects.length} projects
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
            {site.linkedin && (
              <a
                href={site.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                <LinkedinIcon className="size-4" />
                LinkedIn
              </a>
            )}
          </div>
        </div>

        <div className="w-full max-w-md justify-self-center lg:max-w-none lg:justify-self-end">
          <HeroSolver />
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            My Python solver, ported and running live —{" "}
            <Link
              href="/projects/sudoku"
              className="underline underline-offset-4 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              try it yourself
            </Link>
            .
          </p>
        </div>
      </section>

      <section
        aria-labelledby="featured"
        className="border-t border-neutral-200 py-16 dark:border-neutral-800"
      >
        <div className="mb-8 flex items-baseline justify-between gap-4">
          <h2
            id="featured"
            className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
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
        {/*
          One project at a time, driven only by the visitor. Nothing advances on
          its own, so a card cannot slide away while it is being read.
        */}
        <ProjectCarousel projects={featuredProjects} />

        <div className="mt-8 flex justify-center">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
          >
            See all {projects.length} projects
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </section>

      <Experience />

      {/*
        The four HOOJ repos are far stronger read as one product story than as
        four unrelated side projects, so this section gets its own surface.
      */}
      <section
        aria-labelledby="hooj"
        className="border-t border-neutral-200 py-16 dark:border-neutral-800"
      >
        {/*
          The heading sits outside the tinted panel so it starts on the same
          left edge as every other section heading; the panel holds only the
          supporting list, which is what the tint is actually for.
        */}
        <h2
          id="hooj"
          className="text-2xl font-semibold tracking-tight text-balance text-neutral-900 dark:text-neutral-100"
        >
          Building the tooling for a coaching org
        </h2>
        <div className="mt-6 rounded-2xl bg-neutral-50 p-8 sm:p-10 dark:bg-neutral-900/60">
          <p className="max-w-xl text-neutral-600 dark:text-neutral-400">
            I helped run a Valorant coaching organisation, and most of what it needed
            did not exist. Over about a year I built the pieces one problem at a time —
            a public league site, then the admin work behind it, then the analysis tools
            coaches asked for.
          </p>
          <ol className="mt-8 space-y-4">
            {hoojProjects.map((project, index) => (
              <li key={project.slug} className="flex gap-4">
                <span
                  aria-hidden
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
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
        </div>
      </section>

      {/* A closing band rather than a full section: this is a utility, not a peer. */}
      <section
        aria-labelledby="contact"
        className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-neutral-200 py-12 dark:border-neutral-800"
      >
        <div>
          <h2
            id="contact"
            className="text-lg font-medium text-neutral-900 dark:text-neutral-100"
          >
            Get in touch
          </h2>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            I am looking for internships and early-career software roles.
          </p>
        </div>
        <a
          href={`mailto:${site.email}`}
          className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          <Mail aria-hidden className="size-4" />
          {site.email}
        </a>
      </section>
    </Container>
  );
}
