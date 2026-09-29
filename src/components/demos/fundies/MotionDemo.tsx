"use client";

import { useEffect, useRef, useState } from "react";
import {
  type Command,
  type MotionState,
  direction,
  initialMotion,
  relative,
  sample,
} from "./motionInput";
import { cn } from "@/lib/utils";

/**
 * Fundies' motion-input engine, running at 60 Hz on your keyboard.
 *
 * Every frame samples the stick into the same run-length history the game
 * keeps, and pressing attack runs the same recogniser. The history strip is
 * that state drawn directly, so you can watch why a 236 was a fireball, or why
 * one held a frame too long was not.
 */

const FRAME_MS = 1000 / 60;

const ARROW: Record<number, string> = {
  1: "↙",
  2: "↓",
  3: "↘",
  4: "←",
  5: "·",
  6: "→",
  7: "↖",
  8: "↑",
  9: "↗",
};

const LABEL: Record<Command, string> = {
  none: "—",
  stand: "Standing kick",
  low: "Low kick",
  fireball: "Fireball (236)",
  donkey: "Donkey kick (214)",
  dp: "DP (623)",
};

/** Scripted inputs, written the way the game's own tests write them. */
const EXAMPLES: { label: string; seq: string; note: string }[] = [
  { label: "236 fireball", seq: "2:3 3:3 6:3", note: "A clean quarter circle." },
  { label: "623 DP", seq: "6:3 2:3 3:3", note: "Forward, down, down-forward." },
  {
    label: "626 DP",
    seq: "6:3 2:3 6:3",
    note: "Lenient: any forward, any down, any forward.",
  },
  {
    label: "Walking fireball",
    seq: "6:4 4:3 1:3 2:3 3:3 6:3",
    note: "Contains a 623, but returning through back and down reads as an intentional fireball.",
  },
  {
    label: "236, too slow",
    seq: "2:3 3:12 6:3",
    note: "Twelve frames on the diagonal: past the eleven-frame window.",
  },
  {
    label: "26, no diagonal",
    seq: "2:4 6:4",
    note: "Quarter circles require the diagonal. This is a normal.",
  },
];

type Keys = { left: boolean; right: boolean; up: boolean; down: boolean };

/*
 * No reset handling here: the demo shell keys this component on its reset
 * token, so pressing Reset remounts it with fresh state.
 */
