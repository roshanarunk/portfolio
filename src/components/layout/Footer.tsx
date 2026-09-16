import { Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/icons";
import { site } from "@/content/site";
import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-neutral-200 dark:border-neutral-800">
      <Container className="flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-neutral-600 dark:text-neutral-400">
        <p>
          &copy; {new Date().getFullYear()} {site.name}
        </p>
        <div className="flex items-center gap-4">
          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            <GithubIcon className="size-4" />
            GitHub
          </a>
          {site.linkedin && (
            <a
              href={site.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              <LinkedinIcon className="size-4" />
              LinkedIn
            </a>
          )}
          <a
            href={`mailto:${site.email}`}
            className="inline-flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            <Mail aria-hidden className="size-4" />
            Email
          </a>
        </div>
      </Container>
    </footer>
  );
}
