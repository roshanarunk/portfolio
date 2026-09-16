"use client";

import { useMemo, useState } from "react";
import type { DemoComponentProps } from "../registry";
import {
  DIVISIONS,
  TIERS,
  type Student,
  type Verdict,
  isHigherRank,
  verdictFor,
} from "./ranks";
import { cn } from "@/lib/utils";

/**
 * The report the script actually produces, running on a sample roster.
 *
 * The Sheets and rank APIs need credentials, so the lookups cannot happen here.
 * What can is the part that decides the answer: `isHigherRank` and the act
 * check, both ported exactly. The roster below is illustrative — real student
 * names and ranks are not mine to publish — and every verdict on screen is
 * computed by the ported logic rather than written into the data.
 */

const TODAY = new Date("2023-08-15");

/** Illustrative roster. Names are invented; the comparison logic is not. */
const ROSTER: Student[] = [
  {
    name: "Player A",
    startRank: "Silver 1",
    currentRank: "Gold 2",
    lastSeen: new Date("2023-08-02"),
  },
  {
    name: "Player B",
    startRank: "Gold 3",
    currentRank: "Gold 3",
    lastSeen: new Date("2023-08-11"),
  },
  {
    name: "Player C",
    startRank: "Platinum 1",
    currentRank: "Diamond 1",
    lastSeen: new Date("2023-07-29"),
  },
  {
    name: "Player D",
    startRank: "Gold 1",
    currentRank: "Silver 3",
    lastSeen: new Date("2023-08-08"),
  },
  {
    name: "Player E",
    startRank: "Bronze 2",
    currentRank: "Silver 2",
    // An act behind: the report cannot draw a conclusion from this.
    lastSeen: new Date("2023-02-14"),
  },
  {
    name: "Player F",
    startRank: "Immortal 1",
    currentRank: "Radiant",
    lastSeen: new Date("2023-08-13"),
  },
];

const VERDICT_LABEL: Record<Verdict, string> = {
  improved: "Improved",
  same: "No change",
  dropped: "Dropped",
  stale: "Stale — needs a fresh reading",
};

const VERDICT_STYLE: Record<Verdict, string> = {
  improved:
    "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  same: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  dropped: "bg-red-500/10 text-red-700 dark:bg-red-400/10 dark:text-red-300",
  stale: "bg-amber-500/10 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300",
};

const RANKS = [
  "Unrated",
  ...TIERS.flatMap((t) => DIVISIONS.map((d) => `${t} ${d}`)),
  "Radiant",
];

export function TrackerDemo({ resetToken }: DemoComponentProps) {
  const [a, setA] = useState("Silver 2");
  const [b, setB] = useState("Gold 1");

  const report = useMemo(
    () =>
      ROSTER.map((student) => ({
        student,
        verdict: verdictFor(student, TODAY),
      })),
    // Recompute on reset so the shell's button does something visible.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resetToken],
  );

  const usable = report.filter((r) => r.verdict !== "stale");
  const flagged = report.filter((r) => r.verdict === "stale");

  return (
    <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs tracking-wide text-neutral-600 uppercase dark:text-neutral-400">
            Report
          </p>
          <p className="fig text-xs text-neutral-600 dark:text-neutral-400">
            {usable.length} usable · {flagged.length} flagged
          </p>
        </div>

        <ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
          {report.map(({ student, verdict }) => (
            <li
              key={student.name}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {student.name}
              </span>
              <span className="fig text-xs text-neutral-600 dark:text-neutral-400">
                {student.startRank} → {student.currentRank}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[0.65rem] font-medium",
                  VERDICT_STYLE[verdict],
                )}
              >
                {VERDICT_LABEL[verdict]}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
          The script writes two files rather than one: students with usable data, and
          students whose reading predates the current act. A stale rank cannot support a
          conclusion, so it is separated instead of quietly compared — which is the
          difference between a report someone reads and one someone has to audit.
        </p>
      </div>

      {/* The comparison itself, driven by the ported function. */}
      <div className="min-w-0">
        <p className="text-xs tracking-wide text-neutral-600 uppercase dark:text-neutral-400">
          Try the comparison
        </p>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              Starting rank
            </span>
            <select
              value={a}
              onChange={(e) => setA(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-2.5 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            >
              {RANKS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              Current rank
            </span>
            <select
              value={b}
              onChange={(e) => setB(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-2.5 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            >
              {RANKS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>

        <p
          aria-live="polite"
          className="mt-4 rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800"
        >
          <span className="text-neutral-600 dark:text-neutral-400">isHigherRank(</span>
          <span className="fig text-neutral-900 dark:text-neutral-100">
            {a}, {b}
          </span>
          <span className="text-neutral-600 dark:text-neutral-400">) → </span>
          <strong
            className={cn(
              isHigherRank(a, b)
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-neutral-900 dark:text-neutral-100",
            )}
          >
            {String(isHigherRank(a, b))}
          </strong>
        </p>
      </div>
    </div>
  );
}
