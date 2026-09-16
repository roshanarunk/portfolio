"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import {
  type Board,
  type SolveStep,
  cloneBoard,
  solveSteps,
} from "@/components/demos/sudoku/solver";
import { puzzles } from "@/components/demos/sudoku/puzzles";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Win, btnClass } from "@/components/ui/window";
import { cn } from "@/lib/utils";

/**
 * The desktop: the first viewport, as an operating system mid-session.
 *
 * The solver is already running in its own window when the visitor arrives, so
 * "these programs actually work" is demonstrated rather than claimed. The board
 * is the real backtracking solver from the Sudoku project — the same
 * `solveSteps` generator the full demo uses, not a recording.
 */

/**
 * The board from the original GUI.py. The famous hardest puzzle has 21 givens
 * and renders as a nearly empty grid, which reads as broken rather than hard.
 */
const BOARD = puzzles[0];
const STEPS_PER_FRAME = 3;

interface RunState {
  board: Board;
  step: SolveStep | null;
  steps: number;
  backtracks: number;
  solved: boolean;
}

type Action = { type: "advance"; step: SolveStep; board: Board } | { type: "restart" };

function init(): RunState {
  return {
    board: cloneBoard(BOARD.board),
    step: null,
    steps: 0,
    backtracks: 0,
    solved: false,
  };
}

function reducer(state: RunState, action: Action): RunState {
  if (action.type === "restart") return init();
  return {
    board: action.board,
    step: action.step,
    steps: state.steps + 1,
    backtracks: state.backtracks + (action.step.type === "backtrack" ? 1 : 0),
    solved: action.step.type === "solved",
  };
}

export function SolverWindow({ className }: { className?: string }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const reducedMotion = useReducedMotion();
  // Someone who asked for reduced motion gets a still board until they opt in,
  // so `running` is derived rather than written from an effect.
  const [startedByHand, setStartedByHand] = useState(false);
  const running = !reducedMotion || startedByHand;

  const genRef = useRef<Generator<SolveStep, boolean, void> | null>(null);
  const boardRef = useRef<Board | null>(null);

  useEffect(() => {
    if (!running) return;

    let frame = 0;
    let restartAt = 0;

    const tick = () => {
      // Hold the solved grid briefly, then start over.
      if (restartAt) {
        if (performance.now() >= restartAt) {
          restartAt = 0;
          genRef.current = null;
          dispatch({ type: "restart" });
        }
        frame = requestAnimationFrame(tick);
        return;
      }

      if (!genRef.current) {
        boardRef.current = cloneBoard(BOARD.board);
        genRef.current = solveSteps(boardRef.current);
      }

      const gen = genRef.current;
      const board = boardRef.current!;

      for (let i = 0; i < STEPS_PER_FRAME; i++) {
        const next = gen.next();
        if (next.done) {
          restartAt = performance.now() + 2600;
          break;
        }
        dispatch({ type: "advance", step: next.value, board });
        if (next.value.type === "solved") {
          restartAt = performance.now() + 2600;
          break;
        }
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  const active = state.step && "pos" in state.step ? state.step.pos : null;

  return (
    <Win
      title="Sudoku.py — solving"
      className={className}
      bodyClassName="p-3 sm:p-4"
      status={
        <>
          <span>
            {state.steps.toLocaleString()} decisions ·{" "}
            {state.backtracks.toLocaleString()} backtracks
          </span>
          <span>{state.solved ? "Solved" : running ? "Running" : "Paused"}</span>
        </>
      }
    >
      <div
        className="grid aspect-square w-full grid-cols-9 grid-rows-9 border border-[var(--ink)]"
        role="img"
        aria-label={`The Sudoku solver working the board from the original project: ${state.steps.toLocaleString()} decisions so far`}
      >
        {state.board.map((row, r) =>
          row.map((value, c) => {
            const given = BOARD.board[r][c] !== 0;
            const isActive = active?.[0] === r && active?.[1] === c;
            return (
              <span
                key={`${r}-${c}`}
                className={cn(
                  "score flex items-center justify-center text-[clamp(0.6rem,1.6vw,1rem)]",
                  // Hairlines everywhere, doubled rules on the 3x3 seams.
                  r > 0 && "border-t border-[var(--ink)]/35",
                  c > 0 && "border-l border-[var(--ink)]/35",
                  r % 3 === 0 && r > 0 && "border-t-[var(--ink)]",
                  c % 3 === 0 && c > 0 && "border-l-[var(--ink)]",
                  given ? "font-bold" : "font-normal",
                  // The cell under consideration inverts, the 1-bit way.
                  isActive
                    ? "bg-[var(--ink)] text-[var(--paper)]"
                    : "text-[var(--ink)]",
                )}
              >
                {value !== 0 ? value : ""}
              </span>
            );
          }),
        )}
      </div>

      {!running && (
        <button
          type="button"
          onClick={() => setStartedByHand(true)}
          className={btnClass(true, "mt-3 w-full")}
        >
          Run it
        </button>
      )}
    </Win>
  );
}
