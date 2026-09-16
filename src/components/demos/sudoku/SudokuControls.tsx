"use client";

import { Pause, Play, SkipForward, Zap } from "lucide-react";
import type { Dispatch } from "react";
import type { SudokuState } from "./useSudoku";
import { puzzles } from "./puzzles";
import { formatDuration } from "@/lib/utils";

interface Props {
  state: SudokuState;
  mode: "play" | "solve";
  reducedMotion: boolean;
  onStart: () => void;
  onPause: () => void;
  onStep: () => void;
  onInstant: () => void;
  onSpeed: (value: number) => void;
  onLoadPuzzle: (id: string) => void;
  onNumberPad: (value: number) => void;
  onClear: () => void;
  dispatch: Dispatch<{ type: "reset" }>;
}

const buttonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className="font-mono text-lg text-neutral-900 tabular-nums dark:text-neutral-100">
        {value}
      </dd>
    </div>
  );
}

export function SudokuControls({
  state,
  mode,
  reducedMotion,
  onStart,
  onPause,
  onStep,
  onInstant,
  onSpeed,
  onLoadPuzzle,
  onNumberPad,
  onClear,
  dispatch,
}: Props) {
  const solving = state.mode === "solving";

  return (
    <div className="flex w-full flex-col gap-5 sm:max-w-xs">
      <div>
        <label
          htmlFor="sudoku-puzzle"
          className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
        >
          Puzzle
        </label>
        <select
          id="sudoku-puzzle"
          value={state.puzzleId}
          disabled={solving}
          onChange={(event) => onLoadPuzzle(event.target.value)}
          className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        >
          {puzzles.map((puzzle) => (
            <option key={puzzle.id} value={puzzle.id}>
              {puzzle.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {puzzles.find((p) => p.id === state.puzzleId)?.note}
        </p>
      </div>

      {mode === "solve" ? (
        <>
          <div className="flex flex-wrap gap-2">
            {solving ? (
              <button type="button" onClick={onPause} className={buttonClass}>
                <Pause aria-hidden className="size-3.5" />
                Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={onStart}
                disabled={state.mode === "solved"}
                className={buttonClass}
              >
                <Play aria-hidden className="size-3.5" />
                {state.mode === "paused" ? "Resume" : "Solve"}
              </button>
            )}
            <button
              type="button"
              onClick={onStep}
              disabled={state.mode === "solved"}
              className={buttonClass}
            >
              <SkipForward aria-hidden className="size-3.5" />
              Step
            </button>
            <button
              type="button"
              onClick={onInstant}
              disabled={state.mode === "solved"}
              className={buttonClass}
            >
              <Zap aria-hidden className="size-3.5" />
              Instant
            </button>
          </div>

          <div>
            <label
              htmlFor="sudoku-speed"
              className="mb-1 flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              <span>Speed</span>
              <span className="font-mono">{state.stepsPerSecond} steps/s</span>
            </label>
            {/* Log scale: the interesting range spans three orders of magnitude. */}
            <input
              id="sudoku-speed"
              type="range"
              min={0}
              max={100}
              value={(Math.log10(state.stepsPerSecond) / 4) * 100}
              onChange={(event) =>
                onSpeed(Math.round(10 ** ((Number(event.target.value) / 100) * 4)))
              }
              className="w-full accent-neutral-900 dark:accent-neutral-100"
            />
            {reducedMotion && (
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Started slow because you prefer reduced motion.
              </p>
            )}
          </div>

          <dl className="grid grid-cols-3 gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <Stat label="Steps" value={state.stepCount.toLocaleString()} />
            <Stat label="Backtracks" value={state.backtracks.toLocaleString()} />
            <Stat label="Depth" value={state.depth} />
          </dl>
        </>
      ) : (
        <>
          {/* Typing is unavailable on touch, so the pad is the primary input there. */}
          <div>
            <p className="mb-1 text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Enter a number
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 9 }, (_, i) => (
                <button
                  key={i + 1}
                  type="button"
                  onClick={() => onNumberPad(i + 1)}
                  className="rounded-md border border-neutral-300 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={onClear}
                aria-label="Clear cell"
                className="rounded-md border border-neutral-300 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                ⌫
              </button>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <Stat label="Time" value={formatDuration(state.elapsedMs)} />
            <Stat label="Strikes" value={state.strikes} />
            <Stat
              label="Left"
              value={state.board.flat().filter((v) => v === 0).length}
            />
          </dl>

          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Arrow keys move, 1–9 enters a number, Shift+1–9 leaves a pencil mark.
          </p>
        </>
      )}

      <button
        type="button"
        onClick={() => dispatch({ type: "reset" })}
        className="self-start text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        Reset board
      </button>
    </div>
  );
}
