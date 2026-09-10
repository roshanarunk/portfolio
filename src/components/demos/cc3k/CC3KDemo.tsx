"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DemoComponentProps } from "../registry";
import {
  ENEMIES,
  RACES,
  damage,
  simulate,
  traitFor,
  type Combatant,
} from "./combat";
import { cn } from "@/lib/utils";

/** How far through the fight the log has been revealed. */
const STEP_MS = 260;

function StatBar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "player" | "enemy";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </span>
        <span className="font-mono tabular-nums text-neutral-500">
          {value} / {max === 999 ? "∞" : max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className={cn(
            "h-full transition-[width] duration-200 motion-reduce:transition-none",
            tone === "player" ? "bg-emerald-500" : "bg-rose-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function CC3KDemo({ reducedMotion }: DemoComponentProps) {
  const [raceName, setRaceName] = useState("Drow");
  const [enemyName, setEnemyName] = useState("Orc");
  // Reveal progress is stored with the fight it belongs to, so a new matchup
  // reads as "nothing revealed yet" without resetting state inside the effect.
  const [progress, setProgress] = useState({ key: "", count: 0 });
  const logRef = useRef<HTMLOListElement>(null);

  const race = RACES.find((r) => r.name === raceName)!;
  const enemy = ENEMIES.find((e) => e.name === enemyName)!;

  const fight = useMemo(
    () => simulate(race, enemy, { trait: traitFor(race.name) }),
    [race, enemy],
  );

  const matchup = `${race.name}-${enemy.name}`;
  // Reduced motion skips the replay and shows the finished fight.
  const revealed = reducedMotion
    ? fight.attacks.length
    : progress.key === matchup
      ? progress.count
      : 0;

  // Replay the fight one blow at a time. A changed matchup restarts it, since
  // the stored key no longer matches.
  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => {
      setProgress((prev) => {
        const current = prev.key === matchup ? prev.count : 0;
        if (current >= fight.attacks.length) {
          window.clearInterval(id);
          return prev;
        }
        return { key: matchup, count: current + 1 };
      });
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [matchup, fight.attacks.length, reducedMotion]);

  // Keep the newest blow in view without yanking the whole page.
  useEffect(() => {
    const list = logRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [revealed]);

  const shown = fight.attacks.slice(0, revealed);
  const playerHP =
    [...shown].reverse().find((a) => a.by === "enemy")?.remaining ??
    (race.name === "Vampire" ? 50 : race.maxHP);
  const enemyHP =
    [...shown].reverse().find((a) => a.by === "player")?.remaining ?? enemy.maxHP;
  const finished = revealed >= fight.attacks.length;

  const pick = (list: Combatant[], value: string, onChange: (v: string) => void, id: string, label: string) => (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      >
        {list.map((c) => (
          <option key={c.name} value={c.name}>
            {c.symbol} {c.name} — {c.maxHP} HP, {c.atk} atk, {c.def} def
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="p-4">
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatBar
              label={`${race.symbol} ${race.name}`}
              value={playerHP}
              max={race.name === "Vampire" ? 999 : race.maxHP}
              tone="player"
            />
            <StatBar
              label={`${enemy.symbol} ${enemy.name}`}
              value={enemyHP}
              max={enemy.maxHP}
              tone="enemy"
            />
          </div>

          <ol
            ref={logRef}
            className="mt-4 h-56 overflow-y-auto rounded-lg bg-neutral-950 p-3 font-mono text-xs leading-relaxed text-neutral-300 dark:bg-black"
            aria-label="Combat log"
          >
            {shown.map((attack, index) => (
              <li key={index}>
                <span className="text-neutral-600">
                  {String(attack.turn).padStart(2, " ")}{" "}
                </span>
                <span
                  className={
                    attack.by === "player" ? "text-emerald-400" : "text-rose-400"
                  }
                >
                  {attack.by === "player" ? race.name : enemy.name}
                </span>{" "}
                hits for{" "}
                <span className="text-neutral-100">{attack.amount}</span>
                {attack.healed ? (
                  <span className="text-sky-400"> (+{attack.healed} HP)</span>
                ) : null}
                <span className="text-neutral-600">
                  {" "}
                  → {attack.remaining} left
                </span>
              </li>
            ))}
            {finished && (
              <li className="mt-2 text-neutral-100">
                {fight.winner === "player"
                  ? `${race.name} wins in ${fight.turns} turns.`
                  : `${enemy.name} wins. ${race.name} falls on turn ${fight.turns}.`}
              </li>
            )}
          </ol>

          <p aria-live="polite" className="sr-only">
            {finished
              ? `${fight.winner === "player" ? race.name : enemy.name} wins after ${fight.turns} turns.`
              : ""}
          </p>
        </div>

        <div className="space-y-4">
          {pick(RACES, raceName, setRaceName, "cc3k-race", "Your race")}
          {race.note && (
            <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-500">
              {race.note}
            </p>
          )}

          {pick(ENEMIES, enemyName, setEnemyName, "cc3k-enemy", "Enemy")}
          {enemy.note && (
            <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-500">
              {enemy.note}
            </p>
          )}

          <dl className="grid grid-cols-2 gap-2 border-t border-neutral-200 pt-4 text-xs dark:border-neutral-800">
            <div>
              <dt className="text-neutral-500">You hit for</dt>
              <dd className="font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                {damage(race.atk, enemy.def)}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">It hits for</dt>
              <dd className="font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                {damage(enemy.atk, race.def)}
              </dd>
            </div>
          </dl>

          <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-500">
            Damage is{" "}
            <code className="text-neutral-700 dark:text-neutral-300">
              ceil(100 / (100 + def) × atk)
            </code>
            , so defence has diminishing returns rather than subtracting a flat
            amount. Stats are the ones in the C++ constructors.
          </p>
        </div>
      </div>
    </div>
  );
}
