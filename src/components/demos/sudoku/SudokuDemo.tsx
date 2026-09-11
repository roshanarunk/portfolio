"use client";

import { useState } from "react";
import type { DemoComponentProps } from "../registry";
import { SudokuBoard } from "./SudokuBoard";
import { SudokuControls } from "./SudokuControls";
import { useSudoku } from "./useSudoku";
import { puzzles } from "./puzzles";
import { cn } from "@/lib/utils";

type Tab = "play" | "solve";

const statusText = {
  playing: "",
  solving: "Searching…",
  paused: "Paused",
  solved: "Solved",
  unsolvable: "No solution exists for this board",
} as const;

/**
 * Two views of the same board: play it yourself, or watch the ported
 * backtracking solver work through it.
 */
export function SudokuDemo({ reducedMotion }: DemoComponentProps) {
  const [tab, setTab] = useState<Tab>("play");
  const { state, dispatch, startSolving, stepOnce } = useSudoku(reducedMotion);

  const tabs: { id: Tab; label: string }[] = [
    { id: "play", label: "Play it" },
    { id: "solve", label: "Watch it solve" },
  ];

  return (
    <div className="p-4">
      <div
        role="tablist"
        aria-label="Sudoku demo mode"
        className="mb-4 inline-flex rounded-lg bg-neutral-100 p-1 dark:bg-neutral-900"
      >
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            onClick={() => setTab(entry.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition",
              tab === entry.id
                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-start gap-6 sm:flex-row">
        <div className="flex w-full shrink-0 justify-center sm:w-auto">
          <SudokuBoard
            state={state}
            reducedMotion={reducedMotion}
            onSelect={(pos) => dispatch({ type: "select", pos })}
            onMove={(dRow, dCol) => dispatch({ type: "move", dRow, dCol })}
            onInput={(value) => dispatch({ type: "input", value })}
            onToggleNote={(value) => dispatch({ type: "toggleNote", value })}
            onClear={() => dispatch({ type: "clearCell" })}
          />
        </div>

        <SudokuControls
          state={state}
          mode={tab}
          reducedMotion={reducedMotion}
          dispatch={dispatch}
          onStart={startSolving}
          onPause={() => dispatch({ type: "pause" })}
          onStep={() => {
            if (state.mode !== "solving" && state.mode !== "paused") {
              startSolving();
              dispatch({ type: "pause" });
              return;
            }
            stepOnce();
          }}
          onInstant={() => dispatch({ type: "instantSolve" })}
          onSpeed={(value) => dispatch({ type: "setSpeed", value })}
          onLoadPuzzle={(id) => {
            const puzzle = puzzles.find((p) => p.id === id);
            if (puzzle) dispatch({ type: "loadPuzzle", puzzle });
          }}
          onNumberPad={(value) => dispatch({ type: "input", value })}
          onClear={() => dispatch({ type: "clearCell" })}
        />
      </div>

      {/*
        Progress is announced politely and only on meaningful transitions —
        announcing every step would flood a screen reader.
      */}
      <p aria-live="polite" className="sr-only">
        {statusText[state.mode]}
      </p>
      {state.mode !== "playing" && (
        <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
          {statusText[state.mode]}
          {state.mode === "solved" &&
            state.stepCount > 0 &&
            ` in ${state.stepCount.toLocaleString()} steps and ${state.backtracks.toLocaleString()} backtracks.`}
        </p>
      )}
    </div>
  );
}
