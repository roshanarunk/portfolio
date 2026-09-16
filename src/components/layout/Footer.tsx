import { Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/icons";
import { site } from "@/content/site";
import { Container } from "./Container";

/** The cabinet's base plate: the maker's mark and where to reach them. */
export function Footer() {
  return (
    <footer className="mt-24 border-t-2 border-[var(--rule)]">
      <Container className="flex flex-wrap items-center justify-between gap-4 py-8">
        <p className="screened text-[0.7rem] text-[var(--ink-dim)]">
          &copy; {new Date().getFullYear()} {site.name}
        </p>
        <div className="-mr-2.5 flex items-center gap-1">
          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            className="screened inline-flex items-center gap-2 px-2.5 py-2 text-[0.7rem] text-[var(--ink-dim)] transition-colors hover:text-[var(--active)]"
          >
            <GithubIcon className="size-4" />
            GitHub
          </a>
          {site.linkedin && (
            <a
              href={site.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="screened inline-flex items-center gap-2 px-2.5 py-2 text-[0.7rem] text-[var(--ink-dim)] transition-colors hover:text-[var(--active)]"
            >
              <LinkedinIcon className="size-4" />
              LinkedIn
            </a>
          )}
          <a
            href={`mailto:${site.email}`}
            className="screened inline-flex items-center gap-2 px-2.5 py-2 text-[0.7rem] text-[var(--ink-dim)] transition-colors hover:text-[var(--active)]"
          >
            <Mail aria-hidden className="size-4" />
            Email
          </a>
        </div>
      </Container>
    </footer>
  );
}
