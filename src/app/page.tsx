import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { SolverWindow } from "@/components/home/Desktop";
import { Experience } from "@/components/home/Experience";
import { Win, btnClass } from "@/components/ui/window";
import { hoojProjects, projects } from "@/content/projects";
import { site } from "@/content/site";

/** Everything that genuinely executes in the browser, newest first. */
const playable = projects
  .filter((p) => p.demo.kind === "live")
  .sort((a, b) => b.year.localeCompare(a.year));

/**
 * A file row. Deliberately NOT dither-striped: a dither behind body copy
 * destroys its legibility, and the 1-bit original reserved patterns for fills
 * and disabled states rather than running them under text. The rule between
 * rows does the separating work instead.
 */
function rowClass(): string {
  return [
    "flex items-center gap-3 border-b border-[var(--ink)]/30 px-3 py-2.5",
    "hover:bg-[var(--ink)] hover:text-[var(--paper)]",
  ].join(" ");
}

export default function HomePage() {
  return (
    <Container className="py-6 sm:py-8">
      {/*
        The desktop: the solver is already running when the visitor arrives, so
        the claim that these programs work is demonstrated before it is stated.
        Windows carry hard offset shadows, which is how a 1-bit display drew
        depth — a blur here would be a modern card wearing a costume.
      */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
        <SolverWindow />

        <div className="grid gap-5">
          <Win title="Read Me" bodyClassName="p-4 sm:p-5">
            <h1 className="pixel text-[1.15rem] leading-snug text-[var(--ink)] sm:text-[1.4rem]">
              {site.tagline}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]">
              {site.intro}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]">
              {playable.length} of them run in this browser — no install, no signup. The
              Sudoku window is one of them, running now.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/projects/cc3k" className={btnClass(true)}>
                Play the roguelike
              </Link>
              <Link href="/projects" className={btnClass()}>
                All {projects.length} projects
              </Link>
            </div>
          </Win>

          {/*
            A folder listing: name and size, the way the original listed files.
            State is a drawn mark rather than a colour, so it survives greyscale.
          */}
          <Win
            title="Runs Here"
            bodyClassName="p-0"
            status={
              <>
                <span>{playable.length} items</span>
                <span>Click to open</span>
              </>
            }
          >
            <ul>
              {playable.map((project) => (
                <li key={project.slug}>
                  <Link href={`/projects/${project.slug}`} className={rowClass()}>
                    <span
                      aria-hidden
                      className="grid size-4 shrink-0 place-items-center border border-current"
                    >
                      <span className="block size-1.5 bg-current" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {project.title}
                    </span>
                    <span className="pixel score shrink-0 text-[0.6rem]">
                      {project.year}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Win>
        </div>
      </div>

      <Win title="Experience" className="mt-5" bodyClassName="p-4 sm:p-5">
        <Experience />
      </Win>

      <Win
        title="Tooling for a coaching org"
        className="mt-5"
        bodyClassName="p-4 sm:p-5"
        status={<span>{hoojProjects.length} items</span>}
      >
        <p className="max-w-xl text-sm leading-relaxed text-[var(--ink)]">
          I helped run a Valorant coaching organisation, and most of what it needed did
          not exist. Over about a year I built the pieces one problem at a time — a
          public league site, then the admin work behind it, then the analysis tools
          coaches asked for.
        </p>
        <ol className="mt-4 space-y-3">
          {hoojProjects.map((project, index) => (
            <li key={project.slug} className="flex gap-3">
              <span
                aria-hidden
                className="pixel score shrink-0 text-[0.65rem] text-[var(--ink)]"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <Link
                  href={`/projects/${project.slug}`}
                  className="text-sm font-semibold text-[var(--ink)] underline-offset-4 hover:underline"
                >
                  {project.title}
                </Link>
                <p className="text-sm text-[var(--ink)]/75">{project.tagline}</p>
              </div>
            </li>
          ))}
        </ol>
      </Win>

      <Win title="Get in touch" className="mt-5" bodyClassName="p-4 sm:p-5">
        <p className="text-sm text-[var(--ink)]">
          I am looking for internships and early-career software roles.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={`mailto:${site.email}`} className={btnClass(true)}>
            {site.email}
          </a>
          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            className={btnClass()}
          >
            GitHub
          </a>
          {site.linkedin && (
            <a
              href={site.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className={btnClass()}
            >
              LinkedIn
            </a>
          )}
        </div>
      </Win>
    </Container>
  );
}
