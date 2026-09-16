"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";
import type { DemoComponentProps } from "../registry";
import { cn } from "@/lib/utils";

/**
 * The real SF6Assist validator, running on the real frame data.
 *
 * `core/cancel.mjs` and the 32 per-character JSON files are vendored under
 * public/sf6 and loaded at runtime, so this is the project's own code deciding
 * whether a link works — not a re-implementation. The trainer's timing half
 * needs a gamepad and a 60 Hz poll loop, which a page embed cannot honestly
 * provide; the validation half is the part that ports.
 *
 * Frame data is fetched per character (~150 KB), never as one 4.7 MB blob.
 */

interface FrameValue {
  kind: string;
  value?: number;
  raw?: string;
}

interface Move {
  id: string;
  name: string;
  startup?: FrameValue;
  onHit?: FrameValue;
  onBlock?: FrameValue;
  moveType?: string;
}

interface CharacterData {
  name: string;
  moves: Move[];
}

type Verdict = {
  kind: "link" | "cancel" | "illegal" | "unverifiable";
  reason?: string;
  timing?: { min?: number; max?: number } | null;
  confidence?: string;
};

/** A readable subset of the roster; every one of the 32 files is vendored. */
const ROSTER = ["Ryu", "Ken", "Chun-Li", "Luke", "Cammy", "Juri", "Akuma", "Zangief"];

