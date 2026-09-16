"use client";

import Link from "next/link";
import { useEventDisplay } from "./EventDisplay";
import { site } from "@/content/site";

/**
 * The readout: the detector view plus the event summary beside it.
 *
 * Every figure here is measured from the run happening on screen — the decision
 * and backtrack counts come from the real solver generator, not from a constant.
 * A fake number would turn this world into a skin, so there are none.
 */
export function EventPanel({ playableCount }: { playableCount: number }) {
  const evt = useEventDisplay();

  return (
    <section aria-labelledby="readout" className="evt border border-[var(--steel)]">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--steel)] px-4 py-2.5">
        <p className="lbl">Event display · live</p>
        <p className="lbl fig">
          {evt.solved ? "Event complete" : evt.running ? "Acquiring" : "Halted"}
        </p>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,20rem)] lg:items-center lg:gap-10 lg:p-7">
        <div className="mx-auto w-full max-w-[34rem]">{evt.svg}</div>

        <div className="flex flex-col justify-center">
          <h1
            id="readout"
            className="text-2xl leading-tight font-semibold tracking-tight text-[var(--read)] sm:text-3xl"
          >
            {site.tagline}
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-[var(--label)]">
            {site.intro}
          </p>

          {/*
            The summary table: what is running, and what it has cost so far.
            Both counters are read straight off the generator driving the view.
          */}
          <dl className="mt-6 border-t border-[var(--steel)]">
            <Row label="Source" value="Sudoku.py — my own solver, ported" />
            <Row label="Decisions" value={evt.steps.toLocaleString()} accent="track" />
            <Row
              label="Backtracks"
              value={evt.backtracks.toLocaleString()}
              accent="energy"
            />
            <Row
              label="Runs in browser"
              value={`${playableCount} projects`}
              accent="beam"
            />
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/projects/cc3k"
              className="border border-[var(--track)] px-4 py-2.5 text-xs font-medium tracking-wide text-[var(--track)] uppercase transition-colors hover:bg-[var(--track)] hover:text-[var(--vac)]"
            >
              Play the roguelike
            </Link>
            <Link
              href="/projects/sudoku"
              className="border border-[var(--steel)] px-4 py-2.5 text-xs font-medium tracking-wide text-[var(--label)] uppercase transition-colors hover:border-[var(--beam)] hover:text-[var(--beam)]"
            >
              Open this one
            </Link>
          </div>

          {!evt.running && (
            <button
              type="button"
              onClick={evt.start}
              className="mt-3 self-start border border-[var(--beam)] px-4 py-2.5 text-xs font-medium tracking-wide text-[var(--beam)] uppercase transition-colors hover:bg-[var(--beam)] hover:text-[var(--vac)]"
            >
              Start acquisition
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

const accentVar = {
  track: "var(--track)",
  energy: "var(--energy)",
  beam: "var(--beam)",
  none: "var(--read)",
} as const;

function Row({
  label,
  value,
  accent = "none",
}: {
  label: string;
  value: string;
  accent?: keyof typeof accentVar;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--steel)] py-2.5">
      <dt className="lbl">{label}</dt>
      <dd className="fig text-sm font-medium" style={{ color: accentVar[accent] }}>
        {value}
      </dd>
    </div>
  );
}
