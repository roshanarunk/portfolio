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

/** A screened marquee label, used for every section heading on the cabinet. */
function SectionLabel({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="marquee text-3xl text-[var(--ink)] sm:text-4xl">
      {children}
    </h2>
  );
}

export default function HomePage() {
  return (
    <Container>
      {/*
        Attract mode. The machine is already running when the visitor arrives —
        no hero paragraph, no claim about the work, just the work mid-search with
        its real counters climbing. The marquee names the cabinet; the lit panel
        is where a coin slot would be.
      */}
      <section aria-labelledby="marquee" className="py-10 sm:py-14">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_minmax(0,24rem)] lg:gap-16">
          <div>
            <h1
              id="marquee"
              className="marquee text-[2.6rem] text-[var(--ink)] sm:text-6xl lg:text-7xl"
            >
              {site.tagline}
            </h1>

            <p className="screened mt-6 text-[0.7rem] text-[var(--live)]">
              {playableCount} of them run in this browser
            </p>

            <p className="mt-5 max-w-xl text-lg text-[var(--ink-dim)]">{site.intro}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/projects/cc3k"
                className="screened inline-flex items-center gap-2 bg-[var(--live)] px-5 py-3 text-[0.72rem] text-[var(--on-live)] transition-opacity hover:opacity-90"
              >
                Play the roguelike
                <ArrowRight aria-hidden className="size-4" />
              </Link>
              <Link
                href="/projects"
                className="screened inline-flex items-center gap-2 border-2 border-[var(--rule)] px-5 py-3 text-[0.72rem] text-[var(--ink)] transition-colors hover:border-[var(--active)] hover:text-[var(--active)]"
              >
                All {projects.length} projects
              </Link>
            </div>
          </div>

          <div className="w-full">
            <p className="screened mb-3 text-[0.65rem] text-[var(--ink-dim)]">
              Attract mode · Sudoku solver
            </p>
            <HeroSolver />
            <p className="mt-4 text-sm text-[var(--ink-dim)]">
              My Python solver, ported and running live —{" "}
              <Link
                href="/projects/sudoku"
                className="text-[var(--active)] underline underline-offset-4"
              >
                try it yourself
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="featured"
        className="border-t-2 border-[var(--rule)] py-16"
      >
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
          <SectionLabel id="featured">Selected work</SectionLabel>
          <Link
            href="/projects"
            className="screened text-[0.7rem] text-[var(--ink-dim)] transition-colors hover:text-[var(--active)]"
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
            className="screened inline-flex items-center gap-2 border-2 border-[var(--rule)] px-5 py-3 text-[0.72rem] text-[var(--ink)] transition-colors hover:border-[var(--active)] hover:text-[var(--active)]"
          >
            See all {projects.length} projects
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </section>

      <Experience />

      {/*
        The four HOOJ repos are far stronger read as one product story than as
        four unrelated side projects, so this section gets its own panel.
      */}
      <section aria-labelledby="hooj" className="border-t-2 border-[var(--rule)] py-16">
        <SectionLabel id="hooj">Tooling for a coaching org</SectionLabel>
        <div className="mt-6 border-2 border-[var(--rule)] bg-[var(--ground-panel)] p-8 sm:p-10">
          <p className="max-w-xl text-[var(--ink-dim)]">
            I helped run a Valorant coaching organisation, and most of what it needed
            did not exist. Over about a year I built the pieces one problem at a time —
            a public league site, then the admin work behind it, then the analysis tools
            coaches asked for.
          </p>
          <ol className="mt-8 space-y-5">
            {hoojProjects.map((project, index) => (
              <li key={project.slug} className="flex gap-4">
                <span
                  aria-hidden
                  className="score screened mt-0.5 shrink-0 text-sm text-[var(--score)]"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <Link
                    href={`/projects/${project.slug}`}
                    className="font-semibold text-[var(--ink)] underline-offset-4 hover:text-[var(--active)] hover:underline"
                  >
                    {project.title}
                  </Link>
                  <p className="mt-0.5 text-sm text-[var(--ink-dim)]">
                    {project.tagline}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* A closing band rather than a full section: this is a utility. */}
      <section
        aria-labelledby="contact"
        className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5 border-t-2 border-[var(--rule)] py-12"
      >
        <div>
          <SectionLabel id="contact">Get in touch</SectionLabel>
          <p className="mt-3 text-[var(--ink-dim)]">
            I am looking for internships and early-career software roles.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`mailto:${site.email}`}
            className="screened inline-flex items-center gap-2 bg-[var(--live)] px-5 py-3 text-[0.72rem] text-[var(--on-live)] transition-opacity hover:opacity-90"
          >
            <Mail aria-hidden className="size-4" />
            {site.email}
          </a>
          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            className="screened inline-flex items-center gap-2 border-2 border-[var(--rule)] px-4 py-3 text-[0.72rem] text-[var(--ink)] transition-colors hover:border-[var(--active)] hover:text-[var(--active)]"
          >
            <GithubIcon className="size-4" />
            GitHub
          </a>
          {site.linkedin && (
            <a
              href={site.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="screened inline-flex items-center gap-2 border-2 border-[var(--rule)] px-4 py-3 text-[0.72rem] text-[var(--ink)] transition-colors hover:border-[var(--active)] hover:text-[var(--active)]"
            >
              <LinkedinIcon className="size-4" />
              LinkedIn
            </a>
          )}
        </div>
      </section>
    </Container>
  );
}
