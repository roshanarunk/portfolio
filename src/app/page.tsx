import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/icons";
import { Container } from "@/components/layout/Container";
import { Cabinet } from "@/components/home/Cabinet";
import { CabinetRow } from "@/components/home/CabinetRow";
import { Experience } from "@/components/home/Experience";
import { hoojProjects, projects } from "@/content/projects";
import { site } from "@/content/site";

/** Everything that genuinely executes in the browser, newest first. */
const playable = projects
  .filter((p) => p.demo.kind === "live")
  .sort((a, b) => b.year.localeCompare(a.year));

/** A screened marquee label. Every section heading shares one left edge. */
function SectionLabel({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="marquee text-3xl text-[var(--ink)] sm:text-4xl">
      {children}
    </h2>
  );
}

export default function HomePage() {
  return (
    <Container className="pb-4">
      {/* The machine leads: it fills the first viewport and runs on arrival. */}
      <Cabinet playableCount={playable.length} />

      <section aria-labelledby="row" className="py-14">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
          <SectionLabel id="row">Step up and play</SectionLabel>
          <p className="text-sm text-[var(--ink-dim)]">
            {playable.length} of {projects.length} run in this browser.
          </p>
        </div>
        <CabinetRow projects={playable} />

        <div className="mt-6 flex justify-center">
          <Link
            href="/projects"
            className="screened inline-flex items-center gap-2 border-2 border-[var(--rule)] px-5 py-3 text-[0.72rem] text-[var(--ink)] transition-colors hover:border-[var(--active)] hover:text-[var(--active)]"
          >
            All {projects.length} projects
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </section>

      <Experience />

      {/*
        The four HOOJ repos are far stronger read as one product story than as
        four unrelated side projects, so this section gets its own panel.
      */}
      <section aria-labelledby="hooj" className="border-t-2 border-[var(--rule)] py-14">
        <SectionLabel id="hooj">Tooling for a coaching org</SectionLabel>
        <div className="mt-6 border-2 border-[var(--rule)] bg-[var(--ground-panel)] p-6 sm:p-9">
          <p className="max-w-xl text-[var(--ink-dim)]">
            I helped run a Valorant coaching organisation, and most of what it needed
            did not exist. Over about a year I built the pieces one problem at a time —
            a public league site, then the admin work behind it, then the analysis tools
            coaches asked for.
          </p>
          <ol className="mt-7 space-y-5">
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
