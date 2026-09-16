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
      <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
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
                  <div className="relative aspect-[16/10] bg-neutral-100 sm:aspect-auto sm:min-h-72 dark:bg-neutral-900">
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
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
                        {project.title}
                      </div>
                    )}
                    {project.cardImage?.placeholder && (
                      <span className="absolute top-3 left-3 rounded bg-neutral-950/75 px-2 py-1 text-[0.65rem] font-medium tracking-wide text-neutral-200 uppercase">
                        Placeholder image
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-2">
                      {label && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            project.demo.kind === "live"
                              ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                              : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
                          )}
                        >
                          {label}
                        </span>
                      )}
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {project.year}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                      {project.title}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {project.tagline}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-2">
                      {project.tech.slice(0, 3).map((tech) => (
                        <span
                          key={tech.label}
                          className="text-xs text-neutral-500 dark:text-neutral-400"
                        >
                          {tech.label}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={`/projects/${project.slug}`}
                      // Only the visible slide is reachable by keyboard.
                      tabIndex={i === index ? 0 : -1}
                      className="tx mt-3 inline-flex w-fit items-center gap-1.5 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
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
            className="tx rounded-md border border-neutral-300 p-2 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next project"
            className="tx rounded-md border border-neutral-300 p-2 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
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
                  "block h-1.5 rounded-full transition-all",
                  i === index
                    ? "w-6 bg-neutral-900 dark:bg-neutral-100"
                    : "w-1.5 bg-neutral-300 group-hover:bg-neutral-400 dark:bg-neutral-700 dark:group-hover:bg-neutral-600",
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
