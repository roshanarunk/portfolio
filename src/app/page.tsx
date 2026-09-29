import Link from "next/link";
import { ArrowRight, FileText, Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/icons";
import { Container } from "@/components/layout/Container";
import { HeroSolver } from "@/components/home/HeroSolver";
import { Experience } from "@/components/home/Experience";
import { RunNowCard } from "@/components/home/RunNowCard";
import { RUN_NOW, getProject, hoojProjects, projects } from "@/content/projects";
import { site } from "@/content/site";

const playableCount = projects.filter((p) => p.demo.kind === "live").length;

const runNow = RUN_NOW.map((item) => ({ item, project: getProject(item.slug)! }));

export default function HomePage() {
  return (
    <Container>
      {/*
        Experience mode: the artifact leads. The board is the real solver from
        the Sudoku project working the hardest known board, so the first thing
        a visitor meets is the work rather than a claim about it.

        Three grid children rather than two columns: on a phone the board has to
        come straight after the introduction, not after every link and fact, so
        the actions are a separate block that the wide layout tucks under the
        text beside the board.
      */}
      <section className="grid items-start gap-x-16 gap-y-8 py-10 sm:py-14 lg:grid-cols-[1fr_minmax(0,24rem)] lg:grid-rows-[auto_1fr]">
        <div className="rise">
          <h1 className="text-4xl font-semibold tracking-tight text-balance text-neutral-900 sm:text-5xl dark:text-neutral-100">
            {site.tagline}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
            I&apos;m {site.name}, a software engineer working across full-stack web,
            machine learning and mobile. Most of what I have built started as a problem
            someone I knew had.{" "}
            <span className="text-neutral-900 dark:text-neutral-100">
              {playableCount} of them run right here in your browser.
            </span>
          </p>
          <p className="mt-4 max-w-xl text-sm text-neutral-600 dark:text-neutral-400">
            {site.education}.{" "}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {site.availability}
            </span>
          </p>
        </div>

        <div className="rise rise-1 w-full max-w-md justify-self-center lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-none lg:justify-self-end">
          <HeroSolver href="/projects/sudoku" />
        </div>

        <div className="rise rise-2 lg:col-start-1 lg:row-start-2">
          {/*
            One primary action, and it matches the board beside it: the Sudoku
            demo works with a thumb, where the roguelike wants a keyboard.
          */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/projects/sudoku"
              className="tx inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 dark:bg-emerald-400 dark:text-neutral-950 dark:hover:bg-emerald-300"
            >
              Try the solver
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <a
              href={site.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="tx inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
            >
              <FileText aria-hidden className="size-4" />
              Resume
            </a>
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

          {/*
            The board is taller than the text column, and an empty gap under the
            buttons reads as a mistake. These three facts are what separates
            this portfolio from a list of repos, so they earn the space.
          */}
          <dl className="mt-10 grid max-w-xl gap-px border-t border-neutral-200 sm:grid-cols-3 dark:border-neutral-800">
            {[
              { k: "Ported, not rebuilt", v: "The demos run the original algorithms" },
              {
                k: "Real data",
                v: "The League model trained on 3,831 real games",
              },
              {
                k: "Written up honestly",
                v: "Including the bugs and what they taught",
              },
            ].map((item) => (
              <div key={item.k} className="pt-4">
                <dt className="h-meta text-neutral-900 dark:text-neutral-100">
                  {item.k}
                </dt>
                <dd className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                  {item.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section
        aria-labelledby="run-now"
        className="rise rise-3 section-gap border-t border-neutral-200 dark:border-neutral-800"
      >
        <div className="mb-8 flex items-baseline justify-between gap-4">
          <h2 id="run-now" className="h-section text-neutral-900 dark:text-neutral-100">
            Run one now
          </h2>
          <Link
            href="/projects"
            className="text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            All {projects.length} projects
          </Link>
        </div>
        {/*
          A fixed row, not a random draw: every card here runs in the browser,
          so the page's claim is proven whichever one a visitor picks.
        */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {runNow.map(({ item, project }) => (
            <RunNowCard key={project.slug} project={project} item={item} />
          ))}
        </div>
      </section>

      <Experience className="rise rise-4" />

      {/*
        The Underpeel repos are far stronger read as one product story than as
        four unrelated side projects, so this section gets its own surface.
      */}
      <section
        aria-labelledby="community"
        className="rise rise-5 section-gap border-t border-neutral-200 dark:border-neutral-800"
      >
        {/*
          The heading sits outside the tinted panel so it starts on the same
          left edge as every other section heading; the panel holds only the
          supporting list, which is what the tint is for.
        */}
        <h2
          id="community"
          className="h-section text-balance text-neutral-900 dark:text-neutral-100"
        >
          Projects for the {site.community} community
        </h2>
        <div className="mt-6 grid gap-8 rounded-2xl bg-neutral-50 p-8 sm:p-10 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-14 dark:bg-neutral-900/60">
          <p className="text-neutral-600 dark:text-neutral-400">
            I helped run {site.community}, a Valorant league and coaching community, and
            most of what it needed did not exist. Over about a year I built the pieces
            one problem at a time — a public league site, then the admin work behind it,
            then the analysis tools coaches asked for.
          </p>
          <ol className="space-y-5">
            {hoojProjects.map((project, index) => (
              <li key={project.slug} className="flex gap-4">
                <span
                  aria-hidden
                  className="fig mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
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
        className="section-gap flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-neutral-200 dark:border-neutral-800"
      >
        <div>
          <h2 id="contact" className="h-section text-neutral-900 dark:text-neutral-100">
            Get in touch
          </h2>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            {site.availability}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`mailto:${site.email}`}
            className="tx inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
          >
            <Mail aria-hidden className="size-4" />
            {site.email}
          </a>
          <a
            href={site.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="tx inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
          >
            <FileText aria-hidden className="size-4" />
            Resume
          </a>
        </div>
      </section>
    </Container>
  );
}