export function SF6Demo({ resetToken }: DemoComponentProps) {
  const [character, setCharacter] = useState("Ryu");
  /*
   * Load state is keyed by the character it belongs to, so switching characters
   * invalidates it by comparison rather than by clearing it from inside the
   * effect. Writing setState synchronously in an effect costs an extra render
   * and trips react-hooks/set-state-in-effect.
   */
  const [loaded, setLoaded] = useState<{
    for: string;
    data?: CharacterData;
    error?: string;
  } | null>(null);
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [verdictFor, setVerdictFor] = useState<{
    character: string;
    verdict: Verdict;
  } | null>(null);

  const data = loaded?.for === character ? loaded.data : undefined;
  const error = loaded?.for === character ? loaded.error : undefined;
  const verdict = verdictFor?.character === character ? verdictFor.verdict : null;

  // Reload whenever the character changes, or the shell resets.
  useEffect(() => {
    let cancelled = false;
    const file = character.replace(/[^A-Za-z0-9.-]/g, "_");
    fetch(`/sf6/data/characters/${file}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`frame data unavailable (${r.status})`);
        return r.json();
      })
      .then((json: CharacterData) => {
        if (cancelled) return;
        setLoaded({ for: character, data: json });
        // Two normals that usually chain, as a sensible starting pair.
        const named = json.moves.filter((m) => m.startup?.value !== undefined);
        setFirst(named[0]?.id ?? "");
        setSecond(named[1]?.id ?? "");
      })
      .catch((e: Error) => {
        if (!cancelled) setLoaded({ for: character, error: e.message });
      });

    return () => {
      cancelled = true;
    };
  }, [character, resetToken]);

  /** Runs the project's own validator against the two selected moves. */
  async function check() {
    if (!data) return;
    const a = data.moves.find((m) => m.id === first);
    const b = data.moves.find((m) => m.id === second);
    if (!a || !b) return;

    try {
      const mod = await import(
        /* webpackIgnore: true */ "/sf6/core/cancel.mjs" as string
      );
      const result = mod.validateCombo
        ? mod.validateCombo([a, b])
        : mod.checkTransition?.(a, b);
      setVerdictFor({ character, verdict: normalise(result) });
    } catch (e) {
      setLoaded({ for: character, error: (e as Error).message });
    }
  }

  const moves = (data?.moves ?? []).filter((m) => m.startup?.value !== undefined);

  return (
    <div className="p-5 sm:p-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Character
          </span>
          <select
            value={character}
            onChange={(e) => setCharacter(e.target.value)}
            className="mt-1 rounded-md border border-neutral-300 bg-white px-2.5 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          >
            {ROSTER.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>

        <label className="block min-w-0 flex-1">
          <span className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
            First move
          </span>
          <select
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            disabled={!data}
            className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-2.5 py-2 text-sm text-neutral-900 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          >
            {moves.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0 flex-1">
          <span className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Then
          </span>
          <select
            value={second}
            onChange={(e) => setSecond(e.target.value)}
            disabled={!data}
            className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-2.5 py-2 text-sm text-neutral-900 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          >
            {moves.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={check}
          disabled={!data}
          className="tx rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          Check the link
        </button>
      </div>

      {!data && !error && (
        <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
          Loading {character}&rsquo;s frame data…
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      {data && (
        <FrameRow
          a={data.moves.find((m) => m.id === first)}
          b={data.moves.find((m) => m.id === second)}
        />
      )}

      {verdict && <VerdictCard verdict={verdict} />}

      <p className="mt-5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
        This is the project&rsquo;s own <code>core/cancel.mjs</code> running against its
        real frame data — {data?.moves.length ?? 0} moves for {character}, fetched on
        demand. The timing trainer needs a gamepad and a 60&nbsp;Hz poll loop, so it
        stays in the repository rather than being approximated here.
      </p>
    </div>
  );
}

function FrameRow({ a, b }: { a?: Move; b?: Move }) {
  if (!a || !b) return null;
  const adv = a.onHit?.value;
  const startup = b.startup?.value;
  const window = adv !== undefined && startup !== undefined ? adv + 1 - startup : null;

  return (
    <dl className="mt-5 grid gap-px border-t border-neutral-200 sm:grid-cols-3 dark:border-neutral-800">
      <Stat label={`${a.name} on hit`} value={a.onHit?.raw ?? "—"} />
      <Stat label={`${b.name} startup`} value={b.startup?.raw ?? "—"} />
      <Stat
        label="Link window"
        value={window === null ? "unknown" : `${Math.max(window, 0)}f`}
      />
    </dl>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="pt-3">
      <dt className="text-[0.65rem] tracking-wide text-neutral-600 uppercase dark:text-neutral-400">
        {label}
      </dt>
      <dd className="fig mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {value}
      </dd>
    </div>
  );
}

const VERDICT_UI = {
  link: {
    Icon: CheckCircle2,
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
    label: "Links",
  },
  cancel: {
    Icon: CheckCircle2,
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
    label: "Cancels",
  },
  illegal: {
    Icon: AlertTriangle,
    className:
      "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200",
    label: "Illegal",
  },
  unverifiable: {
    Icon: HelpCircle,
    className:
      "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
    label: "Unverifiable",
  },
} as const;

function VerdictCard({ verdict }: { verdict: Verdict }) {
  const ui = VERDICT_UI[verdict.kind] ?? VERDICT_UI.unverifiable;
  const { Icon } = ui;

  return (
    <div
      role="status"
      className={cn("mt-5 flex gap-3 rounded-lg border p-3.5", ui.className)}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 text-sm">
        <p className="font-semibold">{ui.label}</p>
        {verdict.reason && <p className="mt-1">{verdict.reason}</p>}
        {verdict.kind === "unverifiable" && !verdict.reason && (
          <p className="mt-1">
            The dataset cannot express this situation — juggle state, counterhit,
            spacing or Drive Rush. Absence of data is not evidence of illegality, so it
            says so rather than guessing.
          </p>
        )}
      </div>
    </div>
  );
}

/** The validator returns a result object or an array of them; flatten it. */
function normalise(result: unknown): Verdict {
  const r = Array.isArray(result) ? result[0] : result;
  if (r && typeof r === "object" && "kind" in r) {
    return r as Verdict;
  }
  return {
    kind: "unverifiable",
    reason: "The validator returned no verdict for this pair.",
  };
}