export function MotionDemo() {
  const [state, setState] = useState<MotionState>(initialMotion);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [log, setLog] = useState<{ cmd: Command; t: number }[]>([]);
  const [focused, setFocused] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  // Mutable inputs read by the fixed-step loop, so key events never re-render.
  const keys = useRef<Keys>({ left: false, right: false, up: false, down: false });
  const attackQueued = useRef(false);
  const script = useRef<{ dir: number; attack: boolean }[]>([]);
  const facingRef = useRef(facing);
  // The loop steps many frames between renders, so it owns the live state and
  // publishes a copy once per animation frame.
  const motion = useRef<MotionState>(initialMotion());

  useEffect(() => {
    facingRef.current = facing;
  }, [facing]);

  // Fixed 60 Hz step, accumulated from rAF so it holds rate on any display.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const pressed: Command[] = [];

    const tick = (now: number) => {
      acc += Math.min(now - last, 250);
      last = now;

      while (acc >= FRAME_MS) {
        acc -= FRAME_MS;

        let dir: number;
        let attack: boolean;
        const scripted = script.current.shift();
        if (scripted) {
          dir = scripted.dir;
          attack = scripted.attack;
        } else {
          const k = keys.current;
          const x = ((k.right ? 1 : 0) - (k.left ? 1 : 0)) as -1 | 0 | 1;
          const y = ((k.up ? 1 : 0) - (k.down ? 1 : 0)) as -1 | 0 | 1;
          dir = direction(x, y);
          attack = attackQueued.current;
          attackQueued.current = false;
        }

        motion.current = sample(motion.current, dir, attack, facingRef.current);
        if (attack) pressed.push(motion.current.pending);
      }

      // Publish once per animation frame. Updaters stay pure: under Strict Mode
      // React may run them twice, which would double every logged press.
      setState(motion.current);
      if (pressed.length > 0) {
        const entries = pressed.map((cmd) => ({ cmd, t: now }));
        pressed.length = 0;
        setLog((l) => [...entries.reverse(), ...l].slice(0, 6));
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function onKey(e: React.KeyboardEvent, down: boolean) {
    // A scripted example's explanation stops applying once you type yourself.
    if (down) setNote(null);
    const k = keys.current;
    const map: Record<string, keyof Keys> = {
      ArrowLeft: "left",
      a: "left",
      A: "left",
      ArrowRight: "right",
      d: "right",
      D: "right",
      ArrowUp: "up",
      w: "up",
      W: "up",
      ArrowDown: "down",
      s: "down",
      S: "down",
    };
    const dirKey = map[e.key];
    if (dirKey) {
      k[dirKey] = down;
      e.preventDefault();
      return;
    }
    if (down && !e.repeat && (e.key === "j" || e.key === "J" || e.key === " ")) {
      attackQueued.current = true;
      e.preventDefault();
    }
  }

  /** Queues a scripted sequence: relative directions, then an attack press. */
  function play(seq: string, exampleNote: string) {
    const frames: { dir: number; attack: boolean }[] = [];
    // Start from neutral so the example is not polluted by earlier input.
    for (let i = 0; i < 14; i++) frames.push({ dir: 5, attack: false });
    const runs = seq.split(" ");
    runs.forEach((run, ri) => {
      const [d, f] = run.split(":");
      const abs = relative(Number(d), facingRef.current);
      const n = Number(f ?? 1);
      for (let i = 0; i < n; i++) {
        const isLast = ri === runs.length - 1 && i === n - 1;
        frames.push({ dir: abs, attack: isLast });
      }
    });
    for (let i = 0; i < 20; i++) frames.push({ dir: 5, attack: false });
    script.current = frames;
    setNote(exampleNote);
  }

  const latest = log[0]?.cmd ?? null;

  return (
    <div className="p-5 sm:p-6">
      <div
        tabIndex={0}
        role="application"
        aria-label="Motion input tester. Use the arrow keys or WASD to move and J or space to attack."
        onKeyDown={(e) => onKey(e, true)}
        onKeyUp={(e) => onKey(e, false)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          keys.current = { left: false, right: false, up: false, down: false };
        }}
        className={cn(
          // The region shows the site's standard focus ring (globals.css);
          // a border-colour change alone measured 2.46:1, under the 3:1 minimum.
          "tx rounded-lg border p-4",
          focused
            ? "border-emerald-700 dark:border-emerald-400"
            : "border-neutral-300 dark:border-neutral-700",
        )}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            {focused
              ? "Arrows or WASD to move, J or Space to attack."
              : "Click here, then use the arrows or WASD and press J."}
          </p>
          <button
            type="button"
            onClick={() => setFacing((f) => (f === 1 ? -1 : 1))}
            className="tx rounded-md border border-neutral-300 px-2.5 py-1 text-xs text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Facing {facing === 1 ? "right →" : "← left"}
          </button>
        </div>

        {/* The run-length history, drawn straight from the state. */}
        <div className="mt-4">
          <p className="text-[0.65rem] tracking-wide text-neutral-600 uppercase dark:text-neutral-400">
            Direction history, newest first (frames held)
          </p>
          <ol className="mt-2 flex min-h-12 flex-wrap gap-1.5" aria-live="off">
            {state.runs.slice(0, 14).map((run, i) => (
              <li
                key={`${i}-${run.dir}`}
                className={cn(
                  "fig flex min-w-10 flex-col items-center rounded-md border px-1.5 py-1",
                  i === 0
                    ? "border-emerald-500 bg-emerald-500/10 dark:border-emerald-400"
                    : "border-neutral-200 dark:border-neutral-800",
                )}
              >
                <span className="text-lg leading-none text-neutral-900 dark:text-neutral-100">
                  {ARROW[run.dir]}
                </span>
                <span className="mt-0.5 text-[0.65rem] text-neutral-600 dark:text-neutral-400">
                  {run.frames}f
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-[0.65rem] tracking-wide text-neutral-600 uppercase dark:text-neutral-400">
            Recognised
          </p>
          <p
            aria-live="polite"
            className={cn(
              "rounded-md px-3 py-1 text-sm font-semibold",
              latest && latest !== "stand" && latest !== "low"
                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
            )}
          >
            {latest ? LABEL[latest] : "Nothing yet"}
          </p>
          {log.length > 1 && (
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              before:{" "}
              {log
                .slice(1)
                .map((l) => LABEL[l.cmd])
                .join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Or play a scripted input, frame by frame:
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => play(ex.seq, ex.note)}
              className="tx rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              {ex.label}
            </button>
          ))}
        </div>
        {note && (
          <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">{note}</p>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
        Quarter circles get eleven frames per segment, the DP seven, and a press is
        buffered for five. This is <code>MotionInput.cs</code> ported line for line and
        checked against the game&rsquo;s own test vectors.
      </p>
    </div>
  );
}
