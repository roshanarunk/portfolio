"use client";

import { useMemo, useState } from "react";
import {
  MAP_TRANSFORMS,
  fitBounds,
  gameToPlot,
  toViewBox,
  type Point,
} from "./transform";
import type { Kill, Match } from "./types";

const SIZE = 1000;

interface Props {
  match: Match;
  slug: string;
  kills: Kill[];
  reducedMotion: boolean;
}

/**
 * Plots kills as SVG rather than canvas: a few hundred marks is well within
 * SVG's comfort zone, and it gives focusable elements and hit testing for free.
 *
 * Killer and victim differ by shape as well as colour — the original plots green
 * against red, which is the worst pair for colour blindness.
 */
export function MapCanvas({ match, slug, kills, reducedMotion }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const transform = MAP_TRANSFORMS[slug];

  // Bounds come from the whole match, not the filtered subset, so the map does
  // not rescale and shift under the viewer while they move a filter.
  const bounds = useMemo(() => {
    const points: Point[] = match.kills.flatMap((kill) => [
      gameToPlot({ x: kill.kx, y: kill.ky }, transform),
      gameToPlot({ x: kill.vx, y: kill.vy }, transform),
    ]);
    return fitBounds(points);
  }, [match, transform]);

  const plotted = useMemo(
    () =>
      kills.map((kill, index) => ({
        kill,
        index,
        killer: toViewBox(
          gameToPlot({ x: kill.kx, y: kill.ky }, transform),
          bounds,
          SIZE,
        ),
        victim: toViewBox(
          gameToPlot({ x: kill.vx, y: kill.vy }, transform),
          bounds,
          SIZE,
        ),
      })),
    [kills, transform, bounds],
  );

  const nameOf = (id: number) =>
    match.players.find((p) => p.id === id)?.name ?? `Player ${id}`;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full rounded-lg bg-neutral-100 dark:bg-neutral-900"
        role="img"
        aria-label={`${match.map}: ${kills.length} kills plotted`}
      >
        <defs>
          <pattern
            id="grid"
            width={SIZE / 10}
            height={SIZE / 10}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${SIZE / 10} 0 L 0 0 0 ${SIZE / 10}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-neutral-300 dark:text-neutral-800"
            />
          </pattern>
        </defs>
        <rect width={SIZE} height={SIZE} fill="url(#grid)" />

        {plotted.map(({ kill, index, killer, victim }) => {
          const active = hovered === index;
          return (
            <g
              key={index}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
              role="graphics-symbol"
              aria-label={`Round ${kill.round}: ${nameOf(kill.killer)} killed ${nameOf(kill.victim)}`}
              className="outline-none"
              opacity={hovered === null || active ? 1 : 0.25}
            >
              {/* The line from killer to victim, as in the matplotlib original. */}
              <line
                x1={killer.x}
                y1={killer.y}
                x2={victim.x}
                y2={victim.y}
                stroke="currentColor"
                strokeWidth={active ? 3 : 1.5}
                className="text-neutral-400 dark:text-neutral-600"
              />
              {/* Killer: circle. */}
              <circle
                cx={killer.x}
                cy={killer.y}
                r={active ? 11 : 8}
                className="fill-emerald-500"
                stroke="white"
                strokeWidth="2"
              />
              {/* Victim: square, so the two never rely on colour alone. */}
              <rect
                x={victim.x - (active ? 8 : 6)}
                y={victim.y - (active ? 8 : 6)}
                width={active ? 16 : 12}
                height={active ? 16 : 12}
                className="fill-rose-500"
                stroke="white"
                strokeWidth="2"
              />
            </g>
          );
        })}
      </svg>

      {hovered !== null && plotted[hovered] && (
        <div
          className={`pointer-events-none absolute left-2 top-2 rounded-md bg-neutral-900/90 px-2.5 py-1.5 text-xs text-white ${
            reducedMotion ? "" : "transition-opacity"
          }`}
        >
          <span className="font-medium">
            {nameOf(plotted[hovered].kill.killer)}
          </span>{" "}
          killed{" "}
          <span className="font-medium">
            {nameOf(plotted[hovered].kill.victim)}
          </span>
          <span className="ml-2 text-neutral-400">
            round {plotted[hovered].kill.round}
          </span>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12" aria-hidden>
            <circle cx="6" cy="6" r="5" className="fill-emerald-500" />
          </svg>
          Killer
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12" aria-hidden>
            <rect x="1" y="1" width="10" height="10" className="fill-rose-500" />
          </svg>
          Victim
        </span>
        <span>{kills.length} kills shown</span>
      </div>
    </div>
  );
}
