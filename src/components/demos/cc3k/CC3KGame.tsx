"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ENEMY_SPECS,
  FLOOR_COUNT,
  POTION_NAMES,
  RACES,
  attack,
  generateFloor,
  makePlayer,
  makeRng,
  move,
  parseFloors,
  use,
  type Direction,
  type GameState,
  type RaceName,
} from "./engine";
import { cn } from "@/lib/utils";

const TILE = 12;

type Mode = "move" | "attack" | "use";

/** Background colour for each terrain character. */
const TILE_COLOUR: Record<string, string> = {
  "#": "#3f3f46",
  "+": "#a16207",
  ".": "#18181b",
  "|": "#52525b",
  "-": "#52525b",
  " ": "transparent",
};

const ENEMY_COLOUR: Record<string, string> = {
  human: "#f87171",
  dwarf: "#fbbf24",
  halfling: "#34d399",
  elf: "#60a5fa",
  orc: "#a78bfa",
  merchant: "#f472b6",
  dragon: "#ef4444",
};

/**
 * The game state is mutated in place by the engine, so each action stores a
 * shallow wrapper with a fresh version number. That gives React something new
 * to compare without deep-cloning a 79x25 world every turn.
 */
interface Session {
  game: GameState;
  version: number;
}

export function CC3KGame() {
  const [floorMaps, setFloorMaps] = useState<string[][][] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<Mode>("move");

  // The RNG is a mutable cursor, not renderable state, so it belongs in a ref —
  // and it is only ever created or read inside an event handler or effect.
  const rngRef = useRef<(() => number) | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/cc3k/default.txt")
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((text) => {
        if (!cancelled) setFloorMaps(parseFloors(text));
      })
      .catch((cause: Error) => !cancelled && setError(cause.message));
    return () => {
      cancelled = true;
    };
  }, []);

  const startGame = useCallback(
    (chosen: RaceName) => {
      if (!floorMaps) return;
      const rng = makeRng(Math.floor(Math.random() * 0xffffffff));
      rngRef.current = rng;
      const player = makePlayer(chosen);
      // Each floor gets its own copy, so a new run never inherits a mutated map.
      const map = floorMaps[0].map((row) => [...row]);
      setSession({ game: generateFloor(map, player, 1, rng), version: 0 });
      setMode("move");
      boardRef.current?.focus();
    },
    [floorMaps],
  );

  const act = useCallback(
    (direction: Direction) => {
      if (!floorMaps) return;

      setSession((current) => {
        if (!current || current.game.status !== "playing") return current;
        const rng = rngRef.current;
        if (!rng) return current;

        const game = current.game;

        if (mode === "attack") {
          attack(game, direction, rng);
        } else if (mode === "use") {
          use(game, direction, rng);
        } else {
          const result = move(game, direction, rng);
          if (result.descended) {
            if (game.floor >= FLOOR_COUNT) {
              game.status = "won";
              game.log.push("PC escapes the dungeon.");
            } else {
              // Stats carry down; the next floor is generated fresh.
              const next = floorMaps[game.floor].map((row) => [...row]);
              const fresh = generateFloor(
                next,
                { ...game.player },
                game.floor + 1,
                rng,
              );
              fresh.log = [...game.log, `PC descends to floor ${game.floor + 1}.`];
              fresh.merchantsHostile = game.merchantsHostile;
              return { game: fresh, version: current.version + 1 };
            }
          }
        }

        return { game, version: current.version + 1 };
      });

      if (mode !== "move") setMode("move");
    },
    [mode, floorMaps],
  );

  const toggleFreeze = useCallback(() => {
    setSession((current) => {
      if (!current) return current;
      current.game.enemiesFrozen = !current.game.enemiesFrozen;
      return { game: current.game, version: current.version + 1 };
    });
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const keyDirs: Record<string, Direction> = {
        ArrowUp: "no",
        ArrowDown: "so",
        ArrowLeft: "we",
        ArrowRight: "ea",
        // Number pad and vi keys reach the diagonals the arrows cannot.
        "8": "no",
        "2": "so",
        "4": "we",
        "6": "ea",
        "7": "nw",
        "9": "ne",
        "1": "sw",
        "3": "se",
        k: "no",
        j: "so",
        h: "we",
        l: "ea",
        y: "nw",
        u: "ne",
        b: "sw",
        n: "se",
      };

      const key = event.key;
      if (key in keyDirs) {
        event.preventDefault();
        act(keyDirs[key]);
        return;
      }
      if (key === "a" || key === "A") {
        event.preventDefault();
        setMode((m) => (m === "attack" ? "move" : "attack"));
      } else if (key === "p" || key === "P") {
        event.preventDefault();
        setMode((m) => (m === "use" ? "move" : "use"));
      } else if (key === "f" || key === "F") {
        event.preventDefault();
        toggleFreeze();
      } else if (key === "Escape") {
        setMode("move");
      }
    },
    [act, toggleFreeze],
  );

  const game = session?.game ?? null;

  // Composites terrain, then items, then enemies, then the player. Recomputed
  // per turn via the session version, since the engine mutates in place.
  const cells = useMemo(() => {
    if (!game) return null;
    const grid = game.map.map((row) =>
      row.map((ch) => ({
        colour: TILE_COLOUR[ch] ?? "#18181b",
        glyph: ch === "." || ch === " " ? "" : ch,
        title: "",
      })),
    );

    const stairs = grid[game.stairs.y]?.[game.stairs.x];
    if (stairs) {
      stairs.glyph = ">";
      stairs.title = "Staircase down";
    }

    for (const item of game.items) {
      const cell = grid[item.y]?.[item.x];
      if (!cell) continue;
      cell.glyph = item.kind === "potion" ? "!" : "$";
      cell.title =
        item.kind === "potion" ? POTION_NAMES[item.potion!] : `${item.gold} gold`;
    }

    for (const enemy of game.enemies) {
      const cell = grid[enemy.y]?.[enemy.x];
      if (!cell) continue;
      cell.glyph = ENEMY_SPECS[enemy.race].symbol;
      cell.title = `${enemy.race} (${enemy.hp} HP)`;
    }

    const pc = grid[game.player.y]?.[game.player.x];
    if (pc) {
      pc.glyph = "@";
      pc.title = game.player.race;
    }

    return grid;
    // `session` is the dependency that matters: the engine mutates `game` in
    // place, so its identity is stable and would never trigger a recompute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (error) {
    return (
      <div className="p-12 text-center text-sm text-neutral-600 dark:text-neutral-400">
        Could not load the dungeon map ({error}).
      </div>
    );
  }

  if (!floorMaps) {
    return (
      <div className="p-12 text-center text-sm text-neutral-500">
        Loading the dungeon…
      </div>
    );
  }

  if (!game || !cells) {
    return (
      <div className="p-6">
        <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          Choose your race
        </h4>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {RACES.map((spec) => (
            <button
              key={spec.name}
              type="button"
              onClick={() => startGame(spec.name)}
              className="tx rounded-lg border border-neutral-300 p-3 text-left hover:border-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-100 dark:hover:bg-neutral-900"
            >
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {spec.name}
              </span>
              <span className="mt-0.5 block font-mono text-xs text-neutral-500">
                {spec.startHP} HP · {spec.atk} atk · {spec.def} def
              </span>
              <span className="mt-1 block text-xs text-neutral-600 dark:text-neutral-400">
                {spec.blurb}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
          Five floors, the same map and spawn rules as the C++ original. Find the
          staircase on each one.
        </p>
      </div>
    );
  }

  const modeLabel =
    mode === "attack"
      ? "Attack — pick a direction"
      : mode === "use"
        ? "Drink — pick a direction"
        : "Move";

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
        <dl className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs tabular-nums">
          {(
            [
              ["Race", game.player.race, ""],
              ["HP", game.player.hp, game.player.hp < 30 ? "text-rose-500" : ""],
              ["Atk", game.player.atk, ""],
              ["Def", game.player.def, ""],
              ["Gold", game.player.gold, "text-amber-600 dark:text-amber-400"],
              ["Floor", `${game.floor}/${FLOOR_COUNT}`, ""],
            ] as const
          ).map(([label, value, tone]) => (
            <div key={label} className="flex gap-1.5">
              <dt className="text-neutral-500">{label}</dt>
              <dd className={cn("text-neutral-900 dark:text-neutral-100", tone)}>
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium",
              mode === "move"
                ? "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
            )}
          >
            {modeLabel}
          </span>
          <button
            type="button"
            onClick={() => startGame(game.player.race)}
            className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            New run
          </button>
        </div>
      </div>

      {/*
        One focusable region rather than 1,975 elements: a grid that size would
        be unusable with a screen reader, so the log below narrates instead.
      */}
      <div
        ref={boardRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        role="application"
        aria-label="Dungeon map. Arrow keys to move, A to attack, P to drink a potion."
        className="overflow-x-auto rounded-lg bg-neutral-950 p-2 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-black"
      >
        <div
          className="mx-auto"
          style={{
            width: 79 * TILE,
            fontSize: TILE - 1,
            lineHeight: `${TILE}px`,
          }}
        >
          {cells.map((row, y) => (
            <div key={y} className="flex" style={{ height: TILE }}>
              {row.map((cell, x) => {
                const isPC = x === game.player.x && y === game.player.y;
                const enemy = game.enemies.find((e) => e.x === x && e.y === y);
                const colour = isPC
                  ? "#22d3ee"
                  : enemy
                    ? ENEMY_COLOUR[enemy.race]
                    : cell.glyph === "$"
                      ? "#fbbf24"
                      : cell.glyph === "!"
                        ? "#c084fc"
                        : cell.glyph === ">"
                          ? "#4ade80"
                          : "#71717a";
                return (
                  <span
                    key={x}
                    title={cell.title || undefined}
                    className="flex shrink-0 items-center justify-center font-mono"
                    style={{
                      width: TILE,
                      height: TILE,
                      backgroundColor: cell.colour,
                      color: colour,
                      fontWeight: isPC || enemy ? 700 : 400,
                    }}
                  >
                    {cell.glyph}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_16rem]">
        <div>
          <ol
            className="h-24 overflow-y-auto rounded-lg bg-neutral-100 p-2 font-mono text-xs leading-relaxed dark:bg-neutral-900"
            aria-live="polite"
            aria-label="Game log"
          >
            {game.log.slice(-40).map((entry, i) => (
              <li key={i} className="text-neutral-700 dark:text-neutral-300">
                {entry}
              </li>
            ))}
          </ol>

          {game.status !== "playing" && (
            <p
              className={cn(
                "mt-2 rounded-md px-3 py-2 text-sm font-medium",
                game.status === "won"
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
              )}
            >
              {game.status === "won"
                ? `You escaped with ${game.player.gold} gold.`
                : `You died on floor ${game.floor} with ${game.player.gold} gold.`}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {/* Touch controls: typing is unavailable on a phone. */}
          <div className="grid grid-cols-3 gap-1">
            {(
              [
                ["nw", "↖"],
                ["no", "↑"],
                ["ne", "↗"],
                ["we", "←"],
                [null, ""],
                ["ea", "→"],
                ["sw", "↙"],
                ["so", "↓"],
                ["se", "↘"],
              ] as const
            ).map(([dir, glyph], i) =>
              dir ? (
                <button
                  key={dir}
                  type="button"
                  onClick={() => act(dir)}
                  aria-label={`${mode} ${dir}`}
                  className="rounded border border-neutral-300 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  {glyph}
                </button>
              ) : (
                <span key={i} />
              ),
            )}
          </div>

          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setMode((m) => (m === "attack" ? "move" : "attack"))}
              aria-pressed={mode === "attack"}
              className={cn(
                "rounded border px-2 py-1.5 text-xs font-medium",
                mode === "attack"
                  ? "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : "border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800",
              )}
            >
              Attack (a)
            </button>
            <button
              type="button"
              onClick={() => setMode((m) => (m === "use" ? "move" : "use"))}
              aria-pressed={mode === "use"}
              className={cn(
                "rounded border px-2 py-1.5 text-xs font-medium",
                mode === "use"
                  ? "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : "border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800",
              )}
            >
              Drink (p)
            </button>
          </div>

          <dl className="space-y-1 border-t border-neutral-200 pt-3 font-mono text-xs dark:border-neutral-800">
            {(
              [
                ["@", "you", "text-cyan-400"],
                [">", "stairs down", "text-green-500"],
                ["$", "gold", "text-amber-500"],
                ["!", "potion", "text-purple-400"],
                ["H W L E O M", "enemies", "text-rose-400"],
              ] as const
            ).map(([glyph, meaning, tone]) => (
              <div key={meaning} className="flex gap-2">
                <dt className={tone}>{glyph}</dt>
                <dd className="text-neutral-600 dark:text-neutral-400">{meaning}</dd>
              </div>
            ))}
          </dl>

          <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            Arrows or 1–9 move, <kbd>a</kbd> then a direction attacks, <kbd>p</kbd>{" "}
            drinks a potion beside you. Merchants leave you alone until you hit one.
          </p>
        </div>
      </div>
    </div>
  );
}
