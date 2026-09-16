"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAttractMode } from "./AttractMode";
import { site } from "@/content/site";

/**
 * The first viewport: a cabinet standing in front of the visitor.
 *
 * The marquee is a silkscreened header board bolted over the glass, the solver
 * runs behind it as attract mode, and the coin panel along the bottom holds the
 * score and the primary action. This is deliberately not a hero with a picture
 * beside it — the machine is the page, and the copy sits on the machine.
 */
export function Cabinet({ playableCount }: { playableCount: number }) {
  const attract = useAttractMode();

  return (
    <section
      aria-labelledby="marquee"
      className="border-x-2 border-b-2 border-[var(--rule)]"
    >
      {/*
        Marquee: the lit header board. It carries the name and the one claim
        worth making, screened over the top of the machine.
      */}
      <div className="border-b-2 border-[var(--rule)] bg-[var(--ground-panel)] px-5 py-7 sm:px-8 sm:py-9">
        <h1
          id="marquee"
          className="marquee text-[clamp(2rem,6.2vw,5.5rem)] text-[var(--ink)]"
        >
          {site.tagline}
        </h1>
        <p className="screened mt-4 text-[0.7rem] text-[var(--live)]">
          {playableCount} of them run right here · no install, no signup
        </p>
      </div>

      {/*
        The glass. The solver fills it edge to edge, and the plate naming what
        you are watching sits in its own strip above rather than on top of the
        board, where it would cover cells the solver is working in.
      */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[var(--rule)] bg-[var(--ground)] px-4 py-2.5">
        <p className="screened text-[0.6rem] text-[var(--ink-dim)]">
          Attract mode · my Python solver, ported
        </p>
        {!attract.running && (
          <button
            type="button"
            onClick={attract.start}
            className="screened bg-[var(--live)] px-3.5 py-2 text-[0.65rem] text-[var(--on-live)] transition-opacity hover:opacity-90"
          >
            Run it
          </button>
        )}
      </div>

      <div className="aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
        {attract.node}
      </div>

      {/*
        The coin panel: score on the left where a cabinet keeps it, the action
        on the right where the slot is.
      */}
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5 border-t-2 border-[var(--rule)] bg-[var(--ground-panel)] px-5 py-5 sm:px-8">
        <dl className="flex items-baseline gap-x-8 sm:gap-x-12">
          <div>
            <dt className="screened text-[0.6rem] text-[var(--ink-dim)]">Decisions</dt>
            <dd className="score marquee mt-1.5 text-[clamp(1.5rem,3.4vw,2.6rem)] text-[var(--score)]">
              {attract.steps.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="screened text-[0.6rem] text-[var(--ink-dim)]">Backtracks</dt>
            <dd className="score marquee mt-1.5 text-[clamp(1.5rem,3.4vw,2.6rem)] text-[var(--score)]">
              {attract.backtracks.toLocaleString()}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/projects/cc3k"
            className="screened inline-flex items-center gap-2 bg-[var(--live)] px-5 py-3.5 text-[0.72rem] text-[var(--on-live)] transition-opacity hover:opacity-90"
          >
            Play the roguelike
            <ArrowRight aria-hidden className="size-4" />
          </Link>
          <Link
            href="/projects/sudoku"
            className="screened border-2 border-[var(--rule)] px-4 py-3 text-[0.68rem] text-[var(--ink)] transition-colors hover:border-[var(--active)] hover:text-[var(--active)]"
          >
            Try this one
          </Link>
        </div>
      </div>
    </section>
  );
}
