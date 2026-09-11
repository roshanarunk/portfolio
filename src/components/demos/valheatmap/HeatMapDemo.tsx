"use client";

import { useEffect, useMemo, useState } from "react";
import { Map as MapIcon, Table as TableIcon } from "lucide-react";
import { DemoSkeleton } from "../DemoSkeleton";
import { MapCanvas } from "./MapCanvas";
import { MAP_TRANSFORMS } from "./transform";
import type { Filters, Match, MatchSummary } from "./types";
import type { DemoComponentProps } from "../registry";
import { cn } from "@/lib/utils";

const DEFAULT_SLUG = "bind";

export function HeatMapDemo({ reducedMotion }: DemoComponentProps) {
  const [summaries, setSummaries] = useState<MatchSummary[] | null>(null);
  const [slug, setSlug] = useState(DEFAULT_SLUG);
  // Keyed by slug so "is this map still loading" is derived from the data
  // rather than written as a separate state update inside the effect.
  const [loaded, setLoaded] = useState<{ slug: string; match: Match } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "table">("map");
  const [filters, setFilters] = useState<Filters>({
    roundFrom: 0,
    roundTo: 99,
    player: null,
    team: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/data/valheatmap/index.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: MatchSummary[]) => {
        if (!cancelled) setSummaries(data);
      })
      .catch((cause: Error) => !cancelled && setError(cause.message));
    return () => {
      cancelled = true;
    };
  }, []);

  // Match files are fetched per map, so only the one being viewed is downloaded.
  useEffect(() => {
    let cancelled = false;
    fetch(`/data/valheatmap/${slug}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: Match) => {
        if (cancelled) return;
        setLoaded({ slug, match: data });
        setFilters({
          roundFrom: 0,
          roundTo: data.rounds,
          player: null,
          team: null,
        });
      })
      .catch((cause: Error) => !cancelled && setError(cause.message));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Only treat the match as current once the fetch for THIS slug has landed.
  const match = loaded?.slug === slug ? loaded.match : null;

  const kills = useMemo(() => {
    if (!match) return [];
    return match.kills.filter((kill) => {
      if (kill.round < filters.roundFrom || kill.round > filters.roundTo)
        return false;
      if (
        filters.player !== null &&
        kill.killer !== filters.player &&
        kill.victim !== filters.player
      )
        return false;
      if (filters.team !== null) {
        const killer = match.players.find((p) => p.id === kill.killer);
        if (killer?.team !== filters.team) return false;
      }
      return true;
    });
  }, [match, filters]);

  const teams = useMemo(
    () => (match ? [...new Set(match.players.map((p) => p.team))] : []),
    [match],
  );

  if (error) {
    return (
      <div className="p-12 text-center text-sm text-neutral-600 dark:text-neutral-400">
        Could not load match data ({error}).
      </div>
    );
  }

  if (!summaries || !match) return <DemoSkeleton label="Loading match…" />;

  const nameOf = (id: number) =>
    match.players.find((p) => p.id === id)?.name ?? `Player ${id}`;

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {summaries.map((summary) => (
            <button
              key={summary.slug}
              type="button"
              onClick={() => setSlug(summary.slug)}
              aria-pressed={summary.slug === slug}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium transition",
                summary.slug === slug
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "border border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800",
              )}
            >
              {MAP_TRANSFORMS[summary.slug]?.name ?? summary.map}
            </button>
          ))}
        </div>

        {/* A table is strictly more accessible than a scatter plot, so offer both. */}
        <div className="flex rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-900">
          {(
            [
              ["map", MapIcon, "Map"],
              ["table", TableIcon, "Table"],
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              aria-pressed={view === id}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
                view === id
                  ? "bg-white shadow-sm dark:bg-neutral-800"
                  : "text-neutral-600 dark:text-neutral-400",
              )}
            >
              <Icon aria-hidden className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_14rem]">
        <div>
          {view === "map" ? (
            <MapCanvas
              match={match}
              slug={slug}
              kills={kills}
              reducedMotion={reducedMotion}
            />
          ) : (
            <div className="max-h-[30rem] overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Kills in this match, filtered
                </caption>
                <thead className="sticky top-0 bg-neutral-50 text-xs uppercase dark:bg-neutral-900">
                  <tr>
                    <th scope="col" className="px-3 py-2">Round</th>
                    <th scope="col" className="px-3 py-2">Killer</th>
                    <th scope="col" className="px-3 py-2">Victim</th>
                  </tr>
                </thead>
                <tbody>
                  {kills.map((kill, index) => (
                    <tr
                      key={index}
                      className="border-t border-neutral-200 dark:border-neutral-800"
                    >
                      <td className="px-3 py-1.5 tabular-nums">{kill.round}</td>
                      <td className="px-3 py-1.5">{nameOf(kill.killer)}</td>
                      <td className="px-3 py-1.5">{nameOf(kill.victim)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {kills.length === 0 && (
                <p className="p-6 text-center text-sm text-neutral-500">
                  No kills match these filters.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="vh-player"
              className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              Player
            </label>
            <select
              id="vh-player"
              value={filters.player ?? ""}
              onChange={(event) =>
                setFilters((f) => ({
                  ...f,
                  player: event.target.value === "" ? null : Number(event.target.value),
                }))
              }
              className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            >
              <option value="">Everyone</option>
              {match.players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="vh-team"
              className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              Kills by team
            </label>
            <select
              id="vh-team"
              value={filters.team ?? ""}
              onChange={(event) =>
                setFilters((f) => ({
                  ...f,
                  team: event.target.value === "" ? null : event.target.value,
                }))
              }
              className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            >
              <option value="">Both</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="vh-round-from"
              className="mb-1 flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              <span>From round</span>
              <span className="font-mono">{filters.roundFrom}</span>
            </label>
            <input
              id="vh-round-from"
              type="range"
              min={0}
              max={match.rounds}
              value={filters.roundFrom}
              onChange={(event) =>
                setFilters((f) => ({
                  ...f,
                  roundFrom: Math.min(Number(event.target.value), f.roundTo),
                }))
              }
              className="w-full accent-neutral-900 dark:accent-neutral-100"
            />

            <label
              htmlFor="vh-round-to"
              className="mt-2 mb-1 flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              <span>To round</span>
              <span className="font-mono">{filters.roundTo}</span>
            </label>
            <input
              id="vh-round-to"
              type="range"
              min={0}
              max={match.rounds}
              value={filters.roundTo}
              onChange={(event) =>
                setFilters((f) => ({
                  ...f,
                  roundTo: Math.max(Number(event.target.value), f.roundFrom),
                }))
              }
              className="w-full accent-neutral-900 dark:accent-neutral-100"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setFilters({
                roundFrom: 0,
                roundTo: match.rounds,
                player: null,
                team: null,
              })
            }
            className="text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Clear filters
          </button>

          <p className="border-t border-neutral-200 pt-4 text-xs leading-relaxed text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            Real kill positions from a recorded match. The playable area is drawn
            from the match data rather than Riot&apos;s map art.
          </p>
        </div>
      </div>
    </div>
  );
}
