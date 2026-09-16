"use client";

import { useMemo, useRef, useState } from "react";
import type { DemoComponentProps } from "../registry";
import { STANDARD, run, type TriggerConfig } from "./rapidTrigger";
import { cn } from "@/lib/utils";

/**
 * The rapid trigger state machine from the firmware, driven by hand.
 *
 * A hall effect switch reports analogue travel, so a "keypress" is whatever the
 * firmware decides it is. Drag the slider the way a finger moves a key and the
 * readout shows when the button is actually held — including the case rapid
 * trigger exists for: a partial release followed by a partial press re-fires
 * without returning to rest.
 *
 * The logic is `src/addons/he_trigger.cpp` ported line for line, not a
 * simplification.
 */

const MAX_TRAVEL = 100;

/** Travel traces that show each behaviour without needing a steady hand. */
const TRACES: { id: string; label: string; note: string; travels: number[] }[] = [
  {
    id: "double-tap",
    label: "Partial release, press again",
    note: "The behaviour rapid trigger exists for: the second press fires from wherever the finger reversed, not from rest.",
    travels: [
      ...ramp(0, 62, 2),
      ...ramp(62, 46, -2),
      ...ramp(46, 66, 2),
      ...ramp(66, 44, -2),
      ...ramp(44, 70, 2),
      ...ramp(70, 0, -4),
    ],
  },
  {
    id: "hover",
    label: "Resting on the actuation point",
    note: "Sensor noise straddles the threshold. The disarm point sits a noise width below actuation, so this does not flicker.",
    travels: [
      ...ramp(0, 52, 2),
      41,
      39,
      40,
      38,
      41,
      39,
      42,
      38,
      40,
      41,
      39,
      40,
      ...ramp(40, 0, -4),
    ],
  },
  {
    id: "slow",
    label: "Slow, noisy press",
    note: "Many tiny reversals on the way down. Clamping the extrema rather than resetting them is what lets this still fire.",
    travels: (() => {
      const out: number[] = [];
      for (let t = 0; t <= 72; t += 2) out.push(t, t - 1);
      out.push(...ramp(72, 0, -4));
      return out;
    })(),
  },
];

function ramp(from: number, to: number, stepBy: number): number[] {
  const out: number[] = [];
  for (let v = from; stepBy > 0 ? v <= to : v >= to; v += stepBy) {
    out.push(Math.max(0, Math.min(MAX_TRAVEL, v)));
  }
  return out;
}

