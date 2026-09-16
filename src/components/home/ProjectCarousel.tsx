"use client";

import { useCallback, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * A manually-driven project carousel.
 *
 * Deliberately never advances on its own: a recruiter reading one card should
 * not have it slide away mid-sentence, and an auto-rotating region is one of
 * the most common accessibility complaints. Arrows, keyboard, and swipe all
 * move it; nothing else does.
 */

const demoLabel: Record<Project["demo"]["kind"], string | null> = {
  live: "Playable here",
  iframe: "Live site",
  video: "Video",
  gallery: null,
  writeup: null,
};

export function ProjectCarousel({ projects }: { projects: Project[] }) {
  const [index, setIndex] = useState(0);
  const regionId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);

  const count = projects.length;
  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(index - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        go(index + 1);
      }
    },
    [go, index],
  );

  // Swipe, since arrows are a poor target one-handed on a phone.
  const onTouchStart = (event: React.TouchEvent) => {
    touchStart.current = event.touches[0].clientX;
  };
  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(delta) > 40) go(index + (delta < 0 ? 1 : -1));
    touchStart.current = null;
  };

  // The live region should announce changes, not the initial render, and the
  // carousel always starts on the first slide — so a moved index IS the signal.
  const announce = index !== 0;
  const current = projects[index];

  return (
    <div
      className="relative"
      role="group"
      aria-roledescription="carousel"
      aria-label="Selected projects"
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="overflow-hidden border-2 border-[var(--rule)]">
        <div
          ref={trackRef}
          className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {projects.map((project, i) => {
            const label = demoLabel[project.demo.kind];
            return (
              <article
                key={project.slug}
                id={`${regionId}-slide-${i}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}: ${project.title}`}
                aria-hidden={i !== index}
                className="w-full shrink-0"
              >
                <div className="grid sm:grid-cols-[1.15fr_1fr]">
                  <div className="relative aspect-[16/10] bg-[var(--ground-panel)] sm:aspect-auto sm:min-h-72">
                    {project.cardImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={project.cardImage.src}
                        alt={project.cardImage.alt}
                        width={project.cardImage.width}
                        height={project.cardImage.height}
                        // Only the first card is above the fold on most screens.
                        loading={i === 0 ? "eager" : "lazy"}
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : (
                      <div className="marquee absolute inset-0 flex items-center justify-center p-6 text-center text-2xl text-[var(--rule)]">
                        {project.title}
                      </div>
                    )}
                    {project.cardImage?.placeholder && (
                      <span className="screened absolute top-3 left-3 bg-[var(--color-cab-void)]/80 px-2 py-1 text-[0.6rem] text-[var(--color-cab-stock-dim)]">
                        Placeholder image
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col justify-center gap-3 bg-[var(--ground-panel)] p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      {label && (
                        <span
                          className={cn(
                            "screened text-[0.6rem]",
                            project.demo.kind === "live"
                              ? "text-[var(--live)]"
                              : "text-[var(--ink-dim)]",
                          )}
                        >
                          {label}
                        </span>
                      )}
                      <span className="screened score text-[0.6rem] text-[var(--score)]">
                        {project.year}
                      </span>
                    </div>

                    <h3 className="marquee text-xl text-[var(--ink)] sm:text-2xl">
                      {project.title}
                    </h3>
                    <p className="text-[var(--ink-dim)]">{project.tagline}</p>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {project.tech.slice(0, 3).map((tech) => (
                        <span
                          key={tech.label}
                          className="text-xs text-[var(--ink-dim)]"
                        >
                          {tech.label}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={`/projects/${project.slug}`}
                      // Only the visible slide is reachable by keyboard.
                      tabIndex={i === index ? 0 : -1}
                      className="screened mt-3 inline-flex w-fit items-center gap-2 bg-[var(--live)] px-4 py-2.5 text-[0.7rem] text-[var(--on-live)] transition-opacity hover:opacity-90"
                    >
                      Open the project
                      <ArrowRight aria-hidden className="size-4" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous project"
            className="border-2 border-[var(--rule)] p-2.5 text-[var(--ink)] transition-colors hover:border-[var(--active)] hover:text-[var(--active)]"
          >
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next project"
            className="border-2 border-[var(--rule)] p-2.5 text-[var(--ink)] transition-colors hover:border-[var(--active)] hover:text-[var(--active)]"
          >
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {projects.map((project, i) => (
            <button
              key={project.slug}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show ${project.title}`}
              aria-current={i === index}
              // Padding gives a ~32px tap target; the visible mark stays small.
              className="group -mx-0.5 -my-2.5 px-2 py-2.5"
            >
              <span
                className={cn(
                  "block h-1.5 transition-all",
                  i === index
                    ? "w-7 bg-[var(--live)]"
                    : "w-1.5 bg-[var(--rule)] group-hover:bg-[var(--active)]",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {announce ? `${current.title}, ${index + 1} of ${count}` : ""}
      </p>
    </div>
  );
}
