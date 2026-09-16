import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { EventPanel } from "@/components/home/EventPanel";
import { EventList } from "@/components/home/EventList";
import { Experience } from "@/components/home/Experience";
import { hoojProjects, projects } from "@/content/projects";
import { site } from "@/content/site";

/** Everything that genuinely executes in the browser, newest first. */
const playable = projects
  .filter((p) => p.demo.kind === "live")
  .sort((a, b) => b.year.localeCompare(a.year));

/**
 * The landing page as instrument output.
 *
 * `evt` is applied per-section rather than to the body: a previous attempt at a
 * visual world set a global background that only this page could survive, and
 * every other page became unreadable. Surfaces opt in; nothing leaks.
 */
export default function HomePage() {
  return (
    <Container className="py-6 sm:py-8">
      <EventPanel playableCount={playable.length} />

      <section
        aria-labelledby="events"
        className="evt mt-5 border border-[var(--steel)]"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--steel)] px-4 py-2.5">
          <h2 id="events" className="lbl">
            Events · runs in this browser
          </h2>
          <p className="lbl fig">
            {playable.length} of {projects.length}
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <EventList projects={playable} />
          <div className="mt-5">
            <Link
              href="/projects"
              className="inline-block border border-[var(--steel)] px-4 py-2.5 text-xs font-medium tracking-wide text-[var(--label)] uppercase transition-colors hover:border-[var(--beam)] hover:text-[var(--beam)]"
            >
              All {projects.length} projects
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="experience-h"
        className="evt mt-5 border border-[var(--steel)]"
      >
        <div className="border-b border-[var(--steel)] px-4 py-2.5">
          <h2 id="experience-h" className="lbl">
            Experience
          </h2>
        </div>
        <div className="p-4 sm:p-5">
          <Experience />
        </div>
      </section>

      <section aria-labelledby="hooj" className="evt mt-5 border border-[var(--steel)]">
        <div className="border-b border-[var(--steel)] px-4 py-2.5">
          <h2 id="hooj" className="lbl">
            Tooling for a coaching org
          </h2>
        </div>
        <div className="p-4 sm:p-5">
          <p className="max-w-xl text-sm leading-relaxed text-[var(--label)]">
            I helped run a Valorant coaching organisation, and most of what it needed
            did not exist. Over about a year I built the pieces one problem at a time —
            a public league site, then the admin work behind it, then the analysis tools
            coaches asked for.
          </p>
          <ol className="mt-5 border-t border-[var(--steel)]">
            {hoojProjects.map((project, index) => (
              <li
                key={project.slug}
                className="flex items-baseline gap-4 border-b border-[var(--steel)] py-3"
              >
                <span aria-hidden className="fig shrink-0 text-xs text-[var(--track)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="text-sm font-medium text-[var(--read)] underline-offset-4 hover:text-[var(--beam)] hover:underline"
                  >
                    {project.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-[var(--label)]">
                    {project.tagline}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        aria-labelledby="contact"
        className="evt mt-5 border border-[var(--steel)]"
      >
        <div className="border-b border-[var(--steel)] px-4 py-2.5">
          <h2 id="contact" className="lbl">
            Get in touch
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <p className="text-sm text-[var(--label)]">
            I am looking for internships and early-career software roles.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`mailto:${site.email}`}
              className="border border-[var(--track)] px-4 py-2.5 text-xs font-medium tracking-wide text-[var(--track)] uppercase transition-colors hover:bg-[var(--track)] hover:text-[var(--vac)]"
            >
              Email
            </a>
            <a
              href={site.github}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[var(--steel)] px-4 py-2.5 text-xs font-medium tracking-wide text-[var(--label)] uppercase transition-colors hover:border-[var(--beam)] hover:text-[var(--beam)]"
            >
              GitHub
            </a>
            {site.linkedin && (
              <a
                href={site.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-[var(--steel)] px-4 py-2.5 text-xs font-medium tracking-wide text-[var(--label)] uppercase transition-colors hover:border-[var(--beam)] hover:text-[var(--beam)]"
              >
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </section>
    </Container>
  );
}