export function GP2040Demo({ resetToken }: DemoComponentProps) {
  const [rapid, setRapid] = useState(true);
  const [travel, setTravel] = useState(0);
  const [traceId, setTraceId] = useState(TRACES[0].id);
  const [playhead, setPlayhead] = useState<number | null>(null);
  const frame = useRef(0);

  const cfg: TriggerConfig = useMemo(
    () => ({ ...STANDARD, rapidTrigger: rapid }),
    [rapid],
  );

  const trace = TRACES.find((t) => t.id === traceId)!;
  const ticks = useMemo(() => run(trace.travels, cfg), [trace, cfg]);

  /** Live state for the manual slider, computed from rest each time. */
  const manual = useMemo(() => {
    const path = ramp(0, travel, travel >= 0 ? 2 : -2);
    const out = run(path.length ? path : [0], cfg);
    return out.at(-1)!.state;
  }, [travel, cfg]);

  const shown = playhead !== null ? ticks[playhead] : null;
  const active = shown ? shown.state.active : manual.active;
  const shownTravel = shown ? shown.travel : travel;

  function play() {
    cancelAnimationFrame(frame.current);
    let i = 0;
    const tick = () => {
      setPlayhead(i);
      i += 1;
      if (i < ticks.length) {
        frame.current = requestAnimationFrame(tick);
      } else {
        // Hold the final frame briefly, then hand control back to the slider.
        setTimeout(() => setPlayhead(null), 600);
      }
    };
    frame.current = requestAnimationFrame(tick);
  }

  return (
    <div key={resetToken} className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setRapid((r) => !r)}
          aria-pressed={rapid}
          className={cn(
            "tx rounded-md border px-3 py-1.5 text-xs font-medium",
            rapid
              ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-neutral-950"
              : "border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300",
          )}
        >
          Rapid trigger {rapid ? "on" : "off"}
        </button>

        <select
          value={traceId}
          onChange={(e) => {
            setTraceId(e.target.value);
            setPlayhead(null);
          }}
          className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        >
          {TRACES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={play}
          className="tx rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          Play trace
        </button>
      </div>

      {/* The switch, drawn in travel space. */}
      <div className="mt-5 flex gap-5">
        <TravelColumn travel={shownTravel} cfg={cfg} active={active} />

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "inline-flex w-fit items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold",
              active
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
            )}
            aria-live="polite"
          >
            <span
              aria-hidden
              className={cn(
                "size-2 rounded-full",
                active ? "bg-emerald-500" : "bg-neutral-400",
              )}
            />
            {active ? "Button held" : "Released"}
          </p>

          <dl className="fig mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
            <Stat label="Travel" value={shownTravel.toFixed(0)} />
            <Stat label="Actuation" value={String(cfg.actuation)} />
            <Stat label="Deadzone" value={String(cfg.deadzone)} />
            <Stat label="Press sens." value={String(cfg.pressSensitivity)} />
            <Stat label="Release sens." value={String(cfg.releaseSensitivity)} />
            <Stat label="Noise band" value={`±${cfg.noise}`} />
          </dl>

          <label className="mt-5 block">
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              Move the switch by hand
            </span>
            <input
              type="range"
              min={0}
              max={MAX_TRAVEL}
              value={travel}
              disabled={playhead !== null}
              onChange={(e) => setTravel(Number(e.target.value))}
              className="mt-1.5 w-full accent-emerald-600 disabled:opacity-40 dark:accent-emerald-400"
            />
          </label>

          <p className="mt-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
            {trace.note}
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-neutral-600 dark:text-neutral-400">{label}</dt>
      <dd className="font-semibold text-neutral-900 dark:text-neutral-100">{value}</dd>
    </div>
  );
}

/** A vertical travel gauge with the firmware's thresholds marked on it. */
function TravelColumn({
  travel,
  cfg,
  active,
}: {
  travel: number;
  cfg: TriggerConfig;
  active: boolean;
}) {
  const pct = (v: number) => `${(v / MAX_TRAVEL) * 100}%`;

  return (
    <div
      className="relative h-56 w-16 shrink-0 rounded-md border border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900"
      role="img"
      aria-label={`Switch travel ${travel.toFixed(0)} of ${MAX_TRAVEL}, button ${active ? "held" : "released"}`}
    >
      {/* Pressed depth grows from the top, the way a key moves down. */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 rounded-t-md",
          active ? "bg-emerald-500/40" : "bg-neutral-400/30",
        )}
        style={{ height: pct(travel) }}
      />

      <Threshold at={pct(cfg.deadzone)} label="dz" />
      <Threshold at={pct(cfg.actuation)} label="act" emphasis />

      <div
        className="absolute inset-x-0 h-0.5 bg-neutral-900 dark:bg-neutral-100"
        style={{ top: pct(travel) }}
      />
    </div>
  );
}

function Threshold({
  at,
  label,
  emphasis = false,
}: {
  at: string;
  label: string;
  emphasis?: boolean;
}) {
  return (
    <div className="absolute inset-x-0" style={{ top: at }}>
      <div
        className={cn(
          "h-px w-full",
          emphasis
            ? "bg-neutral-500 dark:bg-neutral-400"
            : "bg-neutral-400/60 dark:bg-neutral-600",
        )}
      />
      <span className="absolute -top-1.5 left-full ml-1 text-[0.6rem] text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
    </div>
  );
}
